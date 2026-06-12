/* ==========================================================================
   SALEPERU.PE - MOTOR INTERACTIVO DE HISTORIAS TIPO INSTAGRAM/TIKTOK
   ========================================================================== */

let activeStories = [];
let currentStoryIndex = 0;
let storyProgressInterval = null;
let storyDuration = 5000; // 5 segundos por historia
let storyPaused = false;
let storyPauseStartTime = 0;
let storyElapsedTime = 0;
let storyLastTickTime = 0;
let controlsInitialized = false;

// Registro de historias vistas en LocalStorage
const VIEWED_STORIES_KEY = "saleperu_viewed_stories";

// Coordenadas para gestos táctiles (Swipe Down to dismiss)
let touchStartY = 0;
let touchCurrentY = 0;
let isDraggingStory = false;

/**
 * Inicializa el sistema de historias pintando la barra horizontal
 * @param {Array} storiesData - Arreglo de historias cargadas desde Sheets
 */
function initStoriesSystem(storiesData) {
  const container = document.getElementById("stories-container");
  if (!container) return;

  // Filtrar historias expiradas
  const now = new Date();
  activeStories = storiesData.filter(s => {
    if (!s.expiration) return true;
    const expDate = new Date(s.expiration + "T23:59:59");
    return expDate >= now;
  });

  if (activeStories.length === 0) {
    document.getElementById("stories-section").style.display = "none";
    return;
  }

  // Cargar registro de vistas
  const viewedIds = getViewedStories();

  container.innerHTML = "";
  activeStories.forEach((story, idx) => {
    const isViewed = viewedIds.includes(story.id);
    const item = document.createElement("div");
    item.className = `story-circle-item ${isViewed ? 'viewed' : ''}`;
    item.setAttribute("role", "listitem");
    item.dataset.id = story.id;
    item.dataset.index = idx;

    item.innerHTML = `
      <div class="story-ring">
        <img class="story-avatar" src="${sanitizeUrl(story.coverImage)}" alt="${escapeHTML(story.title)}" 
             width="64" height="64"
             loading="${idx < 4 ? 'eager' : 'lazy'}"
             ${idx < 4 ? 'fetchpriority="high"' : ''}
             decoding="async">
      </div>
      <span class="story-label">${escapeHTML(story.title)}</span>
    `;

    item.addEventListener("click", () => {
      openStoryViewer(idx);
    });

    container.appendChild(item);
  });
}

/**
 * Abre el reproductor a pantalla completa en una historia específica
 * @param {number} index - Índice de la historia en activeStories
 */
function openStoryViewer(index) {
  currentStoryIndex = index;
  storyPaused = false;
  storyElapsedTime = 0;
  
  const overlay = document.getElementById("story-viewer-overlay");
  const body = document.body;
  
  if (!overlay) return;
  
  overlay.style.display = "flex";
  overlay.classList.add("fade-in");
  body.classList.add("modal-open");
  
  // Renderizar la historia activa
  renderActiveStorySlide();
  
  // Agregar gestos táctiles y listeners (solo se vinculan una vez)
  setupStoryControls();

  // Escuchar teclado para accesibilidad WCAG 2.1
  window.addEventListener("keydown", handleStoryKeyboardNav);

  // Interceptar el botón atrás del móvil empujando un estado artificial al historial
  if (!window.history.state || !window.history.state.storyViewerActive) {
    window.history.pushState({ storyViewerActive: true }, "");
  }
}

/**
 * Pinta el slide actual de la historia y sus barras de progreso
 */
function renderActiveStorySlide() {
  const story = activeStories[currentStoryIndex];
  if (!story) return;

  const viewerContainer = document.getElementById("story-viewer-container");
  
  // Registrar como vista
  markStoryAsViewed(story.id);

  // Generar cabecera e info
  const headerContainer = document.querySelector(".story-user-info");
  headerContainer.innerHTML = `
    <div class="story-profile">
      <img class="story-profile-img" src="${sanitizeUrl(story.coverImage)}" alt="${escapeHTML(story.title)}">
      <span class="story-profile-name">${escapeHTML(story.title)}</span>
    </div>
    <button class="story-close-btn" onclick="closeStoryViewer()" aria-label="Cerrar reproductor de historias">✕ Cerrar</button>
  `;

  // Crear barra de progreso segmentada
  const progressContainer = document.getElementById("story-progress-bar-container");
  progressContainer.innerHTML = "";
  
  activeStories.forEach((_, idx) => {
    const segment = document.createElement("div");
    segment.className = "story-progress-segment";
    
    const fill = document.createElement("div");
    fill.className = "story-progress-fill";
    fill.id = `story-progress-fill-${idx}`;
    
    // Rellenar completamente las anteriores, vaciar las siguientes
    if (idx < currentStoryIndex) {
      fill.style.width = "100%";
    } else if (idx > currentStoryIndex) {
      fill.style.width = "0%";
    }
    
    segment.appendChild(fill);
    progressContainer.appendChild(segment);
  });

  // Renderizar cuerpo de contenido
  const bodyContainer = document.getElementById("story-body");
  bodyContainer.innerHTML = `
    <!-- Tap áreas invisibles para navegación -->
    <div class="story-nav-tap story-nav-left"></div>
    <div class="story-nav-tap story-nav-right"></div>
    
    <img class="story-media" src="${sanitizeUrl(story.mediaUrl)}" alt="${escapeHTML(story.caption)}" 
         width="350" height="600" decoding="async">
  `;

  // Renderizar pie de historia
  const footerContainer = document.getElementById("story-footer");
  footerContainer.innerHTML = `
    <p class="story-caption">${escapeHTML(story.caption)}</p>
    <a href="${sanitizeUrl(story.offerLink)}" target="_blank" class="story-action-btn" id="story-action-link" rel="sponsored nofollow noopener noreferrer">
      Ver Oferta ⚡
    </a>
  `;

  // Re-inicializar eventos de tap en el nuevo DOM
  setupTapEvents();

  // Iniciar temporizador de la historia actual
  startStoryTimer();
}

/**
 * Inicia el cronómetro de la historia actual para la barra de progreso fluida
 */
function startStoryTimer() {
  stopStoryTimer();
  
  storyLastTickTime = Date.now();
  storyElapsedTime = 0;
  storyPaused = false;
  
  const fillElement = document.getElementById(`story-progress-fill-${currentStoryIndex}`);
  if (!fillElement) return;

  storyProgressInterval = setInterval(() => {
    if (!storyPaused) {
      const now = Date.now();
      const delta = now - storyLastTickTime;
      storyElapsedTime += delta;
      storyLastTickTime = now;
      
      const pct = Math.min((storyElapsedTime / storyDuration) * 100, 100);
      fillElement.style.width = `${pct}%`;
      
      if (storyElapsedTime >= storyDuration) {
        advanceStory();
      }
    } else {
      storyLastTickTime = Date.now(); // Mantener el tick fresco mientras está pausado
    }
  }, 16); // ~60fps
}

/**
 * Detiene los intervalos de tiempo activos de la historia
 */
function stopStoryTimer() {
  if (storyProgressInterval) {
    clearInterval(storyProgressInterval);
    storyProgressInterval = null;
  }
}

/**
 * Avanza a la siguiente historia disponible o cierra si es la última
 */
function advanceStory() {
  if (currentStoryIndex < activeStories.length - 1) {
    currentStoryIndex++;
    storyElapsedTime = 0;
    renderActiveStorySlide();
  } else {
    closeStoryViewer();
  }
}

/**
 * Retrocede a la historia anterior si es posible
 */
function regressStory() {
  storyElapsedTime = 0;
  if (currentStoryIndex > 0) {
    currentStoryIndex--;
    renderActiveStorySlide();
  } else {
    // Si es la primera, reiniciar temporizador
    startStoryTimer();
  }
}

/**
 * Cierra el reproductor de historias
 * @param {boolean} triggerHistoryBack - Si es true, retira el estado artificial del historial
 */
function closeStoryViewer(triggerHistoryBack = true) {
  stopStoryTimer();
  const overlay = document.getElementById("story-viewer-overlay");
  const body = document.body;
  if (overlay) {
    overlay.classList.remove("fade-in");
    overlay.style.display = "none";
  }
  body.classList.remove("modal-open");
  
  // Remover escuchador de teclado para liberar recursos
  window.removeEventListener("keydown", handleStoryKeyboardNav);

  // Si se cerró explícitamente (no por el botón atrás), devolvemos el historial a su estado previo
  if (triggerHistoryBack && window.history.state && window.history.state.storyViewerActive) {
    window.history.back();
  }

  // Refrescar estado visto en la barra horizontal de círculos
  const circles = document.querySelectorAll(".story-circle-item");
  const viewedIds = getViewedStories();
  circles.forEach(circle => {
    const id = circle.dataset.id;
    if (viewedIds.includes(id)) {
      circle.classList.add("viewed");
    }
  });
}

/**
 * Manejador de eventos de teclado global para historias (Cumplimiento WCAG 2.1)
 */
function handleStoryKeyboardNav(e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeStoryViewer();
  } else if (e.key === "ArrowRight") {
    advanceStory();
  } else if (e.key === "ArrowLeft") {
    regressStory();
  }
}

/**
 * Pausa la reproducción de la historia (util cuando se mantiene presionado)
 */
function pauseStory() {
  storyPaused = true;
}

/**
 * Reanuda la reproducción de la historia
 */
function resumeStory() {
  storyPaused = false;
  storyLastTickTime = Date.now();
}

/**
 * Configura los eventos de clic / gestos para interactuar con la historia
 */
function setupStoryControls() {
  if (controlsInitialized) return;
  const container = document.getElementById("story-viewer-container");
  if (!container) return;
  controlsInitialized = true;

  // 1. GESTOS TÁCTILES - ARRASCAR HACIA ABAJO PARA CERRAR (Drag down to dismiss)
  container.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    isDraggingStory = true;
    container.style.transition = "none";
    pauseStory();
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    if (!isDraggingStory) return;
    touchCurrentY = e.touches[0].clientY;
    const diffY = touchCurrentY - touchStartY;
    
    // Solo permitir arrastre hacia abajo
    if (diffY > 0) {
      container.style.transform = `translateY(${diffY}px)`;
      // Atenuar fondo en base a la distancia de arrastre
      const opacity = Math.max(0.4, 0.95 - (diffY / 800));
      document.getElementById("story-viewer-overlay").style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    }
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    if (!isDraggingStory) return;
    isDraggingStory = false;
    container.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
    
    const diffY = touchCurrentY - touchStartY;
    
    if (diffY > 150) {
      // Arrastre suficiente para cerrar
      container.style.transform = "translateY(100%)";
      setTimeout(() => {
        container.style.transform = "none";
        closeStoryViewer();
      }, 250);
    } else {
      // Rebotar al centro
      container.style.transform = "translateY(0px)";
      document.getElementById("story-viewer-overlay").style.backgroundColor = "rgba(0, 0, 0, 0.95)";
      resumeStory();
    }
  });

  // Pausar y reanudar con mouse también
  container.addEventListener("mousedown", () => {
    pauseStory();
  });
  container.addEventListener("mouseup", () => {
    resumeStory();
  });
}

/**
 * Configura los eventos específicos de tap en áreas izquierda y derecha
 */
function setupTapEvents() {
  const leftTap = document.querySelector(".story-nav-left");
  const rightTap = document.querySelector(".story-nav-right");
  const actionLink = document.getElementById("story-action-link");

  if (leftTap) {
    leftTap.addEventListener("click", (e) => {
      e.stopPropagation();
      regressStory();
    });
  }

  if (rightTap) {
    rightTap.addEventListener("click", (e) => {
      e.stopPropagation();
      advanceStory();
    });
  }

  // Prevenir que clics en el botón de acción gatillen navegación
  if (actionLink) {
    actionLink.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}

/* ==========================================================================
   MÉTODOS DE LOCAL STORAGE PARA VISTA
   ========================================================================== */

function getViewedStories() {
  try {
    const list = localStorage.getItem(VIEWED_STORIES_KEY);
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

function markStoryAsViewed(storyId) {
  try {
    const viewed = getViewedStories();
    if (!viewed.includes(storyId)) {
      viewed.push(storyId);
      localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(viewed));
    }
  } catch (e) {
    console.error("Error guardando historia vista:", e);
  }
}

// Escuchador global de retroceso del navegador/móvil para cerrar historias sin salir de la web
window.addEventListener("popstate", (e) => {
  const overlay = document.getElementById("story-viewer-overlay");
  if (overlay && overlay.style.display === "flex") {
    closeStoryViewer(false);
  }
});

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
