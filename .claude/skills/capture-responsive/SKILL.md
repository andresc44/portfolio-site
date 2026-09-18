# Capture Responsive Screenshots

description: Take full-page screenshots of the WordPress site at desktop, tablet, and mobile viewport sizes

## Overview

This skill uses Playwright to automatically capture your portfolio site at multiple responsive breakpoints:
- **Desktop**: 1920x1080
- **Tablet**: 768x1024  
- **Mobile**: 375x667

Perfect for reviewing responsive design, creating documentation, or comparing layouts.

## Prerequisites

- **Node.js** installed (v20+) — Available at `C:\Program Files\nodejs\`
- **Playwright** — Automatically installed on first run
- **Chromium browser** — Downloaded on first run (~195MB disk space)

## Quick Start

```bash
node capture-responsive.js
```

Screenshots are saved to: `./screenshots/`

## Output Files

```
screenshots/
├── desktop-1920x1080.png      (798 KB - full desktop layout)
├── tablet-768x1024.png         (621 KB - tablet layout)
└── mobile-375x667.png          (900 KB - mobile layout)
```

## Customizing the Target URL

Edit the script and change the `URL` variable:

```javascript
const URL = 'https://andres-portfolio-local.local/your-page-path/';
```

## Customizing Viewport Sizes

Modify the viewport dimensions in the script to capture different breakpoints:

```javascript
// Desktop view (1920x1080)
await page.setViewportSize({ width: 1920, height: 1080 });

// Add custom sizes:
await page.setViewportSize({ width: 1366, height: 768 }); // Laptop
await page.setViewportSize({ width: 414, height: 896 });  // iPhone 11
```

## Troubleshooting

**Playwright not found:**
```bash
npm install playwright
npx playwright install chromium
```

**Disk space error:**
- Ensure at least 300MB free space
- Chromium downloads to: `~/.ms-playwright/`

**HTTPS certificate errors:**
- Already handled in script with `ignoreHTTPSErrors: true`
- Works with local development URLs

**Page not loading:**
- Verify site is running: https://andres-portfolio-local.local/
- Check Local by Flywheel is active
- Adjust `waitUntil` option: `'networkidle'` | `'domcontentloaded'` | `'load'`

## Full Script Reference

The script (`capture-responsive.js`) handles:
- ✅ HTTPS errors (local dev certificates)
- ✅ Full-page screenshots (scrolls to capture all content)
- ✅ Sequential capture (waits for each page to load)
- ✅ Automatic directory creation
- ✅ Clear success/failure logging

## Tips

- Screenshots are **full-page**, not viewport height
- Takes 2-3 minutes total for all three captures
- Images are PNG (lossless, perfect for archives)
- Use for documentation, design reviews, or before/after comparisons

## Related

- [View Portfolio Site](../view-site/SKILL.md) — How to access the site in development
- [Responsive Viewer Artifact](https://claude.ai/artifact/EFavzwHK3RWvoVzmzkQUWy) — Interactive side-by-side viewer
