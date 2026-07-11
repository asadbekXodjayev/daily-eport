// REAL authed captures for the two 07.07.2026 items that were previously shipped as static HTML
// reproductions because their pages are dispatcher-auth-gated (capture-repros.mjs):
//   1) AI cargo-create page — paste an announcement, DeepSeek fills the form, AI-confidence
//      borders (ai-field-success/-warning/-error) render live.
//   2) Offers page (table view) — the offer-TYPE column showing the localized "Обычное
//      предложение" (offerType.SIMPLE), the 07.07 localization fix, live in the ru UI.
//
// The AI-create route is behind AI_CARGO_CREATE_ENABLED (hidden 2026-07-10 for the staging->main
// push). This script is run with the flag TEMPORARILY enabled by the caller, then reverted, so the
// screenshot is the real shipped component against the live staging backend + real DeepSeek parse.
//   node daily-report/07.07.26/capture-authed-live.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");
const PHONE = "+998994878460"; // cargo manager
const PASSWORD = "Asadxad123";

async function login(page) {
  await page.goto(`${BASE}/${LANG}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click(); // Password method
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", PHONE, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(6000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + page.url());
  console.log("logged in ->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await login(page);

  // ---- 1) AI cargo-create (real page + real DeepSeek parse) ----
  await page.goto(`${BASE}/${LANG}/cargo-ai-create`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  if (/my-cargos/.test(page.url())) throw new Error("AI create still flag-gated (redirected to my-cargos)");
  const announcement = [
    "Груз: Ташкент → Алматы",
    "Тип: тент, 20 тонн, 96 м³",
    "Загрузка: 09.07.2026, готов",
    "Оплата: 12 000 000 сум, предоплата 30%",
    "Телефон: +998 90 123-45-67",
    "Логистик 24",
  ].join("\n");
  const paste = page.locator(".ant-input").first();
  await paste.click();
  await paste.fill(announcement);
  await page.waitForTimeout(400);
  await page.locator(".ai-generate-btn").click();
  // wait for the DeepSeek parse to hydrate the form (colored borders appear)
  await page.waitForSelector(".ai-field-success, .ai-field-warning, .ai-field-error", { timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(IMG, "ai-cargo-create.png"), fullPage: true });
  console.log("shot ai-cargo-create.png");

  // ---- 2) Offers table view — localized offer-TYPE column ----
  await page.goto(`${BASE}/${LANG}/offers`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  // switch to table view: the view Segmented (card/table) is the last segmented in the toolbar
  const viewSeg = page.locator(".ant-segmented").last();
  await viewSeg.locator(".ant-segmented-item").last().click();
  await page.waitForTimeout(3500);
  await page.waitForSelector(".ant-table", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(IMG, "offers-simple-localization.png"), fullPage: false });
  console.log("shot offers-simple-localization.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
