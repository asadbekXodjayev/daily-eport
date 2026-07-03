// Run against a LOCAL dev server pointed at STAGING (not production):
//   1) in sarbon-frontend-main: point .env.local to staging, then `pnpm dev`
//   2) provide admin creds via env (do NOT hardcode secrets):
//      ADMIN_USER=... ADMIN_PASS=... node daily-report/03.07.26/capture-admin-command-center.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/03.07.26/img';
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error('Set ADMIN_USER and ADMIN_PASS env vars before running (creds are not stored in this file).');
  process.exit(1);
}
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function run(vp, suffix) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/en/admin/login', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 20000 });
    await page.fill('input[autocomplete="username"]', ADMIN_USER);
    await page.fill('input[autocomplete="current-password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForSelector('header', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.goto(BASE + '/en/admin/command-center', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: join(IMG_DIR, 'admin-command-center-' + suffix + '.png'), fullPage: suffix === 'desktop' });
    console.log('OK admin-command-center-' + suffix);
  } catch (e) {
    console.log('FAIL ' + suffix + ': ' + e.message.slice(0, 160));
    await page.screenshot({ path: join(IMG_DIR, 'admin-command-center-' + suffix + '.png') }).catch(() => {});
  } finally {
    await ctx.close();
  }
}

await run({ width: 1440, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
await browser.close();
console.log('Done');
