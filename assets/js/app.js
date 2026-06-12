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
    const isAliExpressPage = window.location.pathname.includes("aliexpress.html");
    if (isAliExpressPage) {
      const aliexpressOffers = appData.offers.filter(o => o.store && o.store.toLowerCase() === "aliexpress");
      initFeedSystem(aliexpressOffers);

      // Vincular interactividad al botón "Los Más Vendidos" en el banner de AliExpress
      const bestSellersBtn = document.getElementById("feat-best-sellers");
      if (bestSellersBtn) {
        bestSellersBtn.addEventListener("click", () => {
          const sortSelect = document.getElementById("sort-select");
          if (sortSelect) {
            sortSelect.value = "hot"; // Cambiar ordenamiento a Calientes
            // Disparar evento de cambio programado
            const event = new Event("change", { bubbles: true });
            sortSelect.dispatchEvent(event);
          }
        });
      }
    } else {
      initFeedSystem(appData.offers);
      setupStoreFilters();
      setupAliExpressBannerToggle();
    }
    
    // C. Cargar esquemas de Datos Estructurados para SEO y Enrutador de forma diferida (libera main thread)
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => {
        injectGlobalWebsiteSchema();
        initRouterAndSeo();
      });
    } else {
      setTimeout(() => {
        injectGlobalWebsiteSchema();
        initRouterAndSeo();
      }, 100);
    }
  } else {
    showErrorState();
  }

  // 4. Registrar Service Worker para PWA Offline (diferido)
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => registerServiceWorker());
  } else {
    setTimeout(() => registerServiceWorker(), 1000);
  }
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

/**
 * Configura los filtros de tiendas nacionales interactivas (pills)
 * Integra búsqueda cruzada utilizando currentStoreFilter en vez de sobreescribir searchQuery
 */
function setupStoreFilters() {
  const storePills = document.querySelectorAll(".store-pill");
  if (storePills.length === 0) return;

  storePills.forEach(pill => {
    pill.addEventListener("click", () => {
      // Activar clase active en la pastilla seleccionada
      storePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      
      const storeName = pill.dataset.store.toLowerCase().trim();
      currentStoreFilter = storeName;
      
      // Aplicar filtros de forma combinada (categoría + tienda + texto buscador)
      applyFiltersAndSort();
      
      // Hacer un scroll suave al feed de ofertas
      const feedGrid = document.getElementById("feed-grid");
      if (feedGrid) {
        feedGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/**
 * Configura el colapsado/expandido del banner de AliExpress en la portada con persistencia
 */
function setupAliExpressBannerToggle() {
  const banner = document.querySelector(".aliexpress-home-banner");
  const toggleBtn = document.getElementById("aliexpress-banner-toggle");
  if (!banner || !toggleBtn) return;

  // Cargar estado inicial persistido en localStorage
  const isCollapsed = localStorage.getItem("aliexpress_banner_collapsed") === "true";
  if (isCollapsed) {
    banner.classList.add("collapsed");
    updateToggleIcon(true);
  }

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Evitar navegar a aliexpress.html al hacer clic en el botón de alternancia
    e.preventDefault();

    const willCollapse = !banner.classList.contains("collapsed");
    banner.classList.toggle("collapsed", willCollapse);
    localStorage.setItem("aliexpress_banner_collapsed", willCollapse ? "true" : "false");
    updateToggleIcon(willCollapse);
  });

  function updateToggleIcon(collapsed) {
    if (collapsed) {
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      toggleBtn.setAttribute("aria-label", "Expandir banner");
      toggleBtn.title = "Expandir";
    } else {
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      `;
      toggleBtn.setAttribute("aria-label", "Minimizar banner");
      toggleBtn.title = "Minimizar";
    }
  }
}
