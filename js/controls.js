// Selección, órdenes, construcción y eventos de ratón, teclado y pantalla táctil.
'use strict';
function canPlace(type, p, team = 'blue') { let d = plans[type], homes = buildings.filter(b => b.team === team && b.hp > 0 && !b.buildTime && (b.type === 'base' || b.type === 'castle')), supported = type === 'castle' ? homes.some(b => dist(b, p) < 420) || units.some(u => u.team === team && u.type === 'worker' && !u.embarked && dist(u, p) < 160) : homes.some(b => dist(b, p) < 390); if (!supported || p.x < d.r + 10 || p.y < d.r + 10 || p.x > W - d.r - 10 || p.y > H - d.r - 10)
    return false; for (let dy = -d.r; dy <= d.r; dy += T / 2)
    for (let dx = -d.r; dx <= d.r; dx += T / 2)
        if (!walk(p.x + dx, p.y + dy))
            return false; return !buildings.some(b => dist(b, p) < b.r + d.r + 15) && !villages.some(v => dist(v, p) < d.r + v.r + 12) && !nodes.some(n => n.amount > 0 && dist(n, p) < d.r + 22); }
function pos(e) { let r = c.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / camera.zoom + camera.x, 0, W), y: clamp((e.clientY - r.top) / camera.zoom + camera.y, 0, H) }; }
function hit(p, touch = false) { let pad = touch ? Math.max(17, 23 / camera.zoom) : 5; return [...units.filter(u => !u.embarked), ...buildings].filter(o => dist(o, p) < o.r + pad).sort((a, b) => (dist(a, p) - a.r * .4) - (dist(b, p) - b.r * .4))[0]; }
function order(p, touch = false) { if (!started || ended || paused) return; if (inspected && !selected.length && inspected.team === 'blue' && !inspected.buildTime) { inspected.rally = { x: p.x, y: p.y }; commandMarker = { ...p, life: 1 }; say('Punto de reunión fijado.'); return; } if (!selected.length)
    return; let t = hit(p, touch), n = nodes.filter(n => n.amount > 0 && dist(n, p) < (touch ? 30 : 21)).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (n?.owner && n.owner !== 'blue') {
    say('Yacimiento controlado por ' + enemyName[n.owner] + '. Captúralo con un castillo.');
    return;
} if (n?.type === 'plasma' && !has('refinery')) {
    say('Construye una refinería para extraer plasma.');
    return;
} let boarded = 0, index = 0, columns = Math.ceil(Math.sqrt(selected.length)); commandMarker = { ...p, life: 1 }; for (let u of [...selected]) {
    if (t?.type === 'transport' && t.team === 'blue' && u !== t && spec[u.type].kind !== 'air') {
        if (board(u, t))
            boarded++;
        continue;
    }
    if (n && u.type === 'worker')
        u.order = { kind: 'harvest', node: n };
    else if (t && foe(u, t) && u.type !== 'medic' && u.type !== 'transport')
        u.order = { kind: 'attack', target: t };
    else
        u.order = { kind: commandMode || 'move', x: clamp(p.x + (index % columns - (columns - 1) / 2) * 30, 20, W - 20), y: clamp(p.y + (Math.floor(index / columns) - (columns - 1) / 2) * 30, 20, H - 20) };
    index++; u.pathTarget = '';
} commandMode = ''; say(boarded ? 'Embarcando ' + boarded + ' unidades.' : n ? 'Extrayendo ' + (n.type === 'plasma' ? 'plasma.' : 'minerales.') : t && foe({ team: 'blue' }, t) ? 'Objetivo marcado.' : 'Orden de movimiento enviada.'); updateUI(); }
function setMode(type) { if (type) commandMode = ''; mode = type; $('placement').hidden = !type; $('enemyLegend').hidden = !!type; if (type) {
    let home = buildings.find(b => b.team === 'blue' && b.type === 'base');
    $('placementText').textContent = 'Construir ' + plans[type].name + ' · toca una zona verde';
    if (home) {
        focus(home.x + 95, home.y);
        ghost = { x: home.x + 145, y: home.y - 110 };
    }
}
else
    ghost = null; }
function place(type, p) { if (!started || ended || paused) return; let d = plans[type]; if (!canPlace(type, p)) {
    ghost = p;
    say('Zona ocupada, inaccesible o lejos del núcleo. Busca el círculo verde.');
    return;
} if (!costOK(d) || d.requires && !has(d.requires)) {
    say('Faltan recursos o el edificio previo.');
    setMode('');
    return;
} spend(d); const b = building(type, 'blue', p.x, p.y); b.buildTime = b.buildTotal = type === 'castle' ? 24 : type === 'tower' ? 15 : 20; b.hp = Math.round(b.max * .45); setMode(''); say(d.name + ' en construcción.'); updateUI(); }
function selectAt(p, e, touch) { if (touch && inspected && !hit(p, true)) { order(p, true); return; } if (commandMode) { order(p, touch); return; } inspected = null; let t = hit(p, touch), village = villages.find(v => dist(v, p) < 34), resource = nodes.some(n => n.amount > 0 && dist(n, p) < 30); if (!t && village && !selected.length) {
    say('Aldea ' + (village.owner ? village.owner === 'blue' ? 'aliada · lealtad ' + Math.round(village.loyalty ?? 60) + '%' : 'de ' + enemyName[village.owner] : 'neutral') + ' · requiere apoyo de un castillo · ingreso según política.');
    updateUI();
    return;
} if (!t && resource && !selected.length) {
    let n = nodes.find(n => n.amount > 0 && dist(n, p) < 30);
    say((n.type === 'plasma' ? 'Plasma' : 'Minerales') + ' · ' + Math.ceil(n.amount) + ' disponibles' + (n.owner ? ' · control: ' + (n.owner === 'blue' ? 'tú' : enemyName[n.owner]) : ' · sin dueño'));
    updateUI();
    return;
} if (touch && selected.length && (resource || t && foe({ team: 'blue' }, t) || t?.type === 'transport' && t.team === 'blue' && selected.some(u => spec[u.type].kind !== 'air')))
    order(p, true);
else if (t?.team === 'blue' && t.type in spec) {
    selected = e.shiftKey ? [...new Set([...selected, t])] : [t];
    say(spec[t.type].name + ' seleccionado. Mira sus estadísticas abajo.');
}
else if (t?.team === 'blue' && t.type in plans) {
    inspected = t; selected = [];
}
else if (touch && selected.length)
    order(p, true);
else if (t && t.team !== 'blue') {
    say(enemyName[t.team] + ' · ' + (spec[t.type]?.name || plans[t.type]?.name) + ' · ' + Math.ceil(t.hp) + ' PV' + (t.buildTime ? ' · en obras (' + Math.ceil(t.buildTime) + ' s)' : '') + (t.type === 'base' ? ' · ' + units.filter(u => u.team === t.team && u.type === 'worker').length + ' obreros · ' + Math.floor(aiBank[t.team].ore) + ' minerales · ' + Math.floor(aiBank[t.team].plasma) + ' plasma' : ''));
    selected = [];
}
else
    selected = []; updateUI(); }
c.addEventListener('pointerdown', e => { if (e.button !== 0 || !started || ended || paused)
    return; c.setPointerCapture(e.pointerId); let p = pos(e); drag = p; pointer = p; gesture = { type: e.pointerType, screenX: e.clientX, screenY: e.clientY, startX: e.clientX, startY: e.clientY, moved: false }; if (mode)
    ghost = p; });
c.addEventListener('pointermove', e => { if (mode) ghost = pos(e); if (!gesture)
    return; if (mode) {
    ghost = pos(e);
    return;
} let dx = e.clientX - gesture.screenX, dy = e.clientY - gesture.screenY; if (gesture.type !== 'mouse' && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > 9) {
    gesture.moved = true;
    camera.x -= dx / camera.zoom;
    camera.y -= dy / camera.zoom;
    clampCamera();
}
else
    pointer = pos(e); gesture.screenX = e.clientX; gesture.screenY = e.clientY; });
c.addEventListener('pointerup', e => { if (!gesture)
    return; let p = pos(e), size = drag ? dist(drag, p) : 0; if (mode) {
    ghost = p;
    if (!gesture.moved)
        place(mode, p);
}
else if (gesture.type === 'mouse' && size > 8) {
    let found = units.filter(u => u.team === 'blue' && !u.embarked && u.x >= Math.min(drag.x, p.x) && u.x <= Math.max(drag.x, p.x) && u.y >= Math.min(drag.y, p.y) && u.y <= Math.max(drag.y, p.y));
    selected = e.shiftKey ? [...new Set([...selected, ...found])] : found;
}
else if (!gesture.moved)
    selectAt(p, e, gesture.type !== 'mouse'); drag = null; pointer = null; gesture = null; updateUI(); });
c.addEventListener('pointercancel', () => { drag = null; pointer = null; gesture = null; });
c.addEventListener('contextmenu', e => { e.preventDefault(); order(pos(e)); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') {
    setMode('');
    selected = [];
    updateUI();
} });
mini.addEventListener('pointerdown', e => { let r = mini.getBoundingClientRect(); focus((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); if (mode)
    ghost = { x: camera.x + viewW() / 2, y: camera.y + viewH() / 2 }; });
for (let type of ['worker', 'soldier', 'scout', 'medic', 'tank', 'artillery', 'ship', 'transport', 'ranger', 'mech', 'wraith'])
    $(type).onclick = () => spawn(type);
for (let type of ['depot', 'barracks', 'refinery', 'workshop', 'tower', 'lab', 'hangar', 'castle'])
    $(type).onclick = () => { setMode(type); say('Toca una zona verde del mapa para construir.'); };
for (let key of Object.keys(research))
    $('up' + key[0].toUpperCase() + key.slice(1)).onclick = () => buyUpgrade(key);
$('loadTransport').onclick = () => { let ship = selected.find(u => u.type === 'transport') || units.find(u => u.team === 'blue' && u.type === 'transport' && !u.embarked); if (!ship) {
    say('Primero crea un transporte.');
    return;
} let list = selected.filter(u => u !== ship && spec[u.type].kind !== 'air'); if (!list.length)
    list = units.filter(u => u.team === 'blue' && spec[u.type].kind !== 'air' && !u.embarked && dist(u, ship) < 110).slice(0, 4); let count = 0; for (let u of list)
    if (board(u, ship))
        count++; say(count ? 'Embarcando ' + count + ' unidades.' : 'Acerca las tropas al transporte o libera espacio.'); updateUI(); };
$('unloadTransport').onclick = () => { let ship = selected.find(u => u.type === 'transport'); if (ship)
    unload(ship);
else
    say('Selecciona un transporte.'); updateUI(); };
$('allCombat').onclick = () => { selected = units.filter(u => u.team === 'blue' && u.type !== 'worker' && !u.embarked); say(selected.length + ' tropas seleccionadas.'); updateUI(); };
$('allWorkers').onclick = () => { selected = units.filter(u => u.team === 'blue' && u.type === 'worker' && !u.embarked); say(selected.length + ' recolectores seleccionados.'); updateUI(); };
for (let button of document.querySelectorAll('[data-faction]'))
    button.onclick = () => chooseFaction(button.dataset.faction);
for (let button of document.querySelectorAll('[data-tab]'))
    button.onclick = () => { for (let other of document.querySelectorAll('[data-tab]'))
        other.classList.toggle('active', other === button); for (let id of ['units', 'buildings', 'research', 'groups'])
        $(id + 'Panel').hidden = id !== button.dataset.tab; };
$('restart').onclick = () => { if (!started || ended || confirm('¿Reiniciar la operación? Se perderá la partida actual.')) reset(); };
$('cancelBuild').onclick = () => { setMode(''); say('Construcción cancelada.'); };
$('zoomIn').onclick = () => setZoom(camera.zoom * 1.25);
$('zoomOut').onclick = () => setZoom(camera.zoom / 1.25);
if (matchMedia('(pointer:coarse)').matches)
    $('instructions').textContent = 'Toca una unidad y luego un destino o recurso. Arrastra para mover la cámara. Toca el minimapa para saltar. Toca un transporte con tropas seleccionadas para cargarlas.';
