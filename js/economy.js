// Influencia de castillos, captura de recursos/aldeas e ingresos periódicos.
'use strict';
function castlePower(b) { return 1 + Math.min(5, units.filter(u => u.team === b.team && !u.embarked && dist(u, b) < 115).length) * .22; }
function updateClaims(dt) {
    for (let n of nodes) {
        if (n.amount <= 0)
            continue;
        let scores = {};
        for (let b of buildings.filter(b => b.type === 'castle' && b.hp > 0 && !b.buildTime && dist(b, n) < 255))
            scores[b.team] = (scores[b.team] || 0) + castlePower(b);
        let ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        if (ranked.length && (!ranked[1] || ranked[0][1] > ranked[1][1] + .12)) {
            let team = ranked[0][0];
            if (team !== n.owner) {
                if (n.claimTeam !== team) {
                    n.claimTeam = team;
                    n.capture = 0;
                }
                n.capture += dt * (2.1 + ranked[0][1] * .7);
                if (n.capture >= 100) {
                    n.owner = team;
                    n.claimTeam = null;
                    n.capture = 0;
                    if (team === 'blue')
                        say('Yacimiento de ' + (n.type === 'plasma' ? 'plasma' : 'minerales') + ' capturado.');
                }
            }
            else {
                n.claimTeam = null;
                n.capture = 0;
            }
        }
        else if (n.claimTeam)
            n.capture = Math.max(0, n.capture - dt * 3);
        if (n.owner && scores[n.owner] && n.amount > 0 && (n.owner !== 'blue' || n.type !== 'plasma' || has('refinery'))) {
            n.bankTimer += dt;
            if (n.bankTimer >= 6) {
                n.bankTimer -= 6;
                let amount = Math.min(n.amount, n.type === 'plasma' ? 4 : 7);
                n.amount -= amount;
                if (n.owner === 'blue') {
                    if (n.type === 'plasma')
                        plasma += amount;
                    else
                        ore += amount;
                }
                else
                    aiBank[n.owner][n.type] += amount;
            }
        }
    }
}
// La IA usa los mismos costes de unidades y edificios; los recursos salen de minas y trabajadores.
function updateVillages(dt) { for (let v of villages) {
    let scores = {};
    for (let b of buildings) {
        if (b.type !== 'castle' || b.hp <= 0 || b.buildTime || dist(b, v) >= 280)
            continue;
        scores[b.team] = (scores[b.team] || 0) + castlePower(b);
    }
    let ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (ranked.length && (!ranked[1] || ranked[0][1] > ranked[1][1] + .15)) {
        let team = ranked[0][0];
        if (v.owner !== team) {
            if (v.claimTeam !== team) {
                v.claimTeam = team;
                v.capture = 0;
            }
            v.capture += dt * (2 + ranked[0][1] * .75);
            if (v.capture >= 100) {
                v.owner = team;
                v.claimTeam = null;
                v.capture = 0;
                if (team === 'blue')
                    say('Aldea aliada: +10 minerales cada 8 segundos.');
            }
        }
        else {
            v.claimTeam = null;
            v.capture = 0;
        }
    }
    else if (v.claimTeam)
        v.capture = Math.max(0, v.capture - dt * 3);
    if (v.owner && scores[v.owner]) {
        v.bankTimer += dt;
        while (v.bankTimer >= 8) {
            v.bankTimer -= 8;
            if (v.owner === 'blue')
                ore += 10;
            else
                aiBank[v.owner].ore += 10;
        }
    }
} }
