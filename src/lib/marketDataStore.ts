import { openDb, withStore } from './db';
import type { MarketDataRow } from './marketDataNormalize';

export interface Dataset {
  id: string;
  fileName: string;
  symbol: string;
  market: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  rowCount: number;
  createdAt: string;
}

interface StoredMarketDataRow extends MarketDataRow {
  datasetId: string;
}

export async function saveDataset(
  meta: { fileName: string; symbol: string; market: string; timeframe: string },
  rows: MarketDataRow[],
): Promise<string> {
  if (rows.length === 0) {
    throw new Error('저장할 데이터가 없습니다.');
  }

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const dataset: Dataset = {
    id: crypto.randomUUID(),
    fileName: meta.fileName,
    symbol: meta.symbol,
    market: meta.market,
    timeframe: meta.timeframe,
    startDate: sorted[0].date,
    endDate: sorted.at(-1)!.date,
    rowCount: sorted.length,
    createdAt: new Date().toISOString(),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['datasets', 'market_data'], 'readwrite');
    tx.objectStore('datasets').put(dataset);
    const marketDataStore = tx.objectStore('market_data');
    for (const row of sorted) {
      const stored: StoredMarketDataRow = { ...row, datasetId: dataset.id };
      marketDataStore.add(stored);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('저장이 중단되었습니다.'));
  });

  return dataset.id;
}

export function listDatasets(): Promise<Dataset[]> {
  return withStore('datasets', 'readonly', (store) => store.getAll());
}

// Returns rows sorted ascending by date (guaranteed by saveDataset's insert order).
export function getMarketData(datasetId: string): Promise<MarketDataRow[]> {
  return withStore('market_data', 'readonly', (store) =>
    store.index('datasetId').getAll(datasetId),
  );
}

export async function deleteDataset(datasetId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['datasets', 'market_data'], 'readwrite');
    tx.objectStore('datasets').delete(datasetId);
    const cursorReq = tx.objectStore('market_data').index('datasetId').openCursor(IDBKeyRange.only(datasetId));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('삭제가 중단되었습니다.'));
  });
}
