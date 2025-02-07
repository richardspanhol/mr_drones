const CACHE_NAME = 'mr-drones-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/home.html',
  '/pages/servicos.html',
  '/pages/clientes.html',
  '/pages/saidas.html',
  '/pages/relatorios.html',
  '/css/style.css',
  '/js/auth.js',
  '/js/menu.js',
  '/js/app.js',
  '/js/servicos.js',
  '/js/clientes.js',
  '/js/saidas.js',
  '/js/relatorios.js',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/apple-touch-icon.png',
  '/images/favicon.ico',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 