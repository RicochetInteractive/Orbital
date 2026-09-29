# Órbita · revisión de sistemas y presentación

## Dirección

Conservar las tres doctrinas, el escenario de ciencia ficción, minerales/plasma, los castillos como nodos de expansión, los tres rivales y el objetivo de destruir sus núcleos. La mejora se centra en decisiones legibles, órdenes fiables y consecuencias económicas. Los sprites existentes y sus atribuciones se conservan; el nuevo terreno y los cristales se dibujan por código.

## Referencias estudiadas

- **StarCraft:** órdenes diferenciadas, selección por tipo, grupos y reunión. Fuentes: [Blizzard — controles](https://classic.battle.net/scc/gs/control.shtml) y [órdenes de unidades](https://classic.battle.net/scc/GS/com.shtml).
- **Seven Kingdoms:** economía civil y conservación del territorio. La adaptación usa lealtad e impuestos de aldeas; no reproduce su diplomacia o espionaje. Fuente: [manual de Seven Kingdoms](https://www.7kfans.com/downloads/7kaa-manual.pdf).
- **Stronghold:** economía, apoyo de la población y desarrollo militar. La adaptación combina obras vulnerables y un coste político al exigir tributos; no introduce cadenas medievales de alimentos. Fuente: [Firefly — campaña económica y popularidad](https://fireflyworlds.com/2020/02/24/eco-campaign-reveal/).

Son referencias de diseño, no una reproducción de sus reglas, recursos gráficos o amplitud de contenido.

## Revisión punto por punto

| Área | Situación anterior | Cambio realizado |
| --- | --- | --- |
| Identidad | Escaramuza espacial con tres doctrinas | Conservada; selección de facción y consola con jerarquía más clara |
| Reclutamiento | Aparición instantánea para el jugador | Cinco encargos por centro; tiempos; cancelación con devolución |
| Suministro | Sólo unidades presentes | Reservas desde el encargo; bloqueo de salida al perder capacidad |
| Construcción | Edificios operativos al colocarlos | Obras de 15–24 s; salud parcial; progreso; desbloqueo al terminar |
| Expansión | Un castillo recién colocado permitía expandirse | Sólo núcleos y castillos operativos extienden la zona |
| Concentración | Destinos aleatorios muy próximos | Destinos distribuidos en filas; no formación rígida durante la marcha |
| Órdenes | Mover y atacar-mover se comportaban igual | Mover, avanzar atacando, detener y mantener posición |
| Grupos | Sólo selección global | Cinco grupos, atajos, centrar grupo y selección por tipo visible |
| Reunión | Salida no configurable | Reunión por centro, incluida extracción para los recolectores |
| Trabajadores | Inactivos al agotar un nodo | Buscan otro del mismo recurso a menos de 550; acceso a obreros libres |
| Artillería | Retroceso podía no mover la unidad | Retroceso efectivo; explosiones no dañan naves ni pasajeros |
| Transportes | Aproximación con paso temporal fijo | Aproximación con el tiempo de simulación |
| Aldeas | Ingreso fijo | Tres políticas, lealtad e independencia por abandono o tributo |
| IA | 12 suministros base frente a 10; obra curaba todo el daño | 10 para ambos; reserva en colas; conserva daño al finalizar obras |
| Pausa | No disponible | Botón, P, pausa al ocultar pestaña y recuperar partida |
| Persistencia | Recargar perdía todo | Ranura local con colas, órdenes, economía, grupos y transportes |
| Mapa | Colores planos, triángulos y fichas de recursos | Texturas, riberas, rocas facetadas, cristales, profundidad y caché |
| Información | Costes parciales, estados poco visibles | Costes completos, suministros, requisitos, progreso de misión y producción |
| Accesibilidad | Foco poco visible y mensajes sin región de estado | Foco visible, mensajes anunciables, pausa e instrucciones |
| Reinicio | Inmediato | Confirmación dentro del juego para evitar pérdidas accidentales |

## Verificación

Batería en Edge real sin ventana: **22 comprobaciones correctas**, incluyendo diez minutos de simulación y reconstrucción de un transporte cargado. Revisión visual en escritorio y en un marco móvil de 390 px. El terreno se precalcula una vez por mapa para evitar miles de trazos en cada fotograma.

Estas pruebas no sustituyen partidas extensas de equilibrio, una auditoría completa de accesibilidad ni pruebas táctiles en dispositivos físicos. Se comprobó la ejecución directa del navegador; el lanzador Node permite repetirla, pero Node no estaba instalado en el entorno de trabajo.

## Límites actuales

- Información global en mapa y minimapa: todavía no hay niebla de guerra.
- Sin diplomacia, espionaje, comercio, cadenas de alimentos, murallas ni puertas.
- Navegación A* sobre terreno, sin colisiones completas entre tropas y edificios. Los destinos en filas no sustituyen la separación física.
- Obras del jugador automáticas; la IA sigue asignando constructores. Tiempos básicos equivalentes, logística no simétrica.
- Investigación instantánea y catálogo compartido entre facciones; no tres árboles tecnológicos independientes.
- Sin campaña narrativa, multijugador, música ni efectos sonoros nuevos.
- Guardado manual de una ranura vinculado al navegador/origen. No se transfiere automáticamente entre navegadores y se pierde al borrar sus datos.

Estos sistemas requieren diseño y pruebas propios; no se presentan como implementados por añadir botones o textos.
