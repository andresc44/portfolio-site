const pw = require('playwright');
(async () => {
  const b = await pw.webkit.launch(); const p = await (await b.newContext({ ...pw.devices['iPad (gen 7)'], ignoreHTTPSErrors:true })).newPage();
  await p.goto('https://andres-portfolio-local.local/skills-education/', {waitUntil:'load', timeout:240000}); await p.waitForTimeout(4000);
  for (const y of [0, 1080, 2161, 2808, 3045]) { await p.evaluate(m => window.scrollTo({top:m, behavior:'instant'}), y); await p.waitForTimeout(1200); console.log('at', y, 'stops', JSON.stringify(await p.evaluate(() => window.__chStops().map(Math.round))), JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.ch')].map(c => [c.dataset.ch, Math.round(c.getBoundingClientRect().top + scrollY), c.offsetHeight])))); }
  await b.close();
})();
