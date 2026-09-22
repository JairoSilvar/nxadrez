/* Xadrez Pro 3D Service Worker */
const XP_SW_BUILD = 'xp-3d-v3-20260922';
const XP_CACHE = 'xadrez-pro-3d-' + XP_SW_BUILD;
const CORE = [
  "./models/model.glb","./models/staunton-set.glb",'./', './index.html', './manifest.json', './style.css', './game.js', './assets/toasty-sprite.png', './assets/toasty.mp3'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(XP_CACHE).then(cache => cache.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('xadrez-pro-3d-') && k !== XP_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        const copy = res.clone();
        caches.open(XP_CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(XP_CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
