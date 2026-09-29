// Selección de enemigos, daño, efectos y embarque/desembarque de tropas.
'use strict';
function foe(a, b) { return a.team !== b.team; }
function nearEnemy(o, range) { return [...units, ...buildings].filter(v => v.hp > 0 && !v.embarked && foe(o, v) && dist(o, v) < range && (!spec[o.type] || spec[v.type]?.kind !== 'air' || spec[o.type].airAttack)).sort((a, b) => dist(o, a) - dist(o, b))[0]; }
function beam(o, t, heal = false) { particles.push({ x: o.x, y: o.y, tx: t.x, ty: t.y, life: .22, team: o.team, heal }); }
function fight(u, t, dt) { let d = spec[u.type], st = stats(u), range = st.range + t.r; if (d.minRange && dist(u, t) < d.minRange) {
    u.order = { kind: 'move', x: clamp(u.x + (u.x - t.x) * .9, u.r, W - u.r), y: clamp(u.y + (u.y - t.y) * .9, u.r, H - u.r) };
    return;
} if (dist(u, t) > range) {
    move(u, t.x, t.y, range * .8, dt);
    return;
} if (u.cool <= 0) {
    let dmg = st.damage * ((u.type === 'tank' || u.type === 'mech') && t.type in plans ? 1.6 : 1) * (u.type === 'artillery' && t.type in plans ? 1.4 : 1);
    t.hp -= dmg;
    if (d.splash)
        for (let other of units.filter(v => v !== t && v.hp > 0 && foe(u, v) && dist(v, t) < d.splash))
            other.hp -= dmg * .4;
    u.cool = d.rate;
    beam(u, t);
} }
function unload(ship) { if (!ship || !ship.cargo.length)
    return false; let dropped = 0; for (let passenger of [...ship.cargo]) {
    let landing = null;
    for (let radius = 30; radius <= 115 && !landing; radius += 20)
        for (let i = 0; i < 12; i++) {
            let a = i * Math.PI / 6, p = { x: ship.x + Math.cos(a) * radius, y: ship.y + Math.sin(a) * radius };
            if (walk(p.x, p.y) && p.x > 25 && p.y > 25 && p.x < W - 25 && p.y < H - 25 && !buildings.some(b => dist(b, p) < b.r + 18)) {
                landing = p;
                break;
            }
        }
    if (!landing)
        break;
    passenger.x = landing.x;
    passenger.y = landing.y;
    passenger.embarked = null;
    passenger.order = null;
    passenger.path = [];
    ship.cargo.splice(ship.cargo.indexOf(passenger), 1);
    dropped++;
} say(dropped ? dropped + ' unidades desembarcadas.' : 'Busca tierra firme para desembarcar.'); return !!dropped; }
function board(u, ship) { if (!ship || ship.hp <= 0 || ship.team !== u.team || ship.type !== 'transport' || spec[u.type].kind === 'air' || u.embarked)
    return false; let load = ship.cargo.reduce((n, p) => n + (spec[p.type].pop || 1), 0), need = spec[u.type].pop || 1; if (load + need > 4)
    return false; if (dist(u, ship) > ship.r + 30) {
    u.order = { kind: 'board', target: ship };
    move(u, ship.x, ship.y, ship.r + 15, .016);
    return true;
} u.embarked = ship; u.order = null; u.path = []; ship.cargo.push(u); selected = selected.filter(v => v !== u); return true; }
