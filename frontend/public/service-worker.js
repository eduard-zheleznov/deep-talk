self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

    const clientsList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    await self.registration.unregister();

    clientsList.forEach((client) => {
      if (client.url.includes('/DeepTalk/')) {
        client.navigate(client.url);
      }
    });
  })());
});

