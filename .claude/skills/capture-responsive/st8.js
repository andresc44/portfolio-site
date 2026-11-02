const pw = require('playwright');
(async () => {
  const b = await pw.webkit.launch(); const p = await (await b.newContext({ ...pw.devices['iPad (gen 7)'], ignoreHTTPSErrors:true })).newPage();
  await p.goto('https://andres-portfolio-local.local/skills-education/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  const mx = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate(m => window.scrollTo({top:m, behavior:'instant'}), mx); await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => {
    const log = []; const x = 200, vh = innerHeight, y0 = vh*0.25, dist = vh*0.35, tgt = document.elementFromPoint(x, y0);
    const mk = (type, y) => { const t = { identifier:1, target:tgt, clientX:x, clientY:y }; const e = new Event(type, {bubbles:true, cancelable:true}); Object.defineProperty(e,'touches',{value: type==='touchend'?[]:[t]}); Object.defineProperty(e,'changedTouches',{value:[t]}); return e; };
    log.push('start y ' + pageYOffset + ' max ' + (document.documentElement.scrollHeight - innerHeight));
    tgt.dispatchEvent(mk('touchstart', y0));
    for (let i = 1; i <= 8; i++) { await new Promise(r => setTimeout(r, 19)); tgt.dispatchEvent(mk('touchmove', y0 + dist*i/8)); log.push('move ' + i + ' y ' + pageYOffset); }
    tgt.dispatchEvent(mk('touchend', y0 + dist));
    for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 120)); log.push('after ' + pageYOffset); }
    return log;
  });
  console.log(r.join(' | '));
  await b.close();
})();
