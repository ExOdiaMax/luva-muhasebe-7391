// Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır; internet varsa her zaman güncel sürüm alınır.
const CACHE_NAME = 'luva-cave-20261027-204955';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'excel-import.js',
  'excel-export.js',
  'records-tools.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'vendor/sql-wasm.js',
  'vendor/sql-wasm.wasm',
  'vendor/jspdf.umd.min.js',
  'vendor/jspdf.plugin.autotable.min.js',
  'vendor/exceljs.min.js',
  'vendor/NotoSans-Regular.ttf',
  'vendor/NotoSans-Bold.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match('index.html')))
  );
});