import type { RuntimeConfig } from "@/types";

export type OutboxEntry = {
  id: string;
  documentId: string;
  update: Uint8Array;
  seq: number;
  createdAt: number;
};

function getStorageConfig(config: RuntimeConfig) {
  return {
    dbName: config.storage.outboxDbName,
    storeName: config.storage.outboxStoreName,
    dbVersion: config.storage.outboxDbVersion,
  };
}

function openDb(config: RuntimeConfig): Promise<IDBDatabase> {
  const { dbName, storeName, dbVersion } = getStorageConfig(config);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("documentId", "documentId", { unique: false });
        store.createIndex("seq", "seq", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueUpdate(
  config: RuntimeConfig,
  documentId: string,
  update: Uint8Array,
  seq: number
): Promise<void> {
  const { storeName } = getStorageConfig(config);
  const db = await openDb(config);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put({
      id: `${documentId}-${seq}`,
      documentId,
      update,
      seq,
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listOutbox(
  config: RuntimeConfig,
  documentId: string
): Promise<OutboxEntry[]> {
  const { storeName } = getStorageConfig(config);
  const db = await openDb(config);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const index = tx.objectStore(storeName).index("documentId");
    const req = index.getAll(documentId);
    req.onsuccess = () => {
      const entries = (req.result as OutboxEntry[]).sort((a, b) => a.seq - b.seq);
      resolve(entries);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearOutbox(
  config: RuntimeConfig,
  documentId: string
): Promise<void> {
  const entries = await listOutbox(config, documentId);
  const { storeName } = getStorageConfig(config);
  const db = await openDb(config);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const entry of entries) {
      store.delete(entry.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
