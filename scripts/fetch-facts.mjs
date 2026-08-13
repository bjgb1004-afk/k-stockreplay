// FACT ENGINE pipeline (§4 자동화 범위: 수집 → 검증 → 정규화 → Fact 추출 → 이벤트 분류 → 발행).
// Runs server-side only (GitHub Actions) - DART_API_KEY must never be a VITE_-prefixed
// env var, or Vite would bundle it into the public client build.
//
// Scope note: this covers today's disclosures only. `upcoming` (dividend/event
// calendars) and `factChecks` (rule-based fact verification) are later MVP phases
// and are published as empty placeholders here, not fabricated.
//
// Usage: DART_API_KEY=xxx node scripts/fetch-facts.mjs

import { writeFileSync } from 'node:fs';
import { classify, buildMyStockRadar, dedupeDisclosures, interpret } from './lib/facts.mjs';

const API_KEY = process.env.DART_API_KEY;
if (!API_KEY) {
  console.error('DART_API_KEY env var is required.');
  process.exit(1);
}

function todayKst() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

// Market-wide query (no corp_code) instead of one call per tracked ticker -
// this scales to the full KRX universe without the call count scaling with
// how many companies we track. pblntf_ty narrows it to the two "사건성"
// categories: I=거래소공시(수시공시 - 계약/임원변경/소송 등), B=주요사항보고
// (증자/감자/합병/자기주식 등). A(정기공시)/J(공정위공시) etc. run 400-700+/day
// and are mostly routine - out of scope until the earnings-calendar phase.
const PBLNTF_TYPES = ['I', 'B'];

async function fetchByType(type, date) {
  const items = [];
  let page = 1;
  for (;;) {
    const url = new URL('https://opendart.fss.or.kr/api/list.json');
    url.searchParams.set('crtfc_key', API_KEY);
    url.searchParams.set('pblntf_ty', type);
    url.searchParams.set('bgn_de', date);
    url.searchParams.set('end_de', date);
    url.searchParams.set('page_no', String(page));
    url.searchParams.set('page_count', '100');

    const res = await fetch(url);
    if (!res.ok) throw new Error(`DART list.json failed for type ${type} page ${page}: ${res.status}`);
    const body = await res.json();
    if (body.status === '013') break; // no matching disclosures for the range, not an error.
    if (body.status !== '000') throw new Error(`DART list.json error (${type}): ${body.status} ${body.message}`);

    items.push(...(body.list ?? []));
    if (page >= body.total_page) break;
    page++;
  }
  return items;
}

const date = todayKst();
const rawLists = await Promise.all(PBLNTF_TYPES.map((type) => fetchByType(type, date)));
// stock_code is empty for non-listed reporters (bond issuers, funds, etc.) - not tickers we can show.
// report_nm trimmed here (DART pads it to a fixed width) so dedupe's "(정정 등 N건)"
// suffix doesn't land after a run of trailing spaces.
const raw = rawLists.flat()
  .filter((d) => d.stock_code)
  .map((d) => ({ ...d, report_nm: d.report_nm.trim() }));

const byTicker = new Map();
for (const d of raw) {
  if (!byTicker.has(d.stock_code)) byTicker.set(d.stock_code, []);
  byTicker.get(d.stock_code).push(d);
}

let newToday = [];
const changesByTicker = new Map();
for (const [ticker, disclosures] of byTicker) {
  const companyName = disclosures[0].corp_name.trim();
  const deduped = dedupeDisclosures(disclosures);
  for (const d of deduped) {
    const { sentiment, meaning } = interpret(d.report_nm);
    newToday.push({
      id: d.rcept_no,
      ticker,
      companyName,
      type: classify(d.report_nm),
      title: d.report_nm.trim(),
      time: '',
      sentiment,
      meaning,
    });
  }
  changesByTicker.set(ticker, { companyName, changeCount: deduped.length });
}

const totalBeforeCap = newToday.length;
newToday.sort((a, b) => b.id.localeCompare(a.id)); // rcept_no is a receipt timestamp - latest first.
// ponytail: flat feed cap at 60 so the page stays scrollable; myStockRadar below
// isn't affected (client filters it to the user's own watchlist, which is small).
// Add pagination/"더보기" if 60 turns out to be too tight.
newToday = newToday.slice(0, 60);
if (totalBeforeCap > newToday.length) {
  console.log(`(${totalBeforeCap} disclosures today, showing latest ${newToday.length})`);
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
console.log(`Wrote public/data/today.json: ${newToday.length} in feed, ${changesByTicker.size} companies had activity today`);
