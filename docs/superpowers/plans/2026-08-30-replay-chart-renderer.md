# Replay Chart Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a `MarketDataRow[]` (the output of the storage stage's `getMarketData`) as a candlestick + volume chart with pan, zoom, and a crosshair — the fourth stage of the local stock-replay pipeline ("여기부터 제품의 가치가 눈에 보이기 시작한다", `전체디자인.txt` §4).

**Architecture:** One presentational React component, `src/components/ReplayChart.tsx`, wrapping `lightweight-charts` (TradingView's purpose-built, dependency-free charting library — candlestick, volume-as-histogram, pan/zoom, and crosshair are all built-in with zero extra code, which is why this plan adds it as a dependency rather than hand-rolling canvas rendering). The component takes `rows: MarketDataRow[]` as a prop and does not read IndexedDB itself — it must stay a pure "given these rows, draw this" component so the later Playback stage (§5) can hand it a truncated/sliced array (hiding future data) without any further changes to this file.

**Tech Stack:** React 19 (existing), TypeScript, `lightweight-charts@5.2.1` (new dependency — Apache-2.0 license, zero further dependencies of its own, confirmed via `npm view lightweight-charts version license`).

**Spec:** `전체디자인.txt` §4 (Chart Renderer), repo parent folder `kstock/`. Minimum feature list from that section, verbatim: 캔들(candles), 거래량(volume), 날짜축(date axis), 확대/축소(zoom), 좌우 이동(pan), 십자선(crosshair) — "처음부터 보조지표 20개를 넣을 필요는 없습니다" (no need for 20 indicators from day one).

## Global Constraints

- New dependency `lightweight-charts@5.2.1` — pin this exact version (do not use `^` or `latest`).
- The component is presentational only: `{ rows: MarketDataRow[] }` in, chart out. It must not import anything from `src/lib/marketDataStore.ts` or `src/lib/db.ts`.
- Flat `src/components/*.tsx` file, matching the existing convention (`WatchlistScreen.tsx`, etc.): functional component, default export, Tailwind for any surrounding layout.
- Reuse the existing dark theme palette already used in `src/App.tsx` (`#0f172a`/slate-900 background family, `#cbd5e1`/slate-300 text, `#1e293b`/slate-800 gridlines) — do not invent new UI colors. The candle/volume up/down colors (`#26a69a` / `#ef5350`) are the library's own standard convention and are the one exception.
- Do **not** wire this component into `src/App.tsx`'s `SCREENS` map or bottom nav in this plan — there is no upload UI yet to populate a dataset, so there is nothing yet for a user to reach it from. This repo already has a precedent for exactly this situation: `ThemeTreeScreen.tsx` and `ValueChainScreen.tsx` exist as files but are deliberately left out of `SCREENS`/nav, per the comment directly above the `Tab` type in `src/App.tsx` ("데이터 소스가 생기기 전까진 화면 파일만 남겨두고 숨긴다"). Follow that same pattern here.
- No dataset-picker UI, no manual column-mapping UI, no chart toolbar/settings panel — out of scope for this plan.
- No test framework — this repo has none, and a canvas-rendered chart isn't unit-testable without adding one (out of scope). Verification is `npx tsc --noEmit` for the implementer; a human/browser visual check happens separately as a follow-up step outside this plan's task loop (per this project's convention for UI changes), using a temporary, uncommitted local harness — not a task in this plan.

---

### Task 1: `ReplayChart` component (candlestick + volume + pan/zoom/crosshair)

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)
- Create: `src/components/ReplayChart.tsx`

**Interfaces:**
- Consumes: `MarketDataRow` type from `src/lib/marketDataNormalize.ts` (`{ date: string; open: number; high: number; low: number; close: number; volume: number }`, `date` guaranteed `YYYY-MM-DD`).
- Produces: `export default function ReplayChart({ rows }: { rows: MarketDataRow[] }): JSX.Element` — renders nothing but an empty-state message if `rows` is empty. Consumed by a future dataset-picker screen (not part of this plan) as `<ReplayChart rows={await getMarketData(datasetId)} />`, and later by the Playback stage as `<ReplayChart rows={allRows.slice(0, cursor)} />`.

- [ ] **Step 1: Install the dependency**

Run: `npm install lightweight-charts@5.2.1`
Expected: `package.json` gains `"lightweight-charts": "5.2.1"` under `dependencies`; `package-lock.json` updates; exit code 0.

- [ ] **Step 2: Write `src/components/ReplayChart.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import type { MarketDataRow } from '../lib/marketDataNormalize';

const UP_COLOR = '#26a69a';
const DOWN_COLOR = '#ef5350';

export default function ReplayChart({ rows }: { rows: MarketDataRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || rows.length === 0) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: container.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });
    candleSeries.setData(
      rows.map((row) => ({ time: row.date, open: row.open, high: row.high, low: row.low, close: row.close }))
    );

    // 별도 priceScaleId('volume')를 주면 캔들 스케일과 겹치지 않으면서도
    // 우측에 별도 축을 그리지 않는 오버레이가 된다 (라이브러리 공식 거래량 예제 패턴).
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: UP_COLOR,
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(
      rows.map((row) => ({
        time: row.date,
        value: row.volume,
        color: row.close >= row.open ? UP_COLOR : DOWN_COLOR,
      }))
    );

    chart.timeScale().fitContent();

    function handleResize() {
      chart.applyOptions({ width: container!.clientWidth });
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-slate-500 text-sm">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-[400px]" />;
}
```

Pan (mouse-wheel scroll, click-drag, touch-drag), zoom (mouse-wheel scale, pinch), and the crosshair all default to enabled in `lightweight-charts` — no extra options needed for those three requirements from the spec list.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/ReplayChart.tsx
git commit -m "feat: add candlestick+volume chart renderer for replay feature"
```
