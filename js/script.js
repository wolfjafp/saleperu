// Función autoejecutable para encapsular el código
(function() {
    'use strict';

    // --- Variables Constantes ---
    // Número de WhatsApp SIN el '+' inicial. Solo código de país y número.
    const WHATSAPP_NUMBER = '51928743177'; // <<< TU NÚMERO CORRECTO
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
            currentYearElement.textContent = new Date().getFullYear();
        }
    }

    /**
     * Alterna la visibilidad del menú de navegación móvil.
     */
    function toggleMobileMenu() {
        if (mainNav && mobileMenuToggle) {
            mainNav.classList.toggle('active');
            // Cambiar icono hamburguesa a X y viceversa
            const icon = mobileMenuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                mobileMenuToggle.setAttribute('aria-expanded', 'true');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        }
    }

    /**
     * Maneja el envío del formulario de contacto.
     * Prepara y abre el enlace de WhatsApp con los datos.
     * @param {Event} event - El evento de envío del formulario.
     */
    function handleContactFormSubmit(event) {
        event.preventDefault(); // Prevenir el envío normal del formulario

        if (!contactForm || !formFeedback) return;

        // Limpiar feedback anterior
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback'; // Reset class

        // Obtener datos del formulario
        const name = contactForm.elements['name'].value.trim();
        const email = contactForm.elements['email'].value.trim();
        const country = contactForm.elements['country'].value.trim();
        const message = contactForm.elements['message'].value.trim();

        // Validación simple
        if (!name || !email || !country || !message) {
            formFeedback.textContent = '¡Uy! Parece que faltan algunos datos. Porfa, completa todo.';
            formFeedback.classList.add('error');
            // Intentar enfocar el primer campo vacío
            const firstEmptyField = contactForm.querySelector('input:invalid, textarea:invalid');
            if (firstEmptyField) {
                firstEmptyField.focus();
            }
            return;
        }

        // Construir el mensaje pre-llenado para WhatsApp
        let whatsappMessage = `${PREFILLED_MESSAGE_HEADER}\n\n`;
        whatsappMessage += `*Nombre:* ${name}\n`; // Usando markdown básico de WhatsApp
        whatsappMessage += `*Email:* ${email}\n`;
        whatsappMessage += `*País:* ${country}\n\n`;
        whatsappMessage += `*Mensaje:*\n${message}`;

        // Codificar el mensaje para la URL
        const encodedMessage = encodeURIComponent(whatsappMessage);

        // Crear el enlace de WhatsApp asegurando que el número sea correcto
        // wa.me SÓLO quiere los dígitos.
        const cleanPhoneNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, ''); // Asegura solo dígitos
        const whatsappURL = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

        // Mostrar feedback de éxito y abrir WhatsApp
        formFeedback.textContent = '¡Listo! Abriendo WhatsApp para que envíes tu mensaje... 🚀';
        formFeedback.classList.add('success');

        // Abrir WhatsApp en una nueva pestaña
        // Usar window.location.href puede ser más compatible en algunos móviles que window.open
        // window.open(whatsappURL, '_blank');
        window.location.href = whatsappURL;


        // Opcional: Limpiar formulario después de un tiempo (quizás no sea necesario si redirige)
        // setTimeout(() => {
        //     if(contactForm) contactForm.reset();
        //     if(formFeedback) {
        //        formFeedback.textContent = '';
        //        formFeedback.className = 'form-feedback';
        //     }
        // }, 5000);
    }

    // --- Inicialización y Event Listeners ---

    // Ejecutar al cargar el DOM
    document.addEventListener('DOMContentLoaded', () => {
        updateFooterYear();

        // Listener para el botón del menú móvil
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }

        // Listener para el formulario de contacto (si existe en la página actual)
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
        }

        console.log("Sale Peru script initialized (v2).");
    });

})(); // Fin de la función autoejecutable