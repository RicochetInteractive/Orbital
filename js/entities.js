// Creación de unidades y edificios; costes, suministros y mejoras.
'use strict';
function building(type, team, x, y) { let d = plans[type], b = { type, team, x, y, r: d.r, hp: d.hp, max: d.hp, cool: 0, queue: null, buildTime: 0 }; buildings.push(b); return b; }
function unit(type, team, x, y) { let d = spec[type], u = { type, team, x, y, r: d.r, hp: d.hp, max: d.hp, cool: 0, order: null, path: [], pathTarget: '', pathTime: 0, carry: null, harvest: 0, cargo: [], embarked: null, trail: [{ x, y }] }; let st = stats(u); u.hp = st.hp; u.max = st.hp; units.push(u); return u; }
function has(type) { return buildings.some(b => b.team === 'blue' && b.type === type && b.hp > 0 && !b.buildTime); }
function costOK(d) { return ore >= d.ore && plasma >= (d.plasma || 0); }
function spend(d) { ore -= d.ore; plasma -= d.plasma || 0; }
function spawn(type) { queueUnit(type); }
function buyUpgrade(key) { if (!started || ended || paused) return; let d = research[key], level = upgrades[key]; if (!has('lab')) {
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
