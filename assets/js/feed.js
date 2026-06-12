/* ==========================================================================
   SALEPERU.PE - MOTOR DE RENDIMIENTO DEL FEED DE OFERTAS Y BÚSQUEDA
   ========================================================================== */

let allOffers = [];
let filteredOffers = [];
let currentCategory = "todos";
let currentStoreFilter = "todos";
let currentSort = "recientes";
let searchQuery = "";

// Variables de Paginación de Alto Rendimiento para DOM Ligero
let currentPage = 1;
const ITEMS_PER_PAGE = 24;

/**
 * Función auxiliar para extraer el número secuencial de los IDs
 * Ejemplo: "SP-005" -> 5, "SP-120" -> 120
 */
function getNumericId(idStr) {
  if (!idStr) return 0;
  const match = String(idStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Inicializa el feed con los datos descargados
 * @param {Array} offersData - Listado de ofertas procesadas de Sheets
 */
function initFeedSystem(offersData) {
  // Guardar ofertas limpias de expiración de forma automática
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  allOffers = offersData.filter(offer => {
    if (!offer.expiration) return true;
    const expDate = new Date(offer.expiration + "T23:59:59");
    return expDate >= today;
  });

  filteredOffers = [...allOffers];
  
  // Pintar categorías dinámicas en la barra de píldoras
  renderCategoryFilters();

  // Leer parámetro 'search' de la URL para inicializar filtros desde subpáginas
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      searchQuery = searchParam.toLowerCase().trim();
      // Sincronizar inputs de búsqueda
      document.querySelectorAll(".search-input").forEach(input => {
        input.value = searchParam;
      });
      // Mostrar botones de limpiar búsqueda
      document.querySelectorAll(".search-clear-btn").forEach(btn => {
        btn.classList.add("visible");
      });
    }
  } catch (e) {
    console.warn("No se pudo parsear el parámetro de búsqueda de la URL:", e);
  }
  
  // Pintar el feed inicial
  applyFiltersAndSort();
  
  // Enlazar barra de búsqueda en tiempo real
  setupSearchInput();
}

/**
 * Pinta la barra de categorías inteligentes con pills deslizables
 */
function renderCategoryFilters() {
  const wrapper = document.getElementById("category-filters-container");
  if (!wrapper) return;

  const categories = [
    { id: "todos", label: "✨ Todos" },
    { id: "hot", label: "🔥 Más Hot" },
    { id: "error", label: "💥 Errores de Precio" },
    { id: "flash", label: "⚡ Flash Deals" },
    { id: "tecnología", label: "Tecnología" },
    { id: "gaming", label: "Gaming" },
    { id: "moda", label: "Moda" },
    { id: "hogar", label: "Hogar" },
    { id: "supermercado", label: "Supermercado" },
    { id: "viajes", label: "Viajes" }
  ];

  wrapper.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `filter-pill ${currentCategory === cat.id ? 'active' : ''}`;
    btn.textContent = cat.label;
    btn.dataset.id = cat.id;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = cat.id;
      applyFiltersAndSort();
    });

    wrapper.appendChild(btn);
  });
}

/**
 * Función Debounce reutilizable para optimizar el rendimiento de la búsqueda en tiempo real
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Configura los inputs de búsqueda (escritorio y móviles si los hay)
 */
function setupSearchInput() {
  const searchInputs = document.querySelectorAll(".search-input");
  
  const debouncedApplyFilters = debounce(() => {
    applyFiltersAndSort();
  }, 250);

  searchInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      
      // Sincronizar todos los inputs con el mismo valor de inmediato para coherencia visual
      searchInputs.forEach(si => {
        if (si !== input) si.value = e.target.value;
      });

      // Filtrar y ordenar de forma diferida (debounce) para liberar el hilo principal
      debouncedApplyFilters();
    });
  });
}

/**
 * Aplica lógica combinada de Categorías, Búsqueda y Ordenamiento
 */
function applyFiltersAndSort(resetPage = true) {
  if (resetPage) {
    currentPage = 1; // Reiniciar paginación al filtrar o buscar
  }
  
  let result = [...allOffers];

  // 1. Filtrar por Categoría Inteligente
  if (currentCategory !== "todos") {
    if (currentCategory === "hot") {
      result = result.filter(o => o.isHot);
    } else if (currentCategory === "error") {
      result = result.filter(o => o.isErrorPrice);
    } else if (currentCategory === "flash") {
      result = result.filter(o => o.isFlash);
    } else {
      result = result.filter(o => o.category.toLowerCase() === currentCategory);
    }
  }

  // 2. Filtrar por Tienda Seleccionada (Intersección con pills de tienda)
  if (currentStoreFilter !== "todos") {
    result = result.filter(o => o.store && o.store.toLowerCase().trim() === currentStoreFilter);
  }

  // 3. Filtrar por Búsqueda (Título, descripción o categoría)
  if (searchQuery) {
    result = result.filter(o => 
      o.title.toLowerCase().includes(searchQuery) ||
      o.description.toLowerCase().includes(searchQuery) ||
      o.category.toLowerCase().includes(searchQuery)
    );
  }

  // 3. Aplicar Ordenamiento
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    currentSort = sortSelect.value;
  }

  if (currentSort === "recientes") {
    // Ordenar de forma descendente por la numeración de los IDs ya precalculada
    result.sort((a, b) => b.numericId - a.numericId);
  } else if (currentSort === "descuento") {
    // Ordenar de forma descendente por el descuento precalculado
    result.sort((a, b) => b.discountPercent - a.discountPercent);
  } else if (currentSort === "hot") {
    // Primero los isHot
    result.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0));
  } else if (currentSort === "precio-bajo") {
    result.sort((a, b) => a.offerPrice - b.offerPrice);
  }

  filteredOffers = result;
  renderFeedCards();
}

/**
 * Renderiza los esqueletos de carga visuales para una respuesta fluida
 * @param {number} count - Número de esqueletos a mostrar
 */
function renderSkeletonLoading(count = 6) {
  const grid = document.getElementById("feed-grid");
  if (!grid) return;

  // Si ya hay skeletons cargados (ej: en el HTML estático inicial), no los volvemos a renderizar para evitar parpadeos
  if (grid.querySelector(".deal-card")) return;

  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "deal-card";
    skeleton.innerHTML = `
      <div class="skeleton skeleton-card-media"></div>
      <div class="card-body">
        <div class="skeleton skeleton-card-line skeleton-card-title1"></div>
        <div class="skeleton skeleton-card-line skeleton-card-title2"></div>
        <div class="skeleton skeleton-card-line skeleton-card-desc1"></div>
        <div class="skeleton skeleton-card-line skeleton-card-desc2"></div>
        <div class="skeleton skeleton-card-price"></div>
        <div class="skeleton skeleton-card-btn"></div>
      </div>
    `;
    grid.appendChild(skeleton);
  }
}

/**
 * Pinta las tarjetas de ofertas procesadas en el contenedor principal
 */
function renderFeedCards() {
  const grid = document.getElementById("feed-grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (filteredOffers.length === 0) {
    grid.innerHTML = `
      <div class="empty-state slide-up">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No encontramos ofertas</h3>
        <p>Prueba buscando con palabras clave diferentes o selecciona otra categoría.</p>
      </div>
    `;
    
    // Limpiar contenedor de Cargar Más si no hay ofertas
    const loadMoreContainer = document.getElementById("load-more-container");
    if (loadMoreContainer) loadMoreContainer.innerHTML = "";
    return;
  }

  // Paginación: Cortar el arreglo a la página actual * ítems por página
  const paginatedOffers = filteredOffers.slice(0, currentPage * ITEMS_PER_PAGE);

  paginatedOffers.forEach((offer, index) => {
    // Distintivo geográfico para tiendas locales vs importación
    const isStoreAliExpress = offer.store && offer.store.toLowerCase().trim() === "aliexpress";
    const storeLabelPrefix = isStoreAliExpress ? "✈️ " : "🇵🇪 ";

    const card = document.createElement("article");
    card.className = "deal-card slide-up";
    card.id = offer.id;
    // Animación escalonada optimizada para los ítems visibles de la página activa
    const pageIndex = index % ITEMS_PER_PAGE;
    card.style.animationDelay = `${pageIndex * 0.04}s`;

    // Determinar etiqueta de expiración (si expira hoy)
    const isExpiringToday = checkIsExpiringToday(offer.expiration);

    // Renderizado estructurado con SANEAMIENTO escapeHTML para protección total contra XSS
    card.innerHTML = `
      <div class="card-media-wrapper">
        <div class="card-badges">
          ${offer.isHot ? '<span class="badge badge-hot">🔥 Hot</span>' : ''}
          ${offer.isErrorPrice ? '<span class="badge badge-error">💥 Error de Precio</span>' : ''}
          ${offer.isFlash ? '<span class="badge badge-flash">⚡ Flash Deal</span>' : ''}
          ${isExpiringToday ? '<span class="badge badge-error">⏳ Expira Hoy</span>' : ''}
          ${offer.couponCode ? '<span class="badge badge-coupon">🎟️ Cupón</span>' : ''}
        </div>
        <img class="card-image" src="${sanitizeUrl(offer.image)}" alt="${escapeHTML(offer.title)}" 
             width="350" height="200"
             loading="${index < 4 ? 'eager' : 'lazy'}" 
             ${index < 4 ? 'fetchpriority="high"' : ''}
             decoding="async"
             onerror="this.src='https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=350&h=200&q=70&auto=format&fit=crop'">
        <span class="card-store">${storeLabelPrefix}${escapeHTML(offer.store)}</span>
        
        <!-- Botón flotante para compartir -->
        <button class="card-share-btn" data-share-id="${escapeHTML(offer.id)}" aria-label="Compartir Oferta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>

      <div class="card-body">
        <span class="card-category" style="color: var(--color-${getCategoryColorClass(offer.category)})">${escapeHTML(offer.category)}</span>
        <h3 class="card-title">${escapeHTML(offer.title)}</h3>
        <p class="card-description">${escapeHTML(offer.description)}</p>
        
        <div class="card-price-row">
          <span class="price-offer">S/. ${offer.offerPrice.toFixed(2)}</span>
          ${offer.originalPrice > offer.offerPrice ? `<span class="price-original">S/. ${offer.originalPrice.toFixed(2)}</span>` : ''}
          ${offer.discountPercent > 0 ? `<span class="price-discount">-${offer.discountPercent}%</span>` : ''}
        </div>

        ${offer.couponCode ? `
          <div class="card-coupon-container">
            <span class="coupon-text">Cupón:</span>
            <span class="coupon-code-badge" data-coupon-code="${escapeHTML(offer.couponCode)}" title="Copiar cupón">${escapeHTML(offer.couponCode)}</span>
          </div>
        ` : ''}

        <a href="${sanitizeUrl(offer.link)}" target="_blank" class="card-btn" rel="sponsored nofollow noopener noreferrer">
          Ir a oferta ↗
        </a>
      </div>
    `;

    // Hacer que toda la tarjeta sea clickable de forma intuitiva, respetando botones interactivos y manejando clics seguros sin onclick inline
    card.addEventListener("click", (e) => {
      const shareBtn = e.target.closest(".card-share-btn");
      const couponBadge = e.target.closest(".coupon-code-badge");
      
      if (shareBtn) {
        e.stopPropagation();
        e.preventDefault();
        const shareId = shareBtn.dataset.shareId;
        openShareModal(shareId, e);
        return;
      }
      
      if (couponBadge) {
        e.stopPropagation();
        e.preventDefault();
        const couponCodeVal = couponBadge.dataset.couponCode;
        copyCouponCode(couponCodeVal, e);
        return;
      }

      if (e.target.closest(".card-btn")) {
        return; // Dejar que actúe su href nativo
      }
      
      const safeLink = sanitizeUrl(offer.link);
      if (safeLink !== "#") {
        window.open(safeLink, "_blank", "noopener,noreferrer");
      }
    });

    grid.appendChild(card);
  });

  // Renderizar o remover el Botón "Cargar Más" dinámicamente
  const loadMoreContainer = document.getElementById("load-more-container");
  if (loadMoreContainer) {
    if (filteredOffers.length > currentPage * ITEMS_PER_PAGE) {
      loadMoreContainer.innerHTML = `
        <button class="load-more-btn slide-up" onclick="loadNextPage()" aria-label="Ver más ofertas">
          Ver más ofertas ⚡
        </button>
      `;
    } else {
      loadMoreContainer.innerHTML = "";
    }
  }
}

/**
 * Valida si un string de fecha corresponde al día de hoy
 * @param {string} dateStr - Fecha YYYY-MM-DD
 * @returns {boolean} True si coincide con el día de hoy
 */
function checkIsExpiringToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const formattedToday = `${year}-${month}-${day}`;
  return dateStr === formattedToday;
}

/**
 * Mapea categorías a clases de color CSS del sistema de diseño
 * @param {string} category - Nombre de la categoría
 * @returns {string} Clase de color asignada
 */
function getCategoryColorClass(category) {
  const cat = String(category || "").toLowerCase().trim();
  if (cat.includes("tecn")) return "tech";
  if (cat.includes("gam") || cat.includes("jue")) return "gaming";
  if (cat.includes("mod") || cat.includes("ropa")) return "moda";
  if (cat.includes("hog") || cat.includes("casa")) return "hogar";
  if (cat.includes("viaj") || cat.includes("vuel")) return "viajes";
  if (cat.includes("super") || cat.includes("plaz") || cat.includes("comid")) return "supermercado";
  return "tech"; // color por defecto
}

/**
 * Copia un cupón al portapapeles y muestra confirmación visual (Toast)
 */
function copyCouponCode(code, event) {
  if (event) event.stopPropagation();
  navigator.clipboard.writeText(code).then(() => {
    showToastNotification(`🎟️ ¡Cupón "${code}" copiado al portapapeles!`);
  }).catch(err => {
    console.error("No se pudo copiar el cupón:", err);
  });
}

/**
 * Función disparadora de la paginación para cargar el bloque siguiente
 */
function loadNextPage() {
  currentPage++;
  renderFeedCards();
}

/**
 * Sanitiza URLs para prevenir inyecciones maliciosas de javascript: o vbscript:
 * @param {string} url - La URL a analizar
 * @returns {string} URL saneada y segura
 */
function sanitizeUrl(url) {
  if (!url) return "#";
  const cleanUrl = String(url).trim();
  // Rechazar javascript: y esquemas peligrosos
  if (/^(javascript|vbscript|data):/i.test(cleanUrl)) {
    // Permitir URIs de datos seguras si son imágenes
    if (/^data:image\//i.test(cleanUrl)) {
      return escapeHTML(cleanUrl);
    }
    return "#";
  }
  return escapeHTML(cleanUrl);
}
