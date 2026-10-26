const CACHE_NAME = "agendinha-v3";
const START_URL = "/inicio";
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isAuthPath(pathname) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-out") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/refresh")
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".css")
  );
}

function isAppShellRequest(request) {
  if (request.mode === "navigate" || request.destination === "document") {
    return true;
  }
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-State-Tree")
  );
}

function canCacheResponse(request, response) {
  if (!response || !response.ok) return false;
  const finalUrl = new URL(response.url || request.url);
  if (finalUrl.origin !== self.location.origin) return false;
  if (isAuthPath(finalUrl.pathname)) return false;
  return true;
}

function putInCache(request, response) {
  const copy = response.clone();
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => undefined);
}

async function matchCached(request) {
  const exact = await caches.match(request);
  if (exact) return exact;
  const url = new URL(request.url);
  const byPath = await caches.match(url.pathname);
  if (byPath) return byPath;
  if (url.pathname === "/") {
    return caches.match(START_URL);
  }
  return undefined;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (canCacheResponse(request, response)) {
      void putInCache(request, response);
    }
    return response;
  } catch {
    const cached = await matchCached(request);
    if (cached) return cached;
    if (request.mode === "navigate" || request.destination === "document") {
      const offline = await caches.match("/offline.html");
      if (offline) return offline;
    }
    return Response.error();
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.title || "Agendinha";
  const options = {
    body: payload.body || "Um cliente cancelou um horário.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "agendinha-notice",
    data: { url: payload.url || START_URL },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || START_URL,
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const windowClient of windows) {
          if (windowClient.url === target && "focus" in windowClient) {
            return windowClient.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isAuthPath(url.pathname)) return;

  if (isAppShellRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (!isStaticAsset(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            void putInCache(request, response);
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
