// Single shared IndexedDB connection for all local-first stores (§2-3).
// One DB, one version, one upgrade path - two modules opening the same
// database at different versions independently is a VersionError waiting
// to happen, so every store's schema lives here.
const DB_NAME = 'kstockreplay';
const DB_VERSION = 3;

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('watchlist_items')) {
        db.createObjectStore('watchlist_items', { keyPath: 'ticker' });
      }
      if (!db.objectStoreNames.contains('read_alerts')) {
        db.createObjectStore('read_alerts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('streak')) {
        db.createObjectStore('streak', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
