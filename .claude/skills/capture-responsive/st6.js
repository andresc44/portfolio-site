const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ ...pw.devices['Pixel 7'], ignoreHTTPSErrors:true }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto('https://andres-portfolio-local.local/robotics/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  const mx = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate(m => window.scrollTo({top:m, behavior:'instant'}), mx); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__s=[]; const tick = t => { window.__s.push([Math.round(t), +pageYOffset.toFixed(1)]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  const vh = 839, y0 = vh*0.25, dist = vh*0.35;
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:200,y:y0}] });
  for (let i=1;i<=8;i++){ await p.waitForTimeout(19); await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:200,y:y0+dist*i/8}] }); }
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => window.__s); const t0 = s[0][0];
  console.log('max', mx, s.filter((x,i)=> i<60 && i%2===0).map(x => (x[0]-t0)+':'+x[1]).join(' '));
  await b.close();
})();
