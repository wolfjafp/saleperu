/* ==========================================================================
   SALEPERU.PE - MOTOR DE RENDIMIENTO DEL FEED DE OFERTAS Y BÚSQUEDA
   ========================================================================== */

let allOffers = [];
let filteredOffers = [];
let currentCategory = "todos";
let currentSort = "recientes";
let searchQuery = "";

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
 * Configura los inputs de búsqueda (escritorio y móviles si los hay)
 */
function setupSearchInput() {
  const searchInputs = document.querySelectorAll(".search-input");
  
  searchInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      
      // Sincronizar todos los inputs con el mismo valor
      searchInputs.forEach(si => {
        if (si !== input) si.value = e.target.value;
      });

      applyFiltersAndSort();
    });
  });
}

/**
 * Aplica lógica combinada de Categorías, Búsqueda y Ordenamiento
 */
function applyFiltersAndSort() {
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

  // 2. Filtrar por Búsqueda (Título, descripción, marca o tienda)
  if (searchQuery) {
    result = result.filter(o => 
      o.title.toLowerCase().includes(searchQuery) ||
      o.description.toLowerCase().includes(searchQuery) ||
      o.store.toLowerCase().includes(searchQuery) ||
      o.category.toLowerCase().includes(searchQuery)
    );
  }

  // 3. Aplicar Ordenamiento
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    currentSort = sortSelect.value;
  }

  if (currentSort === "recientes") {
    // Por ID descendente (asumiendo que IDs más altos o indexación física son recientes)
    result.reverse(); 
  } else if (currentSort === "descuento") {
    result.sort((a, b) => {
      const pctA = a.originalPrice ? ((a.originalPrice - a.offerPrice) / a.originalPrice) : 0;
      const pctB = b.originalPrice ? ((b.originalPrice - b.offerPrice) / b.originalPrice) : 0;
      return pctB - pctA;
    });
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
    return;
  }

  filteredOffers.forEach((offer, index) => {
    // Calcular porcentaje de descuento
    let discountPercent = 0;
    if (offer.originalPrice && offer.originalPrice > offer.offerPrice) {
      discountPercent = Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100);
    }

    const card = document.createElement("article");
    card.className = "deal-card slide-up";
    card.id = offer.id;
    card.style.animationDelay = `${index * 0.05}s`; // Staggered loading para visual premium

    // Determinar etiqueta de expiración (si expira hoy)
    const isExpiringToday = checkIsExpiringToday(offer.expiration);

    // Renderizado estructurado
    card.innerHTML = `
      <div class="card-media-wrapper">
        <div class="card-badges">
          ${offer.isHot ? '<span class="badge badge-hot">🔥 Hot</span>' : ''}
          ${offer.isErrorPrice ? '<span class="badge badge-error">💥 Error de Precio</span>' : ''}
          ${offer.isFlash ? '<span class="badge badge-flash">⚡ Flash Deal</span>' : ''}
          ${isExpiringToday ? '<span class="badge badge-error">⏳ Expira Hoy</span>' : ''}
          ${offer.couponCode ? '<span class="badge badge-coupon">🎟️ Cupón</span>' : ''}
        </div>
        <img class="card-image" src="${offer.image}" alt="${offer.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80'">
        <span class="card-store">${offer.store}</span>
        
        <!-- Botón flotante para compartir -->
        <button class="card-share-btn" onclick="openShareModal('${offer.id}', event)" aria-label="Compartir Oferta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>

      <div class="card-body">
        <span class="card-category" style="color: var(--color-${getCategoryColorClass(offer.category)})">${offer.category}</span>
        <h3 class="card-title">${offer.title}</h3>
        <p class="card-description">${offer.description}</p>
        
        <div class="card-price-row">
          <span class="price-offer">S/. ${offer.offerPrice.toFixed(2)}</span>
          ${offer.originalPrice > offer.offerPrice ? `<span class="price-original">S/. ${offer.originalPrice.toFixed(2)}</span>` : ''}
          ${discountPercent > 0 ? `<span class="price-discount">-${discountPercent}%</span>` : ''}
        </div>

        ${offer.couponCode ? `
          <div class="card-coupon-container">
            <span class="coupon-text">Cupón:</span>
            <span class="coupon-code-badge" onclick="copyCouponCode('${offer.couponCode}', event)" title="Copiar cupón">${offer.couponCode}</span>
          </div>
        ` : ''}

        <a href="${offer.link}" target="_blank" class="card-btn" rel="sponsored nofollow noopener noreferrer">
          Ir a oferta ↗
        </a>
      </div>
    `;

    grid.appendChild(card);
  });
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
  const cat = category.toLowerCase().trim();
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
