// Fetches KR closing prices for the full KRX universe (matches public/data/stocks.json)
// from the public data portal - see [[kstock_price_data_source]] memory for why this
// source (commercial reuse explicitly allowed) over KRX's own Open API.
//
// Also aggregates the same response into public/data/money-flow.json: how much of
// today's KRX turnover landed in each theme / KSIC sector. The raw per-ticker
// turnover never reaches the client - only the ~170 aggregate rows do.
//
// Usage: DATA_GO_KR_KEY=xxx node scripts/fetch-prices.mjs

import { pathToFileURL } from 'node:url';
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
    // 거래대금(trPrc, 원) -> 억원 정수. 값이 없거나 이상하면 null (화면은 '—'로 그린다).
    amount: Number.isFinite(Number(r.trPrc)) && Number(r.trPrc) > 0 ? Math.round(Number(r.trPrc) / 1e8) : null,
    date: dateStr,
  };
}

// 종목별 최근 N거래일 종가. 화면의 20일 추이용.
// 형식: { dates: [오래된 -> 최신], close: { ticker: [종가|null, ...] } } - dates와 같은 길이로 맞춘다.
// dates 중 그 종목 데이터가 없는 날(신규상장 등)은 null.
export function mergePriceHistory(prev, dateStr, rows, keep = 20) {
  const prevDates = prev?.dates ?? [];
  const prevClose = prev?.close ?? {};
  const dates = [...new Set([...prevDates, dateStr])].sort().slice(-keep);
  const todayClose = new Map();
  for (const r of rows) {
    const close = Number(r.clpr);
    if (r.srtnCd && Number.isFinite(close) && close > 0) todayClose.set(r.srtnCd, close);
  }
  const close = {};
  for (const ticker of new Set([...Object.keys(prevClose), ...todayClose.keys()])) {
    close[ticker] = dates.map((d) => {
      if (d === dateStr) return todayClose.get(ticker) ?? null;
      const i = prevDates.indexOf(d);
      return i >= 0 ? (prevClose[ticker]?.[i] ?? null) : null;
    });
  }
  return { dates, close };
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

// data.go.kr 키는 %2F 처럼 이미 인코딩된 채 발급되기도 한다. URLSearchParams가 다시 인코딩하므로 먼저 디코딩한다.
function serviceKey() {
  const k = process.env.DATA_GO_KR_KEY ?? '';
  try { return decodeURIComponent(k); } catch { return k; }
}

// usedDate(YYYYMMDD) 기준 back일 전을 kstDateMinus(오늘 기준 일수)에 맞는 숫자로 바꿔준다.
function daysBetween(usedDate, back) {
  const used = Date.UTC(+usedDate.slice(0, 4), +usedDate.slice(4, 6) - 1, +usedDate.slice(6, 8));
  const kstToday = Date.UTC(...new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).split('-').map((v, i) => (i === 1 ? +v - 1 : +v)));
  return Math.round((kstToday - used) / 86_400_000) + back;
}

// apis.data.go.kr은 간헐적으로 연결을 끊는다 - 2026-10-25 자동 실행은 ConnectTimeoutError
// 하나로 그날 수집이 통째로 빠졌다. 하루 한 번만 도는 수집이라 다음 기회가 24시간 뒤이므로
// 일시적 실패는 여기서 삼킨다. 5xx/429는 서버 쪽 일시 장애라 다시 걸어보고, 4xx는 키·파라미터
// 문제라 재시도해도 같은 답이 오니 그대로 올린다.
// fetchImpl/sleep/log는 selfcheck가 네트워크·대기 없이 이 루프를 돌리기 위한 주입구다.
export async function fetchWithRetry(url, opts = {}) {
  const { tries = 3, fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console.log } = opts;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetchImpl(url);
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (attempt >= tries) throw e;
      const wait = 2000 * attempt;
      log(`data.go.kr 요청 실패 (${attempt}/${tries}): ${e.message} - ${wait / 1000}초 후 재시도`);
      await sleep(wait);
    }
  }
}

async function fetchForDate(basDt) {
  const rows = [];
  let page = 1;
  for (;;) {
    const url = new URL('https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2');
    // Note: data.go.kr keys are sometimes issued already percent-encoded; URLSearchParams may double-encode them.
    url.searchParams.set('serviceKey', serviceKey());
    url.searchParams.set('resultType', 'json');
    url.searchParams.set('basDt', basDt);
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', String(page));

    const res = await fetchWithRetry(url);
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

// 지수 응답 한 줄 -> 화면용 행. data.go.kr 주가지수시세의 종가=clpr, 등락률=fltRt
// (공공데이터포털 "금융위원회_지수시세정보" 명세 확인). 숫자가 "2,598.37"처럼 콤마를
// 달고 오면 Number()가 NaN이 되어 티커에 NaN%가 찍히므로 콤마를 떼고 파싱한다.
export function mapIndexRow(item) {
  const num = (v) => Number(String(v ?? '').replace(/,/g, '').trim());
  const close = num(item.clpr);
  const changePct = num(item.fltRt);
  if (!Number.isFinite(close)) throw new Error(`index row has unusable clpr: ${JSON.stringify(item.clpr)}`);
  return { name: item.idxNm, close, changePct: Number.isFinite(changePct) ? changePct : 0 };
}

// 코스피/코스닥 지수 - 상단 티커용. 실패해도 종목 시세 수집을 막지 않도록 호출부에서 try/catch.
async function fetchIndices(basDt) {
  const out = [];
  for (const idxNm of ['코스피', '코스닥']) {
    const url = new URL('https://apis.data.go.kr/1160100/GetMarketIndexInfoService_V2/getStockMarketIndex_V2');
    url.searchParams.set('serviceKey', serviceKey());
    url.searchParams.set('resultType', 'json');
    url.searchParams.set('basDt', basDt);
    url.searchParams.set('idxNm', idxNm);
    url.searchParams.set('numOfRows', '1');
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`index request failed: ${res.status}`);
    const body = await res.json();

    // 지수시세정보는 주식시세정보와 별개 서비스다. 키가 이 쪽에 신청되지 않았으면
    // data.go.kr은 200 + 에러 봉투(OpenAPI_ServiceResponse)를 주는데, 예전 코드는
    // item이 없다고 보고 조용히 넘어가서 indices.json이 아예 안 만들어졌다.
    const fault = body.OpenAPI_ServiceResponse?.cmmMsgHeader;
    if (fault) throw new Error(`index request rejected: ${fault.errMsg} (${fault.returnAuthMsg})`);
    const header = body.response?.header;
    if (header?.resultCode !== '00' && header?.resultCode !== '03') {
      throw new Error(`index request failed: ${header?.resultCode} ${header?.resultMsg}`);
    }

    const raw = body.response?.body?.items?.item;
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (!item) {
      console.log(`::warning title=지수 ${idxNm} 0건::basDt=${basDt}, idxNm=${idxNm} 조회 결과가 없다. 지수명 표기가 바뀌었는지 확인할 것.`);
      continue;
    }
    out.push(mapIndexRow(item));
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

  writeFileSync(new URL('../public/data/prices.json', import.meta.url), JSON.stringify(prices) + '\n');
  console.log(`Wrote ${prices.length} KR closing prices (as of ${usedDate}) to public/data/prices.json`);

  // 20일 추이: 처음 도는 날엔 과거 거래일을 거슬러 올라가며 채우고(주말·공휴일은 응답이 비어 건너뜀),
  // 이후엔 하루치만 더한다. 실패해도 오늘 시세는 이미 저장됐으니 경고만 남긴다.
  try {
    let history = readJson('../public/data/price-history.json', null);
    const want = 20;
    const have = new Set(history?.dates ?? []);
    have.add(dateStr);
    for (let back = 1; back <= 45 && have.size < want; back++) {
      const basDt = kstDateMinus(daysBetween(usedDate, back));
      const d = `${basDt.slice(0, 4)}-${basDt.slice(4, 6)}-${basDt.slice(6, 8)}`;
      if (have.has(d)) continue;
      const past = await fetchForDate(basDt);
      if (!past || past.length === 0) continue; // 휴장일
      history = mergePriceHistory(history, d, past, want);
      have.add(d);
    }
    history = mergePriceHistory(history, dateStr, rows, want);
    // 오늘 시세에 없는 종목(상장폐지 등)은 버려서 파일이 계속 부풀지 않게 한다.
    const live = new Set(prices.map((p) => p.ticker));
    history.close = Object.fromEntries(Object.entries(history.close).filter(([t]) => live.has(t)));
    writeFileSync(new URL('../public/data/price-history.json', import.meta.url), JSON.stringify(history) + '\n');
    console.log(`Wrote price history: ${history.dates.length} days x ${Object.keys(history.close).length} tickers`);
    if (history.dates.length < want) {
      console.log(`::warning title=20일 추이 데이터 부족::거래일 ${history.dates.length}/${want}일만 모았다 - 추이 그래프가 짧게 나온다.`);
    }
  } catch (e) {
    console.log(`::warning title=가격 기록 수집 실패::${e.message} - 20일 추이 그래프가 갱신되지 않는다.`);
  }

  try {
    const indices = await fetchIndices(usedDate);
    if (indices.length > 0) {
      writeFileSync(new URL('../public/data/indices.json', import.meta.url), JSON.stringify(indices) + '\n');
      console.log(`Wrote ${indices.length} market indices to public/data/indices.json`);
    } else {
      console.log('::warning title=지수 데이터 없음::indices.json을 쓰지 않았다 - 상단 지수 티커가 빈 채로 남는다.');
    }
  } catch (e) {
    // 종목 시세는 이미 저장됐으니 여기서 죽이진 않되, 실행 요약에서 보이게 남긴다.
    console.log(`::warning title=지수 수집 실패::${e.message} - 상단 지수 티커가 빈 채로 남는다.`);
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
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
