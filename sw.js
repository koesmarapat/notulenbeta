const CACHE_NAME = 'enotulen-pro-v7.19';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './help.html',
  './mindmap.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js',
  'https://raw.githubusercontent.com/srpcom/enotulen/refs/heads/main/new%20logo%20rsud%202025%20kecil.png'
];

// 1. INSTALL EVENT - Caching aset statis awal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE EVENT - Membersihkan cache lama jika ada update versi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH EVENT - Strategi Jaringan
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. JANGAN CACHE API GOOGLE APPS SCRIPT
  // Request ke backend (script.google.com) harus selalu Network First
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // B. UNTUK ASET LAIN (HTML, CDN, Gambar) -> Stale-While-Revalidate
  // Cek cache dulu, tampilkan, sambil update di background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache dengan versi terbaru dari network
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      }).catch(() => {
          // Jika offline dan tidak ada di cache
          // Bisa return halaman offline custom jika ada
      });

      return cachedResponse || fetchPromise;
    })
  );
});
