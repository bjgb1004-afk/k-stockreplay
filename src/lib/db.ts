// Single shared IndexedDB connection for all local-first stores (§2-3).
// One DB, one version, one upgrade path - two modules opening the same
// database at different versions independently is a VersionError waiting
// to happen, so every store's schema lives here.
const DB_NAME = 'kstockreplay';
const DB_VERSION = 5;

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
      if (!db.objectStoreNames.contains('disclosures')) {
        // 서버(today.json)는 오늘자만 주고 잊는다(§2-3 무상태) - 방문할 때마다
        // 받은 걸 여기 쌓아서, 서버 저장 없이 브라우저에만 진짜 히스토리가 생기게 한다.
        const store = db.createObjectStore('disclosures', { keyPath: 'id' });
        store.createIndex('ticker', 'ticker');
        store.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('datasets')) {
        // 리플레이용 업로드 파일 1건당 메타데이터 1행 (§3 datasets).
        db.createObjectStore('datasets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('market_data')) {
        // OHLCV 행 1건당 1레코드. datasetId로만 조회하므로 자동증가 키 + 인덱스만 있으면 된다.
        const store = db.createObjectStore('market_data', { autoIncrement: true });
        store.createIndex('datasetId', 'datasetId');
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
