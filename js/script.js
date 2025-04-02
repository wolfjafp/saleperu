// Función autoejecutable para encapsular el código
(function() {
    'use strict';

    // --- Variables Constantes ---
    // Número de WhatsApp SIN el '+' inicial. Solo código de país y número.
    // ¡ASEGÚRATE QUE ESTE NÚMERO SEA EL CORRECTO!
    const WHATSAPP_NUMBER = '51928743177'; // Número actual en tu código
    const PREFILLED_MESSAGE_HEADER = "¡Hola Sale Peru! 👋 Te escribo desde la web:";

    // --- Selectores de Elementos Comunes ---
    // Es buena práctica obtener los elementos una sola vez si se usan repetidamente
    const currentYearElement = document.getElementById('current-year');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    // Selectores específicos para la página de contacto (si existe)
    const contactForm = document.getElementById('contact-form'); // Podría ser null si no es la pág de contacto
    const formFeedback = document.getElementById('form-feedback'); // Podría ser null

    // --- Funciones ---

    /**
     * Actualiza el año en el elemento del footer.
     * Se asegura que el elemento exista antes de intentar modificarlo.
     */
    function updateFooterYear() {
        if (currentYearElement) {
            try {
                currentYearElement.textContent = new Date().getFullYear();
            } catch (error) {
                console.error("Error actualizando el año en el footer:", error);
            }
        }
    }

    /**
     * Alterna la visibilidad del menú de navegación móvil.
     * Gestiona clases y atributos ARIA.
     */
    function toggleMobileMenu() {
        // Verificar que ambos elementos necesarios existan
        if (!mainNav || !mobileMenuToggle) {
            console.warn("Elementos del menú móvil no encontrados.");
            return;
        }
        try {
            mainNav.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i'); // Asume que siempre hay un <i> dentro
            const isExpanded = mainNav.classList.contains('active');

            if (icon) { // Comprobar si se encontró el icono
                icon.classList.toggle('fa-bars', !isExpanded);
                icon.classList.toggle('fa-times', isExpanded);
            }
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded);

        } catch (error) {
            console.error("Error al alternar el menú móvil:", error);
        }
    }

    /**
     * Maneja el envío del formulario de contacto.
     * Prepara y abre el enlace de WhatsApp con los datos.
     * @param {Event} event - El evento de envío del formulario.
     */
    function handleContactFormSubmit(event) {
        event.preventDefault(); // Prevenir el envío normal del formulario

        // Salir si no estamos en la página de contacto o falta el feedback
        if (!contactForm || !formFeedback) {
             console.warn("Formulario de contacto o elemento de feedback no encontrado.");
             return;
        }

        try {
            // Limpiar feedback anterior
            formFeedback.textContent = '';
            formFeedback.className = 'form-feedback'; // Reset class

            // Obtener datos del formulario de forma segura
            const name = contactForm.elements['name']?.value?.trim() ?? '';
            const email = contactForm.elements['email']?.value?.trim() ?? '';
            const country = contactForm.elements['country']?.value?.trim() ?? '';
            const message = contactForm.elements['message']?.value?.trim() ?? '';

            // Validación simple (igual que la tuya, efectiva para UX básica)
            if (!name || !email || !country || !message) {
                formFeedback.textContent = '¡Uy! Parece que faltan algunos datos. Porfa, completa todo.';
                formFeedback.classList.add('error');
                // Intentar enfocar el primer campo vacío (buena práctica)
                 const firstEmptyOrInvalidField = contactForm.querySelector('input:invalid, textarea:invalid, input[value=""]:not(:disabled), textarea:empty:not(:disabled)');
                if (firstEmptyOrInvalidField) {
                    firstEmptyOrInvalidField.focus();
                }
                return;
            }

            // Construir el mensaje pre-llenado para WhatsApp
            // Usar saltos de línea literales mejora legibilidad
            const whatsappMessage = `${PREFILLED_MESSAGE_HEADER}

*Nombre:* ${name}
*Email:* ${email}
*País:* ${country}

*Mensaje:*
${message}`;

            // Codificar el mensaje para la URL
            const encodedMessage = encodeURIComponent(whatsappMessage);

            // Crear el enlace de WhatsApp asegurando que el número sea correcto
            // Tu limpieza de número ya es robusta
            const cleanPhoneNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
            if (!cleanPhoneNumber) {
                 console.error("Número de WhatsApp no válido después de limpiar:", WHATSAPP_NUMBER);
                 formFeedback.textContent = 'Error configurando el enlace de contacto. Intenta más tarde.';
                 formFeedback.classList.add('error');
                 return;
            }
            const whatsappURL = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

            // Mostrar feedback de éxito y abrir WhatsApp
            formFeedback.textContent = '¡Listo! Abriendo WhatsApp para que envíes tu mensaje... 🚀';
            formFeedback.classList.add('success');

            // Abrir WhatsApp
            // window.location.href es generalmente preferible a window.open para wa.me
            window.location.href = whatsappURL;

            // Consideración: Si la redirección a WhatsApp falla (p.ej., bloqueador de popups muy agresivo, aunque href debería funcionar)
            // el formulario quedaría lleno. Resetearlo podría ser útil, pero también podría borrar datos si el usuario vuelve atrás.
            // Dejarlo como está (sin reset automático) suele ser seguro.

        } catch (error) {
            console.error("Error procesando el formulario de contacto:", error);
            formFeedback.textContent = 'Ocurrió un error inesperado al procesar tu mensaje.';
            formFeedback.classList.add('error');
        }
    }

    // --- Inicialización y Event Listeners ---

    // Ejecutar al cargar el DOM
    document.addEventListener('DOMContentLoaded', () => {
        updateFooterYear();

        // Listener para el botón del menú móvil (si existe)
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        } else {
            // Solo un aviso si no se encuentra, no es un error crítico si no hay menú móvil en una página
             // console.info("Botón de menú móvil no encontrado en esta página.");
        }

        // Listener para el formulario de contacto (si existe en la página actual)
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
        }
        // No es necesario un 'else' aquí, es normal que el form no esté en todas las páginas

        // Mantengo tu log de inicialización
        console.log("Sale Peru script initialized (v2).");
    });

})(); // Fin de la función autoejecutable