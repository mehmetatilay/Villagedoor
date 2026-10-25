// Köy Kapısı — başsız simülasyon testi.
// Çalıştır: node tests/sim.js
// Oyunu tarayıcı olmadan yükler, ~10 dakikalık bir oyun oynatır, kayıt/yükleme ve arayüz fonksiyonlarını dener.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ORDER = ['config', 'world', 'town', 'life', 'save', 'villagers', 'enemies', 'update', 'render', 'ui', 'input', 'main'];

const noop = () => {};
const ctx = new Proxy({ createRadialGradient: () => ({ addColorStop: noop }) }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
const els = {};
function el(id) {
  return els[id] || (els[id] = {
    id, hidden: false, textContent: '', innerHTML: '', style: {}, className: '', disabled: false, dataset: {}, children: [],
    offsetHeight: 180, classList: { toggle: noop, remove: noop, add: noop },
    addEventListener(t, f) { (this.l || (this.l = {}))[t] = f; }, setAttribute: noop, toggleAttribute: noop, appendChild(c) { this.children.push(c); },
    get firstChild() { return { remove: () => this.children.shift() }; }, getContext: () => ctx, setPointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 100 }), clientWidth: 390, clientHeight: 844, width: 0, height: 0,
  });
}
const store = {};
const toasts = [];
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.document = { getElementById: el, hidden: false, addEventListener: noop,
  createElement: () => { const e = el('c' + Math.random()); Object.defineProperty(e, 'textContent', { set(v) { toasts.push(v); }, get() { return ''; } }); return e; } };
global.window = { addEventListener: noop, devicePixelRatio: 2 };
global.innerHeight = 844;
let T = 0; const frames = [];
global.performance = { now: () => T };
global.requestAnimationFrame = f => frames.push(f);
global.setTimeout = noop;

let src = ORDER.map(n => fs.readFileSync(path.join(ROOT, 'js', n + '.js'), 'utf8').replace(/^"use strict";\n/, '')).join('\n');
src += '\n;globalThis.__H={get G(){return G},start(){started=true},saveGame,readSave,loadGame,openTray,updTray,updDock,closeTray,hourAt,residents,bkey};';
(0, eval)('"use strict";\n' + src);
const H = globalThis.__H; H.start();
const G = () => H.G;

let fails = 0;
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails++; };
// Her oyun saniyesinde gece/gündüz durumunu ölç
const day = { night: 0, nightN: 0, work: 1, kids: 0 };
const awake = g => { const vs = g.vill.filter(v => !(v.job === 'asker' && g.orders.asker === 'nobet')); return vs.length ? vs.filter(v => !v.sleep && !v.inside).length / vs.length : 0; };
function sample() {
  const g = G(), h = H.hourAt(g.t);
  if (h >= 1 && h < 4) { day.night = Math.max(day.night, awake(g)); day.nightN++; }
  if (h >= 10 && h < 16 && g.vill.length) day.work = Math.min(day.work, awake(g));
  day.kids = Math.max(day.kids, g.kids.length);
}
const step = sec => { for (let i = 0; i < sec * 20; i++) { T += 50; frames.shift()(T); if (i % 20 === 19) sample(); } };

const plan = [
  [0, () => G().job = 'oduncu'], [15, () => G().job = 'muhendis'], [25, () => G().job = 'madenci'], [35, () => G().job = 'ciftci'], [50, () => G().job = 'oduncu'],
  [60, () => G().oneShot.push('kamp', 'ocak')],
  [130, () => { G().orders.oduncu = 'testere'; }],
  [200, () => { G().orders.oduncu = 'dik'; G().oneShot.push('ciftlik', 'kisla'); }],
  [260, () => { G().orders.oduncu = 'kes'; G().orders.madenci = 'kazma'; }],
  [330, () => { G().orders.madenci = 'guclendir'; G().orders.ciftci = 'saban'; G().job = 'asker'; }],
  [400, () => { G().orders.madenci = 'kir'; G().orders.ciftci = 'hasat'; G().orders.asker = 'avlan'; G().orders.muhendis = 'kule'; }],
  [460, () => { G().orders.asker = 'talim'; G().raids = true; }],
];
console.log('Simülasyon (560 sn):');
try {
  let t = 0;
  for (const [at, fn] of plan) { step(at - t); t = at; fn(); }
  step(560 - t);
  for (const k of ['muhendis', 'oduncu', 'madenci', 'ciftci', 'asker']) { H.openTray(k); H.updTray(); H.updDock(); }
  H.closeTray();
  check(true, 'oyun ve arayüz hatasız çalıştı');
} catch (e) { check(false, 'çalışırken hata: ' + e.stack); }

const g = G();
const has = t => g.blds.some(b => b.type === t && b.built);
check(!g.over, 'köy ayakta');
check(has('atolye'), 'mühendis atölyesi yapıldı');
check(['kamp', 'ocak', 'ciftlik', 'kisla'].every(has), 'dört meslek binası yapıldı');
check(g.tech.testere >= 1, `testere gelişti (seviye ${g.tech.testere})`);
check(g.blds.filter(b => b.type === 'house').length >= 3, 'evler yapıldı');
check(g.vill.length + g.queue > 10, `nüfus arttı (${g.vill.length + g.queue})`);
check(day.nightN > 0 && day.night <= .1, `gece köylüler evinde (en çok %${Math.round(day.night * 100)} dışarıda)`);
check(day.work >= .9, `gündüz köylüler işte (en az %${Math.round(day.work * 100)} dışarıda)`);
check(day.kids > 0 && g.grown >= 1, `çocuklar doğdu ve büyüdü (${g.grown} çocuk sıraya girdi)`);
check(g.vill.every(v => v.home) && g.blds.filter(b => b.type === 'house' && b.built).every(b => H.residents(b) <= [5, 7, 10][b.level - 1]), 'herkesin evi var, evler taşmıyor');
const roads = s => g.road.reduce((n, r) => n + (r >= s ? 1 : 0), 0);
check(roads(1) > 40, `patikalar oluştu (${roads(1)} kare)`);
check(roads(2) > 5, `toprak yollar oluştu (${roads(2)} kare)`);
const houses = g.blds.filter(b => b.type === 'house');
check(g.mah.length >= 1 && houses.every(b => { const m = g.mah.find(q => q.id === b.m); return m && Math.hypot(b.x + 1 - m.x, b.y + 1 - m.y) <= 5.6; }),
  `evler mahallelerde (${g.mah.map(m => m.name).join(', ')})`);
const touches = b => { const n = Math.sqrt(g.road.length), at = (x, y) => g.road[y * n + x] > 0; for (let k = -1; k <= b.w; k++) if (at(b.x + k, b.y - 1) || at(b.x + k, b.y + b.h)) return true;
  for (let k = 0; k < b.h; k++) if (at(b.x - 1, b.y + k) || at(b.x + b.w, b.y + k)) return true; return false; };
check(g.blds.filter(b => b.type !== 'main').every(touches), 'her bina bir yola bitişik');

H.saveGame();
const snap = JSON.stringify({ r: g.res, b: g.blds.length, t: g.trees.length, v: g.vill.length, o: g.orders, tech: g.tech, kids: g.kids.length, homes: g.vill.map(v => v.home).join(';'), road: roads(1) + '/' + roads(2), mah: g.mah.length });
H.loadGame(H.readSave());
const g2 = G();
check(JSON.stringify({ r: g2.res, b: g2.blds.length, t: g2.trees.length, v: g2.vill.length, o: g2.orders, tech: g2.tech, kids: g2.kids.length, homes: g2.vill.map(v => v.home).join(';'), road: g2.road.reduce((n, r) => n + (r >= 1 ? 1 : 0), 0) + '/' + g2.road.reduce((n, r) => n + (r >= 2 ? 1 : 0), 0), mah: g2.mah.length }) === snap, 'kaydet ve yükle aynı köyü veriyor');
try { step(30); check(true, 'yükledikten sonra 30 sn sorunsuz'); } catch (e) { check(false, 'yükleme sonrası hata: ' + e.message); }

if (process.argv.includes('--save')) fs.writeFileSync(path.join(__dirname, 'ornek-kayit.json'), store['koy-kapisi-kayit-v1']);
console.log(fails ? `\n${fails} kontrol başarısız` : '\nHepsi geçti');
process.exit(fails ? 1 : 0);
