/* ==========================================================================
   SALEPERU.PE - EXPERIENCIA DE INTERFAZ DE USUARIO (UI/UX) Y COMPARTE VIRAL
   ========================================================================== */

let deferredInstallPrompt = null;
let currentShareOfferId = "";

document.addEventListener("DOMContentLoaded", () => {
  initThemeSystem();
  initHeaderScrollEffect();
  initPwaInstallEvent();
  setupSearchUX();
});

/* ==========================================================================
   1. SISTEMA DE TEMA CLARO Y OSCURO PERSISTENTE
   ========================================================================== */
function initThemeSystem() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (!themeToggleBtn) return;

  // Intentar leer preferencia del usuario en localStorage, o forzar la versión clara por defecto (ignorar pre-configuración oscura del SO)
  const savedTheme = localStorage.getItem("saleperu_theme");
  const currentTheme = savedTheme || "light";
  
  setTheme(currentTheme);

  themeToggleBtn.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("saleperu_theme", theme);
  
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  // Cambiar ícono SVG dinámicamente según el tema
  if (theme === "dark") {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.72" x2="5.64" y2="18.3"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  }
}

/* ==========================================================================
   2. EFECTO DE SCROLL EN CABECERA (GLASSMORPHISM MEJORADO)
   ========================================================================== */
function initHeaderScrollEffect() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  // Limpiar estilos en línea previos para dejar que el CSS actúe libremente
  header.style.boxShadow = "";
  header.style.borderBottomColor = "";

  let scrollRunning = false;
  window.addEventListener("scroll", () => {
    if (!scrollRunning) {
      scrollRunning = true;
      requestAnimationFrame(() => {
        if (window.scrollY > 30) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
        scrollRunning = false;
      });
    }
  }, { passive: true });
}

/* ==========================================================================
   3. NOTIFICACIONES TOAST DINÁMICAS
   ========================================================================== */
function showToastNotification(message) {
  let toast = document.getElementById("toast-notification");
  
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add("active");

  // Ocultar automáticamente después de 3 segundos
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

/* ==========================================================================
   4. MODAL DE COMPARTE VIRAL (COMPARTIR OFERTA)
   ========================================================================== */
function openShareModal(offerId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  currentShareOfferId = offerId;
  const offer = allOffers.find(o => o.id === offerId);
  if (!offer) return;

  const overlay = document.getElementById("share-modal-overlay");
  if (!overlay) return;

  // Generar URL única del producto utilizando el hash `#SP-001` para enrutamiento instantáneo
  const shareUrl = `${window.location.origin}${window.location.pathname}#${offerId}`;
  
  // Rellenar input de copiado de link
  const linkInput = document.getElementById("share-link-input");
  if (linkInput) {
    linkInput.value = shareUrl;
  }

  // Comprobar soporte del API Web Share nativo en móviles
  if (navigator.share) {
    navigator.share({
      title: offer.title,
      text: `🔥 ¡Mira esta oferta en SALEPERU.PE! ${offer.title} a solo S/. ${offer.offerPrice}.`,
      url: shareUrl
    }).catch(err => {
      console.log("Web Share cancelado o error:", err);
      // Fallback: Abrir nuestro propio modal si falla o se cancela
      overlay.classList.add("active");
      document.body.classList.add("modal-open");
    });
  } else {
    // Si no tiene soporte nativo, abrir modal glassmorphic custom
    overlay.classList.add("active");
    document.body.classList.add("modal-open");
  }
}

function closeShareModal() {
  const overlay = document.getElementById("share-modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
  document.body.classList.remove("modal-open");
}

/**
 * Acciones de redes sociales en el modal
 */
function shareOnWhatsApp() {
  const offer = allOffers.find(o => o.id === currentShareOfferId);
  if (!offer) return;

  const shareUrl = `${window.location.origin}${window.location.pathname}#${currentShareOfferId}`;
  const text = encodeURIComponent(`🔥 ¡Mira este ofertón en SALEPERU.PE! 🇵🇪\n\n*${offer.title}*\n💰 Precio de oferta: *S/. ${offer.offerPrice}* (Antes S/. ${offer.originalPrice})\n🛍️ Tienda: *${offer.store}*\n\n👉 Ver oferta aquí: ${shareUrl}`);
  
  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  closeShareModal();
}

function shareOnTelegram() {
  const offer = allOffers.find(o => o.id === currentShareOfferId);
  if (!offer) return;

  const shareUrl = `${window.location.origin}${window.location.pathname}#${currentShareOfferId}`;
  const text = encodeURIComponent(`🔥 ¡Mira este ofertón en SALEPERU.PE! 🇵🇪\n\n${offer.title}\n💰 Precio: S/. ${offer.offerPrice} (Antes S/. ${offer.originalPrice})\n🛍️ Tienda: ${offer.store}`);
  
  window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  closeShareModal();
}

function copyShareLink() {
  const linkInput = document.getElementById("share-link-input");
  if (!linkInput) return;

  linkInput.select();
  linkInput.setSelectionRange(0, 99999); // Para móviles

  navigator.clipboard.writeText(linkInput.value).then(() => {
    showToastNotification("🔗 Enlace copiado al portapapeles. ¡Compártelo!");
    closeShareModal();
  }).catch(err => {
    console.error("No se pudo copiar el enlace:", err);
  });
}

/* ==========================================================================
   5. CONTROL PWA Y PROMOCIÓN DE INSTALACIÓN
   ========================================================================== */
function initPwaInstallEvent() {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Evitar que Chrome muestre el banner por defecto en móviles
    e.preventDefault();
    deferredInstallPrompt = e;

    // Mostrar un botón de instalación elegante en la cabecera si existe
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
      installBtn.style.display = "flex";
      
      installBtn.addEventListener("click", () => {
        // Mostrar la ventana nativa de instalación
        deferredInstallPrompt.prompt();
        
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("El usuario aceptó la instalación PWA");
            showToastNotification("🎉 ¡Gracias por instalar la app de SALEPERU.PE!");
          } else {
            console.log("El usuario rechazó la instalación PWA");
          }
          deferredInstallPrompt = null;
          installBtn.style.display = "none";
        });
      });
    }
  });

  window.addEventListener("appinstalled", (evt) => {
    console.log("SALEPERU.PE fue instalada exitosamente.");
    showToastNotification("📱 ¡SALEPERU.PE instalada! Ahora puedes entrar directamente desde tu pantalla de inicio.");
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) installBtn.style.display = "none";
  });
}

/* ==========================================================================
   6. MEJORAS DE BUSCADOR PREMIUM (SUGERENCIAS Y LIMPIEZA)
   ========================================================================== */
function setupSearchUX() {
  const desktopSearch = document.getElementById("desktop-search");
  const mobileSearch = document.getElementById("mobile-search");
  
  const desktopClear = document.getElementById("desktop-search-clear");
  const mobileClear = document.getElementById("mobile-search-clear");
  
  const desktopSuggest = document.getElementById("desktop-search-suggestions");
  const mobileSuggest = document.getElementById("mobile-search-suggestions");

  const searchPairs = [
    { input: desktopSearch, clear: desktopClear, suggest: desktopSuggest },
    { input: mobileSearch, clear: mobileClear, suggest: mobileSuggest }
  ];

  // Configuración de los datos de sugerencia premium
  const suggestionsHTML = `
    <div>
      <div class="search-suggest-title">Búsquedas Sugeridas</div>
      <div class="search-suggest-pills">
        <span class="search-suggest-pill" data-type="category" data-val="tecnología">Tecnología 💻</span>
        <span class="search-suggest-pill" data-type="category" data-val="gaming">Gaming 🎮</span>
        <span class="search-suggest-pill" data-type="category" data-val="moda">Moda 👕</span>
        <span class="search-suggest-pill" data-type="query" data-val="zapatillas">Zapatillas 👟</span>
        <span class="search-suggest-pill" data-type="category" data-val="error">Errores 💥</span>
        <span class="search-suggest-pill" data-type="category" data-val="hot">Más Hot 🔥</span>
      </div>
    </div>
    <div>
      <div class="search-suggest-title">Tiendas Destacadas</div>
      <div class="search-suggest-stores">
        <div class="search-suggest-store" data-type="query" data-val="Falabella">
          <span style="font-size: 1.1rem; filter: grayscale(0.2);">🔴</span> <strong>Falabella</strong>
        </div>
        <div class="search-suggest-store" data-type="query" data-val="Ripley">
          <span style="font-size: 1.1rem;">🛍️</span> <strong>Ripley</strong>
        </div>
        <div class="search-suggest-store" data-type="query" data-val="Plaza Vea">
          <span style="font-size: 1.1rem;">🟡</span> <strong>Plaza Vea</strong>
        </div>
        <div class="search-suggest-store" data-type="query" data-val="Oechsle">
          <span style="font-size: 1.1rem;">🔵</span> <strong>Oechsle</strong>
        </div>
        <div class="search-suggest-store" data-type="query" data-val="Sodimac">
          <span style="font-size: 1.1rem;">🟢</span> <strong>Sodimac</strong>
        </div>
        <div class="search-suggest-store" data-type="query" data-val="Amazon">
          <span style="font-size: 1.1rem;">🟠</span> <strong>Amazon</strong>
        </div>
      </div>
    </div>
  `;

  searchPairs.forEach(({ input, clear, suggest }) => {
    if (!input || !suggest) return;

    // Inyectar el HTML de sugerencias
    suggest.innerHTML = suggestionsHTML;

    // Detección de escritura para botón de limpieza
    input.addEventListener("input", (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        clear.classList.add("visible");
      } else {
        clear.classList.remove("visible");
      }
    });

    // Acción del botón limpiar
    if (clear) {
      clear.addEventListener("click", () => {
        input.value = "";
        clear.classList.remove("visible");
        
        // Disparar evento nativo 'input' para limpiar la búsqueda del feed
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
        
        input.focus();
      });
    }

    // Mostrar sugerencias al enfocar
    input.addEventListener("focus", () => {
      suggest.classList.add("active");
    });

    // Ocultar sugerencias al desenfocar (con delay para permitir registro de clic)
    input.addEventListener("blur", () => {
      setTimeout(() => {
        suggest.classList.remove("active");
      }, 220);
    });

    // Manejar clics dentro del panel de sugerencias
    suggest.addEventListener("mousedown", (e) => {
      // mousedown se ejecuta antes que blur, lo que previene que se cierre prematuramente
      const item = e.target.closest(".search-suggest-pill, .search-suggest-store");
      if (!item) return;

      e.preventDefault(); // Previene pérdida de foco inmediata
      
      const type = item.dataset.type;
      const val = item.dataset.val;

      if (type === "category") {
        // Enlazar con las categorías de píldoras existentes
        const pill = document.querySelector(`.filter-pill[data-id="${val}"]`);
        if (pill) {
          pill.click();
        } else {
          // Fallback a texto
          input.value = val;
          const event = new Event("input", { bubbles: true });
          input.dispatchEvent(event);
        }
      } else {
        // Buscar por texto
        input.value = val;
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
      }

      // Cerrar y ocultar botón de limpiar si correspondiera
      suggest.classList.remove("active");
      if (clear && val) {
        clear.classList.add("visible");
      }
    });
  });

  // Lógica de apertura y cierre del Buscador Móvil Overlay
  const mobileSearchTrigger = document.getElementById("mobile-search-trigger");
  const mobileSearchOverlay = document.getElementById("mobile-search-overlay");
  const mobileSearchClose = document.getElementById("mobile-search-close");

  if (mobileSearchTrigger && mobileSearchOverlay) {
    mobileSearchTrigger.addEventListener("click", () => {
      mobileSearchOverlay.classList.add("active");
      document.body.classList.add("modal-open");
      
      // Enfoque automático del input en móvil con un leve delay para esperar la animación CSS
      setTimeout(() => {
        if (mobileSearch) mobileSearch.focus();
      }, 200);
    });
  }

  if (mobileSearchClose && mobileSearchOverlay) {
    mobileSearchClose.addEventListener("click", () => {
      mobileSearchOverlay.classList.remove("active");
      document.body.classList.remove("modal-open");
    });
  }

  // Cerrar el modal al hacer clic en marcas o atajos sugeridos
  if (mobileSuggest && mobileSearchOverlay) {
    mobileSuggest.addEventListener("mousedown", (e) => {
      const item = e.target.closest(".search-suggest-pill, .search-suggest-store");
      if (!item) return;
      setTimeout(() => {
        mobileSearchOverlay.classList.remove("active");
        document.body.classList.remove("modal-open");
      }, 350); // Leve retardo para permitir el clic de filtrado
    });
  }
}

/**
 * Método global de sanitización para prevenir ataques de inyección XSS de Google Sheets
 * @param {string} str - Texto plano a escapar
 * @returns {string} Texto debidamente saneado y seguro para renderizado HTML
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
