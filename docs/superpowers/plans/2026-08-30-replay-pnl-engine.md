# Replay P&L Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn recorded virtual trades (`replay_trades`, from the §6 marking stage) into profit/loss numbers — `전체디자인.txt` §7. Per the design doc's own principle, this lives in its own calculation layer (`src/calculations/`), never computed inline in a component.

**Architecture:** `src/calculations/profitLoss.ts` pairs each buy with its following sell (FIFO) into a closed round-trip, computing profit and profit%. `ReplayTrading` (already committed, §6) calls it to annotate its existing trade log with per-trade profit and a running total — no new screen needed, this stage only adds numbers to what's already rendered.

**Tech Stack:** No new dependency. Pure TypeScript, consumes `ReplayTrade` from `src/lib/replayPosition.ts` (already committed).

**Spec:** `전체디자인.txt` §7, repo parent folder `kstock/`. Explicitly **out of scope**: §8 Performance Analysis (aggregate stats — win rate, avg profit/loss, profit factor, streaks) — that's a separate future plan consuming this one's output; this plan only produces per-round-trip and total profit, not aggregate stats.

## Global Constraints

- No new dependency.
- New pure module under `src/calculations/` (not `src/lib/`) — matches the design doc's own proposed layer split (`src/calculations/profitLoss.ts`, `position.ts`, `winRate.ts`, `performance.ts` are its future siblings).
- Reuse `computePosition`/`ReplayTrade` from `src/lib/replayPosition.ts` — do not duplicate a `position.ts`; that logic already exists and covers what the design doc's proposed `position.ts` would do. `# ponytail: design doc lists a separate position.ts, already-built replayPosition.ts covers it — reuse instead of duplicating.`
- FIFO buy→sell pairing only, no partial-lot splitting — every trade today is a fixed 1-share lot (§6's `QUANTITY` constant), so pairing is always 1:1. `# ponytail: no lot-splitting, add if quantity ever becomes variable.`
- Do not touch `ReplayPlayback.tsx`, `ReplayChart.tsx`, or any `src/lib/marketData*.ts`/`replayTradesStore.ts` file — only consume `replayPosition.ts`'s existing `ReplayTrade` type.
- No aggregate stats (win rate, averages, streaks) — §8's job.

---

### Task 1: `profitLoss.ts` + wire into `ReplayTrading`

**Files:**
- Create: `src/calculations/profitLoss.ts`
- Create: `src/calculations/profitLoss.selfcheck.ts`
- Edit: `src/components/ReplayTrading.tsx`

**Interfaces:**
- Produces: `export interface ClosedTrade { buy: ReplayTrade; sell: ReplayTrade; profit: number; profitPercent: number }`, `function calculateProfitLoss(trades: ReplayTrade[]): { closedTrades: ClosedTrade[]; totalProfit: number }`.
- Consumed by `ReplayTrading` to annotate its trade log.

- [ ] **Step 1: Write `src/calculations/profitLoss.selfcheck.ts` (fails — module doesn't exist yet)**

```ts
import assert from 'node:assert/strict';
import { calculateProfitLoss } from './profitLoss';
import type { ReplayTrade } from '../lib/replayPosition';

const t = (type: 'buy' | 'sell', price: number, cursor: number): ReplayTrade => ({
  id: `${type}-${cursor}`, sessionId: 's', cursor, date: '2026-01-0' + cursor, type, price, quantity: 1,
});

// 미청산(매수만) -> 손익 없음
assert.deepEqual(calculateProfitLoss([t('buy', 100, 1)]).closedTrades, []);

// 매수-매도 1쌍 -> 수익
const oneRound = calculateProfitLoss([t('buy', 100, 1), t('sell', 120, 2)]);
assert.equal(oneRound.closedTrades.length, 1);
assert.equal(oneRound.closedTrades[0].profit, 20);
assert.equal(oneRound.totalProfit, 20);

// 손실 케이스
const loss = calculateProfitLoss([t('buy', 100, 1), t('sell', 80, 2)]);
assert.equal(loss.closedTrades[0].profit, -20);
assert.equal(Math.round(loss.closedTrades[0].profitPercent), -20);

// 매수-매도-매수-매도 두 쌍 -> 합산
const twoRounds = calculateProfitLoss([
  t('buy', 100, 1), t('sell', 110, 2),
  t('buy', 200, 3), t('sell', 190, 4),
]);
assert.equal(twoRounds.closedTrades.length, 2);
assert.equal(twoRounds.totalProfit, 0); // +10 -10

console.log('OK: profitLoss selfcheck passed');
```

- [ ] **Step 2: Run self-check to verify it fails**

Run: `npx tsx src/calculations/profitLoss.selfcheck.ts`
Expected: fails with a module-not-found / import error.

- [ ] **Step 3: Write `src/calculations/profitLoss.ts`**

```ts
import type { ReplayTrade } from '../lib/replayPosition';

export interface ClosedTrade {
  buy: ReplayTrade;
  sell: ReplayTrade;
  profit: number;
  profitPercent: number;
}

export function calculateProfitLoss(trades: ReplayTrade[]): { closedTrades: ClosedTrade[]; totalProfit: number } {
  const closedTrades: ClosedTrade[] = [];
  let openBuy: ReplayTrade | null = null;

  for (const t of trades) {
    if (t.type === 'buy') {
      openBuy = t;
    } else if (openBuy) {
      const profit = (t.price - openBuy.price) * t.quantity;
      const profitPercent = ((t.price - openBuy.price) / openBuy.price) * 100;
      closedTrades.push({ buy: openBuy, sell: t, profit, profitPercent });
      openBuy = null;
    }
  }

  const totalProfit = closedTrades.reduce((sum, c) => sum + c.profit, 0);
  return { closedTrades, totalProfit };
}
```

- [ ] **Step 4: Run self-check to verify it passes**

Run: `npx tsx src/calculations/profitLoss.selfcheck.ts`
Expected: prints `OK: profitLoss selfcheck passed`, exit code 0.

- [ ] **Step 5: Wire into `src/components/ReplayTrading.tsx`**

Import `calculateProfitLoss` from `../calculations/profitLoss`, derive `{ closedTrades, totalProfit }` from `trades` each render, and extend the existing trade-log `<ul>`:
- Build a `Map<string, ClosedTrade>` keyed by `sell.id` so each sell row can look up its own profit.
- On each `sell`-type row, append the profit (colored emerald/red, `+`/`-` prefixed, `toLocaleString()`).
- Below the list, when `closedTrades.length > 0`, show a total line: `총 손익 {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}`.

```tsx
import { calculateProfitLoss } from '../calculations/profitLoss';
// ...inside component, alongside `const position = computePosition(trades)`:
const { closedTrades, totalProfit } = calculateProfitLoss(trades);
const profitBySellId = new Map(closedTrades.map((c) => [c.sell.id, c.profit]));
```

```tsx
// inside the trade-log <li>, after the existing price span:
{t.type === 'sell' && profitBySellId.has(t.id) && (
  <span className={`tabular-nums ${profitBySellId.get(t.id)! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
    {profitBySellId.get(t.id)! >= 0 ? '+' : ''}{profitBySellId.get(t.id)!.toLocaleString()}
  </span>
)}
```

```tsx
// after the <ul>, when closedTrades.length > 0:
{closedTrades.length > 0 && (
  <p className={`px-2 text-sm font-medium ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
    총 손익 {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}
  </p>
)}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual smoke test**

Run: `npm run dev`, open REPLAY tab, open a dataset, 매수 then 매도 — confirm the sell row shows a colored profit number and a "총 손익" line appears below the log with the matching total.

- [ ] **Step 8: Commit**

```bash
git add src/calculations/profitLoss.ts src/calculations/profitLoss.selfcheck.ts src/components/ReplayTrading.tsx
git commit -m "feat: add P&L calculation layer, show per-trade + total profit in replay trading log"
```
