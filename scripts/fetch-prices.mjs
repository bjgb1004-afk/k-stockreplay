// Fetches KR closing prices for the full KRX universe (matches public/data/stocks.json)
// from the public data portal - see [[kstock_price_data_source]] memory for why this
// source (commercial reuse explicitly allowed) over KRX's own Open API.
//
// Usage: DATA_GO_KR_KEY=xxx node scripts/fetch-prices.mjs

import { writeFileSync } from 'node:fs';

const API_KEY = process.env.DATA_GO_KR_KEY;
if (!API_KEY) {
  console.error('DATA_GO_KR_KEY env var is required.');
  process.exit(1);
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
    url.searchParams.set('serviceKey', API_KEY);
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
if (!rows) {
  console.error('No price data found in the last 5 days.');
  process.exit(1);
}

const prices = rows.map((r) => ({
  ticker: r.srtnCd,
  close: Number(r.clpr),
  changePct: Number(r.fltRt),
  date: `${usedDate.slice(0, 4)}-${usedDate.slice(4, 6)}-${usedDate.slice(6, 8)}`,
}));

writeFileSync(new URL('../public/data/prices.json', import.meta.url), JSON.stringify(prices, null, 2) + '\n');
console.log(`Wrote ${prices.length} KR closing prices (as of ${usedDate}) to public/data/prices.json`);
