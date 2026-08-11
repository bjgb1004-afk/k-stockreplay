import { withStore } from './db';

export interface WatchlistItem {
  local_id: string;
  ticker: string;
  companyName: string;
  updated_at: string;
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
  };
  return withStore(STORE, 'readwrite', (store) => store.put(item));
}

export function removeFromWatchlist(ticker: string): Promise<undefined> {
  return withStore(STORE, 'readwrite', (store) => store.delete(ticker));
}
