// Construcción, producción, recolección y estrategia de los tres rivales.
'use strict';
function aiSpend(team, item) { let bank = aiBank[team]; if (bank.ore < (item.ore || 0) || bank.plasma < (item.plasma || 0))
    return false; bank.ore -= item.ore || 0; bank.plasma -= item.plasma || 0; return true; }
function aiStructure(team, type, target) {
    let d = plans[type], bases = buildings.filter(b => b.team === team && b.hp > 0 && (b.type === 'base' || b.type === 'castle') && !b.buildTime);
    if (!bases.length || aiBank[team].ore < d.ore || aiBank[team].plasma < d.plasma)
        return false;
    let spots = [];
    if (target) {
        for (let radius of [70, 100, 140, 180])
            for (let k = 0; k < 16; k++) {
                let a = k * Math.PI / 8;
                spots.push({ x: target.x + Math.cos(a) * radius, y: target.y + Math.sin(a) * radius });
            }
    }
    else
        for (let base of bases)
            for (let radius of [100, 155, 210])
                for (let k = 0; k < 16; k++) {
                    let a = k * Math.PI / 8;
                    spots.push({ x: base.x + Math.cos(a) * radius, y: base.y + Math.sin(a) * radius });
                }
    for (let pos of spots) {
        if (!canPlace(type, pos, team))
            continue;
        if (type === 'castle' && target && dist(pos, target) > (target.amount === undefined ? 280 : 255))
            continue;
        let builder = units.filter(u => u.team === team && u.type === 'worker' && u.hp > 0 && u.order?.kind !== 'build').sort((a, b) => dist(a, pos) - dist(b, pos))[0];
        if (!builder || !aiSpend(team, d))
            return false;
        let b = building(type, team, pos.x, pos.y);
        b.buildTime = type === 'castle' ? 24 : type === 'tower' ? 15 : 20;
        b.hp = Math.round(b.max * .45);
        b.builder = builder;
        builder.order = { kind: 'build', target: b };
        return true;
    }
    return false;
}
function aiQueue(team, type) { let d = spec[type], workers = type === 'worker', air = d.kind === 'air', vehicle = d.kind === 'vehicle', source = buildings.find(b => b.team === team && !b.buildTime && !b.queue && b.type === (workers ? 'base' : air ? 'hangar' : vehicle ? 'workshop' : 'barracks')); if (!source || !aiSpend(team, d))
    return false; source.queue = { type, time: workers ? 10 : air ? 22 : vehicle ? 20 : 13 }; return true; }
function aiProduction(dt) { for (let b of buildings) {
    if (b.team === 'blue')
        continue;
    if (b.buildTime > 0) {
        if (!b.builder || b.builder.hp <= 0 || b.builder.order?.kind !== 'build' || b.builder.order.target !== b) {
            b.builder = units.filter(u => u.team === b.team && u.type === 'worker' && u.hp > 0 && u.order?.kind !== 'build' && !nearEnemy(u, 105)).sort((a, z) => dist(a, b) - dist(z, b))[0];
            if (b.builder)
                b.builder.order = { kind: 'build', target: b };
        }
        if (b.builder && dist(b.builder, b) < b.r + 30) {
            b.buildTime = Math.max(0, b.buildTime - dt);
            if (!b.buildTime) {
                b.hp = b.max;
                b.builder.order = null;
                b.builder = null;
            }
        }
        continue;
    }
    if (!b.queue)
        continue;
    b.queue.time -= dt;
    if (b.queue.time > 0)
        continue;
    let type = b.queue.type, d = spec[type];
    let place = null;
    for (let radius of [b.r + 35, b.r + 55, b.r + 80, b.r + 110]) {
        for (let k = 0; k < 12; k++) {
            let a = k * Math.PI / 6, p = { x: b.x + Math.cos(a) * radius, y: b.y + Math.sin(a) * radius };
            if ((d.kind === 'air' || walk(p.x, p.y)) && p.x > 20 && p.y > 20 && p.x < W - 20 && p.y < H - 20) {
                place = p;
                break;
            }
        }
        if (place)
            break;
    }
    if (!place)
        continue;
    let u = unit(type, b.team, place.x, place.y);
    if (type !== 'worker')
        u.order = { kind: 'move', x: b.x + 60, y: b.y + 50 };
    b.queue = null;
} }
function aiManageWorkers(team) { let workers = units.filter(u => u.team === team && u.type === 'worker' && u.hp > 0); let home = buildings.find(b => b.team === team && b.type === 'base'); if (!home)
    return; for (let w of workers) {
    let threat = nearEnemy(w, 105);
    if (w.order?.kind === 'build' && !threat)
        continue;
    if (threat) {
        w.order = { kind: 'move', x: home.x, y: home.y };
        continue;
    }
    if (w.order?.kind === 'harvest' && w.order.node.amount > 0 && (!w.order.node.owner || w.order.node.owner === team) && !(buildings.some(b => b.team === team && b.type === 'refinery' && !b.buildTime) && aiBank[team].plasma < 65 && w.order.node.type === 'ore' && workers.indexOf(w) === 0 && !w.carry))
        continue;
    if (w.carry) {
        w.order = { kind: 'harvest', node: nodes.find(n => n.amount > 0 && (!n.owner || n.owner === team)) };
        continue;
    }
    let bank = aiBank[team], wantsPlasma = workers.indexOf(w) === 0 && buildings.some(b => b.team === team && b.type === 'refinery' && !b.buildTime) && bank.plasma < 90;
    let options = nodes.filter(n => n.amount > 0 && (!n.owner || n.owner === team) && (!wantsPlasma || n.type === 'plasma') && (!n.type.includes('plasma') || buildings.some(b => b.team === team && b.type === 'refinery' && !b.buildTime)) && dist(n, home) < 650 && walk(n.x, n.y));
    options.sort((a, b) => dist(w, a) - dist(w, b) + (a.type === 'ore' && bank.ore < 130 ? -120 : 0) - (b.type === 'ore' && bank.ore < 130 ? -120 : 0));
    if (options.length)
        w.order = { kind: 'harvest', node: options[0] };
} }
function aiThink(team) {
    let base = buildings.find(b => b.team === team && b.type === 'base');
    if (!base)
        return;
    aiManageWorkers(team);
    let own = buildings.filter(b => b.team === team), active = own.filter(b => !b.buildTime), troops = units.filter(u => u.team === team && u.type !== 'worker'), workers = units.filter(u => u.team === team && u.type === 'worker'), enemies = [...units, ...buildings].filter(o => o.team !== team && o.hp > 0 && dist(o, base) < 310);
    if (workers.length + own.filter(b => b.queue?.type === 'worker').length < 3 && aiBank[team].ore >= spec.worker.ore + 55)
        aiQueue(team, 'worker');
    if (!own.some(b => b.type === 'barracks')) {
        aiStructure(team, 'barracks');
        return;
    }
    if (enemies.length > 1 && own.filter(b => b.type === 'tower').length < 2 && aiStructure(team, 'tower', base))
        return;
    if (!own.some(b => b.type === 'refinery')) {
        if (aiBank[team].ore >= plans.refinery.ore + 35)
            aiStructure(team, 'refinery');
        return;
    }
    let village = villages.filter(v => v.owner !== team && dist(v, base) < 800 && own.every(b => b.type !== 'castle' || dist(b, v) > 270)).sort((a, b) => dist(a, base) - dist(b, base))[0];
    if (village && own.filter(b => b.type === 'castle').length < 2) {
        if (aiBank[team].ore >= plans.castle.ore + 30 && aiStructure(team, 'castle', village))
            return;
        if (aiBank[team].ore < plans.castle.ore + 30 && troops.length >= 2)
            return;
    }
    let nearest = nodes.filter(n => n.amount > 100 && n.owner !== team && dist(n, base) < 750 && own.every(b => b.type !== 'castle' || dist(b, n) > 220)).sort((a, b) => dist(a, base) - dist(b, base))[0];
    if (nearest && own.filter(b => b.type === 'castle').length < 2 && aiBank[team].ore >= plans.castle.ore + 60 && aiStructure(team, 'castle', nearest))
        return;
    if (!own.some(b => b.type === 'workshop') && aiBank[team].ore >= plans.workshop.ore + 40 && aiBank[team].plasma >= plans.workshop.plasma + 15) {
        aiStructure(team, 'workshop');
        return;
    }
    if (team === 'amber' && !own.some(b => b.type === 'hangar') && aiBank[team].ore >= plans.hangar.ore + 40 && aiBank[team].plasma >= plans.hangar.plasma + 15) {
        aiStructure(team, 'hangar');
        return;
    }
    if (own.some(b => b.type === 'lab' && !b.buildTime)) {
        let levels = aiTech[team], key = levels.damage <= levels.armor ? 'damage' : 'armor', d = research[key], cost = { ore: d.ore * (levels[key] + 1), plasma: d.plasma * (levels[key] + 1) };
        if (levels[key] < 2 && aiSpend(team, cost)) {
            levels[key]++;
            if (key === 'armor')
                for (let u of units.filter(u => u.team === team)) {
                    let hp = stats(u).hp;
                    u.hp += hp - u.max;
                    u.max = hp;
                }
            return;
        }
    }
    else if (!own.some(b => b.type === 'lab') && aiBank[team].ore >= plans.lab.ore + 180 && aiBank[team].plasma >= plans.lab.plasma + 65) {
        aiStructure(team, 'lab');
        return;
    }
    let cap = 12 + own.filter(b => b.type === 'depot' && !b.buildTime).length * 6, used = units.filter(u => u.team === team).reduce((n, u) => n + (spec[u.type].pop || 1), 0) + own.reduce((n, b) => n + (b.queue ? spec[b.queue.type].pop || 1 : 0), 0);
    if (used >= cap - 2 && own.filter(b => b.type === 'depot').length < 2) {
        aiStructure(team, 'depot');
        return;
    }
    if (troops.length >= 12 || used >= cap)
        return;
    let choices = team === 'red' ? ['raider', 'raider', 'scout', 'tank'] : team === 'violet' ? ['brute', 'soldier', 'brute', 'artillery'] : ['drone', 'raider', 'scout', 'ship'], type = choices[Math.floor(seconds / 9 + troops.length) % choices.length];
    if (type === 'drone' && !active.some(b => b.type === 'hangar'))
        type = 'raider';
    if ((type === 'ship' && !active.some(b => b.type === 'hangar')) || (type === 'tank' || type === 'artillery') && !active.some(b => b.type === 'workshop'))
        type = team === 'violet' ? 'brute' : 'raider';
    if (used + spec[type].pop <= cap && !aiQueue(team, type) && type !== 'raider')
        aiQueue(team, team === 'violet' ? 'brute' : 'raider');
}
function aiOrders(team) { let base = buildings.find(b => b.team === team && b.type === 'base'); if (!base)
    return; let army = units.filter(u => u.team === team && u.type !== 'worker' && !u.embarked), danger = [...units, ...buildings].filter(o => o.team !== team && o.hp > 0 && dist(o, base) < 330); if (danger.length) {
    let target = danger.sort((a, b) => dist(a, base) - dist(b, base))[0];
    for (let u of army)
        if (dist(u, base) < 400)
            u.order = { kind: 'attackMove', x: target.x, y: target.y };
    return;
} let plan = aiPlans[team]; if (army.length >= 3 && seconds - plan.lastRaid > 72) {
    let rivals = buildings.filter(b => b.team !== team && b.team !== 'blue' && b.hp > 0 && (b.type === 'base' || b.type === 'castle')), blue = buildings.find(b => b.team === 'blue' && b.type === 'base'), targets = seconds < 170 ? rivals : [...rivals, ...(blue ? [blue] : [])];
    targets.sort((a, b) => dist(base, a) - dist(base, b));
    let target = targets[0] || blue;
    if (target) {
        let squad = army.filter(u => !u.order || u.order.kind === 'move' || dist(u, base) < 330).slice(0, 6);
        if (squad.length >= 3) {
            for (let u of squad)
                u.order = { kind: 'attackMove', x: target.x, y: target.y };
            plan.lastRaid = seconds;
        }
    }
} }
