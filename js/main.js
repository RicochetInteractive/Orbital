// Arranque. Debe cargarse después de todos los sistemas del juego.
'use strict';
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
reset();
requestAnimationFrame(frame);
