# Replay Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Progressively reveal a dataset's candles over time — hiding future data and letting the user step or auto-play forward through it — the fifth stage of the local stock-replay pipeline and, per `전체디자인.txt` §5, "Rebirth의 핵심 기능" (the core differentiator vs. just viewing a static historical chart).

**Architecture:** A pure, Node-testable cursor module (`src/lib/playbackCursor.ts`) holds the index math (clamp/step-forward/step-backward/at-end), kept separate from React per §7's own principle ("UI에서 직접 계산하지 않는 원칙" — don't calculate inside the UI layer, even though §7 is about P&L, the same separation applies here). A single component, `src/components/ReplayPlayback.tsx`, wraps the already-committed `ReplayChart` (stage 4): it owns a `cursor` (how many of `rows` are currently revealed), renders `<ReplayChart rows={rows.slice(0, cursor)} />`, and provides play/pause, step back/forward, a scrub slider, and a speed selector.

**Tech Stack:** React 19 (existing), TypeScript, native `<input type="range">` for scrubbing (no new dependency — a slider is a native form control, not a library problem). `lucide-react` (already installed) for icons — `Play`, `Pause`, `SkipBack`, `SkipForward`, `RotateCcw` all confirmed present in the installed version via `node -e "require('lucide-react')"`.

**Spec:** `전체디자인.txt` §5 (Playback), repo parent folder `kstock/`. Explicitly **out of scope for this plan**: §6 Trading Marking (virtual buy/sell recording into a separate `replay_trades`/`replay_sessions` model) and §7 손익계산 (P&L) — those need their own data model and are separate future plans. This plan only builds the reveal/scrub mechanism §5 describes; it does not add buy/sell/관망 buttons, since those write to a model that doesn't exist yet.

## Global Constraints

- No new dependency — `<input type="range">` (native) for scrubbing, `lucide-react` (already installed) for icons.
- Pure cursor logic lives in `src/lib/playbackCursor.ts`, separate from the React component that uses it — mirrors this repo's existing pattern of pure/testable `src/lib/marketData*.ts` modules vs. untested `src/components/*.tsx` screens.
- `ReplayPlayback` must render the already-committed `ReplayChart` (`src/components/ReplayChart.tsx`) — do not duplicate or reimplement any charting logic; it only ever hands `ReplayChart` a sliced `rows` array, which is exactly the extension point `ReplayChart`'s plan built it for.
- Flat `src/components/*.tsx` and `src/lib/*.ts`, no nested folders — matches existing convention.
- Do **not** add buy/sell/관망 (hold) buttons or write to any new storage model — that's §6's job in a future plan.
- Do **not** wire `ReplayPlayback` into `src/App.tsx`'s `SCREENS`/nav — same reasoning as the chart-renderer plan: no upload UI exists yet to produce a dataset to play back.

---

### Task 1: Pure playback cursor module

**Files:**
- Create: `src/lib/playbackCursor.ts`
- Create: `src/lib/playbackCursor.selfcheck.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `function clampCursor(cursor: number, length: number): number` — clamps to `[1, length]`, or `0` if `length` is `0`.
  - `function stepForward(cursor: number, length: number): number` — one step forward, clamped at `length`.
  - `function stepBackward(cursor: number): number` — one step back, floored at `1`.
  - `function isAtEnd(cursor: number, length: number): boolean`
  - Consumed by `ReplayPlayback` (Task 2) to drive its `cursor` state.

- [ ] **Step 1: Write `src/lib/playbackCursor.selfcheck.ts` (fails — module doesn't exist yet)**

```ts
import assert from 'node:assert/strict';
import { clampCursor, stepForward, stepBackward, isAtEnd } from './playbackCursor';

// 정상 범위
assert.equal(clampCursor(30, 100), 30);
// 상한 초과 -> 상한으로
assert.equal(clampCursor(200, 100), 100);
// 하한 미만 -> 최소 1
assert.equal(clampCursor(0, 100), 1);
// 빈 데이터셋 -> 0
assert.equal(clampCursor(5, 0), 0);

// 한 칸 전진
assert.equal(stepForward(5, 10), 6);
// 끝에서는 더 못 감
assert.equal(stepForward(10, 10), 10);

// 한 칸 후진
assert.equal(stepBackward(5), 4);
// 처음에서는 더 못 감
assert.equal(stepBackward(1), 1);

assert.equal(isAtEnd(10, 10), true);
assert.equal(isAtEnd(9, 10), false);

console.log('OK: playbackCursor selfcheck passed');
```

- [ ] **Step 2: Run self-check to verify it fails**

Run: `npx tsx src/lib/playbackCursor.selfcheck.ts`
Expected: fails with a module-not-found / import error.

- [ ] **Step 3: Write `src/lib/playbackCursor.ts`**

```ts
export function clampCursor(cursor: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(cursor, 1), length);
}

export function stepForward(cursor: number, length: number): number {
  return clampCursor(cursor + 1, length);
}

// 데이터셋이 비어 있을 때는 호출되지 않는다 - ReplayPlayback이 rows.length === 0일 때
// 컨트롤 자체를 렌더링하지 않으므로, 여기서 length를 따로 받아 0을 반환할 필요가 없다.
export function stepBackward(cursor: number): number {
  return Math.max(cursor - 1, 1);
}

export function isAtEnd(cursor: number, length: number): boolean {
  return cursor >= length;
}
```

- [ ] **Step 4: Run self-check to verify it passes**

Run: `npx tsx src/lib/playbackCursor.selfcheck.ts`
Expected: prints `OK: playbackCursor selfcheck passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/playbackCursor.ts src/lib/playbackCursor.selfcheck.ts
git commit -m "feat: add pure playback cursor module for replay feature"
```

---

### Task 2: `ReplayPlayback` component (reveal + play/pause + scrub + speed)

**Files:**
- Create: `src/components/ReplayPlayback.tsx`

**Interfaces:**
- Consumes: `clampCursor`, `stepForward`, `stepBackward`, `isAtEnd` from `../lib/playbackCursor` (Task 1); `MarketDataRow` type from `../lib/marketDataNormalize`; `ReplayChart` default export from `./ReplayChart` (already committed).
- Produces: `export default function ReplayPlayback({ rows }: { rows: MarketDataRow[] }): JSX.Element`. Consumed by a future dataset-picker screen (not part of this plan) the same way `ReplayChart` is: `<ReplayPlayback rows={await getMarketData(datasetId)} />`.

- [ ] **Step 1: Write `src/components/ReplayPlayback.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import ReplayChart from './ReplayChart';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import { clampCursor, stepForward, stepBackward, isAtEnd } from '../lib/playbackCursor';

// ponytail: 임의 기본값(약 한 달치 거래일 기준) - 데이터셋 맨 앞부터 보여줄 캔들 개수.
// 필요해지면 prop으로 노출.
const INITIAL_REVEAL = 30;

const SPEED_MS = { slow: 1000, normal: 500, fast: 200 } as const;
type Speed = keyof typeof SPEED_MS;
const SPEED_LABEL: Record<Speed, string> = { slow: '느리게', normal: '보통', fast: '빠르게' };

export default function ReplayPlayback({ rows }: { rows: MarketDataRow[] }) {
  const [cursor, setCursor] = useState(() => clampCursor(INITIAL_REVEAL, rows.length));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');

  useEffect(() => {
    setCursor(clampCursor(INITIAL_REVEAL, rows.length));
    setIsPlaying(false);
  }, [rows]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCursor((c) => {
        const next = stepForward(c, rows.length);
        if (isAtEnd(next, rows.length)) setIsPlaying(false);
        return next;
      });
    }, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isPlaying, speed, rows.length]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-slate-500 text-sm">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ReplayChart rows={rows.slice(0, cursor)} />

      <div className="flex flex-wrap items-center gap-2 px-2">
        <button onClick={() => setCursor(stepBackward(cursor))} className="p-2 text-slate-300" aria-label="이전 구간">
          <SkipBack size={18} />
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="p-2 text-slate-100"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => setCursor(stepForward(cursor, rows.length))}
          className="p-2 text-slate-300"
          aria-label="다음 구간"
        >
          <SkipForward size={18} />
        </button>
        <button
          onClick={() => {
            setCursor(clampCursor(INITIAL_REVEAL, rows.length));
            setIsPlaying(false);
          }}
          className="p-2 text-slate-300"
          aria-label="처음으로"
        >
          <RotateCcw size={18} />
        </button>

        <input
          type="range"
          min={1}
          max={rows.length}
          value={cursor}
          onChange={(e) => setCursor(clampCursor(Number(e.target.value), rows.length))}
          className="flex-1 min-w-[80px]"
        />

        <span className="text-xs text-slate-500 tabular-nums">
          {cursor} / {rows.length}
        </span>

        <div className="flex gap-1">
          {(Object.keys(SPEED_MS) as Speed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${speed === s ? 'bg-slate-700 text-slate-100' : 'text-slate-500'}`}
            >
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReplayPlayback.tsx
git commit -m "feat: add playback reveal/scrub controls wrapping ReplayChart"
```
