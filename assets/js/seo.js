/* ==========================================================================
   SALEPERU.PE - CONTROLADOR DE SEO TÉCNICO Y ENRUTAMIENTO DINÁMICO
   ========================================================================== */

const CANONICAL_DOMAIN = "https://saleperu.pe";

let originalTitle = "";
let originalMetas = {};
let hashRoutingAttempts = 0;
const maxHashRoutingAttempts = 10;

/**
 * Escucha cambios en el hash del navegador para enrutar directamente a ofertas específicas
 */
function initRouterAndSeo() {
  // Capturar SEO original para restaurarlo al salir del hash
  originalTitle = document.title;
  originalMetas = {
    title: document.title,
    ogTitle: getMetaContent("meta[property='og:title']"),
    twTitle: getMetaContent("meta[name='twitter:title']"),
    ogDesc: getMetaContent("meta[property='og:description']"),
    twDesc: getMetaContent("meta[name='twitter:description']"),
    ogImage: getMetaContent("meta[property='og:image']"),
    twImage: getMetaContent("meta[name='twitter:image']"),
    ogUrl: getMetaContent("meta[property='og:url']")
  };

  // 1. Escuchar cambios de hash (ej: #SP-001)
  window.addEventListener("hashchange", handleHashRouting);
  
  // Ejecutar de forma inmediata y determinista
  handleHashRouting();
}

/**
 * Helper para obtener el contenido de un metatag
 */
function getMetaContent(selector) {
  const el = document.querySelector(selector);
  return el ? el.getAttribute("content") : "";
}

/**
 * Restaura el SEO original al navegar fuera del hash
 */
function restoreOriginalSeo() {
  if (!originalTitle) return;
  document.title = originalTitle;
  
  updateMetaTag("meta[property='og:title']", originalMetas.ogTitle);
  updateMetaTag("meta[name='twitter:title']", originalMetas.twTitle);
  updateMetaTag("meta[property='og:description']", originalMetas.ogDesc);
  updateMetaTag("meta[name='twitter:description']", originalMetas.twDesc);
  updateMetaTag("meta[property='og:image']", originalMetas.ogImage);
  updateMetaTag("meta[name='twitter:image']", originalMetas.twImage);
  updateMetaTag("meta[property='og:url']", originalMetas.ogUrl);
  
  const oldScript = document.getElementById("json-ld-dynamic-offer");
  if (oldScript) {
    oldScript.remove();
  }
}

/**
 * Maneja el enrutamiento por hash, desplazando al usuario a la oferta y resaltándola
 */
function handleHashRouting() {
  const hash = window.location.hash;
  if (!hash) {
    restoreOriginalSeo();
    return;
  }

  const offerId = hash.replace("#", "");

  // Comprobar si las ofertas globales ya están cargadas
  if (typeof allOffers === "undefined" || !allOffers || allOffers.length === 0) {
    if (hashRoutingAttempts < maxHashRoutingAttempts) {
      hashRoutingAttempts++;
      setTimeout(handleHashRouting, 300);
    }
    return;
  }

  const card = document.getElementById(offerId);
  if (card && card.classList.contains("deal-card")) {
    hashRoutingAttempts = 0; // Reset counter
    
    // Desplazar la tarjeta suavemente al centro de la pantalla
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // Aplicar un efecto visual de resalto temporizado
    card.style.borderColor = "var(--color-primary)";
    card.style.boxShadow = "0 0 20px rgba(107, 17, 255, 0.4)";
    card.style.transform = "scale(1.03)";
    
    setTimeout(() => {
      card.style.borderColor = "";
      card.style.boxShadow = "";
      card.style.transform = "";
    }, 2500);

    // Actualizar metadata SEO de forma dinámica
    updateSeoForOffer(offerId);
  } else {
    // Si la oferta existe en el set de datos pero no en el DOM, es posible que esté en otra página
    if (typeof filteredOffers !== "undefined" && Array.isArray(filteredOffers)) {
      const offerIndex = filteredOffers.findIndex(o => o.id === offerId);
      if (offerIndex !== -1) {
        if (typeof ITEMS_PER_PAGE !== "undefined" && typeof currentPage !== "undefined") {
          const itemPage = Math.ceil((offerIndex + 1) / ITEMS_PER_PAGE);
          if (itemPage > currentPage) {
            currentPage = itemPage;
            if (typeof renderFeedCards === "function") {
              renderFeedCards();
            }
          }
        }
        
        // Reintentar para que encuentre el elemento recién renderizado
        setTimeout(handleHashRouting, 50);
        return;
      }
    }

    // Si sigue sin encontrarse, reintentar (por carga lenta o render diferido)
    if (hashRoutingAttempts < maxHashRoutingAttempts) {
      hashRoutingAttempts++;
      setTimeout(handleHashRouting, 300);
    }
  }
}

/**
 * Actualiza dinámicamente el título y metatags OpenGraph para mejorar indexación y links compartidos
 * @param {string} offerId - ID de la oferta seleccionada
 */
function updateSeoForOffer(offerId) {
  if (typeof allOffers === "undefined" || !allOffers || !Array.isArray(allOffers)) return;
  const offer = allOffers.find(o => o.id === offerId);
  if (!offer) return;

  const pageTitle = `🔥 ${offer.title} a solo S/. ${offer.offerPrice} en ${offer.store} | SALEPERU.PE`;
  const pageDesc = `¡OFERTÓN! ${offer.description.substring(0, 150)}... Ahorra comprando en las mejores tiendas de Perú con SALEPERU.PE.`;

  // 1. Cambiar Document Title
  document.title = pageTitle;

  // 2. Modificar Metatags en Cabecera (OpenGraph & Twitter Cards)
  updateMetaTag("meta[property='og:title']", pageTitle);
  updateMetaTag("meta[name='twitter:title']", pageTitle);
  
  updateMetaTag("meta[property='og:description']", pageDesc);
  updateMetaTag("meta[name='twitter:description']", pageDesc);
  
  updateMetaTag("meta[property='og:image']", offer.image);
  updateMetaTag("meta[name='twitter:image']", offer.image);

  // Normalizar path de la página para producción
  const normalizedPath = window.location.pathname.startsWith("/") ? window.location.pathname : `/${window.location.pathname}`;
  updateMetaTag("meta[property='og:url']", `${CANONICAL_DOMAIN}${normalizedPath}#${offerId}`);

  // 3. Inyectar Estructura Schema.org JSON-LD Dinámica (Rich Snippets)
  injectStructuredData(offer);
}

/**
 * Función auxiliar para actualizar o crear un metatag en el DOM
 */
function updateMetaTag(selector, content) {
  let element = document.querySelector(selector);
  if (element) {
    element.setAttribute("content", content);
  } else {
    // Si no existe, crearlo dinámicamente en el head
    element = document.createElement("meta");
    if (selector.includes("property")) {
      const prop = selector.match(/'([^']+)'/)[1];
      element.setAttribute("property", prop);
    } else {
      const name = selector.match(/'([^']+)'/)[1];
      element.setAttribute("name", name);
    }
    element.setAttribute("content", content);
    document.head.appendChild(element);
  }
}

/**
 * Inyecta un script de datos estructurados de tipo Product / Offer en el Head
 * para que motores de búsqueda indexen la oferta de forma premium.
 */
function injectStructuredData(offer) {
  // Remover JSON-LD previos para evitar duplicidad
  const oldScript = document.getElementById("json-ld-dynamic-offer");
  if (oldScript) {
    oldScript.remove();
  }

  const normalizedPath = window.location.pathname.startsWith("/") ? window.location.pathname : `/${window.location.pathname}`;
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": offer.title,
    "image": [offer.image],
    "description": offer.description,
    "sku": offer.id,
    "mpn": offer.id,
    "brand": {
      "@type": "Brand",
      "name": offer.store
    },
    "offers": {
      "@type": "Offer",
      "url": `${CANONICAL_DOMAIN}${normalizedPath}#${offer.id}`,
      "priceCurrency": "PEN",
      "price": offer.offerPrice,
      "priceValidUntil": offer.expiration || "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": offer.store
      }
    }
  };

  const script = document.createElement("script");
  script.id = "json-ld-dynamic-offer";
  script.type = "application/ld+json";
  script.text = JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  document.head.appendChild(script);
}

/**
 * Genera datos estructurados globales del sitio al inicializar
 */
function injectGlobalWebsiteSchema() {
  const oldScript = document.getElementById("json-ld-global-site");
  if (oldScript) return;

  const globalJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SALEPERU.PE",
    "url": CANONICAL_DOMAIN,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${CANONICAL_DOMAIN}/?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const script = document.createElement("script");
  script.id = "json-ld-global-site";
  script.type = "application/ld+json";
  script.text = JSON.stringify(globalJson).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  document.head.appendChild(script);
}
