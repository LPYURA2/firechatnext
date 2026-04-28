const CACHE_NAME = 'firechat-v3';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Always fetch HTML from network first to get latest code
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Stale-while-revalidate для assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push notifications support
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'FireChat P2P', {
      body: data.body || 'Новое сообщение',
      icon: '/manifest.json',
      badge: '/manifest.json',
      tag: 'firechat-message',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Открыть' },
        { action: 'close', title: 'Закрыть' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || e.action === '') {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        if (windowClients.length > 0) {
          windowClients[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  }
});