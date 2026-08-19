const CACHE_NAME = "sg-inventory-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "https://unpkg.com/html5-qrcode",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of ASSETS) {
        try {
          const response = await fetch(url, {
            mode: "no-cors"
          });

          await cache.put(url, response);
        } catch (error) {
          console.warn("Could not cache:", url);
        }
      }

      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Never cache Apps Script API requests.
  if (url.hostname.includes("script.google.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }

          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
