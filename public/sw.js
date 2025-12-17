const CACHE_NAME = 'promptgenie-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(error => {
      console.error('[Service Worker] Caching failed', error);
    })
  );
});
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline. Could not connect to the API.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(error => {
      console.error('[Service Worker] Fetch failed', error);
    })
  );
});
self.addEventListener('sync', (event) => {
  if (event.tag === 'promptgenie-sync') {
    console.log('[Service Worker] Firing sync event for promptgenie-sync');
    event.waitUntil(handleBackgroundSync());
  }
});
async function handleBackgroundSync() {
  console.log('[Service Worker] Starting background sync process.');
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('PromptGenieDatabase', 3);
    dbRequest.onerror = (event) => {
      console.error('[SW] IndexedDB error:', event);
      reject('DB open error');
    };
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        console.warn('[SW] syncQueue object store not found.');
        db.close();
        resolve();
        return;
      }
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getAllRequest = store.getAll();
      getAllRequest.onerror = (event) => {
        console.error('[SW] Error reading syncQueue:', event);
        db.close();
        reject('DB read error');
      };
      getAllRequest.onsuccess = () => {
        const queue = getAllRequest.result;
        if (!queue || queue.length === 0) {
          console.log('[SW] Sync queue is empty.');
          db.close();
          resolve();
          return;
        }
        console.log(`[SW] Found ${queue.length} items to sync.`);
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queue }),
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
          }
          return response.json();
        })
        .then(result => {
          if (result.success) {
            console.log('[SW] Sync successful, clearing queue.');
            const clearTransaction = db.transaction('syncQueue', 'readwrite');
            const clearStore = clearTransaction.objectStore('syncQueue');
            clearStore.clear();
            return new Promise((res) => {
              clearTransaction.oncomplete = () => {
                console.log('[SW] Sync queue cleared.');
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => client.postMessage({ type: 'sync-complete' }));
                });
                res();
              };
            });
          } else {
            throw new Error(result.error || 'Sync failed on server');
          }
        })
        .then(() => {
          db.close();
          resolve();
        })
        .catch(err => {
          console.error('[SW] Sync fetch failed:', err);
          db.close();
          reject(err); // This will cause the browser to retry the sync later
        });
      };
    };
  });
}