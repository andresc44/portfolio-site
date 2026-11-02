const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ ...pw.devices['Pixel 7'], ignoreHTTPSErrors:true }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto('https://andres-portfolio-local.local/about-me/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  await p.evaluate(() => { window.__s=[]; const tick = t => { window.__s.push([Math.round(t), +pageYOffset.toFixed(1)]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  const vh = 839;
  for (const kind of ['fast','slow','fast']) {
    await p.evaluate(() => window.__s = []);
    const y0 = vh*0.75, dist = -vh*(kind==='slow'?0.5:0.35), steps = kind==='slow'?24:8, dur = kind==='slow'?700:150;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:200,y:y0}] });
    for (let i=1;i<=steps;i++){ await p.waitForTimeout(dur/steps); await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:200,y:y0+dist*i/steps}] }); }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await p.waitForTimeout(1600);
    const s = await p.evaluate(() => window.__s); const t0 = s[0][0];
    console.log(kind, s.filter((x,i)=> i%3===0).map(x => (x[0]-t0)+':'+x[1]).join(' '));
  }
  await b.close();
})();
