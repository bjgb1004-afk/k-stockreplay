import { withStore } from './db';

const STORE = 'read_alerts';

export async function getReadIds(): Promise<Set<string>> {
  const rows = await withStore<{ id: string }[]>(STORE, 'readonly', (store) => store.getAll());
  return new Set(rows.map((r) => r.id));
}

export function markRead(id: string): Promise<IDBValidKey> {
  return withStore(STORE, 'readwrite', (store) => store.put({ id }));
}
