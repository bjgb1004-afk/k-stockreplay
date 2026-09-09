# Replay Data Normalizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert raw parsed spreadsheet rows (any broker's column names, mixed string/number cell types) into the internal standard `MarketDataRow` model — the second stage of the local stock-replay pipeline, still zero network calls.

**Architecture:** Two pure, Node-testable functions in one module. `detectColumnMapping` guesses which raw header belongs to which of the 6 required fields (date/open/high/low/close/volume) by matching against a known-alias table (Kiwoom, Mirae Asset, generic English headers). `normalizeRows` takes a *resolved* mapping (auto-detected or, later, manually chosen by the user in a UI this plan does not build) and converts each raw row into a typed `MarketDataRow`, handling both comma-formatted number strings and Excel date-serial numbers. No IndexedDB, no chart, no manual-mapping UI, no OHLC sanity checks (e.g. high < low) — those belong to the later Storage, Renderer, and Data-Verify plans respectively.

**Tech Stack:** TypeScript, no new dependencies. Self-check runs via `tsx` (already added as a devDependency in the parser plan).

**Spec:** No separate spec file. Constraints below come from `전체디자인.txt` (§2 데이터 정규화, repo parent folder `kstock/`) and project memory `kstock_replay_excel_clientside.md` / `kstock_design_principles.md`.

## Global Constraints

- Zero network calls anywhere in this module.
- Zero server involvement.
- Follow existing repo convention: flat `src/lib/*.ts` files, no nested folders.
- No new test framework — self-check via `tsx`, same pattern as `src/lib/marketDataParse.selfcheck.ts`.
- This module must not import anything from `src/lib/marketDataParse.ts` — it only needs the *shape* of `ParsedSheet.rows` (`Record<string, string | number>[]`), not the parser itself, so it stays independently testable.

---

### Task 1: Column auto-detection + row normalization

**Files:**
- Create: `src/lib/marketDataNormalize.ts`
- Create: `src/lib/marketDataNormalize.selfcheck.ts`

**Interfaces:**
- Consumes: `Record<string, string | number>[]` — the shape of `ParsedSheet.rows` produced by `parseSpreadsheet` in `src/lib/marketDataParse.ts` (Task 1 of the parser plan). Not imported directly.
- Produces:
  - `type MarketField = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume'`
  - `interface ColumnMapping { date: string | null; open: string | null; high: string | null; low: string | null; close: string | null; volume: string | null }`
  - `interface MarketDataRow { date: string; open: number; high: number; low: number; close: number; volume: number }`
  - `function detectColumnMapping(headers: string[]): ColumnMapping`
  - `function normalizeRows(rows: Record<string, string | number>[], mapping: ColumnMapping): MarketDataRow[]`
  - These are consumed by the later Storage task (IndexedDB) and by a future manual-mapping UI (which calls `detectColumnMapping` first, lets the user fix any `null` field, then calls `normalizeRows`).

- [ ] **Step 1: Write `src/lib/marketDataNormalize.selfcheck.ts` (fails — module doesn't exist yet)**

```ts
import assert from 'node:assert/strict';
import { detectColumnMapping, normalizeRows } from './marketDataNormalize';

// 키움 헤더 자동 인식
{
  const mapping = detectColumnMapping(['일자', '시가', '고가', '저가', '현재가', '거래량']);
  assert.deepEqual(mapping, {
    date: '일자',
    open: '시가',
    high: '고가',
    low: '저가',
    close: '현재가',
    volume: '거래량',
  });
}

// 미래에셋 헤더 자동 인식 (종가 사용)
{
  const mapping = detectColumnMapping(['날짜', '시가', '고가', '저가', '종가', '거래량']);
  assert.equal(mapping.date, '날짜');
  assert.equal(mapping.close, '종가');
}

// 알 수 없는 헤더 -> 전부 null
{
  const mapping = detectColumnMapping(['Col1', 'Col2', 'Col3']);
  assert.deepEqual(mapping, {
    date: null,
    open: null,
    high: null,
    low: null,
    close: null,
    volume: null,
  });
}

const fullMapping = {
  date: '날짜',
  open: '시가',
  high: '고가',
  low: '저가',
  close: '종가',
  volume: '거래량',
};

// 정상 행: 콤마 포함 숫자 문자열 처리
{
  const rows = normalizeRows(
    [{ 날짜: '2026-08-28', 시가: '100,000', 고가: '105,000', 저가: '98,000', 종가: '103,000', 거래량: 1234567 }],
    fullMapping
  );
  assert.deepEqual(rows, [
    { date: '2026-08-28', open: 100000, high: 105000, low: 98000, close: 103000, volume: 1234567 },
  ]);
}

// 날짜 구분자 변형 처리 (yyyy.mm.dd, yyyymmdd)
{
  const rows = normalizeRows(
    [
      { 날짜: '2026.08.28', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 },
      { 날짜: '20260829', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 },
    ],
    fullMapping
  );
  assert.equal(rows[0].date, '2026-08-28');
  assert.equal(rows[1].date, '2026-08-29');
}

// Excel 날짜 시리얼 번호 -> ISO 날짜 (역산해서 왕복 검증)
{
  const referenceDate = '2026-08-28';
  const serial = Math.round(new Date(`${referenceDate}T00:00:00Z`).getTime() / 86400000) + 25569;
  const rows = normalizeRows(
    [{ 날짜: serial, 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
    fullMapping
  );
  assert.equal(rows[0].date, referenceDate);
}

// 매핑 미완성 -> 명확한 에러
{
  const incompleteMapping = { ...fullMapping, close: null };
  assert.throws(
    () => normalizeRows([{ 날짜: '2026-08-28', 시가: 1, 고가: 2, 저가: 1, 거래량: 1 }], incompleteMapping),
    /매핑.*완료되지 않았습니다.*close/
  );
}

// 숫자로 변환 안 되는 값 -> 행 번호 포함 에러
{
  assert.throws(
    () =>
      normalizeRows(
        [{ 날짜: '2026-08-28', 시가: 'abc', 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
        fullMapping
      ),
    /1행.*시가/
  );
}

// 파싱 안 되는 날짜 -> 행 번호 포함 에러
{
  assert.throws(
    () =>
      normalizeRows(
        [{ 날짜: 'not-a-date', 시가: 1, 고가: 2, 저가: 1, 종가: 2, 거래량: 1 }],
        fullMapping
      ),
    /1행.*날짜/
  );
}

console.log('OK: marketDataNormalize selfcheck passed');
```

- [ ] **Step 2: Run self-check to verify it fails**

Run: `npx tsx src/lib/marketDataNormalize.selfcheck.ts`
Expected: fails with a module-not-found / import error (`marketDataNormalize.ts` doesn't exist yet).

- [ ] **Step 3: Write `src/lib/marketDataNormalize.ts`**

```ts
export type MarketField = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume';

export interface ColumnMapping {
  date: string | null;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string | null;
  volume: string | null;
}

export interface MarketDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const FIELD_ALIASES: Record<MarketField, string[]> = {
  date: ['날짜', '일자', '거래일', 'date'],
  open: ['시가', 'open'],
  high: ['고가', 'high'],
  low: ['저가', 'low'],
  close: ['종가', '현재가', 'close'],
  volume: ['거래량', 'volume'],
};

const FIELD_LABELS: Record<MarketField, string> = {
  date: '날짜',
  open: '시가',
  high: '고가',
  low: '저가',
  close: '종가',
  volume: '거래량',
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping = { date: null, open: null, high: null, low: null, close: null, volume: null } as ColumnMapping;

  for (const field of Object.keys(FIELD_ALIASES) as MarketField[]) {
    const aliases = FIELD_ALIASES[field].map((alias) => alias.toLowerCase());
    const match = headers.find((header) => aliases.includes(header.trim().toLowerCase()));
    mapping[field] = match ?? null;
  }

  return mapping;
}

// 증권사 파일은 숫자 셀에 천단위 콤마를 그대로 쓰는 경우가 많다 (예: "103,000").
function parseNumberCell(raw: string | number, rowNumber: number, field: MarketField): number {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new Error(`${rowNumber}행: ${FIELD_LABELS[field]} 값이 숫자가 아닙니다.`);
    }
    return raw;
  }

  const cleaned = raw.replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  if (cleaned === '' || !Number.isFinite(parsed)) {
    throw new Error(`${rowNumber}행: ${FIELD_LABELS[field]} 값이 숫자가 아닙니다. (${raw})`);
  }
  return parsed;
}

const DATE_PATTERN = /^(\d{4})[-./]?(\d{2})[-./]?(\d{2})$/;

// Excel의 날짜 시리얼 번호(1899-12-30 기준 경과일)를 ISO 날짜로 변환한다.
function serialToIsoDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

// 달력 상 존재하지 않는 조합(2월 30일 등)은 걸러내지 않는다 - 실제 증권사 데이터에서는
// 나오지 않고, 걸러내려면 별도 Date 왕복 검증이 필요해 여기서는 생략한다.
// ponytail: 월/일 범위만 확인, 윤년/월별 일수는 검증 안 함. 필요해지면 Date 왕복 검증 추가.
function parseDateCell(raw: string | number, rowNumber: number): string {
  if (typeof raw === 'number') {
    return serialToIsoDate(raw);
  }

  const match = DATE_PATTERN.exec(raw.trim());
  if (!match) {
    throw new Error(`${rowNumber}행: 날짜 형식을 인식할 수 없습니다. (${raw})`);
  }
  const [, year, month, day] = match;
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    throw new Error(`${rowNumber}행: 날짜 형식을 인식할 수 없습니다. (${raw})`);
  }
  return `${year}-${month}-${day}`;
}

export function normalizeRows(
  rows: Record<string, string | number>[],
  mapping: ColumnMapping
): MarketDataRow[] {
  const missing = (Object.keys(mapping) as MarketField[]).filter((field) => mapping[field] === null);
  if (missing.length > 0) {
    throw new Error(`컬럼 매핑이 완료되지 않았습니다: ${missing.join(', ')}`);
  }

  return rows.map((row, index) => {
    const rowNumber = index + 1;
    const get = (field: MarketField) => row[mapping[field] as string];

    return {
      date: parseDateCell(get('date'), rowNumber),
      open: parseNumberCell(get('open'), rowNumber, 'open'),
      high: parseNumberCell(get('high'), rowNumber, 'high'),
      low: parseNumberCell(get('low'), rowNumber, 'low'),
      close: parseNumberCell(get('close'), rowNumber, 'close'),
      volume: parseNumberCell(get('volume'), rowNumber, 'volume'),
    };
  });
}
```

- [ ] **Step 4: Run self-check to verify it passes**

Run: `npx tsx src/lib/marketDataNormalize.selfcheck.ts`
Expected: prints `OK: marketDataNormalize selfcheck passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketDataNormalize.ts src/lib/marketDataNormalize.selfcheck.ts
git commit -m "feat: add column auto-detection + row normalizer for replay feature"
```
