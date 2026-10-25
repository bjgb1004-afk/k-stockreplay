// 종목별 최근 20거래일 종가 (scripts/fetch-prices.mjs가 매일 쌓는다).
// 파일이 아직 없으면 null - 화면은 추이 칸을 '—'로 둔다.
export interface PriceHistory {
  dates: string[]; // 오래된 날 -> 최신
  close: Record<string, (number | null)[]>;
}

let cache: Promise<PriceHistory | null> | null = null;

export function loadPriceHistory(): Promise<PriceHistory | null> {
  cache ??= fetch('/data/price-history.json')
    .then((r) => (r.ok ? (r.json() as Promise<PriceHistory>) : null))
    .catch(() => null);
  return cache;
}
