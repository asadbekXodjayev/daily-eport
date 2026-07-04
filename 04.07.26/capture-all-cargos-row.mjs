// Live capture of the dispatcher all-cargos ROW view after the grid retune + city-name stripping:
// mini-maps all one height (top-aligned), meta column top-aligned across rows, route timeline
// stretched (origin top / destination bottom), from/to labels show clean city only.
// Run against a LOCAL dev server pointed at STAGING (not production):
//   1) in sarbon-frontend-main: point .env.local to staging, then `pnpm dev`
//   2) provide dispatcher creds via env (do NOT hardcode secrets):
//      DISP_USER=... DISP_PASS=... node daily-report/04.07.26/capture-all-cargos-row.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/04.07.26/img';
const DISP_USER = process.env.DISP_USER;
const DISP_PASS = process.env.DISP_PASS;
if (!DISP_USER || !DISP_PASS) {
  console.error('Set DISP_USER and DISP_PASS env vars before running (creds are not stored in this file).');
  process.exit(1);
}
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function run(vp, suffix) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/en/auth/login', { waitUntil: 'networkidle', timeout: 25000 });
    await page.fill('input[autocomplete="username"], input[type="tel"], input[name="phone"]', DISP_USER).catch(() => {});
    await page.fill('input[type="password"]', DISP_PASS).catch(() => {});
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500);
    await page.goto(BASE + '/en/all-cargos', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(4000); // let Yandex mini-maps settle
    await page.screenshot({ path: join(IMG_DIR, 'all-cargos-row-' + suffix + '.png'), fullPage: suffix === 'desktop' });
    console.log('OK all-cargos-row-' + suffix);
  } catch (e) {
    console.log('FAIL ' + suffix + ': ' + e.message.slice(0, 160));
    await page.screenshot({ path: join(IMG_DIR, 'all-cargos-row-' + suffix + '.png') }).catch(() => {});
  } finally {
    await ctx.close();
  }
}

await run({ width: 1440, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
await browser.close();
console.log('Done');
