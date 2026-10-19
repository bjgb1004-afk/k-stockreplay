// Fetches KR closing prices for the full KRX universe (matches public/data/stocks.json)
// from the public data portal - see [[kstock_price_data_source]] memory for why this
// source (commercial reuse explicitly allowed) over KRX's own Open API.
//
// Also aggregates the same response into public/data/money-flow.json: how much of
// today's KRX turnover landed in each theme / KSIC sector. The raw per-ticker
// turnover never reaches the client - only the ~170 aggregate rows do.
//
// Usage: DATA_GO_KR_KEY=xxx node scripts/fetch-prices.mjs

import { readFileSync, writeFileSync } from 'node:fs';

// row -> PriceInfo. Pulled out as a pure function so its join-key assumption
// (data.go.kr's srtnCd == the plain 6-digit ticker already used across the app,
// e.g. public/data/stocks.json's "005930") is locked in by fetch-prices.selfcheck.mjs
// instead of only being verified the first time this hits the real API.
export function mapRow(r, dateStr) {
  return {
    ticker: r.srtnCd,
    close: Number(r.clpr),
    changePct: Number(r.fltRt),
    date: dateStr,
  };
}

// Turnover (trPrc) per group, in 억원. Kept as a pure function so money-flow.selfcheck.mjs
// can pin the maths down without hitting the API.
//
// `c` is the turnover-weighted average change - a plain average would let a 3억원 penny
// stock move the theme as much as 삼성전자, which is the opposite of "where did the money go".
function groupFlow(tickers, byTicker) {
  let amount = 0;
  let weighted = 0;
  for (const ticker of tickers) {
    const row = byTicker.get(ticker);
    if (!row) continue;
    amount += row.amount;
    weighted += row.amount * row.changePct;
  }
  return { amount, weighted };
}

export function aggregateMoneyFlow(rows, { sectorMap, themeMaps, date }) {
  const byTicker = new Map();
  let total = 0;
  for (const r of rows) {
    const amount = Number(r.trPrc);
    const changePct = Number(r.fltRt);
    if (!Number.isFinite(amount) || amount <= 0) continue; // 거래정지/신규상장 등 - 합계를 오염시키지 않게 버린다.
    byTicker.set(r.srtnCd, { amount, changePct: Number.isFinite(changePct) ? changePct : 0 });
    total += amount;
  }
  if (total === 0) throw new Error('aggregateMoneyFlow: no usable trPrc in response');

  // 억원 단위 정수 + share 소수 4자리. 20일치 파일을 수십 KB로 묶어두기 위한 반올림이다.
  const entry = ({ amount, weighted }) => ({
    v: Math.round(amount / 1e8),
    s: Math.round((amount / total) * 1e4) / 1e4,
    c: amount === 0 ? 0 : Math.round((weighted / amount) * 100) / 100,
  });

  const themes = {};
  for (const theme of themeMaps) {
    const tickers = new Set(theme.groups.flatMap((g) => g.stages.flatMap((s) => s.tickers)));
    const flow = groupFlow(tickers, byTicker);
    if (flow.amount > 0) themes[theme.id] = entry(flow);
  }

  const bySector = new Map();
  for (const [ticker, { code }] of Object.entries(sectorMap)) {
    const row = byTicker.get(ticker);
    if (!row) continue;
    const acc = bySector.get(code) ?? { amount: 0, weighted: 0 };
    acc.amount += row.amount;
    acc.weighted += row.amount * row.changePct;
    bySector.set(code, acc);
  }
  // 화면은 상위 15개만 보여준다. 164개 전부를 20일치 들고 있으면 파일이 130KB까지 부는데,
  // 상위 40개만 남기면 30KB대로 떨어지면서 순위 변동을 보여주기엔 충분하다.
  const sectors = {};
  for (const [code, flow] of [...bySector].sort((a, b) => b[1].amount - a[1].amount).slice(0, 40)) {
    sectors[code] = entry(flow);
  }

  return { date, total: Math.round(total / 1e8), themes, sectors };
}

// 같은 날짜를 다시 받으면 덮어쓴다 (워크플로 재실행/수동 트리거 대비).
export function mergeHistory(prev, day, keepDays = 20) {
  const days = [day, ...(prev?.days ?? []).filter((d) => d.date !== day.date)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, keepDays);
  return { days };
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  } catch {
    return fallback;
  }
}

function kstDateMinus(daysAgo) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 - daysAgo * 86_400_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchForDate(basDt) {
  const rows = [];
  let page = 1;
  for (;;) {
    const url = new URL('https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo');
    // Note: data.go.kr keys are sometimes issued already percent-encoded; URLSearchParams may double-encode them.
    url.searchParams.set('serviceKey', process.env.DATA_GO_KR_KEY);
    url.searchParams.set('resultType', 'json');
    url.searchParams.set('basDt', basDt);
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', String(page));

    const res = await fetch(url);
    if (!res.ok) throw new Error(`data.go.kr request failed: ${res.status}`);
    const body = await res.json();
    const header = body.response?.header;
    if (header?.resultCode !== '00') return null; // no data for this date (weekend/holiday) - caller tries an earlier date.

    const items = body.response?.body?.items?.item ?? [];
    rows.push(...(Array.isArray(items) ? items : [items]));
    const totalCount = body.response?.body?.totalCount ?? 0;
    if (page * 1000 >= totalCount) break;
    page++;
  }
  return rows;
}

// 코스피/코스닥 지수 - 상단 티커용. 실패해도 종목 시세 수집을 막지 않도록 호출부에서 try/catch.
async function fetchIndices(basDt) {
  const out = [];
  for (const idxNm of ['코스피', '코스닥']) {
    const url = new URL('https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex');
    url.searchParams.set('serviceKey', process.env.DATA_GO_KR_KEY);
    url.searchParams.set('resultType', 'json');
    url.searchParams.set('basDt', basDt);
    url.searchParams.set('idxNm', idxNm);
    url.searchParams.set('numOfRows', '1');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`index request failed: ${res.status}`);
    const body = await res.json();
    const raw = body.response?.body?.items?.item;
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (!item) continue;
    out.push({ name: idxNm, close: Number(item.clpr), changePct: Number(item.fltRt) });
  }
  return out;
}

async function main() {
  if (!process.env.DATA_GO_KR_KEY) {
    console.error('DATA_GO_KR_KEY env var is required.');
    process.exit(1);
  }

  // 오늘부터 최대 5일 전까지 거슬러 올라가며 첫 성공 응답을 쓴다 (주말/공휴일 대비).
  let rows = null;
  let usedDate = null;
  for (let daysAgo = 0; daysAgo <= 5; daysAgo++) {
    const basDt = kstDateMinus(daysAgo);
    rows = await fetchForDate(basDt);
    if (rows && rows.length > 0) {
      usedDate = basDt;
      break;
    }
  }
  if (!rows || rows.length === 0) {
    console.error('No price data found in the last 5 days.');
    process.exit(1);
  }

  const dateStr = `${usedDate.slice(0, 4)}-${usedDate.slice(4, 6)}-${usedDate.slice(6, 8)}`;
  const prices = rows.map((r) => mapRow(r, dateStr));

  writeFileSync(new URL('../public/data/prices.json', import.meta.url), JSON.stringify(prices, null, 2) + '\n');
  console.log(`Wrote ${prices.length} KR closing prices (as of ${usedDate}) to public/data/prices.json`);

  try {
    const indices = await fetchIndices(usedDate);
    if (indices.length > 0) {
      writeFileSync(new URL('../public/data/indices.json', import.meta.url), JSON.stringify(indices) + '\n');
      console.log(`Wrote ${indices.length} market indices to public/data/indices.json`);
    }
  } catch (e) {
    console.warn('Index fetch skipped:', e.message);
  }

  const day = aggregateMoneyFlow(rows, {
    sectorMap: readJson('../public/data/sector-map.json', {}),
    themeMaps: readJson('../public/data/theme-maps.json', []),
    date: dateStr,
  });
  const history = mergeHistory(readJson('../public/data/money-flow.json', null), day);
  writeFileSync(new URL('../public/data/money-flow.json', import.meta.url), JSON.stringify(history) + '\n');
  console.log(
    `Wrote money flow for ${dateStr}: ${day.total}억 across ${Object.keys(day.themes).length} themes / ` +
      `${Object.keys(day.sectors).length} sectors (${history.days.length} days kept)`
  );
}

// Only run when executed directly (`node scripts/fetch-prices.mjs`) - not when
// imported, e.g. by fetch-prices.selfcheck.mjs pulling in mapRow.
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
