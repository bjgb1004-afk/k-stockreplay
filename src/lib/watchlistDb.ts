import { withStore } from './db';

export type Market = 'KR' | 'US';

export interface WatchlistItem {
  local_id: string;
  ticker: string;
  companyName: string;
  updated_at: string;
  market: Market;
  thesis: string; // "왜 이 종목을 보는가" - 매수/관심 논리. 나중에 새 공시가 뜨면
  // 이 이유를 다시 떠올리게 하는 게 목적이라, 서버로 안 보내고 로컬에만 둔다.
}

const STORE = 'watchlist_items';

// 옛날 레코드(market 필드 도입 전)를 읽을 때 기본값을 채워준다. DB 스키마
// 버전업 없이 필드만 추가했기 때문에, 저장은 안 건드리고 읽는 쪽에서만 보정한다.
export function withMarketDefault(item: Omit<WatchlistItem, 'market'> & { market?: Market }): WatchlistItem {
  return { ...item, market: item.market ?? 'KR' };
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const items = await withStore<WatchlistItem[]>(STORE, 'readonly', (store) => store.getAll());
  return items.map(withMarketDefault);
}

export function addToWatchlist(ticker: string, companyName: string, market: Market = 'KR'): Promise<IDBValidKey> {
  const item: WatchlistItem = {
    local_id: crypto.randomUUID(),
    ticker,
    companyName,
    updated_at: new Date().toISOString(),
    market,
    thesis: '',
  };
  return withStore(STORE, 'readwrite', (store) => store.put(item));
}

export async function updateThesis(ticker: string, thesis: string): Promise<void> {
  const item = await withStore<WatchlistItem | undefined>(STORE, 'readonly', (store) => store.get(ticker));
  if (!item) return;
  await withStore(STORE, 'readwrite', (store) => store.put({ ...item, thesis }));
}

export function removeFromWatchlist(ticker: string): Promise<undefined> {
  return withStore(STORE, 'readwrite', (store) => store.delete(ticker));
}
