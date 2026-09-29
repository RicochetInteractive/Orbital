// Ejecutar con Node.js: node tests/regression.cjs [revision-original]
// Compara la simulación extraída con el index.html original guardado en Git.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
const original = execFileSync('git', ['show', `${process.argv[2] || '3e2600399db4dba203462e118ca9d3613672d62b'}:index.html`], { encoding: 'utf8' });
const inline = [...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
const oldCode = inline.replace(/\(\(\)=>\{'use strict';/, "'use strict';").replace(/\}\)\(\);\s*$/, '');
const html = fs.readFileSync('game.html', 'utf8');
const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(match => match[1]);
const spriteData = JSON.parse(original.match(/id="sprite-data">([\s\S]*?)<\/script>/)[1]);
for (const [key, data] of Object.entries(spriteData)) {
  assert.deepEqual(fs.readFileSync(`assets/sprites/${key}.png`), Buffer.from(data.split(',')[1], 'base64'));
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!match[1].startsWith('https:')) assert.ok(fs.existsSync(match[1]), match[1]);
}
function context(markup, mobile) {
  const elements = new Map();
  const ink = new Proxy({}, { get: (obj, key) => obj[key] || (() => {}), set: (obj, key, value) => (obj[key] = value, true) });
  function element(id) {
    return { id, hidden: false, textContent: '', dataset: {}, style: {}, clientWidth: mobile ? 390 : 1000, clientHeight: 600,
      classList: { toggle() {} }, addEventListener() {}, setPointerCapture() {}, getContext: () => ink,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: mobile ? 390 : 1000, height: 600 }) };
  }
  for (const match of markup.matchAll(/id="([^"]+)"/g)) elements.set(match[1], element(match[1]));
  elements.set('sprite-data', { textContent: JSON.stringify(spriteData) });
  const buttons = attr => [...markup.matchAll(new RegExp(`data-${attr}="([^"]+)"`, 'g'))].map(match => ({ ...element(''), dataset: { [attr]: match[1] } }));
  const factions = buttons('faction'), tabs = buttons('tab');
  const math = Object.create(Math);
  math.random = () => .314159;
  const sandbox = { console, Math: math, performance: { now: () => 0 }, requestAnimationFrame() {},
    matchMedia: () => ({ matches: mobile }), Image: class { complete = true; naturalWidth = 32; },
    document: { getElementById: id => elements.get(id), querySelector: selector => elements.get(selector.slice(1)),
      querySelectorAll: selector => selector === '[data-faction]' ? factions : tabs, createElement: () => element('') },
    window: { devicePixelRatio: 1, addEventListener() {} } };
  return vm.createContext(sandbox);
}
const snapshot = `JSON.stringify({faction,ore,plasma,seconds,started,ended,upgrades,camera,terrain,
  units:units.map(u=>({type:u.type,team:u.team,x:u.x,y:u.y,hp:u.hp,max:u.max,order:u.order?.kind,carry:u.carry,embarked:!!u.embarked,cargo:u.cargo.length})),
  buildings:buildings.map(b=>({type:b.type,team:b.team,x:b.x,y:b.y,hp:b.hp,queue:b.queue,buildTime:b.buildTime})),nodes,villages,aiBank,aiTech,aiPlans,
  hud:['minerals','plasma','clock','supply','status','unitStats'].map(id=>[$(id).textContent,$(id).innerHTML])})`;
for (const mobile of [false, true]) {
  for (const faction of ['colonos', 'mecanos', 'astrales']) {
    const before = context(original, mobile), after = context(html, mobile);
    vm.runInContext(oldCode, before);
    for (const file of scripts) vm.runInContext(fs.readFileSync(file, 'utf8'), after, { filename: file });
    const compare = label => assert.equal(vm.runInContext(snapshot, after), vm.runInContext(snapshot, before), label);
    compare('arranque');
    const steps = [
      `chooseFaction('${faction}'); draw();`,
      `spawn('worker'); for(let i=0;i<200;i++) tick(.05); updateUI(); draw();`,
      `ore=5000;plasma=5000;for(const type of ['depot','barracks','refinery','workshop','lab','hangar']) building(type,'blue',300,550); spawn('tank');spawn('ship');spawn('transport');buyUpgrade('armor');buyUpgrade('damage');buyUpgrade('engine');`,
      `$('allCombat').onclick();order({x:400,y:550});setZoom(1.25);for(let i=0;i<200;i++) tick(.05);updateUI();draw();`,
      `reset();draw();`
    ];
    for (const step of steps) { vm.runInContext(step, before); vm.runInContext(step, after); compare(step); }
    console.log(`OK: ${faction}, ${mobile ? 'móvil' : 'escritorio'}`);
  }
}
console.log(`OK: ${Object.keys(spriteData).length} sprites idénticos, rutas locales y simulación equivalentes.`);
