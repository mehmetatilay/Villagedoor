// Köy Kapısı — tarayıcıda arayüz testi (Playwright + Chromium).
// Çalıştır: node tests/ui.js   (önce: node tests/sim.js --save, örnek kayıt üretir)
// Ekran görüntüleri tests/ekran/ altına yazılır.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'ekran');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  // Yayın ortamının sardığı iskeleti taklit et
  const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
    + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '</body></html>';
  const file = path.join(ROOT, '_test.html');
  fs.writeFileSync(file, page);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + file);
  const save = path.join(__dirname, 'ornek-kayit.json');
  if (fs.existsSync(save)) { await p.evaluate(s => localStorage.setItem('koy-kapisi-kayit-v1', s), fs.readFileSync(save, 'utf8')); await p.reload(); }
  await p.waitForTimeout(300);
  await p.click('#bStart'); await p.waitForTimeout(800);
  await p.click('[data-tok="oduncu"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, '1-oyun.png') });
  await p.click('[data-ordb="oduncu"]'); await p.waitForTimeout(300);
  await p.click('[data-tord="dik"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, '2-oduncu.png') });
  await p.click('[data-ordb="muhendis"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, '3-muhendis.png') });
  await p.mouse.click(195, 300); await p.waitForTimeout(200);
  const closed = await p.evaluate(() => document.getElementById('tray').hidden);
  await p.click('#bPause'); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, '4-menu.png') });
  await b.close();
  fs.unlinkSync(file);
  console.log(closed ? '  ok   haritaya dokununca tepsi kapanıyor' : '  FAIL tepsi kapanmadı');
  console.log(errs.length ? '  FAIL konsol hataları: ' + errs.join(' | ') : '  ok   konsolda hata yok');
  process.exit(closed && !errs.length ? 0 : 1);
})();
