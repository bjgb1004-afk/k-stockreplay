export interface WatchlistItem {
  local_id: string;
  ticker: string;
  companyName: string;
  updated_at: string;
}

const DB_NAME = 'kstockreplay';
const STORE = 'watchlist_items';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'ticker' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function getWatchlist(): Promise<WatchlistItem[]> {
  return withStore('readonly', (store) => store.getAll());
}

export function addToWatchlist(ticker: string, companyName: string): Promise<IDBValidKey> {
  const item: WatchlistItem = {
    local_id: crypto.randomUUID(),
    ticker,
    companyName,
    updated_at: new Date().toISOString(),
  };
  return withStore('readwrite', (store) => store.put(item));
}

export function removeFromWatchlist(ticker: string): Promise<undefined> {
  return withStore('readwrite', (store) => store.delete(ticker));
}
