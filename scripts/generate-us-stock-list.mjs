// One-time (re-run occasionally to pick up new listings/name changes) helper:
// builds public/data/us-stocks.json - the US search universe - from SEC's
// official ticker registry. Mirrors scripts/generate-stock-list.mjs's role
// for the KR universe.
//
// Usage: node scripts/generate-us-stock-list.mjs
// SEC requires a descriptive User-Agent on all sec.gov requests (see
// https://www.sec.gov/os/webmaster-faq#developers) - requests without one
// can be rejected with 403.

import { writeFileSync } from 'node:fs';

const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
  headers: { 'User-Agent': 'k-stockreplay contact:bjgb1004@gmail.com' },
});
if (!res.ok) {
  throw new Error(`SEC company_tickers.json request failed: ${res.status} ${res.statusText}`);
}
const raw = await res.json();

const stocks = Object.values(raw)
  .map((row) => ({ ticker: row.ticker, companyName: row.title }))
  .sort((a, b) => a.ticker.localeCompare(b.ticker));

writeFileSync(
  new URL('../public/data/us-stocks.json', import.meta.url),
  JSON.stringify(stocks, null, 2) + '\n',
);
console.log(`Wrote ${stocks.length} US-listed companies to public/data/us-stocks.json`);
