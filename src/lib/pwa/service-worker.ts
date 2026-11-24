import {
  PWA_ASSET_PATHS,
  PWA_CACHE_NAME,
  PWA_OFFLINE_PATH,
  PWA_SHELL_PATHS,
} from "@/lib/pwa/shell";

export function buildServiceWorkerScript(): string {
  const shell = JSON.stringify(PWA_SHELL_PATHS);
  const precache = JSON.stringify([...PWA_SHELL_PATHS, ...PWA_ASSET_PATHS]);

  return `const CACHE = ${JSON.stringify(PWA_CACHE_NAME)};
const SHELL = ${shell};
const PRECACHE = ${precache};
const FALLBACK = ${JSON.stringify(PWA_OFFLINE_PATH)};

function remember(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then(function (cache) {
    return cache.put(request, copy);
  }).catch(function () {});
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).catch(function () {}).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf("/api/") === 0) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response.ok && !response.redirected && SHELL.indexOf(url.pathname) !== -1) {
          remember(request, response);
        }
        return response;
      }).catch(function () {
        return caches.open(CACHE).then(function (cache) {
          return cache.match(request).then(function (cached) {
            return cached || cache.match(FALLBACK).then(function (fallback) {
              return fallback || Response.error();
            });
          });
        });
      })
    );
    return;
  }

  if (url.pathname.indexOf("/_next/static/") === 0 || PRECACHE.indexOf(url.pathname) !== -1) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response.ok) remember(request, response);
          return response;
        });
      })
    );
  }
});
`;
}
