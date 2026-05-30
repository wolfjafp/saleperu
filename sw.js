/* ==========================================================================
   SALEPERU.PE - SERVICE WORKER DE PWA (CACHÉ Y SOPORTE OFFLINE)
   ========================================================================== */

const CACHE_NAME = "saleperu-pwa-v1";

// Listado de archivos base a precachear
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./robots.txt",
  "./sitemap.xml",
  "./manifest.json",
  "./assets/css/main.css",
  "./assets/css/variables.css",
  "./assets/css/reset.css",
  "./assets/css/layout.css",
  "./assets/css/components.css",
  "./assets/css/animations.css",
  "./assets/js/app.js",
  "./assets/js/sheets.js",
  "./assets/js/stories.js",
  "./assets/js/feed.js",
  "./assets/js/ui.js",
  "./assets/js/seo.js"
];

// Evento de Instalación: Guarda archivos estáticos clave en caché
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Precaché de activos listo");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Fuerza la activación inmediata del SW
  self.skipWaiting();
});

// Evento de Activación: Limpieza de cachés antiguas para evitar problemas de versionado
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Eliminando caché vieja:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento de Intercepción (Fetch): Estrategia "Network First" con fallback a Caché
self.addEventListener("fetch", (e) => {
  // Solo interceptar peticiones del mismo origen (locales) o GETs
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Evitar interceptar consultas directas a Google Sheets para que carguen siempre en vivo
  if (url.hostname.includes("docs.google.com")) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Guardar copia fresca en caché
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // En caso de fallo de red, intentar cargar desde la caché
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en caché y es un documento HTML, retornar la raíz por defecto
          if (e.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
