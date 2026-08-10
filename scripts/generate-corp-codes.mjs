// One-time (re-run when public/data/stocks.json changes) helper: DART identifies
// companies by an 8-digit corp_code, NOT the KRX stock ticker. This downloads
// DART's corp_code -> stock_code master list and keeps only the tickers we track,
// writing scripts/dart-corp-codes.json for fetch-facts.mjs to consume.
//
// Usage: DART_API_KEY=xxx node scripts/generate-corp-codes.mjs
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

const stocks = JSON.parse(readFileSync(new URL('../public/data/stocks.json', import.meta.url)));
const trackedTickers = new Set(stocks.map((s) => s.ticker));

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
const mapping = {};
for (const block of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
  const corpCode = /<corp_code>(.*?)<\/corp_code>/.exec(block[1])?.[1];
  const stockCode = /<stock_code>(.*?)<\/stock_code>/.exec(block[1])?.[1]?.trim();
  if (stockCode && trackedTickers.has(stockCode)) {
    mapping[stockCode] = corpCode;
  }
}

const missing = [...trackedTickers].filter((t) => !mapping[t]);
if (missing.length > 0) {
  console.warn(`No DART corp_code found for tickers: ${missing.join(', ')}`);
}

writeFileSync(
  new URL('./dart-corp-codes.json', import.meta.url),
  JSON.stringify(mapping, null, 2) + '\n',
);
console.log(`Wrote ${Object.keys(mapping).length} corp_code mappings to scripts/dart-corp-codes.json`);
