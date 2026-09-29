// Ciclo de la partida: reinicio y elección de facción.
'use strict';
function reset() { paused = false; commandMode = ''; controlGroups = {}; inspected = null; taxPolicy = 'balanced'; commandMarker = null; gesture = drag = pointer = null; started = false; ended = false; units = []; buildings = []; nodes = []; villages = []; particles = []; selected = []; terrain = []; ore = 360; plasma = 0; seconds = 0; enemyTimer = -28; aiTimer = 0; trackTimer = 0; aiBank = { red: { ore: 300, plasma: 0 }, violet: { ore: 300, plasma: 0 }, amber: { ore: 300, plasma: 0 } }; aiTech = { red: { damage: 0, armor: 0, engine: 0 }, violet: { damage: 0, armor: 0, engine: 0 }, amber: { damage: 0, armor: 0, engine: 0 } }; aiPlans = { red: { lastRaid: 0 }, violet: { lastRaid: 0 }, amber: { lastRaid: 0 } }; lastUi = 0; upgrades = { damage: 0, armor: 0, engine: 0 }; seed = Math.floor(Math.random() * 999999999); rng = random; last = performance.now(); mode = ''; ghost = null; $('placement').hidden = true; $('enemyLegend').hidden = false; $('factionPanel').hidden = false; $('factionName').textContent = 'Escaramuza · Sector 07'; for (let type of ['ranger', 'mech', 'wraith'])
    $(type).hidden = true; generateMap(); renderMiniTerrain(); building('base', 'blue', 140, 550); building('tower', 'blue', 235, 435); building('base', 'red', 2160, 250); building('base', 'violet', 2140, 1260); building('base', 'amber', 1260, 155); placeResources(); placeVillages(); for (let team of ['red', 'violet', 'amber']) {
    let base = buildings.find(b => b.team === team && b.type === 'base');
    for (let i = 0; i < 2; i++) {
        let w = unit('worker', team, base.x - 47 - i * 17, base.y + 42 + i * 16);
        aiBank[team].ore -= spec.worker.ore;
    }
} for (let i = 0; i < 4; i++) {
    let u = unit('worker', 'blue', 195 + i * 22, 570 + i * 24);
    u.order = { kind: 'harvest', node: nodes[i % 4] };
} unit('soldier', 'blue', 205, 430); unit('soldier', 'blue', 235, 475); for (let [team, x, y, type] of [['red', 2080, 330, 'raider'], ['violet', 2070, 1160, 'brute'], ['amber', 1190, 260, 'drone']])
    unit(type, team, x, y); faction = ''; camera.x = 0; camera.y = 345; clampCamera(); say('Elige una facción para empezar.'); updateUI(); }
function chooseFaction(value) { faction = value; color.blue = '#4ce4fb'; started = true; $('factionPanel').hidden = true; $('factionName').textContent = ({ colonos: 'Colonos', mecanos: 'Mecanos', astrales: 'Astrales' })[value] + ' · Sector 07'; for (let type of ['ranger', 'mech', 'wraith'])
    $(type).hidden = spec[type].faction !== value; for (let u of units.filter(u => u.team === 'blue')) {
    let newMax = stats(u).hp;
    u.hp += newMax - u.max;
    u.max = newMax;
} say('Facción ' + $('factionName').textContent.split(' ·')[0] + ' lista.'); updateUI(); }
