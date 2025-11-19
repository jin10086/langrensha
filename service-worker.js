const CACHE_NAME = 'wolfpack-v1';

// Assets that must be cached immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './index.tsx'
];

// External CDNs that we want to try to cache at runtime
const CDN_DOMAINS = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn-icons-png.flaticon.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignore AI API calls (always network)
  if (url.pathname.includes('/chat/completions')) {
    return;
  }

  // 2. Stale-while-revalidate strategy for most resources
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Only cache valid responses (including opaque ones from CDNs)
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              
              // Check if it's a local file or an allowed CDN
              const isLocal = url.origin === self.location.origin;
              const isAllowedCDN = CDN_DOMAINS.some(domain => url.hostname.includes(domain));

              if (isLocal || isAllowedCDN) {
                cache.put(event.request, networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed
            // If it's an API call or navigation that failed, we might return a fallback here if needed
            // For now, just let it fail if not in cache
          });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});