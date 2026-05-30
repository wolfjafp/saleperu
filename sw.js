/* ==========================================================================
   SALEPERU.PE - SERVICE WORKER DE PWA (CACHÉ Y SOPORTE OFFLINE)
   ========================================================================== */

const CACHE_NAME = "saleperu-pwa-v5";

// Listado de archivos base a precachear
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./robots.txt",
  "./sitemap.xml",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/sheets.js",
  "./assets/js/stories.js",
  "./assets/js/feed.js",
  "./assets/js/ui.js",
  "./assets/js/seo.js",
  "./assets/js/music-player.js",
  "./quienes-somos.html",
  "./contacto.html",
  "./guia-ofertas.html",
  "./calendario-ofertas.html",
  "./mejores-horas.html",
  "./preguntas-frecuentes.html",
  "./politica-privacidad.html",
  "./terminos-condiciones.html",
  "./404.html"
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

// Evento de Intercepción (Fetch): Estrategia "Stale-While-Revalidate" para activos locales y estáticos
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Evitar interceptar consultas directas a Google Sheets para que carguen siempre en vivo
  if (url.hostname.includes("docs.google.com")) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Lanzar petición en red en segundo plano para refrescar caché
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("[Service Worker] Falló recuperación de red para:", e.request.url, err);
        });

      // Retornar instantáneamente el recurso en caché si existe (0ms latencia!),
      // de lo contrario esperar por la respuesta de red.
      return cachedResponse || fetchPromise;
    })
  );
});
