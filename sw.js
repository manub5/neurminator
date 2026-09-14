const CACHE_VERSION = "v4";
const CACHE_NAME = `neurminator-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/layout.css",
  "./css/games.css",
  "./js/app.js",
  "./js/router.js",
  "./js/games/index.js",
  "./js/games/span.js",
  "./js/games/span-grid.js",
  "./js/games/nback.js",
  "./js/games/stroop.js",
  "./js/games/reaction.js",
  "./js/core/scoring.js",
  "./js/core/difficulty.js",
  "./js/storage/local.js",
  "./js/views/home.js",
  "./js/views/game.js",
  "./js/views/history.js",
  "./js/views/settings.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isHtml =
    request.mode === "navigate" || request.destination === "document";

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
