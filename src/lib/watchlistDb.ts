import { withStore } from './db';

export interface WatchlistItem {
  local_id: string;
  ticker: string;
  companyName: string;
  updated_at: string;
  thesis: string; // "왜 이 종목을 보는가" - 매수/관심 논리. 나중에 새 공시가 뜨면
  // 이 이유를 다시 떠올리게 하는 게 목적이라, 서버로 안 보내고 로컬에만 둔다.
}

const STORE = 'watchlist_items';

export function getWatchlist(): Promise<WatchlistItem[]> {
  return withStore(STORE, 'readonly', (store) => store.getAll());
}

export function addToWatchlist(ticker: string, companyName: string): Promise<IDBValidKey> {
  const item: WatchlistItem = {
    local_id: crypto.randomUUID(),
    ticker,
    companyName,
    updated_at: new Date().toISOString(),
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
