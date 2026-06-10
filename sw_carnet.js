const CACHE_NAME = 'carnet-vol-v3';

// Cache these files individually - do not fail if one is missing
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache each file individually - ignore failures (missing icons etc)
      return Promise.all(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.log('Cache skip:', url, err);
          });
        })
      );
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
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Cache first - guaranteed offline
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(function(r) {
          if (r && r.status === 200) {
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, r.clone()); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(e.request).then(function(r) {
        if (r && r.status === 200) {
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, r.clone()); });
        }
        return r;
      }).catch(function() {
        return new Response('Hors ligne', { status: 503 });
      });
    })
  );
});
