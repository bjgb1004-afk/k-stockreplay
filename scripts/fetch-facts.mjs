// FACT ENGINE pipeline (§4 자동화 범위: 수집 → 검증 → 정규화 → Fact 추출 → 이벤트 분류 → 발행).
// Runs server-side only (GitHub Actions) - DART_API_KEY must never be a VITE_-prefixed
// env var, or Vite would bundle it into the public client build.
//
// Scope note: this covers today's disclosures only. `upcoming` (dividend/event
// calendars) and `factChecks` (rule-based fact verification) are later MVP phases
// and are published as empty placeholders here, not fabricated.
//
// Usage: DART_API_KEY=xxx node scripts/fetch-facts.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { classify, buildMyStockRadar, dedupeDisclosures } from './lib/facts.mjs';

const API_KEY = process.env.DART_API_KEY;
if (!API_KEY) {
  console.error('DART_API_KEY env var is required.');
  process.exit(1);
}

const stocks = JSON.parse(readFileSync(new URL('../public/data/stocks.json', import.meta.url)));
const corpCodes = JSON.parse(readFileSync(new URL('./dart-corp-codes.json', import.meta.url)));
const companyByTicker = Object.fromEntries(stocks.map((s) => [s.ticker, s.companyName]));

function todayKst() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchDisclosures(ticker, corpCode, date) {
  const url = new URL('https://opendart.fss.or.kr/api/list.json');
  url.searchParams.set('crtfc_key', API_KEY);
  url.searchParams.set('corp_code', corpCode);
  url.searchParams.set('bgn_de', date);
  url.searchParams.set('end_de', date);
  url.searchParams.set('page_count', '20');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`DART list.json failed for ${ticker}: ${res.status}`);
  const body = await res.json();
  // status "013" = no matching disclosures for the range, not an error.
  if (body.status !== '000' && body.status !== '013') {
    throw new Error(`DART list.json error for ${ticker}: ${body.status} ${body.message}`);
  }
  return body.list ?? [];
}

const date = todayKst();
const newToday = [];
const changesByTicker = new Map();

for (const [ticker, corpCode] of Object.entries(corpCodes)) {
  const companyName = companyByTicker[ticker] ?? ticker;
  const disclosures = dedupeDisclosures(await fetchDisclosures(ticker, corpCode, date));
  for (const d of disclosures) {
    newToday.push({
      id: d.rcept_no,
      ticker,
      companyName,
      type: classify(d.report_nm),
      title: d.report_nm,
      time: d.rcept_dt === date ? '' : d.rcept_dt,
    });
  }
  if (disclosures.length > 0) {
    const prev = changesByTicker.get(ticker)?.changeCount ?? 0;
    changesByTicker.set(ticker, { companyName, changeCount: prev + disclosures.length });
  }
}

const myStockRadar = buildMyStockRadar(changesByTicker);

const today = {
  date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
  generatedAt: new Date().toISOString(),
  summary: {
    newEvents: newToday.length,
    importantFacts: 0, // pending FACT verification rule parser
    dividendEvents: newToday.filter((e) => e.type === 'DIVIDEND').length,
    relationChanges: 0, // pending relation/theme-tree tracking
  },
  newToday,
  myStockRadar,
  upcoming: {
    tomorrow: { dividend: 0, shareholderMeeting: 0 }, // pending DIVIDEND/EVENT CALENDAR phase
    thisWeek: { earnings: 0, dividend: 0 },
  },
  factChecks: [], // pending crowdsourced fact-check phase (§7-2)
};

writeFileSync(new URL('../public/data/today.json', import.meta.url), JSON.stringify(today, null, 2) + '\n');
console.log(`Wrote ${newToday.length} disclosure(s) across ${changesByTicker.size} companies to public/data/today.json`);
