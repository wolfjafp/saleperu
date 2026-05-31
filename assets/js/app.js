/* ==========================================================================
   SALEPERU.PE - ORQUESTADOR PRINCIPAL E INICIALIZADOR DE LA PLATAFORMA
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 SALEPERU.PE - Inicializando plataforma premium...");
  
  // 1. Mostrar esqueletos de carga de forma inmediata en el feed y en las historias
  renderInitialSkeletons();

  // 2. Cargar los datos dinámicos (Google Sheets + Caché + Fallback)
  const appData = await loadAppData();
  
  // 3. Pintar componentes y apagar cargadores
  if (appData) {
    // A. Inicializar Historias
    initStoriesSystem(appData.stories);
    
    // B. Inicializar Feed de Ofertas
    initFeedSystem(appData.offers);
    
    // C. Cargar esquemas de Datos Estructurados para SEO en Google
    injectGlobalWebsiteSchema();
    
    // D. Inicializar Enrutador de Hash y SEO dinámico
    initRouterAndSeo();
  } else {
    showErrorState();
  }

  // 4. Registrar Service Worker para PWA Offline de alta velocidad
  registerServiceWorker();
});

/**
 * Pinta skeletons en la pantalla de carga para simular rendimiento instantáneo
 */
function renderInitialSkeletons() {
  // Skeletons del Feed
  renderSkeletonLoading(8);

  // Skeletons de la barra de Historias
  const storiesContainer = document.getElementById("stories-container");
  if (storiesContainer) {
    // Si ya hay skeletons estáticos pre-renderizados en el HTML, los respetamos para evitar doble renderizado y CLS
    if (storiesContainer.querySelector(".story-circle-item")) return;
    
    storiesContainer.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement("div");
      sk.className = "story-circle-item";
      sk.innerHTML = `
        <div class="story-ring" style="background: var(--border-color)">
          <div class="skeleton skeleton-story-avatar"></div>
        </div>
        <div class="skeleton skeleton-story-text"></div>
      `;
      storiesContainer.appendChild(sk);
    }
  }
}

/**
 * Muestra una pantalla de error si ocurre un fallo catastrófico al cargar
 */
function showErrorState() {
  const grid = document.getElementById("feed-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Error al conectar con la red</h3>
        <p>No pudimos cargar las ofertas. Por favor verifica tu conexión y recarga la página.</p>
        <button onclick="window.location.reload()" class="filter-pill active" style="margin-top: 16px; display: inline-block;">Reintentar</button>
      </div>
    `;
  }
}

/**
 * Registra el Service Worker en producción para caché offline compatible con PWA
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // Registra el service worker ubicado en la raíz del proyecto
      navigator.serviceWorker.register("./sw.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito en el ámbito:", registration.scope);
        })
        .catch((err) => {
          console.warn("Fallo al registrar el Service Worker:", err);
        });
    });
  }
}
