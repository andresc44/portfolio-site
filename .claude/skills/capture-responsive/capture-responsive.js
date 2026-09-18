const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://andres-portfolio-local.local/robust-visual-navigation-using-semantic-segmentation-and-sensor-fusion/';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

async function captureResponsive() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Desktop view (1920x1080)
    console.log('Capturing desktop view (1920x1080)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop-1920x1080.png'), fullPage: true });
    console.log('✓ Desktop screenshot saved');

    // Mobile view (375x667 - iPhone SE)
    console.log('Capturing mobile view (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'mobile-375x667.png'), fullPage: true });
    console.log('✓ Mobile screenshot saved');

    // Tablet view (768x1024 - iPad)
    console.log('Capturing tablet view (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'tablet-768x1024.png'), fullPage: true });
    console.log('✓ Tablet screenshot saved');

    console.log(`\n✅ All screenshots saved to: ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
  }
}

captureResponsive().catch(console.error);
