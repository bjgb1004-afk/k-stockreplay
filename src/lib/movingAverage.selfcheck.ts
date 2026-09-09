import assert from 'node:assert/strict';
import { computeSMA } from './movingAverage';
import type { MarketDataRow } from './marketDataNormalize';

const row = (date: string, close: number): MarketDataRow => ({
  date, open: close, high: close, low: close, close, volume: 0,
});

// 데이터보다 긴 기간 -> 빈 배열
assert.deepEqual(computeSMA([row('2026-01-01', 100)], 5), []);

// 정확히 기간만큼 -> 값 1개 (평균)
const exact = computeSMA([row('2026-01-01', 10), row('2026-01-02', 20)], 2);
assert.equal(exact.length, 1);
assert.equal(exact[0].value, 15);
assert.equal(exact[0].time, '2026-01-02');

// 기간보다 긴 데이터 -> 앞쪽 (period-1)개는 건너뛰고, 슬라이딩 윈도우로 계산
const rows = [row('2026-01-01', 10), row('2026-01-02', 20), row('2026-01-03', 30), row('2026-01-04', 40)];
const sma2 = computeSMA(rows, 2);
assert.deepEqual(sma2.map((p) => p.value), [15, 25, 35]);
assert.deepEqual(sma2.map((p) => p.time), ['2026-01-02', '2026-01-03', '2026-01-04']);

console.log('OK: movingAverage selfcheck passed');
