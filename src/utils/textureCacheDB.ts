/**
 * IndexedDB Texture Cache Utility
 * Caches procedural canvas textures (grass, bump, asphalt, sky) in IndexedDB
 * to bypass CPU-heavy canvas rendering loops on mobile devices.
 */

const DB_NAME = 'RiverasPucheta_TextureCache_v1';
const STORE_NAME = 'textures';

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getCachedTextureDataUrl(key: string): Promise<string | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve((req.result as string) || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setCachedTextureDataUrl(key: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, key);
  } catch {
    // Ignore cache write errors
  }
}
