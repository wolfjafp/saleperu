document.addEventListener('DOMContentLoaded', function() {

    // === Funcionalidad #1: Actualizar año en el footer ===
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // === Funcionalidad #2: Lógica del Banner de Cookies ===
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptButton = document.getElementById('accept-cookies');

    // Verifica si la cookie de consentimiento ya existe al cargar la página
    if (!getCookie('cookieConsentAccepted')) {
        // Si no existe la cookie, muestra el banner
        if(cookieBanner) {
            cookieBanner.style.display = 'flex'; // O 'block' según el diseño final del CSS
        }
    }

    // Añade el evento al botón de aceptar
    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            // Establece una cookie llamada 'cookieConsentAccepted' con valor 'true' que expira en 365 días
            setCookie('cookieConsentAccepted', 'true', 365);
            // Oculta el banner después de aceptar
            if(cookieBanner) {
                cookieBanner.style.display = 'none';
            }
        });
    }

    // --- Funciones auxiliares para manejar Cookies ---
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Se añade SameSite=Lax por seguridad y compatibilidad con navegadores modernos
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    function getCookie(name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }


    // === Funcionalidad #3: (Opcional) Animación suave de entrada para tarjetas sociales ===
    //      Para usar esto, necesitas descomentar las líneas correspondientes
    //      al final del archivo css/style.css (`opacity: 0;`, `transform: ...`, `transition: ...`)

    const socialCards = document.querySelectorAll('.social-card.banner-card'); // Selecciona las tarjetas banner

    // Verifica si hay tarjetas y si el navegador soporta IntersectionObserver
    if (socialCards.length > 0 && 'IntersectionObserver' in window) {
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // Si la tarjeta entra en el área visible
                if (entry.isIntersecting) {
                    // Aplica los estilos para mostrarla (revierte los iniciales del CSS)
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    // Deja de observar esta tarjeta para que no se anime de nuevo al scrollear
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Se activa cuando al menos el 10% de la tarjeta es visible
            // rootMargin: '0px 0px -50px 0px' // Opcional: ajustar cuándo se considera "visible"
        });

        // Inicializa cada tarjeta para la animación y empieza a observarla
        socialCards.forEach(card => {
            // ¡IMPORTANTE! Estos estilos iniciales deben coincidir con los que
            // descomentarías en el CSS si decides usar la animación.
            card.style.opacity = '0';          // Empieza invisible
            card.style.transform = 'translateY(20px)'; // Empieza ligeramente desplazada hacia abajo
            card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'; // Define la animación

            // Empieza a observar la tarjeta
            cardObserver.observe(card);
        });

    } else {
        // Si IntersectionObserver no es soportado o no hay tarjetas,
        // simplemente asegúrate de que todas las tarjetas sean visibles por defecto.
        // Esto previene que se queden invisibles si el CSS las oculta inicialmente
        // y el JS de animación no se ejecuta.
        socialCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }
    // === Fin de la Funcionalidad #3 (Opcional) ===

}); // Fin del 'DOMContentLoaded'