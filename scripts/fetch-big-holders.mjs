// 큰손 따라보기(국내): DART 대량보유상황보고(majorstock.json)를 전 상장사에 대해 훑어서
// "5% 이상 보유 보고를 가장 많이 낸 기관"을 뽑고, 기관별 보유 종목·비율·변동 이력을
// public/data/big-holders-kr.json 으로 만든다. 서버(GitHub Actions)에서만 돈다.
//
// 왜 회사별로 훑나: majorstock.json은 보유자가 아니라 회사(corp_code) 기준으로만 조회된다.
// 그래서 전 상장사를 한 번씩 읽고(약 2,500회, DART WAF 때문에 700ms 간격) 보유자별로 다시 묶는다.
// 보유자 이름을 미리 하드코딩하지 않고 "보고 건수 상위 기관"을 자동으로 고른다 - 이름 표기가
// 어떻게 올라오는지 추측해서 놓치는 일이 없게. 개인(대주주)은 이름만으로 구분이 안 되므로
// 기관 키워드가 들어간 보고자만 대상으로 한다.
//
// Usage: DART_API_KEY=xxx node scripts/fetch-big-holders.mjs   (unzip CLI 필요)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const MAX_HOLDERS = 12; // 화면에 올릴 기관 수
const MIN_COMPANIES = 3; // 이보다 적은 종목에만 나오는 보고자는 "큰손"으로 보기 어렵다
const MAX_HOLDINGS = 100; // 기관당 종목 상한 (파일 크기 제한)
const HISTORY_POINTS = 12; // 종목별 추이에 쓰는 최근 보고 수
const REQUEST_INTERVAL_MS = 700;

const INSTITUTION_PATTERN =
  /공단|연금|공제회|자산운용|투자자문|투자신탁|투자증권|증권|은행|보험|캐피탈|펀드|인베스트|파트너스|Fund|Capital|Management|Investment|Advisors|Partners|Asset|Trust|Bank|Securities|Holdings|Group|LLC|L\.P\.|LP|Ltd|Inc|Corp|Co\./i;

export function isInstitution(name) {
  return typeof name === 'string' && INSTITUTION_PATTERN.test(name);
}

// DART는 숫자를 "1,234" / "-" / "" 문자열로 준다.
export function toNumber(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/,/g, '').trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(yyyymmdd) {
  const s = String(yyyymmdd ?? '');
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null;
}

// rows: majorstock.json의 list 항목들 (여러 회사가 섞여 있어도 된다).
// corpToTicker: corp_code -> 6자리 종목코드. 상장사가 아니면 건너뛴다.
export function collectByHolder(rows, corpToTicker) {
  const holders = new Map(); // repror -> Map(ticker -> row[])
  for (const r of rows) {
    const ticker = corpToTicker.get(r.corp_code);
    const ratio = toNumber(r.stkrt);
    const date = toIsoDate(r.rcept_dt);
    if (!ticker || ratio === null || !date || !isInstitution(r.repror)) continue;
    const name = r.repror.trim();
    if (!holders.has(name)) holders.set(name, new Map());
    const byTicker = holders.get(name);
    if (!byTicker.has(ticker)) byTicker.set(ticker, []);
    byTicker.get(ticker).push({
      ticker,
      companyName: r.corp_name,
      date,
      ratio,
      delta: toNumber(r.stkrt_irds),
      reason: (r.report_resn ?? '').trim(),
      rcept: r.rcept_no,
    });
  }
  return holders;
}

export function buildHolders(holders, { maxHolders = MAX_HOLDERS, minCompanies = MIN_COMPANIES } = {}) {
  const out = [];
  for (const [name, byTicker] of holders) {
    if (byTicker.size < minCompanies) continue;
    const holdings = [];
    for (const rows of byTicker.values()) {
      rows.sort((a, b) => a.date.localeCompare(b.date) || String(a.rcept).localeCompare(String(b.rcept)));
      const latest = rows[rows.length - 1];
      holdings.push({
        ticker: latest.ticker,
        name: latest.companyName,
        ratio: latest.ratio,
        delta: latest.delta,
        date: latest.date,
        reason: latest.reason,
        // 최신 보고에서 5% 아래로 내려갔으면 이미 정리한 종목이다 - 목록엔 남기되 구분한다.
        exited: latest.ratio < 5,
        hist: rows.slice(-HISTORY_POINTS).map((r) => [r.date, r.ratio]),
      });
    }
    holdings.sort((a, b) => Number(a.exited) - Number(b.exited) || b.ratio - a.ratio);
    out.push({
      name,
      count: holdings.filter((h) => !h.exited).length,
      latestDate: holdings.reduce((m, h) => (h.date > m ? h.date : m), ''),
      holdings: holdings.slice(0, MAX_HOLDINGS),
    });
  }
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, maxHolders);
}

async function loadCorpToTicker(apiKey, headers) {
  const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`, { headers });
  if (!res.ok) throw new Error(`DART corpCode.xml request failed: ${res.status}`);
  const workDir = mkdtempSync(join(tmpdir(), 'dart-corpcode-'));
  try {
    const zipPath = join(workDir, 'corpCode.zip');
    writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
    execFileSync('unzip', ['-o', zipPath, '-d', workDir]);
    const xml = readFileSync(join(workDir, 'CORPCODE.xml'), 'utf-8');
    const map = new Map();
    for (const block of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
      const corp = /<corp_code>(.*?)<\/corp_code>/.exec(block[1])?.[1];
      const stock = /<stock_code>(.*?)<\/stock_code>/.exec(block[1])?.[1]?.trim();
      if (corp && stock) map.set(corp, stock);
    }
    return map;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    console.error('DART_API_KEY env var is required.');
    process.exit(1);
  }
  // DART의 WAF는 브라우저 UA가 아니면 연결을 끊는다 (generate-sector-map.mjs와 동일).
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  const corpToTicker = await loadCorpToTicker(apiKey, headers);
  console.log(`${corpToTicker.size} listed companies, scanning major-stock reports...`);

  const rows = [];
  let ok = 0;
  let failed = 0;
  const statusCount = {}; // 진단용: DART status 코드별 건수
  const httpCount = {}; // 진단용: HTTP 실패 코드별 건수
  for (const corp of corpToTicker.keys()) {
    try {
      const res = await fetch(`https://opendart.fss.or.kr/api/majorstock.json?crtfc_key=${apiKey}&corp_code=${corp}`, { headers });
      if (res.ok) {
        const body = await res.json();
        statusCount[body.status] = (statusCount[body.status] ?? 0) + 1;
        if (body.status === '000' && Array.isArray(body.list)) {
          rows.push(...body.list);
          ok++;
        } else if (body.status === '020') {
          // 일일 호출 한도 초과 - 일부만 읽은 결과로 파일을 덮어쓰면 보유 현황이 왜곡된다.
          throw new Error('DART daily request limit reached (status 020); aborting without writing.');
        }
        // 013 = 조회된 데이터 없음 (대량보유 보고가 한 번도 없는 회사). 정상이다.
      } else {
        httpCount[res.status] = (httpCount[res.status] ?? 0) + 1;
        failed++;
      }
    } catch (e) {
      if (String(e.message).includes('status 020')) throw e;
      failed++;
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(`DART status counts: ${JSON.stringify(statusCount)}; HTTP failures: ${JSON.stringify(httpCount)}; report rows: ${rows.length}`);
  const reporters = new Map();
  for (const r of rows) reporters.set(r.repror, (reporters.get(r.repror) ?? 0) + 1);
  console.log('Top reporters:', JSON.stringify([...reporters].sort((a, b) => b[1] - a[1]).slice(0, 15)));

  // 요청 대부분이 실패한 실행(차단·장애)은 결과를 신뢰할 수 없으니 기존 파일을 지키고 끝낸다.
  if (failed > corpToTicker.size * 0.2) {
    console.error(`Too many failed requests (${failed}/${corpToTicker.size}); keeping the previous file.`);
    process.exit(1);
  }

  const holders = buildHolders(collectByHolder(rows, corpToTicker));
  if (holders.length === 0) {
    console.error('No institutional holders found; keeping the previous file.');
    process.exit(1);
  }
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  writeFileSync(new URL('../public/data/big-holders-kr.json', import.meta.url), JSON.stringify({ updated: kst, holders }) + '\n');
  console.log(`Wrote ${holders.length} holders (${ok} companies with reports, ${failed} failed requests).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
