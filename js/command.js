// Sistemas de mando: producción, órdenes, gobierno y controles de partida.
'use strict';
let paused = false, commandMode = '', controlGroups = {}, inspected = null;
let taxPolicy = 'balanced', commandMarker = null;
const trainingTime = type => type === 'worker' ? 10 : spec[type].kind === 'air' ? 22 : spec[type].kind === 'vehicle' ? 20 : 13;
const productionType = type => type === 'worker' ? 'base' : spec[type].kind === 'air' ? 'hangar' : spec[type].kind === 'vehicle' ? 'workshop' : 'barracks';
const policies = { relief: { name: 'Ayuda', income: 6, loyalty: 2 }, balanced: { name: 'Equilibrio', income: 10, loyalty: .6 }, levy: { name: 'Tributo', income: 17, loyalty: -1.2 } };

function queueUnit(type) {
    if (!started || ended || paused) return;
    const d = spec[type], s = supply();
    const sources = buildings.filter(b => b.team === 'blue' && b.hp > 0 && !b.buildTime && b.type === productionType(type));
    sources.sort((a, b) => (a === inspected ? -10 : (a.training || []).length) - (b === inspected ? -10 : (b.training || []).length));
    const source = sources.find(b => (b.training || []).length < 5);
    if (d.faction && d.faction !== faction || d.requires && !has(d.requires)) return say('Falta el edificio o la facción requerida.');
    if (!source) return say('No hay un centro disponible. Máximo: cinco unidades por cola.');
    if (!costOK(d)) return say('Faltan minerales o plasma.');
    if (s.used + d.pop > s.max) return say('Suministros reservados. Construye un depósito.');
    spend(d);
    (source.training ||= []).push({ type, time: trainingTime(type), total: trainingTime(type) });
    say(d.name + ' en producción.');
    updateUI();
}

function exitPoint(b, type) {
    for (let radius = b.r + 32; radius <= b.r + 112; radius += 20) {
        for (let i = 0; i < 16; i++) {
            const a = i * Math.PI / 8, p = { x: b.x + Math.cos(a) * radius, y: b.y + Math.sin(a) * radius };
            if (p.x < 22 || p.y < 22 || p.x > W - 22 || p.y > H - 22) continue;
            if (spec[type].kind === 'air' || walk(p.x, p.y) && !buildings.some(v => v !== b && v.hp > 0 && dist(v, p) < v.r + spec[type].r)) return p;
        }
    }
    return null;
}

function updateCommand(dt) {
    for (const b of buildings.filter(b => b.team === 'blue' && b.hp > 0)) {
        if (b.buildTime > 0) {
            const remaining = b.buildTime;
            b.buildTime = Math.max(0, b.buildTime - dt);
            b.hp = Math.min(b.max, b.hp + b.max * .55 * (remaining - b.buildTime) / b.buildTotal);
            if (!b.buildTime) say(plans[b.type].name + ' operativo.');
            continue;
        }
        const item = b.training?.[0];
        if (!item) continue;
        item.time = Math.max(0, item.time - dt);
        if (item.time > 0) continue;
        const s = supply();
        if (s.used > s.max) continue;
        const p = exitPoint(b, item.type);
        if (!p) continue;
        b.training.shift();
        const u = unit(item.type, 'blue', p.x, p.y);
        const n = b.rally && nodes.find(n => n.amount > 0 && dist(n, b.rally) < 28 && (!n.owner || n.owner === 'blue') && (n.type !== 'plasma' || has('refinery')));
        u.order = u.type === 'worker' && n ? { kind: 'harvest', node: n } : { kind: 'move', ...(b.rally || { x: p.x + 35, y: p.y }) };
        say(spec[u.type].name + ' listo.');
    }
    if (commandMarker && (commandMarker.life -= dt) <= 0) commandMarker = null;
}

function tacticalOrder(kind) {
    if (!started || ended || paused) return;
    commandMode = kind === 'attackMove' ? kind : '';
    if (commandMode) { setMode(''); say('Avanzar atacando: marca el destino en el mapa.'); }
    else {
        for (const u of selected) { u.order = kind === 'hold' ? { kind: 'hold' } : null; u.path = []; u.pathTarget = ''; }
        say(kind === 'hold' ? 'Mantener posición: disparar sin perseguir.' : 'Órdenes canceladas.');
    }
    updateUI();
}

function togglePause() {
    if (!started || ended) return;
    paused = !paused;
    gesture = drag = pointer = null;
    updateUI();
}

function idleWorker() {
    const workers = units.filter(u => u.team === 'blue' && u.type === 'worker' && !u.embarked && u.hp > 0 && !u.order);
    if (!workers.length) return say('Todos los recolectores tienen una orden.');
    const next = workers[(workers.indexOf(selected[0]) + 1) % workers.length];
    selected = [next]; inspected = null; focus(next.x, next.y); updateUI();
}

function updateCommandUI() {
    if (selected.length) inspected = null;
    const alive = buildings.filter(b => b.type === 'base' && b.team !== 'blue' && b.hp > 0).length;
    $('missionProgress').textContent = (3 - alive) + ' / 3 núcleos destruidos';
    $('pause').textContent = paused ? 'Continuar · P' : 'Pausa · P';
    $('pause').disabled = !started || ended;
    $('pauseOverlay').hidden = !paused;
    $('idleWorker').textContent = 'Obreros libres · ' + units.filter(u => u.team === 'blue' && u.type === 'worker' && !u.embarked && !u.order).length;
    for (const key of ['attackMove', 'hold', 'stop']) {
        $(key).disabled = !started || ended || paused || !selected.length;
        $(key).classList.toggle('active', key === commandMode);
    }
    $('taxPolicy').value = taxPolicy;
    $('taxPolicy').disabled = !started || ended || paused;
    for (const [type, d] of Object.entries(spec)) {
        const button = $(type);
        if (!button) continue;
        const full = buildings.filter(b => b.team === 'blue' && !b.buildTime && b.type === productionType(type)).every(b => (b.training || []).length >= 5);
        if (full) button.disabled = true;
        button.title = d.requires && !has(d.requires) ? 'Requiere ' + plans[d.requires].name + ' operativo' : !costOK(d) ? 'Recursos insuficientes' : supply().used + d.pop > supply().max ? 'Faltan suministros: construye un depósito' : full ? 'No hay una cola disponible' : role[type] + ' · Entrenamiento: ' + trainingTime(type) + ' s';
    }
    for (const [type, d] of Object.entries(plans)) if ($(type)) $(type).title = d.requires && !has(d.requires) ? 'Requiere ' + plans[d.requires].name + ' operativo' : !costOK(d) ? 'Recursos insuficientes' : 'Construcción: ' + (type === 'castle' ? 24 : type === 'tower' ? 15 : 20) + ' s';
    const owned = villages.filter(v => v.owner === 'blue');
    $('territorySummary').textContent = owned.length ? owned.length + ' aldeas · lealtad ' + Math.round(owned.reduce((s, v) => s + (v.loyalty ?? 60), 0) / owned.length) + ' %' : 'Sin aldeas aliadas · expande con castillos';
    const production = buildings.filter(b => b.team === 'blue' && b.hp > 0 && (b.buildTime || b.training?.length));
    $('productionList').replaceChildren();
    for (const b of production) {
        const item = b.training?.[0], row = document.createElement('div');
        row.className = 'production-row';
        const button = document.createElement('button');
        button.textContent = plans[b.type].name + ' · ' + (b.buildTime ? 'obra ' + Math.ceil(b.buildTime) + ' s' : spec[item.type].name + ' · ' + (item.time > 0 ? Math.ceil(item.time) + ' s' : 'esperando salida/suministros') + ' · ×' + b.training.length);
        button.onclick = () => { inspected = b; selected = []; focus(b.x, b.y); updateUI(); };
        const progress = document.createElement('progress');
        progress.max = 1; progress.value = b.buildTime ? 1 - b.buildTime / b.buildTotal : 1 - item.time / item.total;
        button.append(progress); row.append(button);
        if (!b.buildTime) {
            const cancel = document.createElement('button'); cancel.textContent = '×'; cancel.title = 'Cancelar la última unidad y recuperar su coste'; cancel.disabled = paused || ended;
            cancel.onclick = () => { const entry = b.training.pop(); ore += spec[entry.type].ore; plasma += spec[entry.type].plasma || 0; updateUI(); };
            row.append(cancel);
        }
        $('productionList').append(row);
    }
    if (!production.length) $('productionList').textContent = 'Sin producción activa';
    if (inspected && (inspected.hp <= 0 || !buildings.includes(inspected))) inspected = null;
    if (inspected) {
        $('selected').textContent = plans[inspected.type].name + ' · ' + Math.ceil(inspected.hp) + '/' + inspected.max + ' PV';
        $('unitStats').textContent = inspected.buildTime ? 'En construcción · ' + Math.ceil(inspected.buildTime) + ' s' : 'Clic derecho: fijar punto de reunión. Las nuevas unidades irán allí.';
    }
    $('groupBar').replaceChildren();
    for (let n = 1; n <= 5; n++) {
        const button = document.createElement('button'), group = (controlGroups[n] || []).filter(u => units.includes(u) && u.hp > 0 && !u.embarked);
        button.textContent = n + ' · ' + group.length; button.title = 'Ctrl+' + n + ': asignar. ' + n + ': seleccionar. Alt+' + n + ': centrar.';
        button.onclick = () => { selected = group; inspected = null; updateUI(); };
        $('groupBar').append(button);
    }
}

function drawCommandOverlay() {
    for (const b of buildings) {
        if (b.hp <= 0) continue;
        const item = b.team === 'blue' ? b.training?.[0] : b.queue;
        if (b.buildTime || item) {
            const total = b.buildTotal || (b.type === 'castle' ? 24 : b.type === 'tower' ? 15 : 20);
            const value = b.buildTime ? 1 - b.buildTime / total : 1 - item.time / (item.total || trainingTime(item.type));
            g.fillStyle = '#09151f'; g.fillRect(b.x - 32, b.y + b.r + 12, 64, 5);
            g.fillStyle = b.buildTime ? '#e7bf73' : '#73dacb'; g.fillRect(b.x - 32, b.y + b.r + 12, 64 * clamp(value, 0, 1), 5);
        }
    }
    g.save(); g.lineWidth = 1.5; g.setLineDash([5, 6]);
    for (const u of selected) {
        const o = u.order, target = o?.target || o?.node || o;
        if (!target || !Number.isFinite(target.x)) continue;
        g.strokeStyle = o.kind === 'attack' || o.kind === 'attackMove' ? '#ffbb85aa' : '#a2e8de88';
        g.beginPath(); g.moveTo(u.x, u.y); g.lineTo(target.x, target.y); g.stroke();
    }
    if (inspected?.rally) {
        g.strokeStyle = '#f4d48d'; g.beginPath(); g.moveTo(inspected.x, inspected.y); g.lineTo(inspected.rally.x, inspected.rally.y); g.stroke();
    }
    g.restore();
    if (commandMarker) { g.strokeStyle = '#f8dda0'; g.lineWidth = 2; g.beginPath(); g.arc(commandMarker.x, commandMarker.y, 10 + (1 - commandMarker.life) * 20, 0, Math.PI * 2); g.stroke(); }
}

$('pause').onclick = togglePause;
$('resume').onclick = togglePause;
$('idleWorker').onclick = idleWorker;
for (const kind of ['attackMove', 'hold', 'stop']) $(kind).onclick = () => tacticalOrder(kind);
$('taxPolicy').onchange = e => { if (!paused && !ended) taxPolicy = e.target.value; updateUI(); };
window.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.repeat && !e.key.startsWith('Arrow') || !started || ended) return;
    const key = e.key.toLowerCase();
    if (key === 'p') { e.preventDefault(); togglePause(); return; }
    if (paused) return;
    if (/^[1-5]$/.test(key)) {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) controlGroups[key] = [...selected];
        else {
            selected = (controlGroups[key] || []).filter(u => units.includes(u) && u.hp > 0 && !u.embarked);
            inspected = null;
            if (e.altKey && selected.length) focus(selected[0].x, selected[0].y);
        }
        updateUI(); return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (key === 'a') tacticalOrder('attackMove');
    if (key === 'h') tacticalOrder('hold');
    if (key === 's') tacticalOrder('stop');
    if (key === 'i') idleWorker();
    if (key === 'escape') { commandMode = ''; inspected = null; }
    if (key === 'home') { e.preventDefault(); const base = buildings.find(b => b.team === 'blue' && b.type === 'base'); if (base) focus(base.x, base.y); }
    const pan = { arrowleft: [-100, 0], arrowright: [100, 0], arrowup: [0, -100], arrowdown: [0, 100] }[key];
    if (pan) { e.preventDefault(); camera.x += pan[0] / camera.zoom; camera.y += pan[1] / camera.zoom; clampCamera(); }
});
c.addEventListener('wheel', e => { e.preventDefault(); setZoom(camera.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });
c.addEventListener('dblclick', e => {
    if (!started || ended || paused || mode) return;
    const target = hit(pos(e));
    if (target?.team === 'blue' && target.type in spec) {
        selected = units.filter(u => u.type === target.type && u.team === 'blue' && !u.embarked && u.x >= camera.x && u.x <= camera.x + viewW() && u.y >= camera.y && u.y <= camera.y + viewH());
        inspected = null; updateUI();
    }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && started && !ended && !paused) togglePause(); });

for (const [type, d] of [...Object.entries(spec), ...Object.entries(plans)]) {
    const button = $(type);
    if (!button) continue;
    button.innerHTML = '<img src="' + spriteSources[type] + '" alt="" width="32" height="32"><span>' + d.name + '<small>' + d.ore + ' M' + (d.plasma ? ' · ' + d.plasma + ' P' : '') + (d.pop ? ' · ' + d.pop + ' SUM' : '') + '</small></span>';
}
