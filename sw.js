/* ==========================================================================
   SALEPERU.PE - SERVICE WORKER DE PWA (CACHÉ Y SOPORTE OFFLINE)
   ========================================================================== */

const CACHE_NAME = "saleperu-pwa-v16";

// Listado de archivos base a precachear
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./aliexpress.html",
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

// Evento de Intercepción (Fetch)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Solo interceptar protocolos HTTP/HTTPS (ignorar chrome-extension y similares)
  if (!url.protocol.startsWith("http")) return;

  // Evitar interceptar consultas directas a Google Sheets, streaming de música y Archive.org
  if (url.hostname.includes("docs.google.com") || 
      url.hostname.includes("archive.org") || 
      url.hostname.includes("streamtheworld.com") ||
      url.pathname.endsWith(".mp3") ||
      url.pathname.endsWith(".mp4")) {
    return;
  }

  // Estrategia Network-First para documentos HTML (Navegación)
  // Garantiza que cuando hay conexión se carguen las ofertas más frescas del servidor
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, intentar servir de la caché
          return caches.match(e.request).then((cachedResponse) => {
            // Si no está precacheado, retornar el 404 offline precacheado
            return cachedResponse || caches.match("./404.html");
          });
        })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate para activos locales y estáticos
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          // Solo cachear respuestas exitosas de nuestro dominio u origen seguro CORS
          if (networkResponse && networkResponse.status === 200 && 
              (networkResponse.type === "basic" || networkResponse.type === "cors")) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("[Service Worker] Falló recuperación de red para activo estático:", e.request.url, err);
        });

      // Retornar instantáneamente el recurso en caché si existe, de lo contrario esperar la red
      return cachedResponse || fetchPromise;
    })
  );
});
