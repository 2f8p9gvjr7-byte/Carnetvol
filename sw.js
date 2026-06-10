const CACHE_NAME = 'carnet-vol-v5';
const BASE = '/Carnetvol/';
const INDEX = '/Carnetvol/index.html';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all([
        cache.add(INDEX),
        cache.add(BASE)
      ].map(function(p) { return p.catch(function(){}); }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // Pour les requêtes de navigation, essayer aussi index.html
      if (!cached && e.request.mode === 'navigate') {
        cached = caches.match(INDEX);
      }
      if (cached) {
        fetch(e.request).then(function(r) {
          if (r && r.status === 200) {
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, r.clone()); });
          }
        }).catch(function(){});
        return cached;
      }
      return fetch(e.request).then(function(r) {
        if (r && r.status === 200) {
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, r.clone()); });
        }
        return r;
      }).catch(function() {
        return caches.match(INDEX);
      });
    })
  );
});
