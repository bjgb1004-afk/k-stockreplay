# 주요 일정(경제지표/실적/기관보유) + 관심종목 뉴스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EVENTS 화면에 "주요 일정"(미국 경제지표 발표 + KR 정기공시 법정마감 + US 기관 13F 보유변동)을 통합 표시하고, 종목 상세 화면에 관심종목 관련 뉴스 헤드라인을 보여준다.

**Architecture:** 경제지표/13F는 서버 배치(정적 JSON), KR 정기공시 마감은 순수 계산(외부 API 불필요), 셋 다 `src/lib/upcomingEvents.ts`의 한 병합 함수로 합쳐 "다음 7일" 기준 하나의 리스트로 렌더링 — 아무 것도 없으면 "주요 일정 없음" 하나로 처리한다(요청 원문 그대로). 뉴스는 Google News RSS를 쓰는데 브라우저에서 CORS로 직접 호출이 막히는 게 확인돼(스펙 §7 스파이크 결론) Vercel 서버리스 함수 하나를 얇은 프록시로 둔다(저장/로깅 없음).

**Tech Stack:** TypeScript, React 19, Vite, Vercel Functions, Node.js(스크립트), GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-31-market-context-digest-design.md`

**선행 조건:** `docs/superpowers/plans/2026-08-31-watchlist-market-and-kr-prices.md`의 Task 1(WatchlistItem.market)이 먼저 구현돼 있어야 한다 — 이 플랜의 병합 함수가 `market` 필드로 KR/US를 가른다.

## Global Constraints

- 로컬퍼스트 유지 — 서버는 개인별 워치리스트를 모른다.
- AI 추측을 사실처럼 제시하지 않는다 — KR "실적 발표 예정일"은 회사 재량이라 예측 불가능하므로, 대신 법으로 정해진 정기공시 제출기한(사실)만 계산해서 보여준다.
- 13F는 기관별 개별 사유 추정 없이 "사실 나열"만 한다 — 매수/매도 권유로 읽히는 문구 금지.
- 뉴스는 헤드라인+링크만, 본문 텍스트 저장/표시 없음.

---

## Task 1: 경제지표 캘린더 + KR 정기공시 법정마감 + 통합 병합 함수

**Files:**
- Create: `public/data/econ-calendar.json`
- Create: `src/lib/upcomingEvents.ts`
- Test: `src/lib/upcomingEvents.selfcheck.ts`

**Interfaces:**
- Produces: `UpcomingEvent { date: string; title: string; source: 'ECON' | 'EARNINGS_KR' | 'INSTITUTIONAL_US' }`, `computeUpcomingEvents(watchlist, econCalendar, institutional, today, daysAhead?): UpcomingEvent[]` (Task 2가 이 함수를 소비, Task 4가 `institutional` 인자를 실제로 채움)

- [ ] **Step 1: econ-calendar.json 작성 (2026년 확정 일정, 공식 발표 기준)**

```json
[
  { "date": "2026-09-04", "title": "미국 고용상황보고서(8월, 비농업고용)" },
  { "date": "2026-09-09", "title": "미국 CPI(8월, 소비자물가지수)" },
  { "date": "2026-09-15", "title": "FOMC 회의 첫째날" },
  { "date": "2026-09-16", "title": "FOMC 기준금리 결정" },
  { "date": "2026-09-16", "title": "미국 소매판매(8월)" },
  { "date": "2026-10-02", "title": "미국 고용상황보고서(9월, 비농업고용)" },
  { "date": "2026-10-14", "title": "미국 CPI(9월, 소비자물가지수)" },
  { "date": "2026-10-15", "title": "미국 소매판매(9월)" },
  { "date": "2026-10-22", "title": "한국은행 금융통화위원회 통화정책방향 결정회의" },
  { "date": "2026-10-27", "title": "FOMC 회의 첫째날" },
  { "date": "2026-10-28", "title": "FOMC 기준금리 결정" },
  { "date": "2026-11-06", "title": "미국 고용상황보고서(10월, 비농업고용)" },
  { "date": "2026-11-12", "title": "미국 CPI(10월, 소비자물가지수)" },
  { "date": "2026-11-17", "title": "미국 소매판매(10월)" },
  { "date": "2026-11-26", "title": "한국은행 금융통화위원회 통화정책방향 결정회의" },
  { "date": "2026-12-04", "title": "미국 고용상황보고서(11월, 비농업고용)" },
  { "date": "2026-12-08", "title": "FOMC 회의 첫째날" },
  { "date": "2026-12-09", "title": "FOMC 기준금리 결정" },
  { "date": "2026-12-10", "title": "미국 CPI(11월, 소비자물가지수)" },
  { "date": "2026-12-16", "title": "미국 소매판매(11월)" }
]
```

(출처: FOMC — federalreserve.gov/monetarypolicy/fomccalendars.htm, CPI/고용/소매판매 — bls.gov·census.gov 공식 발표 일정, 한국은행 금통위 — bok.or.kr. **연 1회 수동 갱신 항목**이라 매년 초 다음 해 일정으로 교체해야 한다 — 스펙 §4(a)에서 이미 "연 1회는 매일이 아니라 원칙에 안 걸림"으로 결정됨.)

- [ ] **Step 2: 실패하는 테스트 작성**

`src/lib/upcomingEvents.selfcheck.ts`:

```typescript
import assert from 'node:assert/strict';
import { computeUpcomingEvents, upcomingStatutoryDeadlines } from './upcomingEvents';

// 1) econ 일정만 있고 워치리스트가 비어있으면 econ만 나온다
const econ = [
  { date: '2026-09-04', title: '미국 고용상황보고서' },
  { date: '2026-09-20', title: '범위 밖 일정' }, // 7일 밖 - 제외돼야 함
];
const eventsEmpty = computeUpcomingEvents([], econ, [], '2026-09-01', 7);
assert.deepEqual(eventsEmpty, [{ date: '2026-09-04', title: '미국 고용상황보고서', source: 'ECON' }]);

// 2) KR 종목이 워치리스트에 있으면 법정마감이 섞여 나온다 (2026-05-15 = 1분기보고서 마감)
const eventsKr = computeUpcomingEvents(
  [{ ticker: '005930', market: 'KR' }],
  [],
  [],
  '2026-05-10',
  7,
);
assert.equal(eventsKr.some((e) => e.source === 'EARNINGS_KR' && e.date === '2026-05-15'), true);

// 3) KR 종목이 전혀 없으면 법정마감이 안 나온다
const eventsUsOnly = computeUpcomingEvents([{ ticker: 'AAPL', market: 'US' }], [], [], '2026-05-10', 7);
assert.equal(eventsUsOnly.some((e) => e.source === 'EARNINGS_KR'), false);

// 4) 날짜순 정렬
const eventsSorted = computeUpcomingEvents(
  [],
  [
    { date: '2026-09-04', title: 'B' },
    { date: '2026-09-01', title: 'A' },
  ],
  [],
  '2026-09-01',
  7,
);
assert.deepEqual(eventsSorted.map((e) => e.title), ['A', 'B']);

// 5) 법정마감 계산 자체 (1분기 3/31 + 45일 = 5/15)
const deadlines2026 = upcomingStatutoryDeadlines(2026);
assert.equal(deadlines2026.some((d) => d.date === '2026-05-15'), true);

console.log('OK: upcomingEvents selfcheck passed');
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npx tsx src/lib/upcomingEvents.selfcheck.ts`
Expected: FAIL — 모듈 자체가 없음

- [ ] **Step 4: upcomingEvents.ts 구현**

```typescript
// "주요 일정" = 경제지표(공통) + KR 정기공시 법정마감(계산) + US 기관 13F 보유변동(워치리스트
// 필터). AI가 추측한 "실적 발표 예정일"은 안 보여준다(설계문서 §9 "AI 추측을 사실처럼 제시
// 금지") - KR은 회사 재량 발표일 대신 법으로 정해진 제출기한만 계산한다.

export interface UpcomingEvent {
  date: string; // YYYY-MM-DD
  title: string;
  source: 'ECON' | 'EARNINGS_KR' | 'INSTITUTIONAL_US';
}

export interface EconCalendarEntry {
  date: string;
  title: string;
}

export interface InstitutionalEvent {
  date: string;
  ticker: string;
  title: string;
}

export interface WatchlistLike {
  ticker: string;
  market: 'KR' | 'US';
}

export interface StatutoryDeadline {
  date: string;
  label: string;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 자본시장법상 정기공시 법정 제출기한 - 12월 결산법인(KOSPI/KOSDAQ 대다수) 기준.
// 분기/반기보고서: 분기 종료일로부터 45일 이내. 사업보고서(연간): 사업연도 종료일로부터 90일 이내.
function fiscalDeadlines(year: number): StatutoryDeadline[] {
  return [
    { date: addDays(`${year}-03-31`, 45), label: '1분기보고서 법정 제출기한' },
    { date: addDays(`${year}-06-30`, 45), label: '반기보고서 법정 제출기한' },
    { date: addDays(`${year}-09-30`, 45), label: '3분기보고서 법정 제출기한' },
    { date: addDays(`${year}-12-31`, 90), label: '사업보고서(연간) 법정 제출기한' },
  ];
}

// 연초엔 작년 12월 결산분 사업보고서 마감(3월)이 아직 안 지났을 수 있어 작년치도 포함.
export function upcomingStatutoryDeadlines(year: number): StatutoryDeadline[] {
  return [...fiscalDeadlines(year - 1), ...fiscalDeadlines(year)];
}

export function computeUpcomingEvents(
  watchlist: WatchlistLike[],
  econCalendar: EconCalendarEntry[],
  institutional: InstitutionalEvent[],
  today: string,
  daysAhead = 7,
): UpcomingEvent[] {
  const end = addDays(today, daysAhead);
  const inRange = (date: string) => date >= today && date <= end;

  const events: UpcomingEvent[] = econCalendar
    .filter((e) => inRange(e.date))
    .map((e) => ({ date: e.date, title: e.title, source: 'ECON' as const }));

  if (watchlist.some((w) => w.market === 'KR')) {
    const year = Number(today.slice(0, 4));
    for (const d of upcomingStatutoryDeadlines(year)) {
      if (inRange(d.date)) events.push({ date: d.date, title: d.label, source: 'EARNINGS_KR' });
    }
  }

  const watchedUsTickers = new Set(watchlist.filter((w) => w.market === 'US').map((w) => w.ticker));
  for (const i of institutional) {
    if (watchedUsTickers.has(i.ticker) && inRange(i.date)) {
      events.push({ date: i.date, title: i.title, source: 'INSTITUTIONAL_US' });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npx tsx src/lib/upcomingEvents.selfcheck.ts`
Expected: `OK: upcomingEvents selfcheck passed`

- [ ] **Step 6: 커밋**

```bash
git add public/data/econ-calendar.json src/lib/upcomingEvents.ts src/lib/upcomingEvents.selfcheck.ts
git commit -m "feat: add econ calendar data + KR statutory deadline calc + event merge fn"
```

---

## Task 2: EventCalendarScreen에 "주요 일정" 섹션 추가

**Files:**
- Modify: `src/components/EventCalendarScreen.tsx`

**Interfaces:**
- Consumes: `computeUpcomingEvents`, `UpcomingEvent` (Task 1), `public/data/econ-calendar.json`, `getWatchlist` (기존)

- [ ] **Step 1: 화면에 섹션 추가**

`src/components/EventCalendarScreen.tsx` 상단 import에 추가:

```typescript
import { computeUpcomingEvents, type UpcomingEvent } from '../lib/upcomingEvents';
```

컴포넌트 안에 상태/effect 추가 (기존 `history`/`watchlist` 로딩 옆에):

```typescript
const [econCalendar, setEconCalendar] = useState<{ date: string; title: string }[]>([]);

useEffect(() => {
  fetch('/data/econ-calendar.json').then((r) => r.json()).then(setEconCalendar).catch(() => {});
}, []);

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const upcomingEvents = useMemo(
  () => computeUpcomingEvents(watchlist, econCalendar, [], today, 7),
  [watchlist, econCalendar, today],
);
```

(`useMemo`가 아직 import 안 됐으면 `import { useEffect, useMemo, useState } from 'react';`로 수정)

라벨 매핑과 섹션 JSX 추가 (기존 "🏛️ 주주총회 관련 공시" `<Section>` 바로 위에 삽입):

```typescript
const sourceLabel: Record<UpcomingEvent['source'], string> = {
  ECON: '🌐',
  EARNINGS_KR: '📋',
  INSTITUTIONAL_US: '🏦',
};
```

```tsx
<Section title="🗓️ 주요 일정 (7일 이내)">
  {upcomingEvents.length === 0 ? (
    <p className="text-sm text-slate-500">주요 일정 없음</p>
  ) : (
    <ul className="space-y-2">
      {upcomingEvents.map((e, i) => (
        <li key={`${e.date}_${e.title}_${i}`} className="flex items-center justify-between text-sm bg-slate-900 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">{sourceLabel[e.source]}</span>
            <span className="truncate">{e.title}</span>
          </span>
          <span className="text-xs text-slate-500 shrink-0 ml-2">{e.date}</span>
        </li>
      ))}
    </ul>
  )}
</Section>
```

- [ ] **Step 2: 타입체크**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 로컬 수동 확인**

`npm run dev`, EVENTS 탭 열어서 "주요 일정" 섹션이 econ-calendar.json 내용을 보여주는지 확인. KR 종목을 워치리스트에 추가한 상태로 오늘 날짜를 임시로 법정마감 근처로 바꿔가며(또는 `computeUpcomingEvents` 호출부 `today` 인자를 잠깐 하드코딩해서) EARNINGS_KR 항목이 뜨는지 확인 후 원복.

- [ ] **Step 4: 커밋**

```bash
git add src/components/EventCalendarScreen.tsx
git commit -m "feat: show upcoming econ/earnings events in EVENTS screen"
```

---

## Task 3: 13F 배치 스크립트 (SEC 다운로드 + 파싱 + OpenFIGI 매핑)

**Files:**
- Create: `scripts/fetch-13f.mjs`
- Create: `.github/workflows/fetch-13f.yml`

**Interfaces:**
- Produces: `public/data/13f-changes.json` — `{ date: string; ticker: string; title: string }[]` (Task 4가 소비 — `InstitutionalEvent` 형태와 맞춤)
- 부산물: `public/data/13f-holdings-raw.json` (다음 분기 diff용 원시 집계, 커밋해서 다음 실행 때 읽음)

**소스**: SEC 공식 분기별 벌크 데이터셋 — `https://www.sec.gov/files/structureddata/data/form-13f-data-sets/{start}-{end}_form13f.zip` (예: `01jun2026-31aug2026_form13f.zip`). ZIP 안 `SUBMISSION.tsv`(ACCESSION_NUMBER, FILING_DATE, SUBMISSIONTYPE, CIK, PERIODOFREPORT), `INFOTABLE.tsv`(ACCESSION_NUMBER, NAMEOFISSUER, CUSIP, VALUE, SSHPRNAMT). CUSIP→티커 매핑은 OpenFIGI 공개 API(`POST https://api.openfigi.com/v3/mapping`, 키 없이 하루 5,000요청, 요청당 최대 100개 CUSIP).

- [ ] **Step 1: 스크립트 작성**

```javascript
// Quarterly batch (runs 4x/year via .github/workflows/fetch-13f.yml): downloads
// SEC's official Form 13F bulk dataset, aggregates institutional holdings by
// CUSIP, maps CUSIP->ticker via OpenFIGI, diffs against last quarter's totals
// (public/data/13f-holdings-raw.json), and publishes the aggregate change per
// ticker. Aggregate-across-all-filers only (not per-institution) - see plan
// Task 3 note for why: per-institution tracking needs filer-name matching
// across CIKs, out of scope for the first pass.
//
// Usage: node scripts/fetch-13f.mjs
// Requires the `unzip` CLI (present on GitHub Actions ubuntu-latest runners).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// SEC bulk datasets cover 3-month windows ending Feb/May/Aug/Nov (see
// sec.gov/data-research/sec-markets-data/form-13f-data-sets). Given today's
// date, find the most recently completed window.
function currentWindow(now = new Date()) {
  const y = now.getUTCFullYear();
  const windows = [
    { start: `01dec${y - 1}`, end: `28feb${y}`, endDate: new Date(Date.UTC(y, 1, isLeap(y) ? 29 : 28)) },
    { start: `01mar${y}`, end: `31may${y}`, endDate: new Date(Date.UTC(y, 4, 31)) },
    { start: `01jun${y}`, end: `31aug${y}`, endDate: new Date(Date.UTC(y, 7, 31)) },
    { start: `01sep${y}`, end: `30nov${y}`, endDate: new Date(Date.UTC(y, 10, 30)) },
  ];
  const completed = windows.filter((w) => w.endDate < now);
  return completed[completed.length - 1] ?? windows[0];
}
function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const win = currentWindow();
const zipUrl = `https://www.sec.gov/files/structureddata/data/form-13f-data-sets/${win.start}-${win.end}_form13f.zip`;
console.log(`Fetching ${zipUrl}`);

const res = await fetch(zipUrl, { headers: { 'User-Agent': 'k-stockreplay contact:bjgb1004@gmail.com' } });
if (!res.ok) throw new Error(`SEC 13F dataset request failed: ${res.status} ${res.statusText}`);
const zipBuffer = Buffer.from(await res.arrayBuffer());

const workDir = mkdtempSync(join(tmpdir(), 'sec-13f-'));
const zipPath = join(workDir, '13f.zip');
writeFileSync(zipPath, zipBuffer);
execFileSync('unzip', ['-o', zipPath, '-d', workDir]);

function parseTsv(path) {
  const lines = readFileSync(path, 'utf-8').split('\n').filter(Boolean);
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h, cols[i]]));
  });
}

const submissions = parseTsv(join(workDir, 'SUBMISSION.tsv'));
const validAccessions = new Set(
  submissions.filter((s) => s.SUBMISSIONTYPE === '13F-HR' || s.SUBMISSIONTYPE === '13F-HR/A').map((s) => s.ACCESSION_NUMBER),
);
const periodOfReport = submissions[0]?.PERIODOFREPORT ?? '';

const infotable = parseTsv(join(workDir, 'INFOTABLE.tsv'));
rmSync(workDir, { recursive: true, force: true });

const byCusip = new Map();
for (const row of infotable) {
  if (!validAccessions.has(row.ACCESSION_NUMBER)) continue;
  const cusip = row.CUSIP;
  const value = Number(row.VALUE) || 0;
  const shares = Number(row.SSHPRNAMT) || 0;
  const existing = byCusip.get(cusip) ?? { issuer: row.NAMEOFISSUER, value: 0, shares: 0 };
  existing.value += value;
  existing.shares += shares;
  byCusip.set(cusip, existing);
}
console.log(`Aggregated ${byCusip.size} unique CUSIPs from ${infotable.length} info table rows.`);

// CUSIP -> ticker via OpenFIGI, batched 100 per request (public rate limit: 25 req / 6s unauthenticated).
async function mapCusipsToTickers(cusips) {
  const result = new Map();
  const batches = [];
  for (let i = 0; i < cusips.length; i += 100) batches.push(cusips.slice(i, i + 100));

  for (const batch of batches) {
    const res = await fetch('https://api.openfigi.com/v3/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch.map((cusip) => ({ idType: 'ID_CUSIP', idValue: cusip }))),
    });
    if (!res.ok) {
      console.error(`OpenFIGI batch failed: ${res.status}, skipping ${batch.length} CUSIPs`);
      continue;
    }
    const body = await res.json();
    body.forEach((entry, i) => {
      const ticker = entry.data?.[0]?.ticker;
      if (ticker) result.set(batch[i], ticker);
    });
    await new Promise((r) => setTimeout(r, 300)); // stay under the unauthenticated rate limit
  }
  return result;
}

const cusipToTicker = await mapCusipsToTickers([...byCusip.keys()]);
console.log(`Resolved ${cusipToTicker.size}/${byCusip.size} CUSIPs to tickers.`);

const rawPath = new URL('../public/data/13f-holdings-raw.json', import.meta.url);
const previous = existsSync(rawPath) ? JSON.parse(readFileSync(rawPath, 'utf-8')) : [];
const previousByTicker = new Map(previous.map((p) => [p.ticker, p]));

const changes = [];
const newRaw = [];
for (const [cusip, { issuer, value, shares }] of byCusip) {
  const ticker = cusipToTicker.get(cusip);
  if (!ticker) continue; // bond/private placement/unresolved - not a tracked equity ticker.
  newRaw.push({ ticker, cusip, issuer, value, shares, periodOfReport });

  const prev = previousByTicker.get(ticker);
  if (!prev || prev.value === 0) continue; // no prior quarter to diff against yet.
  const changePct = ((value - prev.value) / prev.value) * 100;
  if (Math.abs(changePct) < 1) continue; // noise threshold - only report moves worth mentioning.
  changes.push({
    date: periodOfReport.split('-').reverse().join('-'), // "30-JUN-2026" style not expected here - PERIODOFREPORT is ISO-ish; adjust if format differs.
    ticker,
    title: `${issuer}: 기관 합산 보유가치 전분기 대비 ${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`,
  });
}

writeFileSync(rawPath, JSON.stringify(newRaw, null, 2) + '\n');
writeFileSync(new URL('../public/data/13f-changes.json', import.meta.url), JSON.stringify(changes, null, 2) + '\n');
console.log(`Wrote ${changes.length} 13F changes (period ${periodOfReport}) to public/data/13f-changes.json`);
```

**주의(구현 중 확인 필요)**: `PERIODOFREPORT`의 실제 날짜 포맷(`30-JUN-2026`인지 `2026-06-30`인지)은 Step 2에서 실제로 다운로드해봐야 확정된다 — 위 스크립트의 날짜 변환 줄에 주석으로 표시해뒀다. Step 2 실행 후 실제 값을 보고 `date:` 라인을 맞는 파싱으로 고친다(예: `2026-Q2 마감` 같은 표시로 단순화해도 됨 — 정확한 일자보다 "어느 분기"가 중요하므로).

- [ ] **Step 2: 로컬에서 실행해 실제 포맷 확인**

Run: `node scripts/fetch-13f.mjs`
Expected: 수백MB 다운로드라 몇 분 걸릴 수 있음. 완료 후 `Wrote N 13F changes...` 출력. 첫 실행은 비교할 이전 분기 데이터가 없어 `changes`가 빈 배열이어도 정상 — `public/data/13f-holdings-raw.json`만 생기면 성공. 이 raw 파일의 `periodOfReport` 실제 값을 보고 위 "주의" 항목의 날짜 파싱을 확정/수정한다.

- [ ] **Step 3: GitHub Actions 워크플로 작성 (분기 1회)**

`.github/workflows/fetch-13f.yml`:

```yaml
name: Fetch 13F institutional holdings

on:
  schedule:
    # SEC publishes the quarterly dataset shortly after each window closes
    # (windows end Feb/May/Aug/Nov) - run on the 20th to give it a buffer.
    - cron: '0 22 20 2,5,8,11 *'
  workflow_dispatch: {}

jobs:
  fetch:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Fetch 13F data
        run: node scripts/fetch-13f.mjs
      - name: Check for changes
        id: diff
        run: |
          git add public/data/13f-changes.json public/data/13f-holdings-raw.json
          git diff --staged --quiet && echo "changed=false" >> "$GITHUB_OUTPUT" || echo "changed=true" >> "$GITHUB_OUTPUT"
      - name: Commit and push
        if: steps.diff.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git commit -m "chore: update 13f-changes.json ($(date -u +%Y-%m-%d))"
          git push
```

- [ ] **Step 4: 커밋**

```bash
git add scripts/fetch-13f.mjs .github/workflows/fetch-13f.yml public/data/13f-holdings-raw.json public/data/13f-changes.json
git commit -m "feat: add quarterly SEC 13F institutional holdings batch"
```

---

## Task 4: 13F를 "주요 일정"에 배선

**Files:**
- Modify: `src/components/EventCalendarScreen.tsx`

**Interfaces:**
- Consumes: `public/data/13f-changes.json` (Task 3), `computeUpcomingEvents`의 `institutional` 인자 (Task 1)

- [ ] **Step 1: 13f-changes.json 로딩 추가**

Task 2에서 추가한 `econCalendar` state 옆에:

```typescript
const [institutional, setInstitutional] = useState<{ date: string; ticker: string; title: string }[]>([]);

useEffect(() => {
  fetch('/data/13f-changes.json').then((r) => r.json()).then(setInstitutional).catch(() => {});
}, []);
```

`computeUpcomingEvents` 호출을 수정:

```typescript
const upcomingEvents = useMemo(
  () => computeUpcomingEvents(watchlist, econCalendar, institutional, today, 7),
  [watchlist, econCalendar, institutional, today],
);
```

- [ ] **Step 2: 타입체크**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 로컬 수동 확인**

`public/data/13f-changes.json`에 오늘 기준 7일 이내 날짜를 가진 더미 항목 하나를 임시로 넣고, 그 티커를 US 워치리스트에 추가한 뒤 "주요 일정"에 🏦 항목으로 뜨는지 확인 → 확인 후 더미 항목 원복.

- [ ] **Step 4: 커밋**

```bash
git add src/components/EventCalendarScreen.tsx
git commit -m "feat: wire 13F institutional changes into upcoming events"
```

---

## Task 5: 뉴스 프록시 + CompanyDetailScreen 뉴스 섹션

**Files:**
- Create: `api/news.ts` (Vercel serverless function)
- Modify: `src/components/CompanyDetailScreen.tsx`

**Interfaces:**
- Produces: `GET /api/news?q=<종목명>&market=KR|US` → `{ title: string; link: string; pubDate: string }[]`

- [ ] **Step 1: vercel.json이 /api를 SPA 리라이트에서 제외하는지 확인**

`vercel.json`을 아래로 교체 (Vercel은 기본적으로 `/api/*.ts` 함수를 리라이트보다 먼저 매칭하지만, 명시적으로 제외해 안전하게 한다):

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: 서버리스 프록시 함수 작성**

`api/news.ts` (Vercel Node.js 함수 — 저장/로깅 없이 그대로 릴레이만 한다, Google News RSS가 CORS를 안 줘서 브라우저 직접 fetch가 막히는 걸 우회하는 용도):

```typescript
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const market = searchParams.get('market') === 'US' ? 'US' : 'KR';
  if (!q) return new Response('q is required', { status: 400 });

  const locale = market === 'US' ? { hl: 'en-US', gl: 'US', ceid: 'US:en' } : { hl: 'ko', gl: 'KR', ceid: 'KR:ko' };
  const rssUrl = new URL('https://news.google.com/rss/search');
  rssUrl.searchParams.set('q', q);
  rssUrl.searchParams.set('hl', locale.hl);
  rssUrl.searchParams.set('gl', locale.gl);
  rssUrl.searchParams.set('ceid', locale.ceid);

  const res = await fetch(rssUrl);
  if (!res.ok) return new Response('upstream fetch failed', { status: 502 });
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15).map((m) => {
    const block = m[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? '';
    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1] ?? '';
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1] ?? '';
    return { title: decodeXmlEntities(title), link, pubDate };
  });

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
  });
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
```

(RSS는 XML이라 `DOMParser`를 쓰는 게 정석이지만, Vercel Edge 런타임엔 `DOMParser`가 없어서 - 브라우저 전용 API - 정규식 파싱으로 대체. 응답 15건으로 제한, 30분 캐시로 같은 종목 반복 조회 시 프록시 부하를 줄인다.)

- [ ] **Step 3: CompanyDetailScreen에 뉴스 섹션 추가**

`src/components/CompanyDetailScreen.tsx` — `HISTORY` 섹션 위(또는 아래)에 새 섹션 추가. 컴포넌트 안에 상태/effect:

```typescript
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

const [news, setNews] = useState<NewsItem[]>([]);

useEffect(() => {
  const market = company.market ?? 'KR';
  fetch(`/api/news?q=${encodeURIComponent(company.companyName)}&market=${market}`)
    .then((r) => r.json())
    .then(setNews)
    .catch(() => setNews([]));
}, [company.ticker, company.companyName, company.market]);
```

JSX (VoteSection과 HISTORY Section 사이):

```tsx
<Section title="📰 관련 뉴스">
  {news.length === 0 ? (
    <p className="text-sm text-slate-500">뉴스를 찾을 수 없습니다.</p>
  ) : (
    <ul className="space-y-2">
      {news.map((n) => (
        <li key={n.link}>
          <a
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-200 hover:text-cyan-400 block truncate"
          >
            {n.title}
          </a>
        </li>
      ))}
    </ul>
  )}
</Section>
```

- [ ] **Step 4: 타입체크**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 5: 로컬 수동 확인**

`vercel dev`로 로컬에서 서버리스 함수를 포함해 띄운 뒤(순수 `npm run dev`/Vite만으론 `/api` 라우트가 안 뜬다 — Vercel CLI 필요, `npm i -g vercel` 후 `vercel dev`), 종목 상세 화면에서 뉴스가 뜨는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add api/news.ts vercel.json src/components/CompanyDetailScreen.tsx
git commit -m "feat: add watchlist company news via Google News RSS proxy"
```
