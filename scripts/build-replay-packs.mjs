// 리플레이 방(여럿이 같은 차트로 가상매매)용 일봉 묶음을 만든다.
// 거래대금 상위 종목 일부의 최근 약 1년치 일봉(시·고·저·종·거래량)을 data.go.kr 주식시세정보에서 받아
// public/data/replay/{종목코드}.json 과 목록 public/data/replay/index.json 으로 쓴다.
// 출처는 fetch-prices.mjs와 같은 공공데이터(상업적 이용 허용). 주 1회면 충분하다.
//
// Usage: DATA_GO_KR_KEY=xxx node scripts/build-replay-packs.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fetchWithRetry } from './fetch-prices.mjs';

const PACK_COUNT = 24;
const DAYS_BACK = 400; // 달력 기준 - 거래일로 약 270일
const MIN_ROWS = 200; // 방 한 판 = 앞 120봉(보여줌) + 60봉(진행). 이보다 짧으면 쓰지 않는다.

const num = (v) => Number(String(v ?? '').replace(/,/g, ''));

// data.go.kr 행 -> 차트 행. 시가 0(거래정지일)은 버린다.
export function toRow(r) {
  const row = {
    date: `${r.basDt.slice(0, 4)}-${r.basDt.slice(4, 6)}-${r.basDt.slice(6, 8)}`,
    open: num(r.mkp),
    high: num(r.hipr),
    low: num(r.lopr),
    close: num(r.clpr),
    volume: num(r.trqu),
  };
  return row.open > 0 && row.high > 0 && row.low > 0 && row.close > 0 ? row : null;
}

function serviceKey() {
  const k = process.env.DATA_GO_KR_KEY ?? '';
  try {
    return decodeURIComponent(k);
  } catch {
    return k;
  }
}

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchSeries(ticker) {
  const end = new Date(Date.now() + 9 * 3600e3);
  const begin = new Date(end.getTime() - DAYS_BACK * 86_400_000);
  const url = new URL('https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2');
  url.searchParams.set('serviceKey', serviceKey());
  url.searchParams.set('resultType', 'json');
  url.searchParams.set('likeSrtnCd', ticker);
  url.searchParams.set('beginBasDt', ymd(begin));
  url.searchParams.set('endBasDt', ymd(end));
  url.searchParams.set('numOfRows', '1000');
  url.searchParams.set('pageNo', '1');
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const raw = body.response?.body?.items?.item ?? [];
  const items = (Array.isArray(raw) ? raw : [raw]).filter((r) => r.srtnCd === ticker); // like 검색이라 정확히 거른다
  return items.map(toRow).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  if (!process.env.DATA_GO_KR_KEY) {
    console.error('DATA_GO_KR_KEY env var is required.');
    process.exit(1);
  }
  const prices = JSON.parse(readFileSync(new URL('../public/data/prices.json', import.meta.url), 'utf8'));
  const names = new Map(
    JSON.parse(readFileSync(new URL('../public/data/stocks.json', import.meta.url), 'utf8')).map((s) => [s.ticker, s.companyName])
  );
  const candidates = prices
    .filter((p) => names.has(p.ticker) && (p.amount ?? 0) > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, PACK_COUNT * 2)
    .map((p) => p.ticker);

  mkdirSync(new URL('../public/data/replay/', import.meta.url), { recursive: true });
  const index = [];
  for (const ticker of candidates) {
    if (index.length >= PACK_COUNT) break;
    try {
      const rows = await fetchSeries(ticker);
      if (rows.length < MIN_ROWS) {
        console.log(`skip ${ticker}: ${rows.length} rows`);
        continue;
      }
      writeFileSync(new URL(`../public/data/replay/${ticker}.json`, import.meta.url), JSON.stringify(rows) + '\n');
      index.push({ ticker, name: names.get(ticker), rows: rows.length, from: rows[0].date, to: rows[rows.length - 1].date });
      console.log(`ok ${ticker} ${rows.length} rows`);
    } catch (e) {
      console.warn(`skip ${ticker}: ${e.message}`);
    }
    await sleep(300);
  }
  if (index.length === 0) {
    console.error('No replay packs built; keeping previous files.');
    process.exit(1);
  }
  const kst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  writeFileSync(new URL('../public/data/replay/index.json', import.meta.url), JSON.stringify({ updated: kst, packs: index }) + '\n');
  console.log(`Wrote ${index.length} replay packs.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
