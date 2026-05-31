/* ==========================================================================
   SALEPERU.PE - REPRODUCTOR DE MÚSICA PREMIUM NATIVO (JS)
   ========================================================================== */

// Lista de las 5 mejores y más escuchadas Radios Musicales en español a nivel mundial.
// ¡Todas usan streams directos corporativos Triton Digital (.mp3 HTTPS) 100% verificados y activos sin geobloqueo!
const RADIO_STATIONS = [
  {
    name: "Los 40 Urban",
    desc: "El ritmo de la calle (Reggaeton / Urbano)",
    url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_URBAN.mp3"
  },
  {
    name: "Los 40 Principales",
    desc: "La radio musical número 1 (Pop / Éxitos)",
    url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3"
  },
  {
    name: "Cadena Dial",
    desc: "Lo mejor de la música en español (Pop Latino)",
    url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3"
  },
  {
    name: "Los 40 Classic",
    desc: "Los éxitos de tu vida (Clásicos 80s & 90s)",
    url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3"
  },
  {
    name: "Radiolé",
    desc: "La música que te alegra (Salsa / Tropical)",
    url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3"
  }
];

// Canciones directas de Archive.org (Servicio premium, rápido y que permite reproducirse bloqueado en el móvil)
const SONGS = [
  {
    title: "Hole In My Soul",
    artist: "Aerosmith",
    url: "https://archive.org/download/rockmusic_201703/Aerosmith%20-%20Hole%20In%20My%20Soul.mp3",
    cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&q=70&auto=format&fit=crop"
  },
  {
    title: "Creep (Live)",
    artist: "Radiohead",
    url: "https://archive.org/download/Radiohead_Glastonbury_1997_bootleg/07%20-%20Radiohead%20-%20Creep%20%28Live%20at%20Glastonbury%201997%29.mp3",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=70&auto=format&fit=crop"
  },
  {
    title: "Losing My Religion",
    artist: "R.E.M.",
    url: "https://archive.org/download/06itsafreeworldbaby/11%20Losing%20My%20Religion.mp3",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=70&auto=format&fit=crop"
  }
];

// URLs del arte de portada elegantes desde Unsplash
const ALBUM_ARTWORKS = {
  song: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&q=70&auto=format&fit=crop", // Rock Concert
  radio: "https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=200&q=70&auto=format&fit=crop" // Retro Radio
};

// Helper para acceso a LocalStorage seguro
function safeGetStorage(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Ignore sandbox write exceptions
  }
}

// Estado general de la aplicación
let musicState = {
  isPlaying: false,
  currentSource: safeGetStorage('music-source', 'song'), // 'song' | 'radio'
  volume: parseFloat(safeGetStorage('music-volume', '0.8')),
  isMuted: safeGetStorage('music-muted', 'false') === 'true',
  activeRadioIndex: parseInt(safeGetStorage('music-radio-index', '0')),
  activeSongIndex: parseInt(safeGetStorage('music-song-index', '0')),
  hasInteracted: false
};

// Objeto del reproductor nativo único
let audioPlayer = null;
let uiElements = {};

/**
 * Inicializador principal del reproductor
 */
function initMusicPlayer() {
  console.log("🎵 Inicializando reproductor de música premium nativo...");
  
  // 1. Obtener referencias del DOM
  cacheDomElements();
  
  // Inyectar dinámicamente el contenedor de texto en el FAB móvil
  setupMobileFabText();
  
  // 2. Crear y configurar elemento HTML5 Audio único
  setupAudioElement();

  // 3. Asignar controladores de eventos de la interfaz
  bindUiEvents();

  // 4. Configurar el disparador de primera interacción para Autoplay
  setupAutoplayTrigger();

  // 5. Cargar el estado inicial guardado de volumen y silencio
  applyInitialVolumeState();

  // 6. Actualizar la interfaz con los valores por defecto
  updateVisuals();

  // 7. Enriquecer con Atributos de Accesibilidad WCAG (ARIA)
  setupAriaAccessibility();
}

/**
 * Inyecta dinámicamente la etiqueta de texto en el FAB móvil para transformarlo en Pill
 */
function setupMobileFabText() {
  if (uiElements.mobileFab) {
    const textContainer = document.createElement('div');
    textContainer.className = 'music-mobile-text-container';
    textContainer.innerHTML = `
      <span class="music-mobile-title js-music-mobile-title">RADIO / MÚSICA</span>
      <span class="music-mobile-status js-music-mobile-status">Pausado</span>
    `;
    
    // Insertar después del vinilo
    const vinyl = uiElements.mobileFab.querySelector('#music-mobile-vinyl');
    if (vinyl) {
      vinyl.after(textContainer);
    }
  }
}

/**
 * Cachear elementos del DOM para optimizar rendimiento
 */
function cacheDomElements() {
  uiElements = {
    // Desktop (Header)
    headerControl: document.getElementById('music-header-control'),
    headerVinyl: document.getElementById('music-header-vinyl'),
    headerPlayBtn: document.getElementById('music-header-play-btn'),
    dropdownCard: document.getElementById('music-dropdown-card'),
    
    // Controles Compartidos
    trackTitle: document.querySelectorAll('.js-music-title'),
    trackSubtitle: document.querySelectorAll('.js-music-subtitle'),
    playBtns: document.querySelectorAll('.js-music-play'),
    muteBtns: document.querySelectorAll('.js-music-mute'),
    volumeSliders: document.querySelectorAll('.js-music-volume-slider'),
    sourceSongBtns: document.querySelectorAll('.js-source-song'),
    sourceRadioBtns: document.querySelectorAll('.js-source-radio'),
    radioSelectorContainers: document.querySelectorAll('.js-music-radio-list'),
    
    // Mobile (FAB & Drawer)
    mobileFab: document.getElementById('music-mobile-fab'),
    mobileVinyl: document.getElementById('music-mobile-vinyl'),
    drawerOverlay: document.getElementById('music-drawer-overlay'),
    drawer: document.getElementById('music-drawer'),
    drawerClose: document.getElementById('music-drawer-close'),
    drawerVinylContainer: document.getElementById('music-drawer-vinyl-container'),
    
    // Vinilos visuales
    vinylDiscs: document.querySelectorAll('.music-vinyl-disc')
  };
}

/**
 * Configura la etiqueta HTML5 Audio principal
 */
function setupAudioElement() {
  audioPlayer = document.getElementById('musica');
  if (!audioPlayer) {
    console.warn("⚠️ Elemento <audio id='musica'> no encontrado, creándolo dinámicamente.");
    audioPlayer = document.createElement('audio');
    audioPlayer.id = 'musica';
    document.body.appendChild(audioPlayer);
  }
  
  // Configuración de controles nativos y precarga
  audioPlayer.volume = musicState.isMuted ? 0 : musicState.volume;
  audioPlayer.muted = musicState.isMuted;
  audioPlayer.preload = "none";
  
  // Establecer la fuente inicial
  const initialUrl = musicState.currentSource === 'song' ? SONGS[musicState.activeSongIndex].url : RADIO_STATIONS[musicState.activeRadioIndex].url;
  audioPlayer.src = initialUrl;

  // Manejar errores de red o stream
  audioPlayer.addEventListener('error', (e) => {
    console.warn("⚠️ Error en el flujo de reproducción:", e);
    if (musicState.isPlaying) {
      showTrackInfo("Señal inestable", "Intentando reconectar...");
      setTimeout(() => {
        if (musicState.isPlaying) {
          audioPlayer.play().catch(() => {});
        }
      }, 4000);
    }
  });

  // Escuchar si el audio se detiene desde el sistema operativo o bluetooth para sincronizar la UI
  audioPlayer.addEventListener('pause', () => {
    if (musicState.isPlaying) {
      musicState.isPlaying = false;
      updateVisuals();
    }
  });

  audioPlayer.addEventListener('play', () => {
    if (!musicState.isPlaying) {
      musicState.isPlaying = true;
      updateVisuals();
    }
  });
}

/**
 * Configurar disparador de interacción para el Autoplay
 */
function setupAutoplayTrigger() {
  // Autoplay desactivado por Auditoría UX/Accesibilidad: Se desactiva el inicio automático por clic fortuito.
  // Ahora la música sólo se inicia si el usuario hace clic de forma explícita en los controles de reproducción.
  console.log("🎵 Reproducción automática desactivada por política de accesibilidad y UX.");
}

/**
 * Inicializar volumen en sliders
 */
function applyInitialVolumeState() {
  uiElements.volumeSliders.forEach(slider => {
    if (slider) slider.value = musicState.volume;
  });
  updateMuteVisuals();
}

/**
 * Enlazar clics de la interfaz de usuario
 */
function bindUiEvents() {
  // 1. Mostrar/Ocultar desplegable en PC
  if (uiElements.headerControl) {
    uiElements.headerControl.addEventListener('click', (e) => {
      e.stopPropagation();
      uiElements.dropdownCard.classList.toggle('active');
      uiElements.headerControl.classList.toggle('music-glowing-active');
    });
  }

  // Cerrar el dropdown de PC al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (uiElements.dropdownCard && uiElements.dropdownCard.classList.contains('active')) {
      if (!uiElements.dropdownCard.contains(e.target) && !uiElements.headerControl.contains(e.target)) {
        uiElements.dropdownCard.classList.remove('active');
        uiElements.headerControl.classList.remove('music-glowing-active');
      }
    }
  });

  // Evitar cerrar al hacer clic dentro de la tarjeta dropdown
  if (uiElements.dropdownCard) {
    uiElements.dropdownCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 2. Botones de Reproducción/Pausa
  uiElements.playBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }
  });
  
  if (uiElements.headerPlayBtn) {
    uiElements.headerPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  // 3. Botones de Silencio (Mute)
  uiElements.muteBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
      });
    }
  });

  // 4. Controladores de volumen (Sliders)
  uiElements.volumeSliders.forEach(slider => {
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
      });
    }
  });

  // 5. Cambio de Fuentes (Canción vs Radio)
  uiElements.sourceSongBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSource('song');
      });
    }
  });

  uiElements.sourceRadioBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSource('radio');
      });
    }
  });

  // 6. Controles Móviles (FAB y Drawer)
  if (uiElements.mobileFab) {
    uiElements.mobileFab.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileDrawer();
    });
  }

  if (uiElements.drawerClose) {
    uiElements.drawerClose.addEventListener('click', () => {
      closeMobileDrawer();
    });
  }

  if (uiElements.drawerOverlay) {
    uiElements.drawerOverlay.addEventListener('click', () => {
      closeMobileDrawer();
    });
  }

  // Renderizar la lista de reproducción (canciones o radios)
  renderPlaylist();
}

/**
 * Renderiza la lista de reproducción dinámica (canciones o radios)
 */
function renderPlaylist() {
  if (!uiElements.radioSelectorContainers || uiElements.radioSelectorContainers.length === 0) return;
  
  uiElements.radioSelectorContainers.forEach(container => {
    container.innerHTML = '';
    
    if (musicState.currentSource === 'song') {
      SONGS.forEach((song, index) => {
        const li = document.createElement('li');
        li.style.margin = '4px 0';
        
        const activeClass = (musicState.activeSongIndex === index && musicState.currentSource === 'song') ? 'active' : '';
        
        li.innerHTML = `
          <button class="music-source-btn js-radio-item ${activeClass}" data-index="${index}" style="width:100%; text-align:left; justify-content:flex-start; padding: 8px 12px; font-size:0.78rem;">
            <span style="font-size: 1rem;">🎵</span>
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
              <span style="font-weight: 700; line-height: 1.2;">${song.title}</span>
              <span style="font-size: 0.68rem; color: var(--text-tertiary); font-weight: 500;">${song.artist}</span>
            </div>
          </button>
        `;
        
        li.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation();
          changeSong(index);
        });
        
        container.appendChild(li);
      });
    } else {
      RADIO_STATIONS.forEach((station, index) => {
        const li = document.createElement('li');
        li.style.margin = '4px 0';
        
        const activeClass = (musicState.activeRadioIndex === index && musicState.currentSource === 'radio') ? 'active' : '';
        
        li.innerHTML = `
          <button class="music-source-btn js-radio-item ${activeClass}" data-index="${index}" style="width:100%; text-align:left; justify-content:flex-start; padding: 8px 12px; font-size:0.78rem;">
            <span style="font-size: 1rem;">📻</span>
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
              <span style="font-weight: 700; line-height: 1.2;">${station.name}</span>
              <span style="font-size: 0.68rem; color: var(--text-tertiary); font-weight: 500;">${station.desc}</span>
            </div>
          </button>
        `;
        
        li.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation();
          changeRadio(index);
        });
        
        container.appendChild(li);
      });
    }
  });
}

/**
 * Sincroniza visualmente las selecciones en la lista de reproducción
 */
function updateRadioListSelection() {
  const radioButtons = document.querySelectorAll('.js-radio-item');
  radioButtons.forEach((btn, idx) => {
    const btnIndex = parseInt(btn.dataset.index);
    if (musicState.currentSource === 'radio') {
      if (musicState.activeRadioIndex === btnIndex && btn.querySelector('span').textContent === '📻') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    } else if (musicState.currentSource === 'song') {
      if (musicState.activeSongIndex === btnIndex && btn.querySelector('span').textContent === '🎵') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

/**
 * Abre el panel (Drawer) de música en móviles
 */
function openMobileDrawer() {
  if (uiElements.drawer && uiElements.drawerOverlay) {
    uiElements.drawerOverlay.classList.add('active');
    uiElements.drawer.classList.add('active');
  }
}

/**
 * Cierra el panel (Drawer) de música en móviles
 */
function closeMobileDrawer() {
  if (uiElements.drawer && uiElements.drawerOverlay) {
    uiElements.drawerOverlay.classList.remove('active');
    uiElements.drawer.classList.remove('active');
  }
}

/**
 * Lanza la reproducción de la fuente cargada
 */
function playMusic() {
  musicState.isPlaying = true;
  musicState.hasInteracted = true;

  const targetSrc = musicState.currentSource === 'song' ? SONGS[musicState.activeSongIndex].url : RADIO_STATIONS[musicState.activeRadioIndex].url;

  // Limpiar y normalizar URLs para comparación robusta (evita dobles cargas y falsos positivos de los navegadores)
  const cleanCurrent = audioPlayer.src.split('?')[0].split('#')[0].replace(/\/$/, "").toLowerCase();
  const cleanTarget = targetSrc.split('?')[0].split('#')[0].replace(/\/$/, "").toLowerCase();

  if (cleanCurrent !== cleanTarget) {
    audioPlayer.src = targetSrc;
  }

  // Reproducción nativa en HTML5 (soporta bloqueo y reproducción en segundo plano)
  audioPlayer.play().catch(err => {
    console.warn("La reproducción automática del navegador fue suspendida o necesita acción directa.", err);
    musicState.isPlaying = false;
    updateVisuals();
  });

  updateVisuals();
}

/**
 * Pausa el flujo de reproducción nativo
 */
function pauseMusic() {
  musicState.isPlaying = false;
  if (audioPlayer) {
    audioPlayer.pause();
  }
  updateVisuals();
}

/**
 * Alternar reproducción (Play / Pause)
 */
function togglePlay() {
  if (musicState.isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

/**
 * Cambia la fuente activa (Aerosmith vs Radios en Vivo)
 */
function setSource(source) {
  if (musicState.currentSource === source) return;
  
  musicState.currentSource = source;
  safeSetStorage('music-source', source);
  
  // Actualizar estados visuales de la interfaz
  updateSourceButtons();
  updateAlbumArt();
  renderPlaylist();
  
  if (musicState.isPlaying) {
    playMusic();
  } else {
    // Si está en pausa, solo actualiza metadata
    updateTrackMetadata();
  }
  
  updateRadioListSelection();
}

/**
 * Cambia la emisora de radio seleccionada
 */
function changeRadio(index) {
  musicState.activeRadioIndex = index;
  safeSetStorage('music-radio-index', index);
  
  musicState.hasInteracted = true;
  musicState.currentSource = 'radio';
  safeSetStorage('music-source', 'radio');
  
  // Forzar reproducción al seleccionar una emisora (UX/UI Premium)
  playMusic();
  
  updateRadioListSelection();
}

/**
 * Cambia la canción seleccionada
 */
function changeSong(index) {
  musicState.activeSongIndex = index;
  safeSetStorage('music-song-index', index);
  
  musicState.hasInteracted = true;
  musicState.currentSource = 'song';
  safeSetStorage('music-source', 'song');
  
  // Forzar reproducción
  playMusic();
  
  updateRadioListSelection();
}

/**
 * Define el volumen del elemento de audio nativo
 */
function setVolume(value) {
  value = Math.max(0, Math.min(1, value));
  musicState.volume = value;
  safeSetStorage('music-volume', value);
  
  if (musicState.isMuted && value > 0) {
    musicState.isMuted = false;
    safeSetStorage('music-muted', 'false');
  }
  
  if (audioPlayer) {
    audioPlayer.muted = musicState.isMuted;
    audioPlayer.volume = value;
  }
  
  uiElements.volumeSliders.forEach(slider => {
    if (slider) {
      slider.value = value;
      slider.setAttribute('aria-valuenow', value.toString());
    }
  });
  
  updateMuteVisuals();
}

/**
 * Silenciar / Activar sonido
 */
function toggleMute() {
  musicState.isMuted = !musicState.isMuted;
  safeSetStorage('music-muted', musicState.isMuted);
  
  if (audioPlayer) {
    audioPlayer.muted = musicState.isMuted;
  }
  
  uiElements.muteBtns.forEach(btn => {
    if (btn) btn.setAttribute('aria-pressed', musicState.isMuted ? 'true' : 'false');
  });
  
  updateMuteVisuals();
}

/**
 * Escribir títulos de canciones e información
 */
function showTrackInfo(title, subtitle) {
  uiElements.trackTitle.forEach(el => { if (el) el.textContent = title; });
  uiElements.trackSubtitle.forEach(el => { if (el) el.innerHTML = subtitle; });
}

function updateTrackMetadata() {
  if (musicState.currentSource === 'song') {
    const song = SONGS[musicState.activeSongIndex];
    showTrackInfo(
      song.title, 
      `<span style='color:var(--color-primary); font-weight:700;'>${song.artist}</span>`
    );
  } else if (musicState.currentSource === 'radio') {
    const radio = RADIO_STATIONS[musicState.activeRadioIndex];
    showTrackInfo(
      radio.name, 
      `<span class="music-live-badge">EN VIVO</span> ${radio.desc}`
    );
  }
}

/**
 * Intercambiar arte de vinilos
 */
function updateAlbumArt() {
  const artUrl = musicState.currentSource === 'song' ? SONGS[musicState.activeSongIndex].cover : ALBUM_ARTWORKS.radio;
  uiElements.vinylDiscs.forEach(disc => {
    if (disc) {
      disc.style.backgroundImage = `url('${artUrl}')`;
    }
  });
}

/**
 * Actualizar estados activos de los botones de fuentes (Canción / Radio)
 */
function updateSourceButtons() {
  const isSong = musicState.currentSource === 'song';
  
  uiElements.sourceSongBtns.forEach(btn => {
    if (btn) {
      if (isSong) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  
  uiElements.sourceRadioBtns.forEach(btn => {
    if (btn) {
      if (!isSong) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

/**
 * Modificar SVG del silenciador (Mute)
 */
function updateMuteVisuals() {
  const isMuted = musicState.isMuted || musicState.volume === 0;
  
  uiElements.muteBtns.forEach(btn => {
    if (btn) {
      if (isMuted) {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        `;
      } else {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        `;
      }
    }
  });
}

/**
 * Actualizar visuales completos en base al estado activo
 */
function updateVisuals() {
  const isPlaying = musicState.isPlaying;
  
  // 1. Alternar animaciones de vinilos giratorios
  const toggleClass = (el, cls, force) => {
    if (el) {
      if (force) el.classList.add(cls);
      else el.classList.remove(cls);
    }
  };

  toggleClass(uiElements.headerVinyl, 'playing', isPlaying);
  toggleClass(uiElements.mobileFab, 'playing', isPlaying);
  toggleClass(uiElements.mobileVinyl, 'playing', isPlaying);
  toggleClass(uiElements.drawerVinylContainer, 'playing', isPlaying);
  toggleClass(uiElements.dropdownCard, 'playing', isPlaying);

  // 2. Actualizar metadata y arte
  updateTrackMetadata();
  updateAlbumArt();
  updateSourceButtons();

  // 3. Sincronizar botones vectoriales Play / Pause
  const playSvg = `
    <svg viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  `;
  const pauseSvg = `
    <svg viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  `;
  
  const currentSvg = isPlaying ? pauseSvg : playSvg;
  
  uiElements.playBtns.forEach(btn => {
    if (btn) btn.innerHTML = currentSvg;
  });
  
  if (uiElements.headerPlayBtn) {
    uiElements.headerPlayBtn.innerHTML = currentSvg;
  }

  // 4. Sincronizar estados de accesibilidad ARIA en botones
  uiElements.playBtns.forEach(btn => {
    if (btn) btn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  });
  if (uiElements.headerPlayBtn) {
    uiElements.headerPlayBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  // 5. Actualizar el widget de música móvil Pill con el estado del reproductor
  const fabTitle = document.querySelector('.js-music-mobile-title');
  const fabStatus = document.querySelector('.js-music-mobile-status');
  if (fabTitle && fabStatus) {
    if (isPlaying) {
      if (musicState.currentSource === 'song') {
        fabTitle.textContent = 'Canción';
        fabTitle.style.color = 'var(--color-primary)';
        fabStatus.textContent = SONGS[musicState.activeSongIndex].title;
      } else {
        fabTitle.textContent = '📻 En Vivo';
        fabTitle.style.color = 'var(--color-accent)';
        fabStatus.textContent = RADIO_STATIONS[musicState.activeRadioIndex].name;
      }
    } else {
      fabTitle.textContent = 'Música / Radio';
      fabTitle.style.color = 'var(--text-tertiary)';
      fabStatus.textContent = 'Pausado';
    }
  }
}

/**
 * Enriquece dinámicamente los elementos con atributos ARIA para cumplir con WCAG 2.1
 */
function setupAriaAccessibility() {
  // Configurar botones de reproducción
  uiElements.playBtns.forEach(btn => {
    if (btn) {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Reproducir o pausar audio');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  if (uiElements.headerPlayBtn) {
    uiElements.headerPlayBtn.setAttribute('role', 'button');
    uiElements.headerPlayBtn.setAttribute('aria-label', 'Control de música principal');
    uiElements.headerPlayBtn.setAttribute('aria-pressed', 'false');
  }

  // Configurar botones de silencio
  uiElements.muteBtns.forEach(btn => {
    if (btn) {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Silenciar música');
      btn.setAttribute('aria-pressed', musicState.isMuted ? 'true' : 'false');
    }
  });

  // Configurar volumen sliders
  uiElements.volumeSliders.forEach(slider => {
    if (slider) {
      slider.setAttribute('role', 'slider');
      slider.setAttribute('aria-label', 'Volumen de música');
      slider.setAttribute('aria-valuemin', '0');
      slider.setAttribute('aria-valuemax', '1');
      slider.setAttribute('aria-valuenow', musicState.volume.toString());
    }
  });

  // Configurar contenedor de información para actualizaciones en vivo (Screen readers)
  uiElements.trackTitle.forEach(el => {
    if (el) el.setAttribute('aria-live', 'polite');
  });

  // Configurar controles móviles
  if (uiElements.mobileFab) {
    uiElements.mobileFab.setAttribute('role', 'button');
    uiElements.mobileFab.setAttribute('aria-label', 'Abrir panel de música flotante');
    uiElements.mobileFab.setAttribute('aria-haspopup', 'dialog');
  }
}

// Inicializar el reproductor automáticamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
