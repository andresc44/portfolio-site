// Chapter-scroll tester: node scrolltest.js [profileFilter] [pageFilter]
const pw = require('playwright');
const BASE = 'https://andres-portfolio-local.local';
const PAGES = ['/', '/about-me/', '/skills-education/', '/robotics/', '/projects/'];
const D = pw.devices;
const PROFILES = [
  { name: 'Desktop Chrome 1440',   br: 'chromium', ctx: { viewport: { width: 1440, height: 900 } }, input: 'wheel' },
  { name: 'Laptop Chrome 1366x768', br: 'chromium', ctx: { viewport: { width: 1366, height: 768 } }, input: 'wheel' },
  { name: 'Desktop Firefox 1440',  br: 'firefox',  ctx: { viewport: { width: 1440, height: 900 } }, input: 'wheel' },
  { name: 'Desktop Safari 1440',   br: 'webkit',   ctx: { viewport: { width: 1440, height: 900 } }, input: 'wheel' },
  { name: 'iPhone 15 (Safari)',    br: 'webkit',   ctx: D['iPhone 15'], input: 'synth' },
  { name: 'iPhone SE (old, Safari)', br: 'webkit', ctx: D['iPhone SE'], input: 'synth' },
  { name: 'iPad (Safari)',         br: 'webkit',   ctx: D['iPad (gen 7)'], input: 'synth' },
  { name: 'Pixel 7 (Chrome)',      br: 'chromium', ctx: D['Pixel 7'], input: 'touch' },
  { name: 'Galaxy S9 (Chrome)',    br: 'chromium', ctx: D['Galaxy S9+'], input: 'touch' },
  { name: 'Low-end Android (Moto G4, 4x CPU)', br: 'chromium', ctx: D['Moto G4'], input: 'touch', cpu: 4 },
  { name: 'Galaxy Tab S4 (Chrome)', br: 'chromium', ctx: D['Galaxy Tab S4'], input: 'touch' },
  { name: 'Firefox Android-size',  br: 'firefox',  ctx: { viewport: { width: 412, height: 800 }, hasTouch: false, isMobile: false }, input: 'wheel' },
];

const RECORDER = () => {
  window.__s = []; window.__lf = 0;
  let last = performance.now();
  const tick = (t) => { const dt = t - last; last = t; if (dt > 48) window.__lf++; window.__s.push([Math.round(t), window.pageYOffset]); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};

async function swipeTouch(cdp, p, vh, dir, kind) {
  const x = 200, y0 = dir > 0 ? vh * 0.75 : vh * 0.25, dist = vh * (kind === 'slow' ? 0.5 : 0.35) * (dir > 0 ? -1 : 1);
  const steps = kind === 'slow' ? 24 : 8, dur = kind === 'slow' ? 700 : 150;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= steps; i++) { await p.waitForTimeout(dur / steps); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + dist * i / steps }] }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function swipeSynth(p, vh, dir, kind) {
  await p.evaluate(async ([vh, dir, kind]) => {
    const x = 200, y0 = dir > 0 ? vh * 0.75 : vh * 0.25, dist = vh * (kind === 'slow' ? 0.5 : 0.35) * (dir > 0 ? -1 : 1);
    const steps = kind === 'slow' ? 24 : 8, dur = kind === 'slow' ? 700 : 150;
    const tgt = document.elementFromPoint(x, y0) || document.body;
    const mk = (type, y) => { const t = { identifier: 1, target: tgt, clientX: x, clientY: y, pageX: x, pageY: y + scrollY }; const e = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [t] }); Object.defineProperty(e, 'changedTouches', { value: [t] }); return e; };
    tgt.dispatchEvent(mk('touchstart', y0));
    for (let i = 1; i <= steps; i++) { await new Promise(r => setTimeout(r, dur / steps)); tgt.dispatchEvent(mk('touchmove', y0 + dist * i / steps)); }
    tgt.dispatchEvent(mk('touchend', y0 + dist));
  }, [vh, dir, kind]);
}

(async () => {
  const pf = (process.argv[2] || '').toLowerCase(), pgf = process.argv[3] || '';
  for (const prof of PROFILES) {
    if (pf && !prof.name.toLowerCase().includes(pf)) continue;
    let b;
    try { b = await pw[prof.br].launch(); } catch (e) { console.log(prof.name, 'cannot launch'); continue; }
    const ctx = await b.newContext({ ...prof.ctx, ignoreHTTPSErrors: true });
    for (const u of PAGES) {
      if (pgf && !u.includes(pgf)) continue;
      const p = await ctx.newPage();
      let cdp = null;
      if (prof.br === 'chromium') { cdp = await ctx.newCDPSession(p); if (prof.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu }); }
      const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 80)));
      try { await p.goto(BASE + u, { waitUntil: 'load', timeout: 240000 }); } catch (e) { console.log(prof.name, u, 'LOAD FAIL'); await p.close(); continue; }
      await p.waitForTimeout(3500);
      await p.evaluate(RECORDER);
      const vh = p.viewportSize().height, vw = p.viewportSize().width;
      const stopsRes = [];
      const maxY = async () => p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const gesture = async (dir, kind) => {
        const before = await p.evaluate(() => { window.__s = []; return pageYOffset; });
        if (prof.input === 'touch' && cdp) await swipeTouch(cdp, p, vh, dir, kind);
        else if (prof.input === 'synth') await swipeSynth(p, vh, dir, kind);
        else { await p.mouse.move(vw / 2, vh / 2); await p.mouse.wheel(0, dir * (kind === 'slow' ? 60 : 120)); }
        await p.waitForTimeout(1700);
        const s = await p.evaluate(() => window.__s.slice());
        const after = s.length ? s[s.length - 1][1] : before;
        // reversals against direction of travel
        let rev = 0, prev = before, sign = 0;
        for (const [, y] of s) { const d = y - prev; if (Math.abs(d) > 1.5) { const sg = d > 0 ? 1 : -1; if (sign && sg !== sign) rev++; sign = sg; } prev = y; }
        // settle: last 400ms stationary?
        const tail = s.slice(-20).map(x => x[1]); const moving = Math.max(...tail) - Math.min(...tail) > 1; if (moving && process.env.DBG) console.log('   UNSETTLED tail', JSON.stringify(s.slice(-24)));
        return { before: Math.round(before), after: Math.round(after), rev, moving };
      };
      const out = [];
      const mY = await maxY();
      for (let i = 0; i < 12; i++) { const g = await gesture(1, i % 3 === 2 ? 'slow' : 'fast'); out.push(g); if (g.after >= mY - 2 && i > 1 && out.slice(-2).every(o => o.after === g.after)) break; }
      const down = out.slice();
      const reachedBottom = down.some(g => g.after >= mY - 3);
      const up = [];
      for (let i = 0; i < 14; i++) { const g = await gesture(-1, i % 3 === 2 ? 'slow' : 'fast'); up.push(g); if (g.after <= 3 && i > 1) break; }
      const reachedTop = up.some(g => g.after <= 3);
      const allG = down.concat(up);
      const stuck = allG.filter(g => g.before === g.after).length;
      const reversals = allG.reduce((s, g) => s + g.rev, 0);
      const unsettled = allG.filter(g => g.moving).length;
      const longFrames = await p.evaluate(() => window.__lf);
      const bad = (!reachedBottom || !reachedTop || reversals > 0 || unsettled > 0 || errs.length);
      console.log((bad ? 'ISSUE ' : 'ok    ') + prof.name.padEnd(36) + u.padEnd(20) + `down:${down.length} (bottom ${reachedBottom ? 'Y' : 'N'}) up:${up.length} (top ${reachedTop ? 'Y' : 'N'}) reversals:${reversals} unsettled:${unsettled} stuck-gestures:${stuck} longframes:${longFrames} errs:${errs.length}` + (bad ? '\n      down ' + down.map(g => g.before + '>' + g.after).join(' ') + '\n      up   ' + up.map(g => g.before + '>' + g.after + (g.rev ? '(rev' + g.rev + ')' : '')).join(' ') : ''));
      await p.close();
    }
    await b.close();
  }
})();
