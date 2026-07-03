import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/sarbon-frontend-main/daily-report/02.07.26/img';
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function run(vp, suffix) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    // --- admin login ---
    await page.goto(BASE + '/en/admin/login', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 20000 });
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[autocomplete="current-password"]', 'admin321321');
    await page.click('button[type="submit"]');
    // wait for admin chrome
    await page.waitForSelector('header', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // --- go to moderation ---
    await page.goto(BASE + '/en/admin/moderation', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2500);

    // --- click the Managers tab ---
    const tab = page.getByRole('tab', { name: /managers/i });
    if (await tab.count()) {
      await tab.first().click();
      await page.waitForTimeout(2500);
    } else {
      console.log('WARN managers tab not found ' + suffix);
    }
    await page.screenshot({ path: join(IMG_DIR, 'admin-moderation-managers-' + suffix + '.png'), fullPage: false });
    console.log('OK admin-moderation-managers-' + suffix);

    // open the reject modal on the first actionable row (if any) for proof of the reject flow
    if (suffix === 'desktop') {
      const rejectBtn = page.getByRole('button', { name: /reject|отклон/i });
      if (await rejectBtn.count()) {
        await rejectBtn.first().click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: join(IMG_DIR, 'admin-moderation-reject-modal.png'), fullPage: false });
        console.log('OK admin-moderation-reject-modal');
      } else {
        console.log('INFO no reject button (no pending managers) — panel-only shot captured');
      }
    }
  } catch (e) {
    console.log('FAIL ' + suffix + ': ' + e.message.slice(0, 160));
    await page.screenshot({ path: join(IMG_DIR, 'admin-moderation-managers-' + suffix + '.png'), fullPage: false }).catch(() => {});
  } finally {
    await ctx.close();
  }
}

await run({ width: 1440, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
await browser.close();
console.log('Done');
