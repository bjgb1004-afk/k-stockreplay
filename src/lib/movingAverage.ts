import type { MarketDataRow } from './marketDataNormalize';

export interface MAPoint {
  time: string;
  value: number;
}

// 단순이동평균(SMA). 앞쪽 period-1개는 평균 낼 데이터가 모자라서 건너뛴다.
export function computeSMA(rows: MarketDataRow[], period: number): MAPoint[] {
  if (period <= 0) return [];
  const points: MAPoint[] = [];
  let sum = 0;
  for (let i = 0; i < rows.length; i++) {
    sum += rows[i].close;
    if (i >= period) sum -= rows[i - period].close;
    if (i >= period - 1) points.push({ time: rows[i].date, value: sum / period });
  }
  return points;
}
