import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/sarbon-frontend-main/daily-report/02.07.26/img';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(BASE + '/en/admin/login', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 20000 });
  await page.fill('input[autocomplete="username"]', 'admin');
  await page.fill('input[autocomplete="current-password"]', 'admin321321');
  await page.click('button[type="submit"]');
  await page.waitForSelector('header', { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.goto(BASE + '/en/admin/moderation', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: /managers/i }).first().click();
  await page.waitForTimeout(2500);
  // scroll the Managers table into view so the Accept/Reject action buttons are visible
  // action buttons live inside the admin inner-scroll container — scroll a real Accept button
  // (non-sticky) into view so the container scrolls and the Actions column is fully visible
  const acc = page.getByRole('button', { name: /^accept|принять/i }).first();
  if (await acc.count()) await acc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(IMG_DIR, 'admin-moderation-managers-table-desktop.png'), fullPage: false });
  console.log('OK admin-moderation-managers-table-desktop');
} catch (e) {
  console.log('FAIL: ' + e.message.slice(0, 160));
} finally {
  await ctx.close();
  await browser.close();
}
console.log('Done');
