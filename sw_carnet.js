const CACHE_NAME = 'carnet-vol-v1';
const ASSETS = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', function(e){e.waitUntil(caches.open(CACHE_NAME).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate', function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch', function(e){if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(function(r){if(r&&r.status===200){var c=r.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,c);});}return r;}).catch(function(){return caches.match(e.request);}));});
