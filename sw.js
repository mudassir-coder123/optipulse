// OptiPulse service worker
// Purpose: (1) makes the app installable to a phone/tablet home screen,
// (2) caches the app shell so it loads instantly on repeat visits.
// This app always talks to Supabase over the network for real data - it does
// NOT work fully offline, it just makes the app itself open faster/reliably.

const CACHE_NAME = 'optipulse-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never cache Supabase API calls - always go live so data is fresh and secure.
  if (req.url.includes('supabase.co')) return;

  // For the app shell itself: try the network first (so updates show up),
  // fall back to cache if offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
