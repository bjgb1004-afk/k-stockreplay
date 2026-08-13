// One-time (re-run occasionally to pick up new listings/delistings/name
// changes) helper: builds public/data/stocks.json - the full KRX-listed
// company search universe - from DART's corp_code -> stock_code master list.
//
// Supersedes the old per-ticker generate-corp-codes.mjs: fetch-facts.mjs now
// queries DART market-wide (see PBLNTF_TYPES in fetch-facts.mjs) and gets
// stock_code/corp_name directly in each disclosure, so no separate corp_code
// mapping file is needed anymore - this script only feeds the search box.
//
// Usage: DART_API_KEY=xxx node scripts/generate-stock-list.mjs
// Requires the `unzip` CLI (present on GitHub Actions ubuntu-latest runners).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API_KEY = process.env.DART_API_KEY;
if (!API_KEY) {
  console.error('DART_API_KEY env var is required.');
  process.exit(1);
}

const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${API_KEY}`);
if (!res.ok) {
  throw new Error(`DART corpCode.xml request failed: ${res.status} ${res.statusText}`);
}
const zipBuffer = Buffer.from(await res.arrayBuffer());

const workDir = mkdtempSync(join(tmpdir(), 'dart-corpcode-'));
const zipPath = join(workDir, 'corpCode.zip');
writeFileSync(zipPath, zipBuffer);
execFileSync('unzip', ['-o', zipPath, '-d', workDir]);
const xml = readFileSync(join(workDir, 'CORPCODE.xml'), 'utf-8');
rmSync(workDir, { recursive: true, force: true });

// DART's CORPCODE.xml is a flat, regular <list><corp_code/><corp_name/><stock_code/><modify_date/></list>
// structure - a small regex extraction avoids pulling in a full XML parser dependency.
const stocks = [];
for (const block of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
  const stockCode = /<stock_code>(.*?)<\/stock_code>/.exec(block[1])?.[1]?.trim();
  const corpName = /<corp_name>(.*?)<\/corp_name>/.exec(block[1])?.[1]?.trim();
  if (stockCode && corpName) {
    stocks.push({ ticker: stockCode, companyName: corpName });
  }
}
stocks.sort((a, b) => a.ticker.localeCompare(b.ticker));

writeFileSync(
  new URL('../public/data/stocks.json', import.meta.url),
  JSON.stringify(stocks, null, 2) + '\n',
);
console.log(`Wrote ${stocks.length} listed companies to public/data/stocks.json`);
