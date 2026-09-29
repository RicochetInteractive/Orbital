// Creación de unidades y edificios; costes, suministros y mejoras.
'use strict';
function building(type, team, x, y) { let d = plans[type], b = { type, team, x, y, r: d.r, hp: d.hp, max: d.hp, cool: 0, queue: null, buildTime: 0 }; buildings.push(b); return b; }
function unit(type, team, x, y) { let d = spec[type], u = { type, team, x, y, r: d.r, hp: d.hp, max: d.hp, cool: 0, order: null, path: [], pathTarget: '', pathTime: 0, carry: null, harvest: 0, cargo: [], embarked: null, trail: [{ x, y }] }; let st = stats(u); u.hp = st.hp; u.max = st.hp; units.push(u); return u; }
function has(type) { return buildings.some(b => b.team === 'blue' && b.type === type); }
function costOK(d) { return ore >= d.ore && plasma >= (d.plasma || 0); }
function spend(d) { ore -= d.ore; plasma -= d.plasma || 0; }
function spawn(type) { if (!started || ended)
    return; let d = spec[type], s = supply(); if (d.faction && d.faction !== faction) {
    say('Esa unidad pertenece a otra facción.');
    return;
} if (d.requires && !has(d.requires)) {
    say('Necesitas ' + plans[d.requires].name.toLowerCase() + '.');
    return;
} if (!costOK(d)) {
    say('Faltan minerales o plasma.');
    return;
} if (s.used + d.pop > s.max) {
    say('Faltan suministros. Construye depósitos.');
    return;
} let source = type === 'worker' ? buildings.find(b => b.team === 'blue' && b.type === 'base') : d.kind === 'air' ? buildings.find(b => b.team === 'blue' && b.type === 'hangar') : d.kind === 'vehicle' ? buildings.find(b => b.team === 'blue' && b.type === 'workshop') : buildings.find(b => b.team === 'blue' && b.type === 'barracks'); if (!source) {
    say('Falta el edificio de producción.');
    return;
} spend(d); let x = source.x + source.r + 35, y = source.y + rand(-30, 30); if (d.kind !== 'air' && !walk(x, y)) {
    let found = false;
    for (let radius = source.r + 35; radius < 150 && !found; radius += 20)
        for (let i = 0; i < 16; i++) {
            let a = i * Math.PI / 8, px = source.x + Math.cos(a) * radius, py = source.y + Math.sin(a) * radius;
            if (walk(px, py)) {
                x = px;
                y = py;
                found = true;
                break;
            }
        }
    if (!found) {
        say('No hay una salida terrestre junto al edificio.');
        return;
    }
} let u = unit(type, 'blue', x, y); u.order = { kind: 'move', x: clamp(x + 75, 0, W), y }; say(d.name + ' listo.'); updateUI(); }
function buyUpgrade(key) { let d = research[key], level = upgrades[key]; if (!has('lab')) {
    say('Construye un laboratorio.');
    return;
} if (level >= 3)
    return; let cost = { ore: d.ore * (level + 1), plasma: d.plasma * (level + 1) }; if (!costOK(cost)) {
    say('Recursos insuficientes para la mejora.');
    return;
} spend(cost); upgrades[key]++; if (key === 'armor')
    for (let u of units.filter(u => u.team === 'blue')) {
        let newMax = stats(u).hp;
        u.hp += newMax - u.max;
        u.max = newMax;
    } say(d.name + ' mejorado al nivel ' + upgrades[key] + '.'); updateUI(); }
