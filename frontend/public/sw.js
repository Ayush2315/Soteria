// SOTERIA Progressive Web App Service Worker
const CACHE_NAME = "soteria-pwa-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
];

// Install Event: Cache Core Shell Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SOTERIA SW] Pre-caching offline application shell...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SOTERIA SW] Non-fatal caching warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SOTERIA SW] Removing legacy cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-First with Offline Cache Fallback for navigation and static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Bypass API and WebSocket endpoints to let Axios / native Fetch and WS handle them directly
  if (request.url.includes("/api/") || request.url.includes("/ws/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response and cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        console.log("[SOTERIA SW] Network offline. Serving cached asset for:", request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Network offline - SOTERIA PWA Cache Active", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        });
      })
  );
});
