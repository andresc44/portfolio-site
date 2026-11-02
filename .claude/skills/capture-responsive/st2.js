const pw = require('playwright');
(async () => {
  const b = await pw.webkit.launch(); const p = await (await b.newContext({ viewport:{width:1440,height:900}, ignoreHTTPSErrors:true })).newPage();
  await p.goto('https://andres-portfolio-local.local/about-me/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(3500);
  await p.evaluate(() => { window.__s=[]; const tick = t => { window.__s.push([Math.round(t), pageYOffset]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await p.mouse.move(720,450); await p.mouse.wheel(0,120); await p.waitForTimeout(2500);
  const s = await p.evaluate(() => window.__s);
  const t0 = s[0][0]; console.log('samples', s.length); console.log(s.filter((x,i) => i % 4 === 0).map(x => (x[0]-t0)+':'+x[1]).join(' '));
  await b.close();
})();
