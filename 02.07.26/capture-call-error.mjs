import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const IMG_DIR = 'C:/Users/hp/Desktop/sarbon-frontend-main/daily-report/02.07.26/img';

const browser = await chromium.launch({ headless: true });

async function run(vp, suffix) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/en?__callproof=1', { waitUntil: 'networkidle', timeout: 25000 });
    // wait for the seeded error modal to mount
    await page.waitForTimeout(3500);
    await page.screenshot({ path: join(IMG_DIR, 'call-error-modal-' + suffix + '.png'), fullPage: false });
    console.log('OK call-error-modal-' + suffix);
  } catch (e) {
    console.log('FAIL ' + suffix + ': ' + e.message.slice(0, 160));
  } finally {
    await ctx.close();
  }
}

await run({ width: 1440, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
await browser.close();
console.log('Done');
