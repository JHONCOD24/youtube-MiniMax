export interface KbDocRecord {
  id: string;
  projectId: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
  text: string;
}

const DB_NAME = 'ynl-kb';
const DB_VERSION = 1;
const STORE = 'docs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('projectId', 'projectId', { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  }));
}

export function kbPut(doc: KbDocRecord): Promise<void> {
  return withStore('readwrite', (store) => store.put(doc)).then(() => undefined);
}

export function kbDelete(id: string): Promise<void> {
  return withStore('readwrite', (store) => store.delete(id)).then(() => undefined);
}

export function kbListByProject(projectId: string): Promise<KbDocRecord[]> {
  return openDb().then((db) => new Promise<KbDocRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const idx = store.index('projectId');
    const req = idx.getAll(projectId);
    req.onsuccess = () => resolve((req.result as KbDocRecord[]) || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  }));
}

export async function kbTotalBytes(projectId: string): Promise<number> {
  const docs = await kbListByProject(projectId);
  return docs.reduce((s, d) => s + (d.size || 0), 0);
}
