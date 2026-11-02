const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ ...pw.devices['Pixel 7'], ignoreHTTPSErrors:true }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto('https://andres-portfolio-local.local/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(3500);
  const info = await p.evaluate(() => { const c = document.querySelector('.ch[data-ch="contact"]'); return [Math.round(c.getBoundingClientRect().top + scrollY), innerHeight]; });
  console.log('contact chapter top', info);
  await p.evaluate(t => window.scrollTo({top:t, behavior:'instant'}), info[0]); await p.waitForTimeout(1500);
  const vh = info[1];
  for (const y0 of [0.15, 0.3, 0.5, 0.7, 0.85]) {
    const sy = await p.evaluate(() => pageYOffset);
    const el = await p.evaluate(([x,y]) => { const e = document.elementFromPoint(x,y); return e ? e.tagName + '.' + String(e.className).slice(0,30) + (e.closest('input,textarea,select,button,a') ? ' [interactive:' + e.closest('input,textarea,select,button,a').tagName + ']' : '') : null; }, [200, vh*y0]);
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:200,y:vh*y0}] });
    for (let i=1;i<=8;i++){ await p.waitForTimeout(20); await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:200,y:vh*y0 + vh*0.3*i/8}] }); }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await p.waitForTimeout(1500);
    const ey = await p.evaluate(() => pageYOffset);
    console.log('swipe DOWN-the-page(=scroll up) from', y0, el, ' scrollY', Math.round(sy), '->', Math.round(ey));
    await p.evaluate(t => window.scrollTo({top:t, behavior:'instant'}), info[0]); await p.waitForTimeout(800);
  }
  await b.close();
})();
