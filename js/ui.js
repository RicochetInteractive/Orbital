// Actualización de recursos, estadísticas, mensajes y disponibilidad de acciones.
'use strict';
function say(s) { message = s; messageUntil = seconds + 5; $('status').textContent = s; }
function updateUI() { let s = supply(); $('minerals').textContent = Math.floor(ore); $('plasma').textContent = Math.floor(plasma); $('supply').textContent = s.used + '/' + s.max; $('clock').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(Math.floor(seconds % 60)).padStart(2, '0'); let u = selected.length === 1 ? selected[0] : null; $('selected').textContent = u ? spec[u.type].name + ' · ' + Math.ceil(u.hp) + '/' + u.max + ' PV' : selected.length ? selected.length + ' unidades seleccionadas' : 'Toca una unidad para ver sus datos.'; let st = u ? stats(u) : null; $('unitStats').innerHTML = u ? '<div class="statline"><span>❤️ <b>' + Math.ceil(u.hp) + '/' + u.max + '</b></span><span>⚔️ <b>' + st.damage + '</b></span><span>🏃 <b>' + st.speed + '</b></span><span>🎯 <b>' + st.range + (spec[u.type].minRange ? ' (mín. ' + spec[u.type].minRange + ')' : '') + '</b></span><span>⏱️ <b>' + st.rate + ' s</b></span><span>🧭 ' + (spec[u.type].kind === 'air' ? 'Aérea' : 'Terrestre') + '</span>' + (u.type === 'transport' ? '<span>📦 ' + u.cargo.reduce((n, passenger) => n + spec[passenger.type].pop, 0) + '/4 SUM</span>' : '') + '</div><div>' + role[u.type] + '</div><div>Mejoras: armamento ' + upgrades.damage + ' · blindaje ' + upgrades.armor + ' · motores ' + upgrades.engine + '</div>' : ''; $('status').textContent = seconds < messageUntil ? message : ''; for (let type of ['worker', 'soldier', 'scout', 'medic', 'tank', 'artillery', 'ship', 'transport', 'ranger', 'mech', 'wraith']) {
    let d = spec[type];
    $(type).disabled = !started || ended || paused || !!(d.faction && d.faction !== faction) || !!(d.requires && !has(d.requires)) || !costOK(d) || s.used + d.pop > s.max;
} for (let type of ['depot', 'barracks', 'refinery', 'workshop', 'tower', 'lab', 'hangar', 'castle']) {
    let d = plans[type];
    $(type).disabled = !started || ended || paused || !costOK(d) || !!(d.requires && !has(d.requires));
} for (let key of Object.keys(research)) {
    let d = research[key], lv = upgrades[key], cost = { ore: d.ore * (lv + 1), plasma: d.plasma * (lv + 1) };
    let btn = $('up' + key[0].toUpperCase() + key.slice(1));
    btn.innerHTML = d.name + ' · nivel ' + lv + '/3 <small>' + (lv === 3 ? 'Máximo' : cost.ore + ' 💎 + ' + cost.plasma + ' ⚡ · ' + d.description) + '</small>';
    btn.disabled = !started || ended || paused || !has('lab') || lv === 3 || !costOK(cost);
} $('loadTransport').disabled = paused || ended || !selected.some(x => x.type === 'transport' || spec[x.type].kind !== 'air'); $('unloadTransport').disabled = paused || ended || !selected.some(x => x.type === 'transport' && x.cargo.length); updateCommandUI(); }
