// Función autoejecutable para encapsular el código
(function() {
    'use strict';

    // --- Variables Constantes ---
    // Número de WhatsApp SIN el '+' inicial. Solo código de país y número.
    // ¡ASEGÚRATE QUE ESTE NÚMERO SEA EL CORRECTO!
    const WHATSAPP_NUMBER = '51928743177'; // Número proporcionado
    const PREFILLED_MESSAGE_HEADER = "¡Hola Sale Peru! 👋 Te escribo desde la web:";

    // --- Selectores de Elementos Comunes ---
    const currentYearElement = document.getElementById('current-year');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');

    // --- Funciones ---

    /**
     * Actualiza el año en el elemento del footer.
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
        if (!mainNav || !mobileMenuToggle) {
            console.warn("Elementos del menú móvil no encontrados.");
            return;
        }
        try {
            const isExpanded = mainNav.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded.toString()); // Convertir a string
            const icon = mobileMenuToggle.querySelector('i');

            if (icon) {
                icon.classList.toggle('fa-bars', !isExpanded);
                icon.classList.toggle('fa-times', isExpanded);
            }

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

        if (!contactForm || !formFeedback) {
             console.warn("Formulario de contacto o elemento de feedback no encontrado.");
             return;
        }

        try {
            formFeedback.textContent = '';
            formFeedback.className = 'form-feedback';

            const name = contactForm.elements['name']?.value?.trim() ?? '';
            const email = contactForm.elements['email']?.value?.trim() ?? '';
            const country = contactForm.elements['country']?.value?.trim() ?? '';
            const message = contactForm.elements['message']?.value?.trim() ?? '';

            // Usar checkValidity() para validación HTML5 nativa + required
            if (!contactForm.checkValidity()) {
                formFeedback.textContent = '¡Uy! Parece que faltan datos o hay errores. Revisa los campos marcados.';
                formFeedback.classList.add('error');

                // Reportar validez para mostrar mensajes de error nativos (si el CSS los soporta)
                contactForm.reportValidity();

                // Enfocar el primer campo inválido
                const firstInvalidField = contactForm.querySelector(':invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                return;
            }


            // Construir el mensaje pre-llenado para WhatsApp
            const whatsappMessage = `${PREFILLED_MESSAGE_HEADER}

*Nombre:* ${name}
*Email:* ${email}
*País:* ${country}

*Mensaje:*
${message}`;

            const encodedMessage = encodeURIComponent(whatsappMessage);
            const cleanPhoneNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

            if (!cleanPhoneNumber) {
                 console.error("Número de WhatsApp no válido:", WHATSAPP_NUMBER);
                 formFeedback.textContent = 'Error configurando el enlace de contacto.';
                 formFeedback.classList.add('error');
                 return;
            }
            const whatsappURL = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

            formFeedback.textContent = '¡Listo! Abriendo WhatsApp para que envíes tu mensaje... 🚀';
            formFeedback.classList.add('success');

            // Usar window.open para intentar abrir en nueva pestaña/app
            // Es más robusto que location.href para wa.me en algunos casos
            const whatsappWindow = window.open(whatsappURL, '_blank');

             // Opcional: Resetear formulario después de un pequeño retraso
             // setTimeout(() => {
             //    contactForm.reset();
             // }, 1500);


        } catch (error) {
            console.error("Error procesando el formulario de contacto:", error);
            formFeedback.textContent = 'Ocurrió un error inesperado al procesar tu mensaje.';
            formFeedback.classList.add('error');
        }
    }

    // --- Inicialización y Event Listeners ---

    document.addEventListener('DOMContentLoaded', () => {
        updateFooterYear();

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            // Asegurarse que el nav no esté activo al cargar en móvil
            if (window.innerWidth <= 992 && mainNav) {
                mainNav.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                const icon = mobileMenuToggle.querySelector('i');
                 if(icon){
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                 }
            }
        }

        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
            // Quitar novalidate si queremos validación nativa del navegador antes del JS
            // contactForm.removeAttribute('novalidate');
            // O mantener novalidate y confiar en la validación JS + checkValidity()
        }

        console.log("Sale Peru script initialized (v3 - Consolidated).");
    });

})(); // Fin de la función autoejecutable   