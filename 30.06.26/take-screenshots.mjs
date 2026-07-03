import { chromium } from 'C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/sarbon-frontend-main/daily-report/30.06.26/img';
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function shot(name, url, waitMs = 2000) {
  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: join(IMG_DIR, name + '.png'), fullPage: false });
    console.log('OK', name);
  } catch(e) { console.log('FAIL', name, e.message.slice(0, 80)); }
}

await shot('01-admin-login', '/en/admin/login', 2000);
await shot('02-home', '/en', 2000);
// Admin pages redirect to login if not auth'd — still useful
await shot('03-admin-command-center', '/en/admin/command-center', 2000);
await shot('04-admin-users', '/en/admin/users', 2000);
await shot('05-admin-moderation', '/en/admin/moderation', 2000);
await shot('06-admin-moderation-log', '/en/admin/moderation-log', 2000);
await shot('07-admin-communications', '/en/admin/communications', 2000);
await shot('08-admin-metrics', '/en/admin/metrics', 2000);
await shot('09-admin-cargo', '/en/admin/cargo', 2000);
await shot('10-admin-drivers', '/en/admin/drivers', 2000);

await browser.close();
console.log('Done');
