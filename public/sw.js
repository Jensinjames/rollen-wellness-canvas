// Service Worker for caching static assets
const CACHE_NAME = 'wellness-tracker-v2';

// Install event - no pre-caching to avoid stale HTML
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-only for navigation, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Skip API requests and Supabase calls
  if (url.pathname.startsWith('/rest/') || 
      url.pathname.startsWith('/auth/') ||
      url.hostname.includes('supabase')) {
    return;
  }

  // Network-only for HTML/navigation - never serve stale HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request));
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, images, fonts)
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
