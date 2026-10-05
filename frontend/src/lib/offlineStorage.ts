/**
 * SOTERIA — Native Typed IndexedDB Offline Storage Engine.
 * Queues audio recordings, disaster photos, GPS coordinates, and distress reports
 * when cellular connectivity drops (dead-zones), enabling zero-data-loss synchronization.
 */

export interface OfflineDistressPayload {
  id?: number;
  uuid: string;
  timestamp: number;
  text: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  audioBlob?: Blob;
  imageBlob?: Blob;
  imageName?: string;
  status: "QUEUED" | "SYNCING" | "FAILED";
}

const DB_NAME = "soteria_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "pending_sos_queue";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        console.log("[SOTERIA IndexedDB] Initialized offline storage store:", STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Stores an emergency distress report locally into IndexedDB when offline.
 */
export async function storeOfflineDistress(
  data: Omit<OfflineDistressPayload, "id" | "timestamp" | "status">
): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record: OfflineDistressPayload = {
      ...data,
      timestamp: Date.now(),
      status: "QUEUED",
    };

    const request = store.add(record);

    request.onsuccess = () => {
      const insertedId = request.result as number;
      console.log(`[SOTERIA IndexedDB] Distress payload #${insertedId} queued offline.`);
      resolve(insertedId);
    };

    request.onerror = () => {
      console.error("[SOTERIA IndexedDB] Failed to save offline payload:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Fetches all pending distress reports waiting for network connectivity to sync.
 */
export async function getPendingDistressQueue(): Promise<OfflineDistressPayload[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("[SOTERIA IndexedDB] Unable to read queue:", err);
    return [];
  }
}

/**
 * Removes a successfully synchronized distress report from IndexedDB.
 */
export async function removeQueuedDistress(id: number): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[SOTERIA IndexedDB] Flushed synced item #${id} from offline storage.`);
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Returns the count of pending offline records in the queue.
 */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result || 0);
      };

      request.onerror = () => {
        resolve(0);
      };
    });
  } catch {
    return 0;
  }
}
