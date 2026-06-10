const CACHE_NAME = 'carnet-vol-v4';

self.addEventListener('install', function(e) {
  // Cache ONLY index.html - the most important file
  e.waitUntil(
    fetch('./index.html').then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.put('./index.html', response);
      });
    }).then(function() {
      return self.skipWaiting();
    }).catch(function(err) {
      console.log('Install error:', err);
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

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  
  var url = e.request.url;
  
  // For navigate requests (opening the app) - cache first
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function(cached) {
        if (cached) {
          // Update cache in background
          fetch(e.request).then(function(r) {
            if (r && r.status === 200) {
              caches.open(CACHE_NAME).then(function(c) {
                c.put('./index.html', r);
              });
            }
          }).catch(function() {});
          return cached;
        }
        return fetch(e.request).then(function(r) {
          if (r && r.status === 200) {
            caches.open(CACHE_NAME).then(function(c) {
              c.put('./index.html', r.clone());
            });
          }
          return r;
        });
      })
    );
    return;
  }
  
  // For all other requests - cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(r) {
        if (r && r.status === 200) {
          var clone = r.clone();
          caches.open(CACHE_NAME).then(function(c) {
            c.put(e.request, clone);
          });
        }
        return r;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
