'use strict';
// Guarda la foto original en esta ruta para usarla en la animación.
// El texto del estudio permite entrar al juego aunque todavía no esté la foto.
(() => {
    const image = document.getElementById('brandImage');
    const fallback = document.getElementById('brandFallback');
    image.addEventListener('load', () => {
        image.hidden = false;
        fallback.hidden = true;
    });
    image.src = 'assets/brand/ricochet.jpg';
})();
