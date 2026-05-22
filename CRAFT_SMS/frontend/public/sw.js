const CACHE_NAME = 'craft-sms-cache-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Bypass all cross-origin requests (e.g. Supabase auth, external APIs)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Bypass non-GET requests (POST, PUT, DELETE shouldn't be handled by Cache API)
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first for internal API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Background Sync — fires when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncActions());
  }
});

/**
 * Reads pending mutations from IndexedDB (CraftSMS_Offline database)
 * and posts them to the API. Deletes successfully synced entries.
 */
async function syncActions() {
  let idb;
  try {
    idb = await openIDB('CraftSMS_Offline', 1);
  } catch (err) {
    console.error('[SW] Could not open IndexedDB:', err);
    return;
  }

  let mutations = [];
  try {
    mutations = await idbGetAll(idb, 'mutations');
  } catch (err) {
    console.error('[SW] Could not read mutations store:', err);
    return;
  }

  for (const mutation of mutations) {
    if (!mutation || mutation.lastError?.startsWith('CONFLICT')) continue;

    const { _endpoint, _method, _timestamp, _syncTaskId, ...payload } = mutation.data || {};
    const endpoint = _endpoint;
    const method = _method || 'POST';

    if (!endpoint) continue;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, client_timestamp: _timestamp }),
      });

      if (res.ok) {
        await idbDelete(idb, 'mutations', mutation.id);
        console.log('[SW] Synced mutation id:', mutation.id);
      } else if (res.status === 409) {
        mutation.lastError = `CONFLICT: HTTP 409 from server.`;
        await idbPut(idb, 'mutations', mutation);
      }
    } catch (err) {
      console.error('[SW] Failed to sync mutation', mutation.id, ':', err);
    }
  }
}

// ─── Minimal native IndexedDB helpers ────────────────────────────────────────

function openIDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // Note: Dexie creates the object store; we just open the existing DB
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function idbGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
