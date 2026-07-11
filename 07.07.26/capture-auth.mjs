// Live capture of the 07.07.2026 auth restructure — shared identifier toggle (Telegram / Email)
// above a method toggle (Password / Confirmation code), Email gated to the code method, and the
// phone-input country-flag corner fix. These are PUBLIC pages (no login) → real live captures.
// Run against a local dev server:  pnpm dev  →  node daily-report/07.07.26/capture-auth.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5173';
const LANG = 'ru';
const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/07.07.26/img';
mkdirSync(IMG_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: join(IMG_DIR, name), fullPage: false, ...opts });
  console.log('saved', name);
};
// click item N (0-based) inside the Mth ant-segmented group
const seg = async (page, group, idx) => {
  const g = page.locator('.ant-segmented').nth(group);
  await g.locator('.ant-segmented-item').nth(idx).click();
  await page.waitForTimeout(500);
};
const byEmail = async (page) => {
  await page.locator('.ant-segmented-item', { hasText: 'Email' }).first().click();
  await page.waitForTimeout(500);
};

{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // LOGIN — default: Password + phone (shows the phone input + country-flag fix in context)
  await page.goto(`${BASE}/${LANG}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1400);
  await shot(page, 'auth-login-password-phone.png');

  // Zoomed crop of the phone-input country-flag button (07.07 10:13 corner-overlap fix)
  const phone = page.locator('.react-international-phone').first();
  if (await phone.count()) {
    await phone.scrollIntoViewIfNeeded();
    const box = await phone.boundingBox();
    if (box) {
      await shot(page, 'auth-phone-flag-zoom.png', {
        clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(360, box.width + 16), height: box.height + 16 },
      });
    }
  }

  // LOGIN — Confirmation code + Email (the 11:00 fix: Email gated to the code method)
  await seg(page, 0, 1); // method group -> "Код подтверждения"
  await page.waitForTimeout(300);
  await byEmail(page); // identity -> Email
  await shot(page, 'auth-login-code-email.png');

  // LOGIN — Confirmation code + Telegram (default channel)
  await page.locator('.ant-segmented-item', { hasText: 'Telegram' }).first().click();
  await page.waitForTimeout(500);
  await shot(page, 'auth-login-code-telegram.png');

  // REGISTER — Telegram (default) then Email
  await page.goto(`${BASE}/${LANG}/auth/register`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1400);
  await shot(page, 'auth-register-telegram.png');
  await byEmail(page);
  await shot(page, 'auth-register-email.png');

  // FORGOT — Email
  await page.goto(`${BASE}/${LANG}/auth/forgot`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  await byEmail(page);
  await shot(page, 'auth-forgot-email.png');

  await ctx.close();
}

// Mobile 390 — register email, assert no horizontal overflow
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${LANG}/auth/register`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1400);
  await byEmail(page);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('mobile 390 horizontal overflow =', ov, ov <= 1 ? 'OK' : 'FAIL');
  await shot(page, 'auth-register-email-mobile.png');
  await ctx.close();
}

await browser.close();
console.log('DONE');
