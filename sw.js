const CACHE_NAME = 'firechat-v3';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE_NAME).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    return e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(() => e.request.destination === 'image' ? caches.match('/index.html') : null)));
});

self.addEventListener('sync', e => {
  if (e.tag === 'firechat-send') {
    e.waitUntil(clients.matchAll({type:'window'}).then(cl => cl.forEach(c => c.postMessage({type:'SYNC_REQUESTED'}))));
  }
});

self.addEventListener('push', e => {
  const d = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(d.title || 'FireChat', {body: d.body || 'Новое сообщение', icon: '/manifest.json', badge: '/manifest.json', tag: 'firechat-msg', renotify: true}));
});
