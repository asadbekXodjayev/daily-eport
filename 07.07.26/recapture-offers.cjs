// Focused recapture of offers-simple-localization.png: offers TABLE view with the noise columns
// hidden so the localized offer-TYPE column ("Обычное предложение" = offerType.SIMPLE, the 07.07
// fix) is clearly visible next to the cargo + offer status. Real authed ru capture.
//   node daily-report/07.07.26/recapture-offers.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");
const PHONE = "+998994878460";
const PASSWORD = "Asadxad123";

// Columns to KEEP visible; every other column checkbox gets unchecked.
const KEEP = new Set(["Груз", "Тип предложения", "Статус предложения"]);

async function login(page) {
  await page.goto(`${BASE}/${LANG}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", PHONE, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(6000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await login(page);

  await page.goto(`${BASE}/${LANG}/offers`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  // switch to table view
  await page.locator(".ant-segmented").last().locator(".ant-segmented-item").last().click();
  await page.waitForTimeout(2500);
  // make sure the columns panel is open
  const colBtn = page.getByRole("button", { name: /Колонки/ }).first();
  const panelVisible = await page.locator(".ant-checkbox-wrapper").first().isVisible().catch(() => false);
  if (!panelVisible) { await colBtn.click().catch(() => {}); await page.waitForTimeout(600); }

  // uncheck every column not in KEEP
  const wrappers = page.locator(".ant-checkbox-wrapper");
  const n = await wrappers.count();
  for (let i = 0; i < n; i++) {
    const w = wrappers.nth(i);
    const label = (await w.innerText().catch(() => "")).trim();
    if (!label) continue;
    const checked = await w.locator("input").isChecked().catch(() => false);
    if (!KEEP.has(label) && checked) {
      await w.click();
      await page.waitForTimeout(120);
    }
  }
  await page.waitForTimeout(600);
  // close the columns panel so it doesn't overlap the table
  await colBtn.click().catch(() => {});
  await page.waitForTimeout(1200);
  await page.waitForSelector(".ant-table", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(IMG, "offers-simple-localization.png"), fullPage: false });
  console.log("shot offers-simple-localization.png");
  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
