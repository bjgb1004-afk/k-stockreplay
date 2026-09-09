// One-time (re-run occasionally - companies rarely change registered industry)
// helper: builds public/data/sector-map.json, a ticker -> KSIC(한국표준산업분류)
// 소분류 industry code+name map. This is DART's own official classification
// (company.json's induty_code field), not hand-curated "테마" - every listed
// company already has one, so no editorial data entry is needed.
//
// Usage: DART_API_KEY=xxx node scripts/generate-sector-map.mjs
// Requires the `unzip` CLI. Runs ~4000 DART API calls (one per company).
// DART's WAF caps anonymous traffic at ~100 req/min and resets connections
// (not a clean error response) once tripped, so this runs sequentially with
// a throttle - takes ~45min. Safe to Ctrl+C and re-run: it checkpoints to
// public/data/sector-map.json periodically and skips tickers already there.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const API_KEY = process.env.DART_API_KEY;
if (!API_KEY) {
  console.error('DART_API_KEY env var is required.');
  process.exit(1);
}

const ksicNames = JSON.parse(readFileSync(new URL('./lib/ksic-codes.json', import.meta.url)));

// DART's WAF resets connections that don't send a browser-like User-Agent.
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// --- 1. ticker -> corp_code (same source/parse as generate-stock-list.mjs) ---
const zipRes = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${API_KEY}`, { headers: BROWSER_HEADERS });
if (!zipRes.ok) throw new Error(`DART corpCode.xml request failed: ${zipRes.status}`);
const zipBuffer = Buffer.from(await zipRes.arrayBuffer());

const workDir = mkdtempSync(join(tmpdir(), 'dart-corpcode-'));
const zipPath = join(workDir, 'corpCode.zip');
writeFileSync(zipPath, zipBuffer);
execFileSync('unzip', ['-o', zipPath, '-d', workDir]);
const xml = readFileSync(join(workDir, 'CORPCODE.xml'), 'utf-8');
rmSync(workDir, { recursive: true, force: true });

const tickerToCorp = new Map();
for (const block of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
  const corpCode = /<corp_code>(.*?)<\/corp_code>/.exec(block[1])?.[1];
  const stockCode = /<stock_code>(.*?)<\/stock_code>/.exec(block[1])?.[1]?.trim();
  if (corpCode && stockCode) tickerToCorp.set(stockCode, corpCode);
}
console.log(`${tickerToCorp.size} listed companies found, fetching industry codes...`);

// --- 2. corp_code -> induty_code, sequential + throttled (~85 req/min, under DART's ~100/min cap) ---
const outUrl = new URL('../public/data/sector-map.json', import.meta.url);
const sectorMap = existsSync(outUrl) ? JSON.parse(readFileSync(outUrl)) : {};
const REQUEST_INTERVAL_MS = 700;

const entries = [...tickerToCorp.entries()].filter(([ticker]) => !(ticker in sectorMap));
console.log(`${entries.length} remaining (${tickerToCorp.size - entries.length} already cached).`);

function save() {
  writeFileSync(outUrl, JSON.stringify(sectorMap, null, 2) + '\n');
}

let done = 0;
let failed = 0;
for (const [ticker, corpCode] of entries) {
  try {
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${API_KEY}&corp_code=${corpCode}`;
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (res.ok) {
      const body = await res.json();
      // induty_code는 회사마다 등록된 KSIC 분류 깊이가 달라 3자리(소분류) 또는
      // 5자리(세분류)로 옴 (예: 은행/보험 계열은 64121, 65121). ksic-codes.json은
      // 3자리 이름표만 갖고 있으니 앞 3자리로 잘라서 조회한다.
      const code = body.induty_code?.slice(0, 3);
      const name = body.status === '000' && ksicNames[code];
      if (name) sectorMap[ticker] = { code, name };
    }
  } catch {
    failed++;
  }
  done++;
  if (done % 100 === 0) {
    save();
    console.log(`${done}/${entries.length} (${failed} failed)...`);
  }
  await sleep(REQUEST_INTERVAL_MS);
}

save();
console.log(`Wrote ${Object.keys(sectorMap).length} ticker->sector mappings to public/data/sector-map.json (${failed} requests failed this run)`);
