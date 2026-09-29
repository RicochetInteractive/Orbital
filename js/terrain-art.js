// Arte procedural estable: no consume el generador de la simulación.
'use strict';
function terrainNoise(x, y, salt = 0) {
    let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ salt;
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return (n >>> 0) / 4294967296;
}

const terrainCanvas = document.createElement('canvas');
terrainCanvas.width = W; terrainCanvas.height = H;
let paintedTerrain = null;
function drawTerrain() {
    if (paintedTerrain !== terrain) { bakeTerrain(); paintedTerrain = terrain; }
    g.drawImage(terrainCanvas, 0, 0);
}
function bakeTerrain() {
    const g = terrainCanvas.getContext('2d');
    const left = 0, right = COLS - 1, top = 0, bottom = Math.ceil(ROWS) - 1;
    for (let row = top; row <= bottom; row++) for (let col = left; col <= right; col++) {
        const type = terrain[row * COLS + col], x = col * T, y = row * T, noise = terrainNoise(col, row);
        g.fillStyle = type === 'water' ? '#193d48' : type === 'cliff' ? '#404b48' : '#334e40';
        g.fillRect(x, y, T + 1, T + 1);
        if (type === 'sand') {
            const sand = g.createRadialGradient(x + 20, y + 20, 4, x + 20, y + 20, 30);
            sand.addColorStop(0, '#8d805a66'); sand.addColorStop(1, '#8d805a00');
            g.fillStyle = sand; g.fillRect(x, y, T, T);
        }
        if (type === 'water') {
            g.strokeStyle = '#669b9e35'; g.lineWidth = 1;
            for (let k = 0; k < 2; k++) {
                const yy = y + 9 + k * 19 + noise * 7;
                g.beginPath(); g.moveTo(x + 4 + noise * 7, yy); g.quadraticCurveTo(x + 18, yy - 2, x + 31, yy); g.stroke();
            }
            // Riberas dentro de la celda de agua: coinciden con el terreno transitable.
            g.strokeStyle = '#89967777'; g.lineWidth = 3;
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                if (tile(x + 20 + dx * T, y + 20 + dy * T) === 'water') continue;
                g.beginPath();
                if (dx) { const xx = x + (dx > 0 ? T - 2 : 2); g.moveTo(xx, y); g.lineTo(xx, y + T); }
                else { const yy = y + (dy > 0 ? T - 2 : 2); g.moveTo(x, yy); g.lineTo(x + T, yy); }
                g.stroke();
            }
        } else if (type === 'cliff') {
            const peak = 9 + noise * 13;
            g.fillStyle = '#111f2266'; g.beginPath(); g.ellipse(x + 23, y + 32, 19, 8, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#68716a'; g.beginPath(); g.moveTo(x + 3, y + 28); g.lineTo(x + 11, y + 10); g.lineTo(x + peak, y + 5); g.lineTo(x + 35, y + 19); g.lineTo(x + 37, y + 31); g.lineTo(x + 18, y + 36); g.closePath(); g.fill();
            g.fillStyle = '#394640'; g.beginPath(); g.moveTo(x + peak, y + 5); g.lineTo(x + 35, y + 19); g.lineTo(x + 37, y + 31); g.lineTo(x + 18, y + 36); g.lineTo(x + 22, y + 19); g.fill();
            g.strokeStyle = '#a2aa8955'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y + 27); g.lineTo(x + 12, y + 11); g.lineTo(x + peak, y + 6); g.stroke();
        } else {
            for (let k = 0; k < 5; k++) {
                const px = x + terrainNoise(col, row, k * 997 + 1) * 38, py = y + terrainNoise(col, row, k * 677 + 2) * 38;
                g.strokeStyle = k % 2 ? '#a1ac7350' : '#172e2460'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(px - 2, py + 3); g.lineTo(px, py - 2); g.lineTo(px + 2, py + 2); g.stroke();
            }
            if (noise > .82) { g.fillStyle = '#a5a08040'; g.beginPath(); g.ellipse(x + 8, y + 23, 3, 1.7, noise, 0, Math.PI * 2); g.fill(); }
        }
        g.fillStyle = '#061411'; g.globalAlpha = noise * .06; g.fillRect(x, y, T, T); g.globalAlpha = 1;
    }
}

function drawResource(n) {
    g.fillStyle = '#071d2390'; g.beginPath(); g.ellipse(n.x, n.y + 12, 22, 9, 0, 0, Math.PI * 2); g.fill();
    const purple = n.type === 'plasma';
    for (const [dx, dy, height] of [[-10, 2, 18], [10, 5, 20], [0, 0, 30]]) {
        const x = n.x + dx, y = n.y + dy;
        g.fillStyle = purple ? '#9665af' : '#72b9bb';
        g.beginPath(); g.moveTo(x - 6, y + 10); g.lineTo(x - 7, y - height * .35); g.lineTo(x, y - height); g.lineTo(x + 7, y - height * .4); g.lineTo(x + 5, y + 8); g.closePath(); g.fill();
        g.fillStyle = purple ? '#d9a9e1' : '#c1e2d6';
        g.beginPath(); g.moveTo(x, y - height); g.lineTo(x + 7, y - height * .4); g.lineTo(x, y + 5); g.closePath(); g.fill();
    }
    if (n.owner || n.claimTeam) {
        g.strokeStyle = color[n.claimTeam || n.owner]; g.lineWidth = 2;
        g.beginPath(); g.arc(n.x, n.y, 26, -Math.PI / 2, -Math.PI / 2 + (n.claimTeam ? n.capture / 100 : 1) * Math.PI * 2); g.stroke();
    }
}
