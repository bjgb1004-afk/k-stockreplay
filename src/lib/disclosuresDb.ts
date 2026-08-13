import { openDb } from './db';

export type DisclosureType = 'DISCLOSURE' | 'CONTRACT' | 'DIVIDEND' | 'MANAGEMENT_CHANGE';
export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

export interface DisclosureRecord {
  id: string; // rcept_no - globally unique, doubles as the store's keyPath
  ticker: string;
  companyName: string;
  type: DisclosureType;
  title: string;
  date: string; // YYYY-MM-DD, the today.json date this was fetched under
  sentiment: Sentiment;
  meaning: string;
}

const STORE = 'disclosures';
const RETENTION_DAYS = 90;

// TodayScreen이 오늘자 today.json을 받을 때마다 호출 - 서버가 표시 목적으로 잘라
// 보내는 60건짜리 오늘 피드를 그대로 누적한다. 매일 방문할수록 로컬 히스토리가
// 넓어지는 구조라, 서버 컷오프는 "표시 제한"이 아니라 "일일 페이로드 제한"이 된다.
export async function ingestToday(items: DisclosureRecord[]): Promise<void> {
  if (items.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const item of items) store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getHistoryForTicker(ticker: string): Promise<DisclosureRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('ticker').getAll(ticker);
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)));
    req.onerror = () => reject(req.error);
  });
}

// useAlerts(§6-7 침묵 종목 서프라이즈)가 워치리스트 전체를 훑을 때 쓴다 - 워치리스트
// 필터링은 호출 쪽에서 하므로 여기선 그냥 전부 반환.
export function getAllHistory(): Promise<DisclosureRecord[]> {
  const db = openDb();
  return db.then(
    (d) =>
      new Promise((resolve, reject) => {
        const req = d.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ponytail: 단순 날짜 컷오프. IndexedDB 용량이 실제로 문제되면 그때 압축/집계로 승격.
export async function pruneOld(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString().slice(0, 10);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const range = IDBKeyRange.upperBound(cutoff, true);
    const req = tx.objectStore(STORE).index('date').openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
