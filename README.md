# Órbita: frente de ceniza

Abre `index.html` para ver la portada animada y pulsa **Entrar al juego**.
También puedes abrir `game.html` directamente. No requiere instalación,
servidor ni conexión a internet.

## Organización

- `index.html`, `css/intro.css`, `js/intro.js`: portada del estudio.
- `game.html`: estructura de la interfaz y controles del juego.
- `css/game.css`: estilos del juego y adaptación a móviles.
- `js/stats.js`: estadísticas, costes, requisitos, roles, mejoras y bonificaciones.
- `js/state.js`: estado de la partida, referencias al DOM y dimensiones del mapa.
- `js/assets.js`, `assets/sprites/`: catálogo y 27 imágenes originales extraídas sin modificaciones.
- `js/world.js`: generación del terreno, recursos, aldeas y búsqueda de caminos.
- `js/entities.js`: creación de unidades/edificios, producción y compra de mejoras.
- `js/session.js`: reinicio y selección de facción.
- `js/ui.js`: recursos, reloj, mensajes, botones y estadísticas de selección.
- `js/combat.js`: combate, curación visual y transportes.
- `js/economy.js`: captura de yacimientos/aldeas e ingresos.
- `js/ai.js`: economía, construcción, producción y órdenes enemigas.
- `js/simulation.js`: actualización de la simulación por fotograma.
- `js/renderer.js`: cámara, zoom, dibujo del campo y minimapa.
- `js/controls.js`: ratón, pantalla táctil, teclado y acciones de interfaz.
- `js/main.js`: arranque del juego.

Los scripts del juego son clásicos con `defer`: comparten el mismo ámbito y se
ejecutan en el orden declarado en `game.html`, dejando el arranque al final.
Esto conserva la apertura mediante `file://`, sin `fetch` ni módulos ES que
necesiten un servidor. Para añadir lógica, carga su archivo antes de `main.js`.

## Logo de la portada

La foto original está incluida en `assets/brand/ricochet.jpg` y se muestra
automáticamente con la animación de entrada. Si la imagen no se puede cargar,
la portada muestra el nombre del estudio en texto.
La animación respeta la preferencia de movimiento
reducido del dispositivo y el enlace de entrada funciona sin JavaScript.

Los gráficos del juego conservan los créditos CC0 de Kenney en `game.html`.

## Comprobación de regresiones

Con Node.js disponible, ejecuta `node tests/regression.cjs`. La prueba compara
el juego separado con la revisión original de Git: arranque, tres facciones,
producción, mejoras, movimiento, simulación, reinicio y bytes de los sprites.
Usa un DOM y un canvas simulados en tamaños de móvil y escritorio; no sustituye
una revisión visual en un navegador. Requiere conservar el historial original
de este repositorio. Puedes pasar otra revisión original como primer argumento.
