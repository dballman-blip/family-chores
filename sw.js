// Family Chores service worker. Bump VERSION (and APP_VERSION in index.html) on each release.
const VERSION = 'fc-v3';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {            // app shell: network first, cache fallback (offline)
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || caches.match('./index.html'))));
  } else if (u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/')) {   // pinned libraries (supabase-js, QR): cache first so the app opens offline
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(r, c)); return res; })));
  } // everything else (Supabase API / realtime traffic) passes through untouched
});
