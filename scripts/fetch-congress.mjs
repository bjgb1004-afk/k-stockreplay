// 미국 하원의원 주식 거래 신고(STOCK Act PTR)를 하원 사무처 공개 자료에서 무료로 모아
// public/data/congress-us.json 으로 만든다. 서버(GitHub Actions)에서만 돈다.
//
// 1) disclosures-clerk.house.gov/public_disc/financial-pdfs/{연도}FD.zip 안의 {연도}FD.xml
//    = 모든 재산·거래 신고 목록 (FilingType "P" = 주식 거래 신고 PTR). 2026-11-22 형식 확인.
// 2) PTR 원문 PDF(ptr-pdfs/{연도}/{DocID}.pdf)를 pdftotext로 글자만 뽑아 종목·매수/매도·날짜·금액대를 읽는다.
//    손글씨·스캔 신고는 글자가 안 나오므로 원문 링크만 남긴다 (화면에 "원문 확인"으로 표시).
//
// 신고는 거래 후 최대 45일 뒤에 올라오고 금액은 구간($1,001-$15,000 등)으로만 공개된다. 화면에도 밝힌다.
//
// Usage: node scripts/fetch-congress.mjs   (unzip, pdftotext(poppler-utils) CLI 필요)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'https://disclosures-clerk.house.gov/public_disc';
const MAX_FILINGS = 60; // 최근 신고 몇 건의 원문을 읽을지 (하루 1회, 요청 간격 400ms)
const REQUEST_INTERVAL_MS = 400;
const HEADERS = { 'User-Agent': 'k-stockreplay (https://k-stockreplay.pe.kr)' };

const tag = (block, name) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(block)?.[1]?.trim() ?? '';

// "4/15/2026" -> "2026-04-15"
export function usDate(mdy) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(mdy ?? '').trim());
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
}

// {연도}FD.xml -> PTR 신고 목록 (최신 신고일 순)
export function parseIndex(xml, year) {
  const out = [];
  for (const m of xml.matchAll(/<Member>([\s\S]*?)<\/Member>/g)) {
    const b = m[1];
    if (tag(b, 'FilingType') !== 'P') continue;
    const docId = tag(b, 'DocID');
    const filed = usDate(tag(b, 'FilingDate'));
    if (!docId || !filed) continue;
    const name = [tag(b, 'First'), tag(b, 'Last'), tag(b, 'Suffix')].filter(Boolean).join(' ');
    out.push({ name, state: tag(b, 'StateDst'), filed, docId, url: `${BASE}/ptr-pdfs/${year}/${docId}.pdf` });
  }
  return out.sort((a, b) => b.filed.localeCompare(a.filed) || b.docId.localeCompare(a.docId));
}

const TYPE = { P: 'buy', S: 'sell', 'S (partial)': 'sell', E: 'exchange' };

// pdftotext 결과 -> 거래 행. 전자 신고서는 한 거래가
//   "NVIDIA Corporation - Common Stock (NVDA) [ST]   P   10/15/2026 10/20/2026 $1,001 - $15,000"
// 처럼 나오는데, 줄바꿈 위치가 신고마다 달라 공백을 하나로 접은 뒤 찾는다. 주식([ST])만 쓴다.
export function parseTrades(text) {
  const flat = String(text).replace(/\s+/g, ' ');
  const re =
    /\(([A-Z][A-Z0-9.\-]{0,6})\)\s*\[([A-Z]{2})\]\s*(?:[A-Za-z]{1,3}\s+)?(P|S \(partial\)|S|E)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\$[\d,]+\s*-\s*\$[\d,]+|Over \$[\d,]+|\$[\d,]+)/g;
  const trades = [];
  for (const m of flat.matchAll(re)) {
    if (m[2] !== 'ST') continue;
    trades.push({ ticker: m[1], type: TYPE[m[3]] ?? 'other', txDate: usDate(m[4]), amount: m[6].replace(/\s+/g, ' ') });
  }
  return trades;
}

// 최근 신고들에서 종목별 매수/매도 건수 (의원 수 기준) - "의원들이 많이 산 종목"
export function topTickers(filings, limit = 15) {
  const map = new Map();
  for (const f of filings) {
    for (const t of f.trades) {
      const cur = map.get(t.ticker) ?? { ticker: t.ticker, buy: new Set(), sell: new Set() };
      if (t.type === 'buy') cur.buy.add(f.name);
      if (t.type === 'sell') cur.sell.add(f.name);
      map.set(t.ticker, cur);
    }
  }
  return [...map.values()]
    .map((t) => ({ ticker: t.ticker, buyers: t.buy.size, sellers: t.sell.size }))
    .sort((a, b) => b.buyers + b.sellers - (a.buyers + a.sellers) || b.buyers - a.buyers)
    .slice(0, limit);
}

async function loadIndex(year, workDir) {
  const res = await fetch(`${BASE}/financial-pdfs/${year}FD.zip`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${year}FD.zip ${res.status}`);
  const zip = join(workDir, `${year}.zip`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  execFileSync('unzip', ['-o', '-q', zip, `${year}FD.xml`, '-d', workDir]);
  return parseIndex(readFileSync(join(workDir, `${year}FD.xml`), 'utf8'), year);
}

async function readPdf(url, workDir) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status}`);
  const pdf = join(workDir, 'f.pdf');
  writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
  return execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

async function main() {
  const workDir = mkdtempSync(join(tmpdir(), 'house-ptr-'));
  try {
    const year = new Date().getUTCFullYear();
    let index = await loadIndex(year, workDir);
    // 연초엔 올해 신고가 적으니 작년 목록도 붙인다.
    if (index.length < MAX_FILINGS) index = [...index, ...(await loadIndex(year - 1, workDir).catch(() => []))];

    const filings = [];
    let parsed = 0;
    for (const f of index.slice(0, MAX_FILINGS)) {
      let trades = [];
      try {
        trades = parseTrades(await readPdf(f.url, workDir));
        if (trades.length) parsed++;
      } catch (e) {
        console.warn(`skip pdf ${f.docId}: ${e.message}`);
      }
      filings.push({ ...f, trades });
      await sleep(REQUEST_INTERVAL_MS);
    }
    if (filings.length === 0) {
      console.error('No PTR filings found; keeping the previous file.');
      process.exit(1);
    }
    const kst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    writeFileSync(
      new URL('../public/data/congress-us.json', import.meta.url),
      JSON.stringify({ updated: kst, filings, top: topTickers(filings) }) + '\n'
    );
    console.log(`Wrote ${filings.length} PTR filings (${parsed} with parsed stock trades).`);
    if (parsed === 0) console.log('::warning title=의원 거래 파싱 0건::PDF 글자 형식이 바뀌었는지 parseTrades를 확인할 것.');
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
