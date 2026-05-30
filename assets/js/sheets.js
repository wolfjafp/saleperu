/* ==========================================================================
   SALEPERU.PE - INTEGRACIÓN DE DATOS CON GOOGLE SHEETS Y MOCK DATA
   ========================================================================== */

// ID de la Hoja de Cálculo (Ofuscado en Base64 para protegerlo de raspadores automáticos en GitHub)
const SPREADSHEET_ID = atob("MTNWQjY1eXA0YTUtTHR1VllRa0dOclQwZlBxcjFkeHdjRU5KRDVEWXM1Znc=");

// Claves de Almacenamiento en Caché
const CACHE_KEY = "saleperu_deals_cache";
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos de caché inteligente

/**
 * DATOS DE RESPALDO PREMIUM (MOCK DATA)
 * Se cargan automáticamente si no se ha configurado el Google Sheet,
 * si la red falla o para demostración rápida e instantánea.
 */
const MOCK_DATA = {
  stories: [
    {
      id: "ST-001",
      title: "Falabella 🔥",
      coverImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
      mediaType: "image",
      caption: "¡Cyber Falabella! Hasta 60% de descuento en Tecnología y Celulares.",
      offerLink: "#SP-001",
      expiration: "2026-12-31"
    },
    {
      id: "ST-002",
      title: "PlayStation 💥",
      coverImage: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=150&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",
      mediaType: "image",
      caption: "¡Error de Precio! PS5 Slim 1TB a solo S/. 1499 en Plaza Vea.",
      offerLink: "#SP-002",
      expiration: "2026-12-31"
    },
    {
      id: "ST-003",
      title: "Zapatillas ⚡",
      coverImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      mediaType: "image",
      caption: "Cupón Exclusivo de 30% en zapatillas Adidas seleccionadas en Ripley.",
      offerLink: "#SP-003",
      expiration: "2026-12-31"
    },
    {
      id: "ST-004",
      title: "Amazon Perú",
      coverImage: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=150&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&q=80",
      mediaType: "image",
      caption: "Envío GRATIS a Perú en miles de productos seleccionados de Amazon.",
      offerLink: "#SP-005",
      expiration: "2026-12-31"
    },
    {
      id: "ST-005",
      title: "Pasajes ✈️",
      coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=150&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
      mediaType: "image",
      caption: "Vuelos Cusco - Lima ida y vuelta por solo S/. 120 por SKY.",
      offerLink: "#SP-007",
      expiration: "2026-12-31"
    }
  ],
  offers: [
    {
      id: "SP-001",
      title: "iPhone 15 Pro Max 256GB - Titanio Natural",
      description: "Precio mínimo histórico en Falabella con tarjeta CMR. Garantía oficial de 1 año en Apple Perú. Envío gratuito en Lima Metropolitana.",
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
      category: "Tecnología",
      originalPrice: 6299,
      offerPrice: 4299,
      link: "https://www.falabella.com.pe",
      expiration: "2026-12-31",
      isHot: true,
      isFlash: false,
      isErrorPrice: false,
      couponCode: "",
      store: "Falabella"
    },
    {
      id: "SP-002",
      title: "Consola PlayStation 5 Slim 1TB + Juego Uncharted",
      description: "¡ERROR DE PRECIO EN PLAZA VEA! Precio normal es S/. 2499. Corre antes de que cancelen las compras o se agote el stock. Probablemente un error del sistema.",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",
      category: "Gaming",
      originalPrice: 2499,
      offerPrice: 1499,
      link: "https://www.plazavea.com.pe",
      expiration: "2026-12-31",
      isHot: false,
      isFlash: false,
      isErrorPrice: true,
      couponCode: "",
      store: "Plaza Vea"
    },
    {
      id: "SP-003",
      title: "Zapatillas Adidas Ultraboost Light - Hombre",
      description: "Aplica el cupón especial 'CORRE30' al finalizar la compra para obtener un 30% de descuento adicional sobre el precio de oferta en Ripley. Variedad de tallas.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      category: "Moda",
      originalPrice: 699,
      offerPrice: 349,
      link: "https://simple.ripley.com.pe",
      expiration: "2026-12-31",
      isHot: true,
      isFlash: true,
      isErrorPrice: false,
      couponCode: "CORRE30",
      store: "Ripley"
    },
    {
      id: "SP-004",
      title: "Smart TV LG OLED 55 pulgadas B3 4K HDR",
      description: "Excelente oportunidad para tener un televisor OLED. Ideal para gaming (120Hz, HDMI 2.1) y cine en casa. Solo por hoy en Oechsle online.",
      image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
      category: "Tecnología",
      originalPrice: 4999,
      offerPrice: 2899,
      link: "https://www.oechsle.pe",
      expiration: "2026-12-31",
      isHot: true,
      isFlash: false,
      isErrorPrice: false,
      couponCode: "",
      store: "Oechsle"
    },
    {
      id: "SP-005",
      title: "Audífonos Inalámbricos Sony WH-1000XM5 ANC",
      description: "Los mejores audífonos con cancelación de ruido activa del mercado. Precio rebajado en Amazon con envío gratuito y directo a Perú sin impuestos de importación.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      category: "Tecnología",
      originalPrice: 1499,
      offerPrice: 999,
      link: "https://www.amazon.com",
      expiration: "2026-12-31",
      isHot: false,
      isFlash: true,
      isErrorPrice: false,
      couponCode: "",
      store: "Amazon"
    },
    {
      id: "SP-006",
      title: "Xiaomi Redmi Note 13 Pro+ 5G 512GB / 12GB RAM",
      description: "Gran teléfono de gama media alta con cámara de 200MP y carga rápida de 120W. En AliExpress con envío premium a Perú. Utiliza cupones de tienda.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      category: "Tecnología",
      originalPrice: 1899,
      offerPrice: 1249,
      link: "https://es.aliexpress.com",
      expiration: "2026-12-31",
      isHot: false,
      isFlash: false,
      isErrorPrice: false,
      couponCode: "ES13PRO",
      store: "AliExpress"
    },
    {
      id: "SP-007",
      title: "Vuelos Cusco - Lima Ida y Vuelta - SKY Airline",
      description: "Oferta de pasajes aéreos para viajar en temporada baja. Incluye bolso de mano. Compras válidas hasta agotar stock de 50 asientos por tramo.",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
      category: "Viajes",
      originalPrice: 320,
      offerPrice: 120,
      link: "https://www.skyairline.com/peru",
      expiration: "2026-12-31",
      isHot: true,
      isFlash: false,
      isErrorPrice: false,
      couponCode: "",
      store: "SKY Airline"
    },
    {
      id: "SP-008",
      title: "Freidora de Aire Philips Essential HD9200 4.1L",
      description: "Cocina tus platos favoritos de forma saludable con hasta un 90% menos de grasa. Panel digital, fácil limpieza. Descuento exclusivo en Plaza Vea online.",
      image: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&q=80",
      category: "Hogar",
      originalPrice: 449,
      offerPrice: 229,
      link: "https://www.plazavea.com.pe",
      expiration: "2026-12-31",
      isHot: false,
      isFlash: false,
      isErrorPrice: false,
      couponCode: "",
      store: "Plaza Vea"
    }
  ]
};

/**
 * Parsea el JSON crudo del API de Google Sheets (GViz)
 * @param {string} text - Texto devuelto por el API GViz de Sheets
 * @returns {Array} Listado de objetos mapeados con los datos de las columnas
 */
function parseGoogleSheetsResponse(text) {
  try {
    // El API GViz responde con un wrapper js: google.visualization.Query.setResponse({...});
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Formato de respuesta de Google Sheets no válido.");
    }

    const jsonStr = text.substring(startIdx, endIdx + 1);
    const rawData = JSON.parse(jsonStr);

    if (rawData.status !== "ok") {
      throw new Error("Google Sheets devolvió un estatus de error: " + rawData.status);
    }

    const table = rawData.table;
    const cols = table.cols.map(c => c.label ? c.label.trim().toLowerCase() : "");
    const rows = table.rows;

    // Mapea dinámicamente las filas basadas en los labels de las columnas o índices por defecto
    return rows.map((row) => {
      const item = {};
      row.c.forEach((cell, idx) => {
        // En GViz, a veces las celdas nulas o vacías vienen como null
        let value = cell ? cell.v : "";

        // Si el valor es una fecha de Google (ej: "Date(2026,4,26)"), la convertimos a formato YYYY-MM-DD
        if (typeof value === "string" && value.startsWith("Date(")) {
          const parts = value.replace("Date(", "").replace(")", "").split(",");
          if (parts.length >= 3) {
            const year = parts[0];
            const month = String(Number(parts[1]) + 1).padStart(2, "0"); // En JS los meses son 0-11, en GViz también
            const day = String(Number(parts[2])).padStart(2, "0");
            value = `${year}-${month}-${day}`;
          }
        }

        // Asignar el valor según la etiqueta de la columna
        const colLabel = cols[idx];
        if (colLabel) {
          // Normalizar valores booleanos
          if (value === "TRUE" || value === "true" || value === true || value === 1) {
            value = true;
          } else if (value === "FALSE" || value === "false" || value === false || value === 0) {
            value = false;
          }
          item[colLabel] = value;
        } else {
          // Fallback por índice por si las columnas no tienen cabeceras explícitas
          item[`col_${idx}`] = value;
        }
      });
      return item;
    });
  } catch (err) {
    console.error("Error analizando datos de Google Sheets:", err);
    return null;
  }
}

/**
 * Función principal para obtener todos los datos (Offers y Stories)
 * Implementa caché local de 5 minutos y fallback a Mock Data.
 * @param {boolean} forceRefresh - Si es true, ignora la caché local
 * @returns {Promise<{offers: Array, stories: Array}>} Datos listos para pintar en el frontend
 */
async function loadAppData(forceRefresh = false) {
  // 1. Intentar cargar desde localStorage (Solo en producción y si coincide el ID del sheet)
  const isLocalDev = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" || 
                     window.location.protocol === "file:";

  if (!forceRefresh && !isLocalDev) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        // Validar que el ID del sheet en caché coincida con el ID actual en ejecución
        if (cacheData.sheetId === SPREADSHEET_ID) {
          const age = Date.now() - cacheData.timestamp;
          if (age < CACHE_EXPIRY_MS) {
            console.log("⚡ Cargando datos desde caché de LocalStorage...");
            return cacheData.data;
          }
        } else {
          console.log("🔄 El ID de Google Sheets cambió. Ignorando caché antigua...");
        }
      } catch (e) {
        console.error("Error leyendo caché, se re-solicitará:", e);
      }
    }
  }

  console.log("🌍 Consultando nuevos datos en vivo desde tu Google Sheets...");

  // 2. Realizar peticiones HTTP asíncronas a Google Sheets
  const urlOffers = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Offers`;
  const urlStories = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Stories`;

  try {
    const [resOffers, resStories] = await Promise.all([
      fetch(urlOffers).then(r => r.text()),
      fetch(urlStories).then(r => r.text())
    ]);

    const parsedOffers = parseGoogleSheetsResponse(resOffers);
    const parsedStories = parseGoogleSheetsResponse(resStories);

    if (parsedOffers && parsedOffers.length > 0) {
      // Mapear al modelo que el frontend espera
      const formattedOffers = parsedOffers.map(o => ({
        id: o.id || `SP-${Math.random().toString(36).substr(2, 9)}`,
        title: o.title || "Oferta sin título",
        description: o.description || "",
        image: o.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
        category: o.category || "Tecnología",
        originalPrice: Number(o.originalprice) || 0,
        offerPrice: Number(o.offerprice) || 0,
        link: o.link || "#",
        expiration: o.expiration || "",
        isHot: o.ishot === true || o.ishot === "TRUE",
        isFlash: o.isflash === true || o.isflash === "TRUE",
        isErrorPrice: o.iserrorprice === true || o.iserrorprice === "TRUE",
        couponCode: o.couponcode || "",
        store: o.store || "Tienda"
      }));

      const formattedStories = (parsedStories || []).map(s => ({
        id: s.id || `ST-${Math.random().toString(36).substr(2, 9)}`,
        title: s.title || "Historia",
        coverImage: s.coverimage || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150&q=80",
        mediaUrl: s.mediaurl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
        mediaType: s.mediatype || "image",
        caption: s.caption || "",
        offerLink: s.offerlink || "#",
        expiration: s.expiration || ""
      }));

      const appData = {
        offers: formattedOffers,
        stories: formattedStories
      };

      // Guardar en Caché
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          sheetId: SPREADSHEET_ID, // Guardar el ID activo para validación cruzada
          data: appData
        }));
      } catch (err) {
        console.warn("No se pudo guardar la caché en localStorage:", err);
      }

      return appData;
    } else {
      throw new Error("No se encontraron ofertas válidas en Google Sheets");
    }
  } catch (err) {
    console.warn("⚠️ Error obteniendo datos de Google Sheets. Usando MOCK_DATA como fallback. Detalle:", err.message);

    // Retornamos mock data si algo falla, pero no lo metemos en caché para intentar refrescar la próxima vez
    return MOCK_DATA;
  }
}
