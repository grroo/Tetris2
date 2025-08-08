
const CACHE = 'tetrasw-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
