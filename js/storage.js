// Una ranura local. Las referencias circulares de transportes y órdenes se guardan por índice.
'use strict';
const SAVE_KEY = 'orbita.campaign.v1';
function snapshot() {
    const ref = target => units.includes(target) ? ['unit', units.indexOf(target)] : buildings.includes(target) ? ['building', buildings.indexOf(target)] : null;
    return {
        version: 1, faction, seed, terrain, ore, plasma, seconds, aiTimer, aiBank, aiTech, aiPlans, upgrades, taxPolicy,
        camera: { x: camera.x, y: camera.y, zoom: camera.zoom }, nodes, villages,
        buildings: buildings.map(b => ({ ...b, builder: units.indexOf(b.builder) })),
        units: units.map(u => ({ ...u, path: [], pathTarget: '', cargo: u.cargo.map(p => units.indexOf(p)), embarked: units.indexOf(u.embarked),
            order: u.order ? { ...u.order, target: ref(u.order.target), node: nodes.indexOf(u.order.node) } : null })),
        groups: Object.fromEntries(Object.entries(controlGroups).map(([key, group]) => [key, group.map(u => units.indexOf(u)).filter(i => i >= 0)]))
    };
}

function restoreSnapshot(data) {
    const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H;
    if (!data || data.version !== 1 || !['colonos', 'mecanos', 'astrales'].includes(data.faction) || !policies[data.taxPolicy] ||
        !Array.isArray(data.terrain) || data.terrain.length !== COLS * Math.ceil(ROWS) || !data.terrain.every(t => ['plain', 'sand', 'cliff', 'water'].includes(t)) ||
        ![data.ore, data.plasma, data.seconds, data.aiTimer, data.seed].every(Number.isFinite) || data.ore < 0 || data.plasma < 0 ||
        !Array.isArray(data.units) || !Array.isArray(data.buildings) || !Array.isArray(data.nodes) || !Array.isArray(data.villages) ||
        !validPoint(data.camera) || !Number.isFinite(data.camera.zoom) || !Object.values(data.groups || {}).every(group => Array.isArray(group) && group.every(Number.isInteger))) throw Error('Archivo de partida incompatible.');
    if (!data.units.every(u => validPoint(u) && spec[u.type] && color[u.team] && Number.isFinite(u.hp) && Number.isFinite(u.max) && Array.isArray(u.cargo) && Array.isArray(u.trail)) ||
        !data.buildings.every(b => validPoint(b) && plans[b.type] && color[b.team] && Number.isFinite(b.hp) && Number.isFinite(b.max) && (!b.training || b.training.every(q => spec[q.type] && Number.isFinite(q.time) && q.total > 0))) ||
        !data.nodes.every(n => validPoint(n) && ['ore', 'plasma'].includes(n.type) && Number.isFinite(n.amount)) || !data.villages.every(validPoint) ||
        !['damage', 'armor', 'engine'].every(k => Number.isInteger(data.upgrades?.[k]) && data.upgrades[k] >= 0 && data.upgrades[k] <= 3) ||
        !['red', 'violet', 'amber'].every(t => data.aiBank?.[t] && Number.isFinite(data.aiBank[t].ore) && Number.isFinite(data.aiBank[t].plasma) && data.aiTech?.[t] && data.aiPlans?.[t])) throw Error('Datos de partida incompletos.');
    const army = data.units, structures = data.buildings;
    for (const u of army) {
        u.cargo = u.cargo.map(i => army[i]).filter(Boolean);
        u.embarked = army[u.embarked] || null;
        u.path = []; u.pathTarget = ''; u.pathTime = 0;
        if (u.order) {
            const o = u.order;
            o.target = o.target ? (o.target[0] === 'unit' ? army : structures)[o.target[1]] : null;
            o.node = data.nodes[o.node] || null;
            if (['attack', 'board', 'build'].includes(o.kind) && !o.target || o.kind === 'harvest' && !o.node) u.order = null;
        }
    }
    for (const b of structures) b.builder = army[b.builder] || null;
    // Cambiar el estado sólo después de validar y reconstruir las referencias.
    units = army; buildings = structures; nodes = data.nodes; villages = data.villages; terrain = data.terrain;
    faction = data.faction; seed = data.seed; rng = random; ore = data.ore; plasma = data.plasma; seconds = data.seconds;
    aiTimer = data.aiTimer; aiBank = data.aiBank; aiTech = data.aiTech; aiPlans = data.aiPlans; upgrades = data.upgrades; taxPolicy = data.taxPolicy;
    Object.assign(camera, data.camera); clampCamera();
    controlGroups = Object.fromEntries(Object.entries(data.groups || {}).map(([key, group]) => [key, group.map(i => army[i]).filter(Boolean)]));
    started = true; ended = false; paused = true; selected = []; inspected = null; particles = []; commandMode = ''; commandMarker = null;
    gesture = drag = pointer = null; trackTimer = 0; lastUi = seconds; last = performance.now(); setMode('');
    $('factionPanel').hidden = true;
    $('factionName').textContent = ({ colonos: 'Colonos', mecanos: 'Mecanos', astrales: 'Astrales' })[faction] + ' · Sector 07';
    for (const type of ['ranger', 'mech', 'wraith']) $(type).hidden = spec[type].faction !== faction;
    renderMiniTerrain(); say('Partida recuperada en pausa. Continúa cuando estés listo.'); updateUI();
}

function saveGame() {
    if (!started || ended) return say('Inicia una operación para guardarla.');
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); say('Partida guardada en este navegador.'); }
    catch { say('El navegador no permite guardar o no tiene espacio disponible.'); }
}
function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return say('Todavía no hay una partida guardada en este navegador.');
        if (started && !ended && !confirm('¿Cargar la partida guardada? Se sustituirá la operación actual.')) return;
        restoreSnapshot(JSON.parse(raw));
    } catch { say('No se pudo recuperar la partida. La operación actual se conserva.'); }
}
$('saveGame').onclick = saveGame;
$('loadGame').onclick = loadGame;
