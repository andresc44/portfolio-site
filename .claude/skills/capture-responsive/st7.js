const pw = require('playwright');
(async () => {
  const b = await pw.webkit.launch(); const p = await (await b.newContext({ ...pw.devices['iPad (gen 7)'], ignoreHTTPSErrors:true })).newPage();
  await p.goto('https://andres-portfolio-local.local/skills-education/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  const mx = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate(m => window.scrollTo({top:m, behavior:'instant'}), mx); await p.waitForTimeout(1500);
  console.log('max', mx, 'vh', p.viewportSize().height);
  console.log(await p.evaluate(() => { const out = []; for (const y of [270, 500]) { let e = document.elementFromPoint(200, y); const chain = []; while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)) chain.push(e.tagName + '.' + String(e.className).slice(0,30) + ' oy=' + cs.overflowY + ' sh=' + e.scrollHeight + ' ch=' + e.clientHeight + ' st=' + e.scrollTop); e = e.parentElement; } out.push('y=' + y + ': ' + document.elementFromPoint(200,y).tagName + ' | scrollers: ' + chain.join(' ; ')); } return out.join('\n'); }));
  await b.close();
})();
