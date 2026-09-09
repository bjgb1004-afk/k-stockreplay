# Replay Trading Marking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user mark virtual buy/sell decisions while stepping through `ReplayPlayback` — the sixth pipeline stage (`전체디자인.txt` §6, "Trading Marking"). Explicitly a *recording* stage only: no P&L math here, that's §7's job, kept in its own calculation layer per the design doc's own principle ("UI에서 직접 계산하지 않는 원칙").

**Architecture:** Two new IndexedDB stores, `replay_sessions` and `replay_trades`, kept separate from `datasets`/`market_data` per §3/§6 ("복기 기록은 별도로... virtual transaction... 가계부 거래 데이터와 반드시 분리"). A pure module `src/lib/replayPosition.ts` derives net held quantity from a trade list (mirrors the `playbackCursor.ts` pure/impure split). A new component `src/components/ReplayTrading.tsx` wraps the already-committed `ReplayPlayback`, giving it a small new `onCursorChange` prop so the wrapper knows the currently-revealed candle to trade at — the same wrap-and-extend pattern `ReplayPlayback` used on `ReplayChart`.

**Tech Stack:** No new dependency. `crypto.randomUUID()` (already used in `marketDataStore.ts`) for ids, existing `withStore`/`openDb` from `src/lib/db.ts`.

**Spec:** `전체디자인.txt` §6, repo parent folder `kstock/`. Explicitly **out of scope**: §7 손익계산 (P&L) — no `profitLoss.ts`/`calculateProfitLoss` in this plan, no profit/loss numbers shown anywhere, only raw recorded trades (date/type/price/quantity). Also out of scope: reopening a past session (§3's "지난번에 복기했던 거 다시 열기" — needs a session list UI, future plan).

## Global Constraints

- No new dependency.
- `replay_sessions`/`replay_trades` are separate IndexedDB stores from `datasets`/`market_data` — never mix virtual-trade rows into `market_data`.
- No P&L computation anywhere in this plan (no subtraction of buy price from sell price, no totals) — raw trade log display only.
- Quantity is a fixed constant (`1`), not a user input. `# ponytail: fixed quantity, add a quantity input if virtual position-sizing turns out to matter.`
- One session per playback view-visit (created on mount, not resumable) — no session-list/"reopen" UI.
- Do not touch `ReplayChart.tsx` or any `src/lib/marketData*.ts` file.
- `ReplayPlayback.tsx` gets exactly one additive change (a new optional prop) — its existing behavior/props for callers that don't pass it must be unchanged.

---

### Task 1: DB schema + pure position module

**Files:**
- Edit: `src/lib/db.ts`
- Create: `src/lib/replayPosition.ts`
- Create: `src/lib/replayPosition.selfcheck.ts`
- Create: `src/lib/replayTradesStore.ts`

**Interfaces:**
- Produces (`replayPosition.ts`): `export interface ReplayTrade { id: string; sessionId: string; cursor: number; date: string; type: 'buy' | 'sell'; price: number; quantity: number }`, `function computePosition(trades: ReplayTrade[]): number` (net held quantity: sum of buy quantities minus sum of sell quantities).
- Produces (`replayTradesStore.ts`): `function startSession(datasetId: string): Promise<string>`, `function recordTrade(trade: Omit<ReplayTrade, 'id'>): Promise<ReplayTrade>`, `function getSessionTrades(sessionId: string): Promise<ReplayTrade[]>` (sorted ascending by `cursor`).
- Consumed by `ReplayTrading` (Task 2).

- [ ] **Step 1: Bump `src/lib/db.ts` schema**

Add two stores inside `req.onupgradeneeded`, after the existing `market_data` block, and bump `DB_VERSION` from `5` to `6`:

```ts
if (!db.objectStoreNames.contains('replay_sessions')) {
  // 가상매매 세션 1건당 1행 (§6) - 실제 가계부 거래(watchlist 등)와 분리된 별도 저장소.
  db.createObjectStore('replay_sessions', { keyPath: 'id' });
}
if (!db.objectStoreNames.contains('replay_trades')) {
  // 세션 내 가상 매수/매도 기록. sessionId로만 조회하므로 인덱스 하나면 충분하다.
  const store = db.createObjectStore('replay_trades', { keyPath: 'id' });
  store.createIndex('sessionId', 'sessionId');
}
```

- [ ] **Step 2: Write `src/lib/replayPosition.selfcheck.ts` (fails — module doesn't exist yet)**

```ts
import assert from 'node:assert/strict';
import { computePosition, type ReplayTrade } from './replayPosition';

const trade = (type: 'buy' | 'sell', quantity: number): ReplayTrade => ({
  id: 't', sessionId: 's', cursor: 1, date: '2026-01-01', type, price: 100, quantity,
});

// 거래 없음 -> 0
assert.equal(computePosition([]), 0);
// 매수 1건 -> 보유중
assert.equal(computePosition([trade('buy', 1)]), 1);
// 매수 후 매도 -> 청산
assert.equal(computePosition([trade('buy', 1), trade('sell', 1)]), 0);
// 매수 2회 -> 누적
assert.equal(computePosition([trade('buy', 1), trade('buy', 1)]), 2);

console.log('OK: replayPosition selfcheck passed');
```

- [ ] **Step 3: Run self-check to verify it fails**

Run: `npx tsx src/lib/replayPosition.selfcheck.ts`
Expected: fails with a module-not-found / import error.

- [ ] **Step 4: Write `src/lib/replayPosition.ts`**

```ts
export interface ReplayTrade {
  id: string;
  sessionId: string;
  cursor: number;
  date: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
}

export function computePosition(trades: ReplayTrade[]): number {
  return trades.reduce((qty, t) => qty + (t.type === 'buy' ? t.quantity : -t.quantity), 0);
}
```

- [ ] **Step 5: Run self-check to verify it passes**

Run: `npx tsx src/lib/replayPosition.selfcheck.ts`
Expected: prints `OK: replayPosition selfcheck passed`, exit code 0.

- [ ] **Step 6: Write `src/lib/replayTradesStore.ts`**

```ts
import { openDb, withStore } from './db';
import type { ReplayTrade } from './replayPosition';

export async function startSession(datasetId: string): Promise<string> {
  const id = crypto.randomUUID();
  await withStore('replay_sessions', 'readwrite', (store) =>
    store.add({ id, datasetId, createdAt: new Date().toISOString() }),
  );
  return id;
}

export async function recordTrade(trade: Omit<ReplayTrade, 'id'>): Promise<ReplayTrade> {
  const record: ReplayTrade = { ...trade, id: crypto.randomUUID() };
  await withStore('replay_trades', 'readwrite', (store) => store.add(record));
  return record;
}

export async function getSessionTrades(sessionId: string): Promise<ReplayTrade[]> {
  const db = await openDb();
  const trades = await new Promise<ReplayTrade[]>((resolve, reject) => {
    const tx = db.transaction('replay_trades', 'readonly');
    const req = tx.objectStore('replay_trades').index('sessionId').getAll(sessionId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return trades.sort((a, b) => a.cursor - b.cursor);
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db.ts src/lib/replayPosition.ts src/lib/replayPosition.selfcheck.ts src/lib/replayTradesStore.ts
git commit -m "feat: add replay session/trade storage + pure position derivation"
```

---

### Task 2: `ReplayTrading` component (buy/sell marking + trade log)

**Files:**
- Edit: `src/components/ReplayPlayback.tsx`
- Create: `src/components/ReplayTrading.tsx`
- Edit: `src/components/ReplayScreen.tsx`

**Interfaces:**
- `ReplayPlayback` gets one new optional prop: `onCursorChange?: (cursor: number, row: MarketDataRow) => void`, called whenever `cursor` changes (including on mount) — additive only, existing callers unaffected.
- `ReplayTrading` consumes: `ReplayPlayback` (with the new prop), `startSession`/`recordTrade`/`getSessionTrades` (`../lib/replayTradesStore`), `computePosition`/`type ReplayTrade` (`../lib/replayPosition`), `type MarketDataRow` (`../lib/marketDataNormalize`).
- Produces: `export default function ReplayTrading({ datasetId, rows }: { datasetId: string; rows: MarketDataRow[] }): JSX.Element`.
- `ReplayScreen`'s `play` view swaps `<ReplayPlayback rows={view.rows} />` for `<ReplayTrading datasetId={view.dataset.id} rows={view.rows} />`.

- [ ] **Step 1: Add `onCursorChange` to `src/components/ReplayPlayback.tsx`**

Add the prop to the function signature and one `useEffect`:

```tsx
export default function ReplayPlayback({
  rows,
  onCursorChange,
}: {
  rows: MarketDataRow[];
  onCursorChange?: (cursor: number, row: MarketDataRow) => void;
}) {
  // ...existing state...

  useEffect(() => {
    if (rows.length > 0) onCursorChange?.(cursor, rows[cursor - 1]);
  }, [cursor, rows]);

  // ...rest unchanged...
```

- [ ] **Step 2: Write `src/components/ReplayTrading.tsx`**

```tsx
import { useEffect, useState } from 'react';
import ReplayPlayback from './ReplayPlayback';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import { startSession, recordTrade, getSessionTrades } from '../lib/replayTradesStore';
import { computePosition, type ReplayTrade } from '../lib/replayPosition';

// ponytail: 고정 1주 - 가상 포지션 크기 조절이 필요해지면 입력값으로 뺀다.
const QUANTITY = 1;

export default function ReplayTrading({ datasetId, rows }: { datasetId: string; rows: MarketDataRow[] }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const [current, setCurrent] = useState<{ cursor: number; row: MarketDataRow } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    startSession(datasetId).then((id) => {
      setSessionId(id);
      return getSessionTrades(id);
    }).then(setTrades);
  }, [datasetId]);

  const position = computePosition(trades);

  async function trade(type: 'buy' | 'sell') {
    if (!sessionId || !current || busy) return;
    setBusy(true);
    const recorded = await recordTrade({
      sessionId,
      cursor: current.cursor,
      date: current.row.date,
      type,
      price: current.row.close,
      quantity: QUANTITY,
    });
    setTrades((prev) => [...prev, recorded]);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <ReplayPlayback rows={rows} onCursorChange={(cursor, row) => setCurrent({ cursor, row })} />

      <div className="flex gap-2 px-2">
        <button
          onClick={() => trade('buy')}
          disabled={position > 0 || busy || !current}
          className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-30"
        >
          매수
        </button>
        <button
          onClick={() => trade('sell')}
          disabled={position <= 0 || busy || !current}
          className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-30"
        >
          매도
        </button>
      </div>

      {trades.length > 0 && (
        <ul className="px-2 space-y-1">
          {trades.map((t) => (
            <li key={t.id} className="flex justify-between text-xs text-slate-400">
              <span>{t.date}</span>
              <span className={t.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                {t.type === 'buy' ? '매수' : '매도'} {t.quantity}주
              </span>
              <span className="tabular-nums">{t.price.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into `src/components/ReplayScreen.tsx`**

Replace the `play`-view render of `ReplayPlayback` with `ReplayTrading`, and drop the now-unused `ReplayPlayback` import:

```tsx
import ReplayTrading from './ReplayTrading';
// ...
<ReplayTrading datasetId={view.dataset.id} rows={view.rows} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open REPLAY tab, open a saved dataset (or upload one), confirm: 매수 enabled/매도 disabled at start; click 매수 → trade appears in log, 매수 disables, 매도 enables; step/scrub forward; click 매도 → second trade appears, buttons flip back.

- [ ] **Step 6: Commit**

```bash
git add src/components/ReplayPlayback.tsx src/components/ReplayTrading.tsx src/components/ReplayScreen.tsx
git commit -m "feat: add virtual buy/sell marking to replay playback"
```
