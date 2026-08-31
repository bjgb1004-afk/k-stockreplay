# 워치리스트 한/미 확장 + KR 종가표 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MY STOCK RADAR(워치리스트)가 한국·미국 종목을 함께 담을 수 있게 확장하고, KR 관심종목에 전일 종가/등락률을 표시한다.

**Architecture:** 기존 IndexedDB `watchlist_items` 스토어에 `market` 필드만 추가(스키마 버전업 불필요). US 종목 검색용 유니버스는 SEC 공식 데이터로 별도 스크립트가 생성. KR 종가는 기존 GitHub Actions cron 패턴(하루 1회 배치 → 정적 JSON → 클라이언트가 로컬 워치리스트로 필터링)을 그대로 재사용. US 종가는 상업적 재배포를 허용하는 무료 API가 없다는 게 확인돼 이번 스코프에서 제외 — US 워치리스트 항목은 가격 없이 표시된다.

**Tech Stack:** TypeScript, React 19, Vite, IndexedDB, Node.js(스크립트), GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-31-market-context-digest-design.md`

## Global Constraints

- 로컬퍼스트 유지 — 서버는 개인별 워치리스트를 모른다. 새 계정/서버 저장 없음.
- 실시간 시세 없음 — 전일 종가(T+1)만.
- US 종가/실적 API는 상업적 재배포 허용 무료 소스가 없어 이번 스코프에서 제외 (스펙 §7 스파이크 결론, 2026-08-31 대화에서 확정).
- 신규 3rd-party 키 필요 API는 서버 배치로만 호출 (쿼터 고정 원칙, 스펙 §1).

---

## Task 1: WatchlistItem에 market 필드 추가

**Files:**
- Modify: `src/lib/watchlistDb.ts`

**Interfaces:**
- Produces: `WatchlistItem.market: 'KR' | 'US'`, `addToWatchlist(ticker: string, companyName: string, market?: 'KR' | 'US'): Promise<IDBValidKey>` (market 생략 시 `'KR'`), `getWatchlist(): Promise<WatchlistItem[]>` (기존 레코드도 항상 `market` 필드가 채워진 상태로 반환)

- [ ] **Step 1: 기존 동작을 지키는 실패 테스트 작성**

`src/lib/watchlistDb.selfcheck.ts` 신규 생성. 이 프로젝트엔 IndexedDB 목(mock)이 없으므로, DB I/O가 없는 순수 부분(기본값 처리 로직)만 분리해서 검증한다. 그러려면 먼저 기본값 처리를 순수 함수로 뽑는다:

```typescript
// src/lib/watchlistDb.ts 안에 추가할 순수 함수 (아래 Step 3에서 실제로 추가)
export function withMarketDefault(item: Omit<WatchlistItem, 'market'> & { market?: 'KR' | 'US' }): WatchlistItem {
  return { ...item, market: item.market ?? 'KR' };
}
```

테스트 파일:

```typescript
import assert from 'node:assert/strict';
import { withMarketDefault } from './watchlistDb';

// market 필드가 아예 없는 옛날 레코드 -> KR로 기본값
const legacy = withMarketDefault({ local_id: 'a', ticker: '005930', companyName: '삼성전자', updated_at: '2026-01-01', thesis: '' });
assert.equal(legacy.market, 'KR');

// market이 이미 있으면 그대로
const us = withMarketDefault({ local_id: 'b', ticker: 'AAPL', companyName: 'Apple', updated_at: '2026-01-01', thesis: '', market: 'US' });
assert.equal(us.market, 'US');

console.log('OK: watchlistDb selfcheck passed');
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npx tsx src/lib/watchlistDb.selfcheck.ts`
Expected: FAIL — `withMarketDefault` is not exported (아직 없음)

- [ ] **Step 3: watchlistDb.ts 수정**

`src/lib/watchlistDb.ts` 전체를 아래 내용으로 교체:

```typescript
import { withStore } from './db';

export type Market = 'KR' | 'US';

export interface WatchlistItem {
  local_id: string;
  ticker: string;
  companyName: string;
  updated_at: string;
  market: Market;
  thesis: string; // "왜 이 종목을 보는가" - 매수/관심 논리. 나중에 새 공시가 뜨면
  // 이 이유를 다시 떠올리게 하는 게 목적이라, 서버로 안 보내고 로컬에만 둔다.
}

const STORE = 'watchlist_items';

// 옛날 레코드(market 필드 도입 전)를 읽을 때 기본값을 채워준다. DB 스키마
// 버전업 없이 필드만 추가했기 때문에, 저장은 안 건드리고 읽는 쪽에서만 보정한다.
export function withMarketDefault(item: Omit<WatchlistItem, 'market'> & { market?: Market }): WatchlistItem {
  return { ...item, market: item.market ?? 'KR' };
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const items = await withStore<WatchlistItem[]>(STORE, 'readonly', (store) => store.getAll());
  return items.map(withMarketDefault);
}

export function addToWatchlist(ticker: string, companyName: string, market: Market = 'KR'): Promise<IDBValidKey> {
  const item: WatchlistItem = {
    local_id: crypto.randomUUID(),
    ticker,
    companyName,
    updated_at: new Date().toISOString(),
    market,
    thesis: '',
  };
  return withStore(STORE, 'readwrite', (store) => store.put(item));
}

export async function updateThesis(ticker: string, thesis: string): Promise<void> {
  const item = await withStore<WatchlistItem | undefined>(STORE, 'readonly', (store) => store.get(ticker));
  if (!item) return;
  await withStore(STORE, 'readwrite', (store) => store.put({ ...item, thesis }));
}

export function removeFromWatchlist(ticker: string): Promise<undefined> {
  return withStore(STORE, 'readwrite', (store) => store.delete(ticker));
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npx tsx src/lib/watchlistDb.selfcheck.ts`
Expected: `OK: watchlistDb selfcheck passed`

- [ ] **Step 5: 타입체크**

Run: `npm run lint`
Expected: 에러 없음 — 단, `addToWatchlist(ticker, companyName)`를 호출하는 기존 코드(`src/components/WatchlistScreen.tsx`, `src/components/CompanyDetailScreen.tsx`)는 market 인자가 없어도 기본값 `'KR'`이 적용되므로 타입 에러 없이 그대로 컴파일된다. (market 인자를 실제로 넘기는 배선은 Task 3에서 한다.)

- [ ] **Step 6: 커밋**

```bash
git add src/lib/watchlistDb.ts src/lib/watchlistDb.selfcheck.ts
git commit -m "feat: add market(KR/US) field to WatchlistItem"
```

---

## Task 2: US 종목 유니버스 생성 스크립트

**Files:**
- Create: `scripts/generate-us-stock-list.mjs`
- Create (실행 결과물, 스크립트 실행으로 생성): `public/data/us-stocks.json`

**Interfaces:**
- Produces: `public/data/us-stocks.json` — `{ ticker: string; companyName: string }[]` (Task 3의 WatchlistScreen 검색이 이 파일을 fetch해서 소비)

**소스**: SEC 공식 `https://www.sec.gov/files/company_tickers.json` — 무료, 키 불필요, 공식 데이터. 응답 형태는 `{ "0": { "cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc." }, "1": {...}, ... }` (숫자 인덱스 키를 가진 객체, 배열이 아님). SEC는 자동화된 요청에 실명이 담긴 User-Agent 헤더를 요구한다(https://www.sec.gov/os/webmaster-faq#developers) — 이게 없으면 403이 날 수 있다.

- [ ] **Step 1: 스크립트 작성**

```javascript
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
```

- [ ] **Step 2: 실행해서 실제로 파일이 생기는지 확인**

Run: `node scripts/generate-us-stock-list.mjs`
Expected: `Wrote N US-listed companies to public/data/us-stocks.json` (N은 수천 단위) 출력, `public/data/us-stocks.json` 파일 생성됨. 파일을 열어 `{"ticker": "AAPL", "companyName": "Apple Inc."}` 형태의 항목이 있는지 눈으로 확인.

- [ ] **Step 3: 커밋**

```bash
git add scripts/generate-us-stock-list.mjs public/data/us-stocks.json
git commit -m "feat: add US stock universe generator (SEC company_tickers.json)"
```

---

## Task 3: WatchlistScreen/CompanyDetailScreen 한/미 배선

**Files:**
- Modify: `src/components/WatchlistScreen.tsx`
- Modify: `src/components/CompanyDetailScreen.tsx`

**Interfaces:**
- Consumes: `addToWatchlist(ticker, companyName, market)` (Task 1), `WatchlistItem.market` (Task 1), `public/data/us-stocks.json` (Task 2)
- Produces: 검색 결과에 KR/US 배지가 붙은 통합 검색, 워치리스트 목록에 시장 구분 표시

- [ ] **Step 1: WatchlistScreen에 US 유니버스 로딩 + market 태그 추가**

`src/components/WatchlistScreen.tsx`의 `StockOption` 인터페이스와 데이터 로딩, 검색 로직을 수정한다:

```typescript
interface StockOption {
  ticker: string;
  companyName: string;
  market: 'KR' | 'US';
}
```

`useEffect` 안 `fetch('/data/stocks.json')...` 블록을 아래로 교체 (KR + US 두 유니버스를 합쳐서 하나의 `stocks` 상태로 관리):

```typescript
useEffect(() => {
  getWatchlist().then((list) => setItems(list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))));
  Promise.all([
    fetch('/data/stocks.json').then((r) => r.json()).catch(() => []),
    fetch('/data/us-stocks.json').then((r) => r.json()).catch(() => []),
  ]).then(([kr, us]) => {
    setStocks([
      ...kr.map((s: { ticker: string; companyName: string }) => ({ ...s, market: 'KR' as const })),
      ...us.map((s: { ticker: string; companyName: string }) => ({ ...s, market: 'US' as const })),
    ]);
  });
}, []);
```

`handleAdd`가 market을 넘기도록 수정:

```typescript
async function handleAdd(stock: StockOption) {
  await addToWatchlist(stock.ticker, stock.companyName, stock.market);
  setItems(await getWatchlist());
  setQuery('');
  setSelected(stock);
}
```

검색 제안 목록 렌더링(`suggestions.map`)에 배지를 추가 — 기존:
```tsx
<span>{s.companyName}</span>
<span className="text-slate-500">{s.ticker}</span>
```
를 아래로 교체:
```tsx
<span className="flex items-center gap-1.5 min-w-0">
  <span className="truncate">{s.companyName}</span>
  <span className={`text-[10px] shrink-0 rounded px-1 py-0.5 ${s.market === 'US' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
    {s.market}
  </span>
</span>
<span className="text-slate-500">{s.ticker}</span>
```

워치리스트 목록 렌더링(`items.map`)의 `<span className="truncate">` 블록에도 같은 배지를 추가 (종목명 옆):
```tsx
<span className="truncate">
  <span className="font-medium">{item.companyName}</span>
  <span className={`ml-1.5 text-[10px] rounded px-1 py-0.5 ${item.market === 'US' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
    {item.market}
  </span>
  <span className="text-slate-500 ml-2 text-xs">{item.ticker}</span>
</span>
```

`selected` state와 `CompanyDetailScreen`에 넘기는 `company` 타입도 `market`을 포함하도록 `interface StockOption`을 그대로 재사용하면 되므로 별도 수정 불필요 — 단, `handleShare`/`CompanyDetailScreen` 쪽에서 `company: { ticker, companyName }`만 쓰던 타입을 넓혀야 한다(다음 스텝).

- [ ] **Step 2: CompanyDetailScreen의 CompanyRef에 market 추가, addToWatchlist 배선**

`src/components/CompanyDetailScreen.tsx`:

```typescript
interface CompanyRef {
  ticker: string;
  companyName: string;
  market?: 'KR' | 'US'; // WatchlistScreen 목록에서 넘어올 땐 항상 있음; 다른 진입 경로 대비 옵셔널
}
```

`handleToggleWatch` 안 `addToWatchlist` 호출을 수정:

```typescript
async function handleToggleWatch() {
  if (watchlistEntry) {
    await removeFromWatchlist(company.ticker);
  } else {
    await addToWatchlist(company.ticker, company.companyName, company.market ?? 'KR');
  }
  refreshWatchlistEntry();
}
```

- [ ] **Step 3: 타입체크**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 4: 로컬에서 수동 확인**

Run: `npm run dev`, 브라우저에서 MY STOCK RADAR 탭 열고 "AAPL" 또는 "apple" 검색 → US 배지 붙은 결과가 나오는지, 추가 후 목록에 US 배지가 보이는지 확인. KR 종목("삼성전자")도 여전히 검색되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/WatchlistScreen.tsx src/components/CompanyDetailScreen.tsx
git commit -m "feat: support US tickers in watchlist search and detail screen"
```

---

## Task 4: KR 종가 배치 스크립트

**Files:**
- Create: `scripts/fetch-prices.mjs`
- Modify: `.github/workflows/fetch-facts.yml` (같은 워크플로에 스텝 추가 — 별도 워크플로 파일 대신, 이미 매일 도는 job에 얹는다)

**Interfaces:**
- Produces: `public/data/prices.json` — `{ ticker: string; close: number; changePct: number; date: string }[]`. Task 5가 이 파일을 소비.

**소스**: 공공데이터포털 `금융위원회_주식시세정보` — `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo`. 파라미터: `serviceKey`, `numOfRows`, `pageNo`, `resultType=json`, `basDt`(기준일자, YYYYMMDD). 응답 필드: `basDt, srtnCd(종목코드), itmsNm(종목명), clpr(종가), fltRt(등락률)` 등. 갱신주기가 "영업일 기준 하루 뒤 오후 1시 이후"라 최신 영업일 기준으로 못 받을 수 있어, 오늘부터 최대 5일 전까지 거슬러 올라가며 첫 성공 응답을 쓴다(주말/공휴일 대비).

- [ ] **Step 1: 스크립트 작성**

```javascript
// Fetches KR closing prices for the full KRX universe (matches public/data/stocks.json)
// from the public data portal - see [[kstock_price_data_source]] memory for why this
// source (commercial reuse explicitly allowed) over KRX's own Open API.
//
// Usage: DATA_GO_KR_KEY=xxx node scripts/fetch-prices.mjs

import { writeFileSync } from 'node:fs';

const API_KEY = process.env.DATA_GO_KR_KEY;
if (!API_KEY) {
  console.error('DATA_GO_KR_KEY env var is required.');
  process.exit(1);
}

function kstDateMinus(daysAgo) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 - daysAgo * 86_400_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchForDate(basDt) {
  const rows = [];
  let page = 1;
  for (;;) {
    const url = new URL('https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('resultType', 'json');
    url.searchParams.set('basDt', basDt);
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', String(page));

    const res = await fetch(url);
    if (!res.ok) throw new Error(`data.go.kr request failed: ${res.status}`);
    const body = await res.json();
    const header = body.response?.header;
    if (header?.resultCode !== '00') return null; // no data for this date (weekend/holiday) - caller tries an earlier date.

    const items = body.response?.body?.items?.item ?? [];
    rows.push(...(Array.isArray(items) ? items : [items]));
    const totalCount = body.response?.body?.totalCount ?? 0;
    if (page * 1000 >= totalCount) break;
    page++;
  }
  return rows;
}

// 오늘부터 최대 5일 전까지 거슬러 올라가며 첫 성공 응답을 쓴다 (주말/공휴일 대비).
let rows = null;
let usedDate = null;
for (let daysAgo = 0; daysAgo <= 5; daysAgo++) {
  const basDt = kstDateMinus(daysAgo);
  rows = await fetchForDate(basDt);
  if (rows && rows.length > 0) {
    usedDate = basDt;
    break;
  }
}
if (!rows) {
  console.error('No price data found in the last 5 days.');
  process.exit(1);
}

const prices = rows.map((r) => ({
  ticker: r.srtnCd,
  close: Number(r.clpr),
  changePct: Number(r.fltRt),
  date: `${usedDate.slice(0, 4)}-${usedDate.slice(4, 6)}-${usedDate.slice(6, 8)}`,
}));

writeFileSync(new URL('../public/data/prices.json', import.meta.url), JSON.stringify(prices, null, 2) + '\n');
console.log(`Wrote ${prices.length} KR closing prices (as of ${usedDate}) to public/data/prices.json`);
```

- [ ] **Step 2: 로컬에서 실행 (data.go.kr 키 발급 후)**

data.go.kr에서 "금융위원회_주식시세정보" API 활용신청 후 인증키 발급 (사용자가 직접 해야 함 — 계정 필요).

Run: `DATA_GO_KR_KEY=<발급받은키> node scripts/fetch-prices.mjs`
Expected: `Wrote N KR closing prices (as of YYYYMMDD) to public/data/prices.json` 출력, 파일 생성 확인.

- [ ] **Step 3: GitHub Actions 워크플로에 스텝 추가**

`.github/workflows/fetch-facts.yml`의 "Fetch today's disclosures" 스텝 다음에 추가:

```yaml
      - name: Fetch KR closing prices
        env:
          DATA_GO_KR_KEY: ${{ secrets.DATA_GO_KR_KEY }}
        run: node scripts/fetch-prices.mjs
```

그리고 "Check for changes" 스텝의 `git add` 대상에 `public/data/prices.json` 추가:

```yaml
      - name: Check for changes
        id: diff
        run: |
          git add public/data/today.json public/data/prices.json
          git diff --staged --quiet && echo "changed=false" >> "$GITHUB_OUTPUT" || echo "changed=true" >> "$GITHUB_OUTPUT"
```

GitHub 리포지토리 Settings > Secrets에 `DATA_GO_KR_KEY` 추가 필요 (사용자가 직접 해야 함).

- [ ] **Step 4: 커밋**

```bash
git add scripts/fetch-prices.mjs .github/workflows/fetch-facts.yml
git commit -m "feat: fetch KR closing prices daily via data.go.kr"
```

---

## Task 5: MY STOCK RADAR에 종가 표시

**Files:**
- Modify: `src/components/WatchlistScreen.tsx`

**Interfaces:**
- Consumes: `public/data/prices.json` (Task 4), `WatchlistItem.market` (Task 1)

- [ ] **Step 1: prices.json 로딩 + 워치리스트 목록에 종가 표시**

`WatchlistScreen.tsx`에 상태와 로딩 추가:

```typescript
interface PriceInfo {
  ticker: string;
  close: number;
  changePct: number;
  date: string;
}

const [prices, setPrices] = useState<Map<string, PriceInfo>>(new Map());
```

`useEffect` 데이터 로딩 블록에 추가:

```typescript
fetch('/data/prices.json')
  .then((r) => r.json())
  .then((rows: PriceInfo[]) => setPrices(new Map(rows.map((r) => [r.ticker, r]))))
  .catch(() => {});
```

워치리스트 목록 렌더링에서, 종목명 옆 줄에 종가를 추가 (US는 아직 데이터가 없으므로 안내 문구):

```tsx
<span className="text-slate-500 ml-2 text-xs">{item.ticker}</span>
```
바로 아래 줄에 추가:
```tsx
{item.market === 'KR' && prices.has(item.ticker) ? (
  <p className="text-xs mt-0.5">
    {prices.get(item.ticker)!.close.toLocaleString()}원{' '}
    <span className={prices.get(item.ticker)!.changePct >= 0 ? 'text-red-400' : 'text-blue-400'}>
      {prices.get(item.ticker)!.changePct >= 0 ? '+' : ''}
      {prices.get(item.ticker)!.changePct.toFixed(2)}%
    </span>
  </p>
) : item.market === 'US' ? (
  <p className="text-xs text-slate-600 mt-0.5">가격 정보 미지원</p>
) : null}
```

(국내 관행대로 상승=빨강/하락=파랑 — TodayScreen의 sentiment 배색과는 다른 축이라 혼동 없음)

- [ ] **Step 2: 타입체크**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 로컬 수동 확인**

`public/data/prices.json`이 없으면(아직 로컬에서 스크립트를 안 돌렸으면) 404가 나서 `.catch(() => {})`로 조용히 넘어가는지, 워치리스트 화면이 깨지지 않는지 확인. Task 4에서 만든 파일을 `public/data/`에 두고 `npm run dev`로 KR 종목에 종가가 표시되는지, US 종목엔 "가격 정보 미지원"이 뜨는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/WatchlistScreen.tsx
git commit -m "feat: show KR closing price/change in MY STOCK RADAR"
```
