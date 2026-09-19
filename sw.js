const CACHE_NAME = "klb-finance-v17";
const APP_FILES = ["/", "/index.html", "/config.js", "/manifest.json", "/favicon.ico", "/icons/logo-transparent.png", "/icons/favicon-32.png", "/icons/apple-touch-icon.png", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-192.png", "/icons/icon-maskable-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("push", event => {
  let data = { title: "KLB Finance", body: "Novo item na sacola", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      data: { url: data.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  const absolute = new URL(target, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (!client.url.startsWith(self.location.origin)) continue;
        if ("focus" in client) client.focus();
        if ("navigate" in client) return client.navigate(absolute);
        client.postMessage({ type: "klb-navigate", url: absolute });
        return;
      }
      if (clients.openWindow) return clients.openWindow(absolute);
    })
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && request.mode === "navigate") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("/index.html", copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || (request.mode === "navigate" ? caches.match("/index.html") : Response.error())))
  );
});
