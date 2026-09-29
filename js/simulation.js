// Actualización temporal de unidades, edificios, combate y economía.
'use strict';
function tick(dt) {
    seconds += dt;
    aiTimer += dt;
    trackTimer += dt;
    if (trackTimer >= .55) {
        trackTimer = 0;
        for (let u of units) {
            if (u.embarked)
                continue;
            u.trail.push({ x: u.x, y: u.y });
            if (u.trail.length > 7)
                u.trail.shift();
        }
    }
    updateClaims(dt);
    updateVillages(dt);
    aiProduction(dt);
    if (aiTimer >= 8) {
        aiTimer = 0;
        for (let team of ['red', 'violet', 'amber']) {
            aiThink(team);
            aiOrders(team);
        }
    }
    for (let b of buildings) {
        if (b.type !== 'tower' || b.hp <= 0 || b.buildTime)
            continue;
        b.cool -= dt;
        let t = nearEnemy(b, 170);
        if (t && b.cool <= 0) {
            t.hp -= 18;
            b.cool = .8;
            beam(b, t);
        }
    }
    for (let u of units) {
        if (u.hp <= 0 || u.embarked)
            continue;
        u.cool = Math.max(0, u.cool - dt);
        let o = u.order;
        if (u.type === 'worker' && o?.kind === 'build') {
            if (o.target.hp > 0 && o.target.buildTime > 0)
                move(u, o.target.x, o.target.y, o.target.r + 20, dt);
            else
                u.order = null;
            continue;
        }
        if (o?.kind === 'board') {
            if (!board(u, o.target))
                u.order = null;
            continue;
        }
        if (u.type === 'worker' && o?.kind === 'harvest') {
            let n = o.node, home = buildings.filter(b => b.team === u.team && (b.type === 'base' || b.type === 'castle') && !b.buildTime).sort((a, b) => dist(u, a) - dist(u, b))[0], refinery = buildings.some(b => b.team === u.team && b.type === 'refinery' && !b.buildTime);
            if (!home || !n || (!u.carry && n.amount <= 0) || (!u.carry && n.owner && n.owner !== u.team) || (!u.carry && n.type === 'plasma' && !refinery)) {
                u.order = null;
                continue;
            }
            if (u.carry) {
                if (move(u, home.x, home.y, home.r + 20, dt)) {
                    let amount = u.carry.amount, bank = u.team === 'blue' ? null : aiBank[u.team];
                    if (bank)
                        bank[u.carry.type] += amount;
                    else if (u.carry.type === 'ore')
                        ore += amount;
                    else
                        plasma += amount;
                    u.carry = null;
                }
            }
            else if (move(u, n.x, n.y, 23, dt)) {
                u.harvest += dt;
                if (u.harvest >= .9) {
                    u.carry = { type: n.type, amount: Math.min(n.type === 'plasma' ? 8 : 12, n.amount) * (u.team === 'blue' && faction === 'colonos' ? 1.2 : 1) };
                    n.amount -= Math.ceil(u.carry.amount / (u.team === 'blue' && faction === 'colonos' ? 1.2 : 1));
                    u.harvest = 0;
                }
            }
            continue;
        }
        if (u.type === 'medic') {
            let ally = [...units, ...buildings].filter(v => v.team === u.team && v !== u && v.hp > 0 && v.hp < v.max && !v.embarked && dist(u, v) < 100).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
            if (ally && u.cool <= 0) {
                ally.hp = Math.min(ally.max, ally.hp + 18);
                u.cool = .75;
                beam(u, ally, true);
            }
            if (o?.kind === 'move' || o?.kind === 'attackMove')
                if (move(u, o.x, o.y, 4, dt))
                    u.order = null;
            continue;
        }
        if (u.type === 'transport') {
            if (o?.kind === 'move' || o?.kind === 'attackMove')
                if (move(u, o.x, o.y, 4, dt))
                    u.order = null;
            continue;
        }
        let target = o?.kind === 'attack' && o.target.hp > 0 ? o.target : null;
        if (target && spec[target.type]?.kind === 'air' && !spec[u.type].airAttack)
            target = null;
        if (!target)
            target = nearEnemy(u, u.team === 'blue' ? 150 : 160);
        if (target) {
            fight(u, target, dt);
            continue;
        }
        if (o?.kind === 'move' || o?.kind === 'attackMove')
            if (move(u, o.x, o.y, 4, dt))
                u.order = null;
    }
    for (let u of units.filter(u => u.type === 'transport' && u.hp <= 0))
        for (let passenger of u.cargo)
            passenger.hp = 0;
    units = units.filter(u => u.hp > 0);
    buildings = buildings.filter(b => b.hp > 0);
    selected = selected.filter(u => u.hp > 0 && !u.embarked);
    particles = particles.filter(p => (p.life -= dt) > 0);
    if (!has('base') || !buildings.some(b => b.type === 'base' && b.team !== 'blue')) {
        ended = true;
        say(has('base') ? '¡Victoria! Las tres bases enemigas han caído.' : 'Derrota: tu núcleo ha caído.');
        messageUntil = Infinity;
    }
    if (seconds - lastUi > .2 || ended) {
        lastUi = seconds;
        updateUI();
    }
}
