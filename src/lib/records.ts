import type { PaintType, WorkEnvironment } from '@/types';

export interface PaintingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  paintType: PaintType;
  environment: WorkEnvironment;
  score: number;
  result: 'success' | 'ok' | 'failure';
  note: string;
  createdAt: string; // ISO
}

const DB_NAME = 'paintingdayfinder';
const STORE = 'records';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addRecord(
  data: Omit<PaintingRecord, 'id' | 'createdAt'>,
): Promise<PaintingRecord> {
  const db = await openDB();
  const record: PaintingRecord = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllRecords(): Promise<PaintingRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as PaintingRecord[]).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      );
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
