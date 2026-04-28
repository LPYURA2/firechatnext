const CACHE_NAME = 'firechat-v2-hybrid';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
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
  // Навигация — сеть первым, кэш как fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Firebase SDK — всегда сеть
  if (e.request.url.includes('firebasejs')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Остальное — кэш первым
  e.respondWith(
    caches.match(e.request).then(cached => 
      cached || fetch(e.request).catch(() => {
        if (e.request.destination === 'document') 
          return caches.match('/index.html');
      })
    )
  );
});
