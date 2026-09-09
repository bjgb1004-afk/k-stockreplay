# Replay File Parser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse a user-uploaded CSV/XLSX file entirely client-side into raw row data — the first stage of the local stock-replay pipeline, with zero network calls anywhere.

**Architecture:** One library (`xlsx`, SheetJS) reads both CSV and XLSX formats. A pure, Node-testable core function (`parseSpreadsheet`) takes a raw buffer and returns headers + row objects; a thin browser wrapper (`parseSpreadsheetFile`) adapts a DOM `File` to that core function. No IndexedDB, no OHLCV column mapping, no chart — those are separate later plans (Normalizer, Storage, Renderer).

**Tech Stack:** TypeScript, `xlsx` npm package. Self-check runs via `tsx` (new devDependency — repo has no test framework; `tsx` is the standard zero-config way to run a `.ts` file directly in Node without adding a full test runner).

**Spec:** No separate spec file for this plan — constraints below come directly from prior conversation decisions. See project memory `kstock_replay_excel_clientside.md` (architecture + hard rules) and `kstock_design_principles.md` (product constraints) for full rationale.

## Global Constraints

- Zero network calls anywhere in this module — no `fetch`, no importing `src/lib/supabase.ts` (it exists in this repo for other features; must not be pulled into the replay data path).
- Zero server involvement — no upload endpoint, ever. This logic must be fully client-side/Node-portable.
- Follow existing repo convention: flat `src/lib/*.ts` files, no nested folders (matches `tax.ts`, `date.ts`, `streakDb.ts`, etc.).
- No new test framework (no vitest/jest) — this repo currently has none; keep it that way.

---

### Task 1: Raw spreadsheet parser (CSV/XLSX → rows)

**Files:**
- Create: `src/lib/marketDataParse.ts`
- Create: `src/lib/marketDataParse.selfcheck.ts`
- Modify: `package.json` (add `xlsx` dependency, `tsx` devDependency)

**Interfaces:**
- Produces:
  - `interface ParsedSheet { headers: string[]; rows: Record<string, string | number>[] }`
  - `function parseSpreadsheet(buffer: ArrayBuffer, filename: string): ParsedSheet` — pure, no DOM, Node-testable
  - `function parseSpreadsheetFile(file: File): Promise<ParsedSheet>` — browser wrapper
- Consumes: nothing (first task in the pipeline; later Normalizer task consumes `ParsedSheet`)

- [x] **Step 1: Install dependencies**

```bash
cd k-stockreplay
npm install xlsx
npm install -D tsx
```

- [x] **Step 2: Write `src/lib/marketDataParse.ts`**

```ts
import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string | number>[];
}

// CSV는 텍스트로 디코드해서 넘겨야 SheetJS가 구분자 파싱을 함 - ArrayBuffer 그대로
// 넘기면 바이너리 포맷(xlsx)으로 오인해 깨진 결과가 나온다.
export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): ParsedSheet {
  const isCsv = filename.toLowerCase().endsWith('.csv');
  const workbook = isCsv
    ? XLSX.read(new TextDecoder('utf-8').decode(buffer), { type: 'string' })
    : XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('빈 파일입니다.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });
  if (rows.length === 0) {
    throw new Error('데이터가 없습니다.');
  }

  return { headers: Object.keys(rows[0]), rows };
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  return parseSpreadsheet(buffer, file.name);
}
```

- [x] **Step 3: Write `src/lib/marketDataParse.selfcheck.ts`**

```ts
import assert from 'node:assert/strict';
import { parseSpreadsheet } from './marketDataParse';

function bufferFrom(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

// 정상 CSV: 헤더 + row 파싱 확인
{
  const csv = '날짜,시가,고가,저가,종가,거래량\n2026-08-28,100000,105000,98000,103000,1234567\n';
  const result = parseSpreadsheet(bufferFrom(csv), 'test.csv');
  assert.deepEqual(result.headers, ['날짜', '시가', '고가', '저가', '종가', '거래량']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]['종가'], 103000);
}

// 빈 파일: 명확한 에러
{
  assert.throws(() => parseSpreadsheet(bufferFrom(''), 'empty.csv'), /데이터가 없습니다/);
}

console.log('OK: marketDataParse selfcheck passed');
```

- [x] **Step 4: Run self-check**

Run: `npx tsx src/lib/marketDataParse.selfcheck.ts`
Expected: prints `OK: marketDataParse selfcheck passed`, exit code 0. If the empty-file assertion throws unexpectedly or the CSV assertions fail, the script exits non-zero with the assertion diff.

- [x] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/marketDataParse.ts src/lib/marketDataParse.selfcheck.ts
git commit -m "feat: add client-side CSV/XLSX parser for replay feature"
```
