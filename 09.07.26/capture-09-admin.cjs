// REAL authed admin captures of the 09.07.2026 analytics change: the admin "New drivers / managers"
// trend switched from a LINE chart to a BAR chart (AdminLine -> AdminTrendBars: recharts LineChart ->
// BarChart, value labels via LabelList, gridlines). Same admin analytics page the 08.07 report used,
// so this is a clean day-over-day visual diff. Admin login on the live staging backend.
//   node daily-report/09.07.26/capture-09-admin.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG = path.join(__dirname, "img");
const LOGIN = "admin";
const PASSWORD = "admin321321";

async function shot(page, name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(IMG, name), fullPage: false });
  console.log("  shot ->", name);
}
async function settle(page, ms = 6000) {
  await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: ms }).catch(() => {});
  await page.waitForTimeout(1500);
}
async function selectMetric(page, text) {
  const box = page.locator("div").filter({ has: page.getByText("Metric", { exact: true }) }).filter({ has: page.locator(".ant-select") }).last();
  const sel = box.locator(".ant-select").first();
  await sel.scrollIntoViewIfNeeded();
  await sel.click();
  await page.waitForTimeout(500);
  await page.locator(".ant-select-dropdown").last().locator(".ant-select-item-option", { hasText: text }).first().click();
  await settle(page);
}
async function gran(page, text) {
  const seg = page.locator(".ant-segmented").filter({ hasText: "Month" }).first();
  await seg.locator(".ant-segmented-item", { hasText: text }).first().click();
  await settle(page);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/en/admin/login`);
  await page.waitForSelector("input[autocomplete='username']", { timeout: 15000 });
  await page.fill("input[autocomplete='username']", LOGIN);
  await page.fill("input[autocomplete='current-password']", PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL(/admin\/(?!login)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log("logged in");

  await page.goto(`${BASE}/en/admin/users`);
  await page.waitForTimeout(3000);
  await settle(page);

  // New drivers — the FE-bucketed series, now rendered as BARS (was a line on 08.07)
  await selectMetric(page, "New drivers");
  await shot(page, "04-admin-trend-bars-day.png");
  await gran(page, "Week");
  await shot(page, "05-admin-trend-bars-week.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message ? e.message : e); process.exit(1); });
