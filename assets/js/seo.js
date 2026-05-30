/* ==========================================================================
   SALEPERU.PE - CONTROLADOR DE SEO TÉCNICO Y ENRUTAMIENTO DINÁMICO
   ========================================================================== */

/**
 * Escucha cambios en el hash del navegador para enrutar directamente a ofertas específicas
 */
function initRouterAndSeo() {
  // 1. Escuchar cambios de hash (ej: #SP-001)
  window.addEventListener("hashchange", handleHashRouting);
  
  // Ejecutar de forma inmediata y determinista, ya que el DOM y los datos están listos.
  handleHashRouting();
}

/**
 * Maneja el enrutamiento por hash, desplazando al usuario a la oferta y resaltándola
 */
function handleHashRouting() {
  const hash = window.location.hash;
  if (!hash) return;

  const offerId = hash.replace("#", "");
  const card = document.getElementById(offerId);
  
  if (card) {
    // Desplazar la tarjeta suavemente al centro de la pantalla
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // Aplicar un efecto visual de resalto temporizado
    card.style.borderColor = "var(--color-primary)";
    card.style.boxShadow = "0 0 20px rgba(107, 17, 255, 0.4)";
    card.style.transform = "scale(1.03)";
    
    setTimeout(() => {
      card.style.borderColor = "var(--border-color)";
      card.style.boxShadow = "var(--shadow-sm)";
      card.style.transform = "none";
    }, 2500);

    // Actualizar metadata SEO de forma dinámica
    updateSeoForOffer(offerId);
  }
}

/**
 * Actualiza dinámicamente el título y metatags OpenGraph para mejorar indexación y links compartidos
 * @param {string} offerId - ID de la oferta seleccionada
 */
function updateSeoForOffer(offerId) {
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

  updateMetaTag("meta[property='og:url']", `${window.location.origin}${window.location.pathname}#${offerId}`);

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

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": offer.title,
    "image": [offer.image],
    "description": offer.description,
    "sku": offer.id,
    "brand": {
      "@type": "Brand",
      "name": offer.store
    },
    "offers": {
      "@type": "Offer",
      "url": `${window.location.origin}${window.location.pathname}#${offer.id}`,
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
  script.text = JSON.stringify(jsonLd);
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
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const script = document.createElement("script");
  script.id = "json-ld-global-site";
  script.type = "application/ld+json";
  script.text = JSON.stringify(globalJson);
  document.head.appendChild(script);
}
