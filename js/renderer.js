// Cámara, zoom, sprites, campo de batalla, minimapa y bucle de fotogramas.
'use strict';
function viewW() { return c.clientWidth / camera.zoom; }
function viewH() { return c.clientHeight / camera.zoom; }
function clampCamera() { camera.x = clamp(camera.x, 0, Math.max(0, W - viewW())); camera.y = clamp(camera.y, 0, Math.max(0, H - viewH())); }
function focus(x, y) { camera.x = x - viewW() / 2; camera.y = y - viewH() / 2; clampCamera(); }
function resizeCanvas() { let r = c.getBoundingClientRect(); camera.dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.max(1, Math.round(r.width * camera.dpr)); c.height = Math.max(1, Math.round(r.height * camera.dpr)); if (!camera.initialized) {
    camera.zoom = matchMedia('(max-width:800px)').matches ? 1.08 : Math.max(.7, Math.min(r.width / 900, r.height / 600));
    camera.initialized = true;
} clampCamera(); }
function setZoom(value) { let x = camera.x + viewW() / 2, y = camera.y + viewH() / 2; camera.zoom = clamp(value, .65, 1.9); focus(x, y); }
function sprite(key, x, y, w, h) { let im = sprites[key]; if (im && im.complete && im.naturalWidth) {
    g.drawImage(im, x - w / 2, y - h / 2, w, h);
    return true;
} return false; }
function grid() { let left = Math.max(0, Math.floor(camera.x / T) - 1), right = Math.min(COLS - 1, Math.ceil((camera.x + viewW()) / T) + 1), top = Math.max(0, Math.floor(camera.y / T) - 1), bottom = Math.min(ROWS - 1, Math.ceil((camera.y + viewH()) / T) + 1); for (let row = top; row <= bottom; row++)
    for (let col = left; col <= right; col++) {
        let type = terrain[row * COLS + col], x = col * T, y = row * T;
        g.fillStyle = type === 'water' ? '#1c6077' : type === 'cliff' ? '#6d7780' : type === 'sand' ? '#747267' : '#2c5f57';
        g.fillRect(x, y, T + 1, T + 1);
        if (type === 'water') {
            g.strokeStyle = '#85d6df55';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(x + 6, y + 21);
            g.quadraticCurveTo(x + 20, y + 17, x + 34, y + 21);
            g.stroke();
        }
        else if (type === 'cliff') {
            g.fillStyle = '#abb1a377';
            g.beginPath();
            g.moveTo(x + 5, y + 31);
            g.lineTo(x + 19, y + 7);
            g.lineTo(x + 34, y + 33);
            g.fill();
        }
        else {
            g.globalAlpha = .12;
            sprite('ground', x + 20, y + 20, 40, 40);
            g.globalAlpha = 1;
        }
    } }
function bar(o, w) { g.fillStyle = '#091c20'; g.fillRect(o.x - w / 2, o.y - o.r - 17, w, 5); g.fillStyle = color[o.team]; g.fillRect(o.x - w / 2, o.y - o.r - 17, w * clamp(o.hp / o.max, 0, 1), 5); }
function drawBuilding(b) { g.fillStyle = '#071824aa'; g.beginPath(); g.ellipse(b.x, b.y + b.r * .62, b.r * 1.35, b.r * .55, 0, 0, 7); g.fill(); g.strokeStyle = color[b.team]; g.lineWidth = 5; g.beginPath(); g.ellipse(b.x, b.y + b.r * .55, b.r * 1.3, b.r * .56, 0, 0, 7); g.stroke(); sprite(b.type === 'tower' && b.team === 'red' ? 'towerRed' : b.type, b.x, b.y - b.r * .2, b.r * 2.95, b.r * 2.56); if (b.type === 'castle') {
    g.strokeStyle = color[b.team] + '66';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(b.x, b.y, 255, 0, Math.PI * 2);
    g.stroke();
} if (b.type === 'base' && b.team !== 'blue') {
    g.fillStyle = color[b.team];
    g.font = 'bold 17px system-ui';
    g.textAlign = 'center';
    g.fillText(enemyName[b.team], b.x, b.y - b.r - 33);
} g.fillStyle = '#effff8'; g.font = 'bold 16px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(({ base: '⌂', depot: '▣', barracks: '⚑', workshop: '⚙', tower: '', refinery: '◆', lab: '✣', hangar: '✈', castle: '♜' })[b.type], b.x, b.y + b.r * .6); bar(b, b.r * 2); }
function drawUnit(u) { if (u.embarked)
    return; g.fillStyle = '#091b22aa'; g.beginPath(); g.ellipse(u.x, u.y + u.r * .7, u.r * 1.5, u.r * .65, 0, 0, 7); g.fill(); let size = spec[u.type].kind === 'air' ? 51 : spec[u.type].kind === 'vehicle' ? 51 : 45; sprite(u.type, u.x, u.y, size, size); g.strokeStyle = selected.includes(u) ? '#fff499' : color[u.team]; g.lineWidth = selected.includes(u) ? 4 : 2.5; g.beginPath(); if (u.team === 'violet')
    g.rect(u.x - u.r - 9, u.y - u.r - 9, (u.r + 9) * 2, (u.r + 9) * 2);
else if (u.team === 'amber') {
    g.moveTo(u.x, u.y - u.r - 12);
    g.lineTo(u.x + u.r + 12, u.y);
    g.lineTo(u.x, u.y + u.r + 12);
    g.lineTo(u.x - u.r - 12, u.y);
    g.closePath();
}
else
    g.arc(u.x, u.y, u.r + 10, 0, 7); g.stroke(); if (spec[u.type].kind === 'air') {
    g.fillStyle = color[u.team];
    g.beginPath();
    g.arc(u.x, u.y + u.r + 13, 3, 0, 7);
    g.fill();
} if (u.carry) {
    g.fillStyle = u.carry.type === 'plasma' ? '#e9a5ff' : '#a5f2ff';
    g.fillRect(u.x - 5, u.y - 27, 10, 7);
} bar(u, Math.max(30, u.r * 2.3)); }
function renderMiniTerrain() { terrainInk.fillStyle = '#27544f'; terrainInk.fillRect(0, 0, 210, 130); for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
        let type = terrain[row * COLS + col];
        if (type === 'water' || type === 'cliff') {
            terrainInk.fillStyle = type === 'water' ? '#267a99' : '#9aa09b';
            terrainInk.fillRect(col / COLS * 210, row / ROWS * 130, 210 / COLS + 1, 130 / ROWS + 1);
        }
    } }
function drawMini() { mg.drawImage(miniTerrain, 0, 0); for (let n of nodes) {
    if (n.amount <= 0)
        continue;
    mg.fillStyle = n.owner ? color[n.owner] : n.type === 'plasma' ? '#dc9bf8' : '#96e6ef';
    mg.fillRect(n.x / W * 210 - 2, n.y / H * 130 - 2, 4, 4);
} for (let v of villages) {
    mg.fillStyle = v.owner ? color[v.owner] : '#f9e5a0';
    mg.beginPath();
    mg.arc(v.x / W * 210, v.y / H * 130, 3.8, 0, 7);
    mg.fill();
} for (let b of buildings) {
    mg.fillStyle = color[b.team];
    b.team === 'violet' ? mg.fillRect(b.x / W * 210 - 5, b.y / H * 130 - 5, 10, 10) : b.team === 'amber' ? (mg.beginPath(), mg.moveTo(b.x / W * 210, b.y / H * 130 - 6), mg.lineTo(b.x / W * 210 + 6, b.y / H * 130 + 5), mg.lineTo(b.x / W * 210 - 6, b.y / H * 130 + 5), mg.fill()) : mg.fillRect(b.x / W * 210 - 4, b.y / H * 130 - 4, 8, 8);
} for (let u of units) {
    if (u.embarked)
        continue;
    mg.strokeStyle = color[u.team] + '99';
    mg.lineWidth = 1.5;
    if (u.trail.length > 1) {
        mg.beginPath();
        mg.moveTo(u.trail[0].x / W * 210, u.trail[0].y / H * 130);
        for (let q of u.trail.slice(1))
            mg.lineTo(q.x / W * 210, q.y / H * 130);
        mg.lineTo(u.x / W * 210, u.y / H * 130);
        mg.stroke();
    }
    mg.fillStyle = color[u.team];
    mg.beginPath();
    mg.arc(u.x / W * 210, u.y / H * 130, u.team === 'blue' ? 3 : 4.5, 0, Math.PI * 2);
    mg.fill();
} mg.strokeStyle = '#fff3ae'; mg.lineWidth = 2; mg.strokeRect(camera.x / W * 210 + 1, camera.y / H * 130 + 1, Math.max(2, viewW() / W * 210 - 2), Math.max(2, viewH() / H * 130 - 2)); }
function draw() { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d202d'; g.fillRect(0, 0, c.width, c.height); let scale = camera.dpr * camera.zoom; g.setTransform(scale, 0, 0, scale, -camera.x * scale, -camera.y * scale); grid(); for (let n of nodes) {
    if (n.amount <= 0 || n.x < camera.x - 50 || n.x > camera.x + viewW() + 50 || n.y < camera.y - 50 || n.y > camera.y + viewH() + 50)
        continue;
    g.fillStyle = n.owner ? color[n.owner] : (n.type === 'plasma' ? '#ab67d2' : '#60b6cc');
    g.beginPath();
    g.arc(n.x, n.y, 22, 0, 7);
    g.fill();
    if (n.claimTeam) {
        g.strokeStyle = color[n.claimTeam];
        g.lineWidth = 5;
        g.beginPath();
        g.arc(n.x, n.y, 26, -Math.PI / 2, -Math.PI / 2 + n.capture / 100 * Math.PI * 2);
        g.stroke();
    }
    sprite(n.type === 'plasma' ? 'plasma' : 'ore', n.x, n.y, 37, 37);
    g.strokeStyle = n.type === 'plasma' ? '#efbbff' : '#b8ffff';
    g.lineWidth = 2;
    g.stroke();
} for (let v of villages) {
    g.fillStyle = v.owner ? color[v.owner] : '#ecd498';
    g.beginPath();
    g.arc(v.x, v.y, 29, 0, 7);
    g.fill();
    sprite('depot', v.x, v.y - 4, 67, 58);
    g.fillStyle = '#142b34';
    g.fillRect(v.x - 18, v.y + 17, 36, 18);
    g.fillStyle = '#fff';
    g.font = 'bold 12px system-ui';
    g.textAlign = 'center';
    g.fillText('ALDEA', v.x, v.y + 30);
    if (v.claimTeam) {
        g.strokeStyle = color[v.claimTeam];
        g.lineWidth = 4;
        g.beginPath();
        g.arc(v.x, v.y, 34, -Math.PI / 2, -Math.PI / 2 + v.capture / 100 * 7);
        g.stroke();
    }
} for (let b of buildings)
    drawBuilding(b); for (let u of units)
    drawUnit(u); for (let p of particles) {
    g.strokeStyle = p.heal ? '#b1ffc5' : color[p.team];
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.tx, p.ty);
    g.stroke();
} if (drag && pointer && gesture?.type === 'mouse' && !mode) {
    g.strokeStyle = '#b8fff1';
    g.fillStyle = '#74ecdd33';
    g.lineWidth = 2;
    let x = Math.min(drag.x, pointer.x), y = Math.min(drag.y, pointer.y), w = Math.abs(drag.x - pointer.x), h = Math.abs(drag.y - pointer.y);
    if (w > 8 && h > 8) {
        g.fillRect(x, y, w, h);
        g.strokeRect(x, y, w, h);
    }
} if (mode && ghost) {
    let ok = canPlace(mode, ghost), d = plans[mode];
    g.strokeStyle = ok ? '#9dffb4' : '#ff948b';
    g.fillStyle = ok ? '#61f09a66' : '#f2666680';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(ghost.x, ghost.y, d.r + 9, 0, 7);
    g.fill();
    g.stroke();
    g.globalAlpha = .75;
    sprite(mode, ghost.x, ghost.y, d.r * 2.2, d.r * 2.2);
    g.globalAlpha = 1;
    g.fillStyle = ok ? '#e7ffce' : '#ffe1d8';
    g.font = 'bold 16px system-ui';
    g.textAlign = 'center';
    g.fillText(ok ? 'TOCA PARA CONSTRUIR' : 'ZONA BLOQUEADA', ghost.x, ghost.y - d.r - 24);
    g.textAlign = 'left';
} if (ended) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#091826c7';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.font = 'bold 38px system-ui';
    g.textAlign = 'center';
    g.fillText(has('base') ? 'VICTORIA' : 'DERROTA', c.width / 2, c.height / 2);
    g.textAlign = 'left';
} drawMini(); }
function frame(now) { let dt = Math.min((now - last) / 1000, .05); last = now; if (started && !ended)
    tick(dt); draw(); requestAnimationFrame(frame); }
