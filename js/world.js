// Generación del mapa, recursos, aldeas y navegación terrestre con A*.
'use strict';
const rand = (a, b) => a + rng() * (b - a), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function random() { let n = seed += 0x6d2b79f5; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }
function tile(x, y) { let col = Math.floor(x / T), row = Math.floor(y / T); if (col < 0 || row < 0 || col >= COLS || row >= ROWS)
    return 'cliff'; return terrain[row * COLS + col]; }
function walk(x, y) { return tile(x, y) !== 'water' && tile(x, y) !== 'cliff'; }
function generateMap() { terrain = []; let lakes = [{ x: 480, y: 410, rx: 145, ry: 132, type: 'water' }, { x: 1090, y: 430, rx: 180, ry: 115, type: 'water' }, { x: 760, y: 810, rx: 130, ry: 140, type: 'cliff' }, { x: 1360, y: 670, rx: 140, ry: 115, type: 'cliff' }, { x: 1770, y: 560, rx: 180, ry: 145, type: 'water' }, { x: 1880, y: 1090, rx: 155, ry: 130, type: 'cliff' }, { x: 930, y: 1170, rx: 175, ry: 120, type: 'water' }]; for (let i = 0; i < 9; i++)
    lakes.push({ x: 400 + rand(0, 1700), y: 150 + rand(0, 1200), rx: 36 + rand(0, 45), ry: 38 + rand(0, 50), type: i % 2 ? 'water' : 'cliff' }); for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
        let x = col * T + T / 2, y = row * T + T / 2, type = ((col * 7 + row * 13 + Math.floor(rand(0, 8))) % 13 < 3) ? 'sand' : 'plain';
        for (let a of lakes) {
            let noise = rand(-.11, .11);
            if (((x - a.x) / a.rx) ** 2 + ((y - a.y) / a.ry) ** 2 < 1 + noise)
                type = a.type;
        }
        if ((x < 390 && y > 350 && y < 780) || (x > 1990 && ((y < 420) || (y > 1080))) || (x > 1080 && x < 1430 && y < 340))
            type = 'plain';
        terrain.push(type);
    } }
function node(type, x, y, amount) { let n = { type, x, y, amount, owner: null, claimTeam: null, capture: 0, bankTimer: 0 }; nodes.push(n); return n; }
function placeResources() { nodes = []; let starters = [['ore', 270, 465], ['ore', 300, 535], ['ore', 285, 610], ['ore', 345, 575], ['plasma', 355, 700], ['ore', 2025, 305], ['ore', 2040, 1165], ['ore', 1155, 225], ['plasma', 2100, 380], ['plasma', 2015, 1290], ['plasma', 1350, 255]]; for (let [type, x, y] of starters)
    node(type, x, y, 850); let attempts = 0; while (nodes.length < 58 && attempts++ < 1600) {
    let x = 80 + rand(0, W - 160), y = 80 + rand(0, H - 160), type = rng() < .32 ? 'plasma' : 'ore';
    if (!walk(x, y) || nodes.some(n => dist(n, { x, y }) < 85) || buildings.some(b => dist(b, { x, y }) < b.r + 95) || !route({ x: 140, y: 550 }, { x, y }).length)
        continue;
    node(type, x, y, 450 + Math.floor(rand(0, 450)));
} }
function placeVillages() { villages = []; let sites = [[590, 240], [780, 590], [1020, 1000], [1450, 1050], [1650, 290], [1980, 790], [1080, 1370], [1670, 1320]]; for (let [x, y] of sites) {
    let found = null;
    for (let r of [0, 55, 100, 150, 200]) {
        for (let k = 0; k < 16; k++) {
            let p = { x: x + Math.cos(k * Math.PI / 8) * r, y: y + Math.sin(k * Math.PI / 8) * r };
            if (p.x < 70 || p.y < 70 || p.x > W - 70 || p.y > H - 70 || !walk(p.x, p.y) || nodes.some(n => dist(n, p) < 65) || buildings.some(b => dist(b, p) < b.r + 55) || villages.some(v => dist(v, p) < 230) || !route({ x: 140, y: 550 }, p).length)
                continue;
            found = p;
            break;
        }
        if (found)
            break;
    }
    if (found)
        villages.push({ x: found.x, y: found.y, owner: null, claimTeam: null, capture: 0, bankTimer: 0, r: 25 });
} }
// A* sobre celdas transitables. Las naves vuelan directamente.
function route(from, to) { let sx = clamp(Math.floor(from.x / T), 0, COLS - 1), sy = clamp(Math.floor(from.y / T), 0, ROWS - 1), gx = clamp(Math.floor(to.x / T), 0, COLS - 1), gy = clamp(Math.floor(to.y / T), 0, ROWS - 1); if (!walk(gx * T + 20, gy * T + 20)) {
    let found = false;
    for (let r = 1; r < 8 && !found; r++)
        for (let dy = -r; dy <= r && !found; dy++)
            for (let dx = -r; dx <= r; dx++) {
                let xx = gx + dx, yy = gy + dy;
                if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS && walk(xx * T + 20, yy * T + 20)) {
                    gx = xx;
                    gy = yy;
                    found = true;
                    break;
                }
            }
    if (!found)
        return [];
} let start = sy * COLS + sx, goal = gy * COLS + gx, open = [start], seen = new Set(), score = new Float64Array(COLS * ROWS).fill(Infinity), came = new Int32Array(COLS * ROWS).fill(-1); score[start] = 0; let h = id => Math.abs(id % COLS - gx) + Math.abs(Math.floor(id / COLS) - gy); while (open.length) {
    open.sort((a, b) => score[a] + h(a) - score[b] - h(b));
    let cur = open.shift();
    if (cur === goal) {
        let points = [];
        while (cur !== start && cur >= 0) {
            points.push({ x: (cur % COLS + .5) * T, y: (Math.floor(cur / COLS) + .5) * T });
            cur = came[cur];
        }
        points.reverse();
        return points;
    }
    if (seen.has(cur))
        continue;
    seen.add(cur);
    let x = cur % COLS, y = Math.floor(cur / COLS);
    for (let [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nx = x + dx, ny = y + dy, id = ny * COLS + nx;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || !walk(nx * T + 20, ny * T + 20) || seen.has(id))
            continue;
        let next = score[cur] + 1;
        if (next < score[id]) {
            score[id] = next;
            came[id] = cur;
            open.push(id);
        }
    }
} return []; }
function direct(u, x, y, stop, dt) { let dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy); if (d <= stop + 2)
    return true; let step = Math.min(d - stop, stats(u).speed * dt); u.x = clamp(u.x + dx / d * step, u.r, W - u.r); u.y = clamp(u.y + dy / d * step, u.r, H - u.r); return false; }
function move(u, x, y, stop, dt) { if (spec[u.type].kind === 'air')
    return direct(u, x, y, stop, dt); if (dist(u, { x, y }) <= stop + 2)
    return true; if (Math.floor(u.x / T) === Math.floor(x / T) && Math.floor(u.y / T) === Math.floor(y / T) && walk(x, y))
    return direct(u, x, y, stop, dt); let goal = Math.floor(x / T) + Math.floor(y / T) * COLS; u.pathTime -= dt; if (u.pathTarget !== goal || u.pathTime <= 0 && u.path.length === 0) {
    u.path = route(u, { x, y });
    u.pathTarget = goal;
    u.pathTime = 1.1;
} if (!u.path.length)
    return false; let next = u.path[0]; if (direct(u, next.x, next.y, 3, dt))
    u.path.shift(); return dist(u, { x, y }) <= stop + 2; }
