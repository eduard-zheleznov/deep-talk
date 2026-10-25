const CACHE_VERSION = 'pro-obshenie-v2';
const APP_CACHE = `${CACHE_VERSION}-app`;
const APP_ROOT = '/DeepTalk/';
const CORE_ASSETS = [
  APP_ROOT,
  `${APP_ROOT}asset-manifest.json`,
  `${APP_ROOT}manifest.json`,
  `${APP_ROOT}favicon.svg`,
  `${APP_ROOT}icon-192.png`,
  `${APP_ROOT}icon-512.png`,
];

const cacheBuildAssets = async (cache) => {
  const response = await fetch(`${APP_ROOT}asset-manifest.json`, { cache: 'no-store' });
  if (!response.ok) return;
  const manifest = await response.json();
  const files = Object.values(manifest.files || {})
    .filter((path) => typeof path === 'string' && path.startsWith(APP_ROOT) && !path.endsWith('.map'));
  await cache.addAll([...new Set(files)]);
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(CORE_ASSETS);
    await cacheBuildAssets(cache).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('pro-obshenie-') && name !== APP_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

const offlineNavigation = async (request) => {
  try {
    const response = await fetch(request);
    const cache = await caches.open(APP_CACHE);
    await cache.put(APP_ROOT, response.clone());
    return response;
  } catch (error) {
    return (await caches.match(APP_ROOT)) || Response.error();
  }
};

const staticAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(APP_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;
  if (url.pathname.startsWith(`${APP_ROOT}api/`)) return;

  if (request.mode === 'navigate') {
    event.respondWith(offlineNavigation(request));
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination) || url.pathname.endsWith('.json')) {
    event.respondWith(staticAsset(request));
  }
});

