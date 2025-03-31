document.addEventListener('DOMContentLoaded', function() {

    // Actualizar año en el footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Lógica del Banner de Cookies
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptButton = document.getElementById('accept-cookies');

    // Verifica si la cookie de consentimiento ya existe
    if (!getCookie('cookieConsentAccepted')) {
        if(cookieBanner) cookieBanner.style.display = 'flex'; // Muestra el banner si no hay cookie
    }

    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            // Establece una cookie que expira en 1 año
            setCookie('cookieConsentAccepted', 'true', 365);
            if(cookieBanner) cookieBanner.style.display = 'none'; // Oculta el banner
        });
    }

    // Funciones auxiliares para cookies
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; // Añadido SameSite=Lax
    }

    function getCookie(name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

});