// REAL authed capture of the 10.07.2026 Admin Command Center redesign:
//  - a 6th "Total cargo" KPI card
//  - "Trend over time" with date-range + per-series show/hide + horizontal scroll
//  - a unified Summary: ~20 named metrics as counter cards in stakeholder order, each showing the
//    whole family (value · growth% vs prev · average · avg-growth% · previous) with a distinct accent
//    colour and a per-card histogram toggle.
// Captured on /en/admin/command-center, admin login, live staging.
//   node daily-report/10.07.26/capture-10-command-center.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG = path.join(__dirname, "img");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/en/admin/login`);
  await page.waitForSelector("input[autocomplete='username']", { timeout: 15000 });
  await page.fill("input[autocomplete='username']", "admin");
  await page.fill("input[autocomplete='current-password']", "admin321321");
  await page.click("button[type='submit']");
  await page.waitForURL(/admin\/(?!login)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("logged in");

  await page.goto(`${BASE}/en/admin/command-center`);
  await page.waitForTimeout(3500);
  await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
  // top: the 6 KPI cards (incl. Total cargo) + trend
  await page.screenshot({ path: path.join(IMG, "07-admin-command-center.png"), fullPage: false });
  console.log("shot 07-admin-command-center.png");

  // scroll down to the unified Summary counter cards (accent rails + family sub-stats + graph toggle)
  await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 1.1)));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(IMG, "08-admin-summary-cards.png"), fullPage: false });
  console.log("shot 08-admin-summary-cards.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message ? e.message : e); process.exit(1); });
