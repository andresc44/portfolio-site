const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ ...pw.devices['Pixel 7'], ignoreHTTPSErrors:true }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto('https://andres-portfolio-local.local/robotics/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  await p.evaluate(() => { window.__s=[]; const tick = t => { window.__s.push([Math.round(t), +pageYOffset.toFixed(1)]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  const vh = 839;
  const sw = async (dir, kind) => {
    await p.evaluate(() => window.__s = []);
    const y0 = dir>0 ? vh*0.75 : vh*0.25, dist = (dir>0?-1:1)*vh*(kind==='slow'?0.5:0.35), steps = kind==='slow'?24:8, dur = kind==='slow'?700:150;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:200,y:y0}] });
    for (let i=1;i<=steps;i++){ await p.waitForTimeout(dur/steps); await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:200,y:y0+dist*i/steps}] }); }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await p.waitForTimeout(1500);
    const s = await p.evaluate(() => window.__s); let prev = s[0][1], sign = 0, out = [];
    for (const [t,y] of s) { const d = y - prev; if (Math.abs(d) > 1.5) { const sg = d>0?1:-1; if (sign && sg !== sign) out.push('REV@'+t+' '+prev+'->'+y); sign = sg; } prev = y; }
    console.log(dir>0?'down':'up', kind, 'start', s[0][1], 'end', s[s.length-1][1], out.join(' ') || 'monotonic');
  };
  await sw(1,'fast'); await sw(1,'fast'); await sw(1,'slow'); await sw(-1,'fast'); await sw(-1,'slow'); await sw(-1,'fast');
  await b.close();
})();
