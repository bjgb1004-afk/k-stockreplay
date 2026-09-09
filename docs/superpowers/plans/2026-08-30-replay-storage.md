# Replay Data Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist normalized `MarketDataRow[]` (from the Normalizer stage) into IndexedDB as a named, reloadable dataset — the third stage of the local stock-replay pipeline, still zero network calls.

**Architecture:** Two IndexedDB object stores added to the repo's single shared database (`src/lib/db.ts`): `datasets` (one record per uploaded file — metadata only) and `market_data` (one record per OHLCV row, indexed by `datasetId`). A new module `src/lib/marketDataStore.ts` exposes `saveDataset`, `listDatasets`, `getMarketData`, `deleteDataset`. `saveDataset` writes the dataset record and all its rows in a single IndexedDB transaction so a page reload never leaves a dataset half-written.

**Tech Stack:** TypeScript, native IndexedDB (no new dependency). No selfcheck script for this module — IndexedDB has no Node runtime, and the existing IndexedDB modules in this repo (`watchlistDb.ts`, `streakDb.ts`, `alertsDb.ts`, `disclosuresDb.ts`) have none either; `npx tsc --noEmit` (the repo's existing `lint` script) is the verification step, consistent with that convention.

**Spec:** `전체디자인.txt` §3 (IndexedDB), repo parent folder `kstock/`. Store shapes below are copied from that section almost verbatim (added: `id`/`createdAt` on datasets, per-row `datasetId` on market_data for the index).

## Global Constraints

- Zero network calls anywhere in this module.
- One shared IndexedDB database, one version, one upgrade path — all schema changes go in `src/lib/db.ts`'s existing `onupgradeneeded`, per that file's header comment.
- Follow existing repo convention: flat `src/lib/*.ts` files, no nested folders.
- No new dependency (no `fake-indexeddb`, no ORM) — use `withStore` from `db.ts` for single-store ops, raw `openDb()` + `db.transaction([...])` for the two ops that touch both stores.
- `market_data` rows reuse the `MarketDataRow` type from `src/lib/marketDataNormalize.ts` (Task 1 of the normalizer plan) — do not redefine `date/open/high/low/close/volume` fields.

---

### Task 1: Add `datasets` + `market_data` object stores to the shared DB

**Files:**
- Modify: `src/lib/db.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: two IndexedDB object stores, `datasets` (keyPath `id`) and `market_data` (auto-incrementing key, index `datasetId`), that Task 2's `marketDataStore.ts` reads and writes.

- [ ] **Step 1: Bump `DB_VERSION` and add the two stores**

Edit `src/lib/db.ts`:

```ts
const DB_NAME = 'kstockreplay';
const DB_VERSION = 5;
```

Inside `req.onupgradeneeded`, after the existing `if (!db.objectStoreNames.contains('disclosures'))` block, add:

```ts
      if (!db.objectStoreNames.contains('datasets')) {
        // 리플레이용 업로드 파일 1건당 메타데이터 1행 (§3 datasets).
        db.createObjectStore('datasets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('market_data')) {
        // OHLCV 행 1건당 1레코드. datasetId로만 조회하므로 자동증가 키 + 인덱스만 있으면 된다.
        const store = db.createObjectStore('market_data', { autoIncrement: true });
        store.createIndex('datasetId', 'datasetId');
      }
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add datasets + market_data IndexedDB stores for replay storage"
```

---

### Task 2: `marketDataStore.ts` — save/list/get/delete a dataset

**Files:**
- Create: `src/lib/marketDataStore.ts`

**Interfaces:**
- Consumes: `openDb`, `withStore` from `./db` (Task 1); `MarketDataRow` type from `./marketDataNormalize` (already committed).
- Produces:
  - `interface Dataset { id: string; fileName: string; symbol: string; market: string; timeframe: string; startDate: string; endDate: string; rowCount: number; createdAt: string }`
  - `function saveDataset(meta: { fileName: string; symbol: string; market: string; timeframe: string }, rows: MarketDataRow[]): Promise<string>` — returns the new dataset's `id`. Throws if `rows` is empty.
  - `function listDatasets(): Promise<Dataset[]>`
  - `function getMarketData(datasetId: string): Promise<MarketDataRow[]>`
  - `function deleteDataset(datasetId: string): Promise<void>`
  - Consumed by the later Chart Renderer task (loads a dataset's rows to plot) and a future "내 업로드 목록" UI (lists/deletes datasets).

- [ ] **Step 1: Write `src/lib/marketDataStore.ts`**

```ts
import { openDb, withStore } from './db';
import type { MarketDataRow } from './marketDataNormalize';

export interface Dataset {
  id: string;
  fileName: string;
  symbol: string;
  market: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  rowCount: number;
  createdAt: string;
}

interface StoredMarketDataRow extends MarketDataRow {
  datasetId: string;
}

export async function saveDataset(
  meta: { fileName: string; symbol: string; market: string; timeframe: string },
  rows: MarketDataRow[],
): Promise<string> {
  if (rows.length === 0) {
    throw new Error('저장할 데이터가 없습니다.');
  }

  const dates = rows.map((row) => row.date);
  const dataset: Dataset = {
    id: crypto.randomUUID(),
    fileName: meta.fileName,
    symbol: meta.symbol,
    market: meta.market,
    timeframe: meta.timeframe,
    startDate: dates.reduce((min, d) => (d < min ? d : min)),
    endDate: dates.reduce((max, d) => (d > max ? d : max)),
    rowCount: rows.length,
    createdAt: new Date().toISOString(),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['datasets', 'market_data'], 'readwrite');
    tx.objectStore('datasets').put(dataset);
    const marketDataStore = tx.objectStore('market_data');
    for (const row of rows) {
      const stored: StoredMarketDataRow = { ...row, datasetId: dataset.id };
      marketDataStore.add(stored);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return dataset.id;
}

export function listDatasets(): Promise<Dataset[]> {
  return withStore('datasets', 'readonly', (store) => store.getAll());
}

export function getMarketData(datasetId: string): Promise<MarketDataRow[]> {
  return withStore('market_data', 'readonly', (store) =>
    store.index('datasetId').getAll(datasetId),
  );
}

export async function deleteDataset(datasetId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['datasets', 'market_data'], 'readwrite');
    tx.objectStore('datasets').delete(datasetId);
    const cursorReq = tx.objectStore('market_data').index('datasetId').openCursor(IDBKeyRange.only(datasetId));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/marketDataStore.ts
git commit -m "feat: add IndexedDB dataset store (save/list/get/delete) for replay feature"
```
