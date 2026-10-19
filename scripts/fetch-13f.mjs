// 큰손 따라보기(해외): SEC EDGAR 13F-HR(분기 보유 현황)을 읽어 투자자별 보유 종목과
// 직전 분기 대비 증감을 public/data/big-holders-us.json 으로 만든다. 서버(GitHub Actions)에서만 돈다.
//
// 13F로 알 수 있는 것: 분기 말 기준 미국 상장 주식 롱 포지션(보유 수량·평가액). 최대 45일 지연 공개.
// 알 수 없는 것: 정확한 매매일·체결가, 옵션/공매도/비미국 자산. 화면에도 그대로 밝힌다.
//
// 평가액 단위는 2023년 초를 기준으로 천 달러 → 달러로 바뀌었다. 같은 제출분 안에서의 "비중"만
// 쓰기 때문에 단위가 어느 쪽이어도 결과가 같다 (제출분끼리 평가액을 섞어 쓰지 않는다).
//
// Usage: node scripts/fetch-13f.mjs   (SEC_USER_AGENT env로 연락처를 바꿀 수 있다)

import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const USER_AGENT = process.env.SEC_USER_AGENT || 'k-stockreplay (https://k-stockreplay.pe.kr)';
const REQUEST_INTERVAL_MS = 250; // SEC 제한은 초당 10회 - 여유를 둔다.
const TOP_HOLDINGS = 30;
const TOP_SOLD = 10;

// match는 EDGAR가 돌려주는 등록명 검증용이다. CIK를 잘못 알고 있어도 엉뚱한 투자자의 데이터가
// 다른 이름표를 달고 올라가지 않게, 이름이 안 맞으면 그 투자자는 건너뛴다.
export const INVESTORS = [
  { id: 'berkshire', name: '버크셔 해서웨이', cik: '1067983', match: /BERKSHIRE HATHAWAY/i },
  { id: 'daily-journal', name: '데일리 저널', note: '찰리 멍거가 2023년까지 의장을 맡은 회사', cik: '783412', match: /DAILY JOURNAL/i },
  { id: 'pershing', name: '퍼싱 스퀘어', cik: '1336528', match: /PERSHING SQUARE/i },
  { id: 'scion', name: '사이언 애셋 매니지먼트', cik: '1649339', match: /SCION/i },
  { id: 'bridgewater', name: '브리지워터 어소시에이츠', cik: '1350694', match: /BRIDGEWATER/i },
  { id: 'soros', name: '소로스 펀드 매니지먼트', cik: '1029160', match: /SOROS/i },
  { id: 'third-point', name: '서드 포인트', cik: '1040273', match: /THIRD POINT/i },
  { id: 'greenlight', name: '그린라이트 캐피털', cik: '1079114', match: /GREENLIGHT/i },
];

const tag = (block, name) => new RegExp(`<(?:\\w+:)?${name}>\\s*([^<]*?)\\s*<`, 'i').exec(block)?.[1];

// 정보표 XML -> 롱 주식 포지션 행. 옵션(putCall)과 채권(PRN)은 제외한다.
export function parseInfoTable(xml) {
  const rows = [];
  for (const m of xml.matchAll(/<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/gi)) {
    const block = m[1];
    if (tag(block, 'putCall')) continue;
    if ((tag(block, 'sshPrnamtType') ?? 'SH').toUpperCase() !== 'SH') continue;
    const cusip = tag(block, 'cusip');
    const value = Number(tag(block, 'value'));
    const shares = Number(tag(block, 'sshPrnamt'));
    if (!cusip || !Number.isFinite(value) || !Number.isFinite(shares)) continue;
    rows.push({ name: tag(block, 'nameOfIssuer') ?? cusip, cusip, value, shares });
  }
  return rows;
}

// 같은 CUSIP이 여러 줄(운용 주체별)로 올라오므로 합친다. weight = 제출분 전체 평가액 대비 %.
export function aggregate(rows) {
  const byCusip = new Map();
  let total = 0;
  for (const r of rows) {
    const cur = byCusip.get(r.cusip) ?? { name: r.name, cusip: r.cusip, shares: 0, value: 0 };
    cur.shares += r.shares;
    cur.value += r.value;
    byCusip.set(r.cusip, cur);
    total += r.value;
  }
  const list = [...byCusip.values()].sort((a, b) => b.value - a.value);
  return { total, positions: list.map((p) => ({ ...p, weight: total > 0 ? (p.value / total) * 100 : 0 })) };
}

// 직전 분기와 비교: 신규 / 증가 / 감소 / 변동 없음, 그리고 전량 매도(sold).
export function diffPositions(current, previous) {
  const prev = new Map(previous.map((p) => [p.cusip, p]));
  const seen = new Set();
  const holdings = current.map((p) => {
    seen.add(p.cusip);
    const before = prev.get(p.cusip);
    let status = 'new';
    let changePct = null;
    if (before) {
      if (p.shares > before.shares) status = 'inc';
      else if (p.shares < before.shares) status = 'dec';
      else status = 'same';
      changePct = before.shares > 0 ? ((p.shares - before.shares) / before.shares) * 100 : null;
    }
    return { name: p.name, cusip: p.cusip, shares: p.shares, weight: p.weight, status, changePct };
  });
  const sold = previous
    .filter((p) => !seen.has(p.cusip))
    .map((p) => ({ name: p.name, cusip: p.cusip, shares: 0, weight: 0, status: 'sold', changePct: -100, prevWeight: p.weight }));
  return { holdings, sold };
}

const round = (n, d = 1) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// 제출 목록에서 13F-HR(정정 제외)을 보고 기간 최신순으로 뽑는다.
export function pick13F(submissions) {
  const r = submissions?.filings?.recent;
  if (!r?.form) return [];
  const out = [];
  r.form.forEach((form, i) => {
    if (form === '13F-HR') {
      out.push({ accession: r.accessionNumber[i], filed: r.filingDate[i], period: r.reportDate[i] });
    }
  });
  return out.sort((a, b) => b.period.localeCompare(a.period));
}

async function loadFiling(cik, accession) {
  const dir = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replace(/-/g, '')}`;
  await sleep(REQUEST_INTERVAL_MS);
  const index = await getJson(`${dir}/index.json`);
  const files = (index.directory?.item ?? []).filter((f) => /\.xml$/i.test(f.name) && !/primary_doc/i.test(f.name));
  const table = files.find((f) => /info|table|13f/i.test(f.name)) ?? files.sort((a, b) => Number(b.size) - Number(a.size))[0];
  if (!table) throw new Error(`no information table in ${accession}`);
  await sleep(REQUEST_INTERVAL_MS);
  return aggregate(parseInfoTable(await getText(`${dir}/${table.name}`)));
}

async function buildInvestor(inv) {
  const subs = await getJson(`https://data.sec.gov/submissions/CIK${inv.cik.padStart(10, '0')}.json`);
  if (!inv.match.test(subs.name ?? '')) {
    throw new Error(`name mismatch for CIK ${inv.cik}: "${subs.name}"`);
  }
  const filings = pick13F(subs);
  if (filings.length === 0) throw new Error('no 13F-HR filings');
  const latest = filings[0];
  const prevFiling = filings[1];
  const cur = await loadFiling(inv.cik, latest.accession);
  const prev = prevFiling ? await loadFiling(inv.cik, prevFiling.accession) : { positions: [] };
  const { holdings, sold } = diffPositions(cur.positions, prev.positions);
  const fmt = (h) => ({
    ...h,
    weight: round(h.weight),
    changePct: round(h.changePct, 0),
    ...(h.prevWeight !== undefined ? { prevWeight: round(h.prevWeight) } : {}),
  });
  return {
    id: inv.id,
    name: inv.name,
    ...(inv.note ? { note: inv.note } : {}),
    edgarName: subs.name,
    period: latest.period,
    filed: latest.filed,
    prevPeriod: prevFiling?.period ?? null,
    positions: cur.positions.length,
    holdings: holdings.slice(0, TOP_HOLDINGS).map(fmt),
    sold: sold.sort((a, b) => b.prevWeight - a.prevWeight).slice(0, TOP_SOLD).map(fmt),
  };
}

async function main() {
  const investors = [];
  for (const inv of INVESTORS) {
    try {
      investors.push(await buildInvestor(inv));
      console.log(`ok   ${inv.id}`);
    } catch (e) {
      // 한 투자자의 실패(이름 불일치, 정보표 형식 차이 등)가 나머지를 막지 않게 한다.
      console.warn(`skip ${inv.id}: ${e.message}`);
    }
    await sleep(REQUEST_INTERVAL_MS);
  }
  if (investors.length === 0) {
    console.error('No investors fetched; keeping the previous file.');
    process.exit(1);
  }
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  writeFileSync(new URL('../public/data/big-holders-us.json', import.meta.url), JSON.stringify({ updated: kst, investors }) + '\n');
  console.log(`Wrote ${investors.length}/${INVESTORS.length} investors.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
