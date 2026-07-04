// Live capture of the admin console responsive hardening (4K → 360px phone): no page horizontal
// scroll at any breakpoint, modals cap height + scroll internally, headers wrap.
// Run against a LOCAL dev server pointed at STAGING (not production):
//   1) in sarbon-frontend-main: point .env.local to staging, then `pnpm dev`
//   2) provide admin creds via env (do NOT hardcode secrets):
//      ADMIN_USER=... ADMIN_PASS=... node daily-report/04.07.26/capture-admin-responsive.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/04.07.26/img';
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error('Set ADMIN_USER and ADMIN_PASS env vars before running (creds are not stored in this file).');
  process.exit(1);
}
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
// Breakpoints from the responsive pass: 4K, laptop, tablet, small phone (360px is the hard floor).
const VIEWPORTS = [
  [{ width: 2560, height: 1440 }, '4k'],
  [{ width: 1366, height: 768 }, 'laptop'],
  [{ width: 768, height: 1024 }, 'tablet'],
  [{ width: 360, height: 800 }, 'phone360'],
];
const PAGES = ['command-center', 'geo', 'push'];

async function login(page) {
  await page.goto(BASE + '/en/admin/login', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 20000 });
  await page.fill('input[autocomplete="username"]', ADMIN_USER);
  await page.fill('input[autocomplete="current-password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

for (const [vp, tag] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    await login(page);
    for (const p of PAGES) {
      await page.goto(BASE + '/en/admin/' + p, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(3000);
      // Assert the cardinal rule: no horizontal page overflow at this breakpoint.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(`${tag}/${p}: horizontal overflow = ${overflow}px ${overflow <= 1 ? 'OK' : 'FAIL'}`);
      await page.screenshot({ path: join(IMG_DIR, `admin-${p}-${tag}.png`), fullPage: false });
    }
  } catch (e) {
    console.log('FAIL ' + tag + ': ' + e.message.slice(0, 160));
  } finally {
    await ctx.close();
  }
}
await browser.close();
console.log('Done');
