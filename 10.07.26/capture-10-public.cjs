// REAL capture of the 10.07.2026 login-page simplification: the Telegram/Email identity picker is
// now hidden behind EMAIL_AUTH_ENABLED (off for the staging->main push), so login is phone-only —
// just the method tabs (Пароль / Код) over a single phone input. Public page, no auth. ru UI.
//   node daily-report/10.07.26/capture-10-public.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // LOGIN — default (Код method, phone). No Telegram/Email identity segmented pill anymore.
  await page.goto(`${BASE}/${LANG}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(IMG, "01-login-phone-only.png"), fullPage: false });
  console.log("shot 01-login-phone-only.png");

  // LOGIN — Password tab (phone + password), still phone-only identity
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(IMG, "02-login-password-phone.png"), fullPage: false });
  console.log("shot 02-login-password-phone.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
