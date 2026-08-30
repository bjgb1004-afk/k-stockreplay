import { openDb, withStore } from './db';
import type { ReplayTrade } from './replayPosition';

export async function startSession(datasetId: string): Promise<string> {
  const id = crypto.randomUUID();
  await withStore('replay_sessions', 'readwrite', (store) =>
    store.add({ id, datasetId, createdAt: new Date().toISOString() }),
  );
  return id;
}

export async function recordTrade(trade: Omit<ReplayTrade, 'id'>): Promise<ReplayTrade> {
  const record: ReplayTrade = { ...trade, id: crypto.randomUUID() };
  await withStore('replay_trades', 'readwrite', (store) => store.add(record));
  return record;
}

export async function getSessionTrades(sessionId: string): Promise<ReplayTrade[]> {
  const db = await openDb();
  const trades = await new Promise<ReplayTrade[]>((resolve, reject) => {
    const tx = db.transaction('replay_trades', 'readonly');
    const req = tx.objectStore('replay_trades').index('sessionId').getAll(sessionId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return trades.sort((a, b) => a.cursor - b.cursor);
}
