// REAL authed captures of two 10.07.2026 manager-facing changes, live staging, ru/uz UI:
//  1) GPS tracking (cargo manager) — the map is now scoped to the manager's OWN drivers (own drivers
//     + drivers on their active trips), never the whole fleet; driver search matches name OR phone
//     (digits-only tolerant).
//  2) Drivers page (driver manager) — DriversPage + invite flow + search-params tweaks.
// Two roles => two browser contexts.
//   node daily-report/10.07.26/capture-10-managers.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG = path.join(__dirname, "img");
const CARGO_MGR = "+998994878460";
const DRIVER_MGR = "+998998809935";
const PASSWORD = "Asadxad123";

async function login(page, phone, lang = "uz") {
  await page.goto(`${BASE}/${lang}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", phone, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(6000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed for " + phone + ": " + page.url());
  console.log("logged in", phone, "->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // --- 1) Cargo manager -> GPS tracking (own-driver scoped map) ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    await login(page, CARGO_MGR, "uz");
    await page.goto(`${BASE}/uz/gps-tracking`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(IMG, "05-gps-tracking-scoped.png"), fullPage: false });
    console.log("shot 05-gps-tracking-scoped.png");
    await ctx.close();
  }

  // --- 2) Driver manager -> Drivers page ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    await login(page, DRIVER_MGR, "uz");
    await page.goto(`${BASE}/uz/drivers`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4500);
    await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(IMG, "06-drivers-page.png"), fullPage: false });
    console.log("shot 06-drivers-page.png");
    await ctx.close();
  }

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
