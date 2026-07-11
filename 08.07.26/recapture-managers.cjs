const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG = path.join(__dirname, "img");

async function shot(page, name) {
  await page.screenshot({ path: path.join(IMG, name), fullPage: false });
  console.log("  shot ->", name);
}
async function longSettle(page) {
  // dispatchers fetch-all pages through the whole list — give it up to 40s
  await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(2500);
}
async function selectMetric(page, text) {
  const box = page.locator("div").filter({ has: page.getByText("Metric", { exact: true }) }).filter({ has: page.locator(".ant-select") }).last();
  await box.locator(".ant-select").first().click();
  await page.waitForTimeout(500);
  await page.locator(".ant-select-dropdown").last().locator(".ant-select-item-option", { hasText: text }).first().click();
  await longSettle(page);
}
async function view(page, text) {
  const seg = page.locator(".ant-segmented").filter({ hasText: "Cargo managers" }).first();
  await seg.locator(".ant-segmented-item", { hasText: text }).first().click();
  await page.waitForTimeout(2500);
  await longSettle(page);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/admin/login`);
  await page.waitForSelector("input[autocomplete='username']", { timeout: 15000 });
  await page.fill("input[autocomplete='username']", "admin");
  await page.fill("input[autocomplete='current-password']", "admin321321");
  await page.click("button[type='submit']");
  await page.waitForURL(/admin\/(?!login)/, { timeout: 20000 });
  await page.waitForTimeout(1500);

  await page.goto(`${BASE}/en/admin/users`);
  await page.waitForTimeout(3000);

  await view(page, "Cargo managers");
  await selectMetric(page, "New this week");
  await shot(page, "07-trend-new-cargo-managers.png");

  await view(page, "Driver managers");
  await selectMetric(page, "New this week");
  await shot(page, "09-trend-new-driver-managers.png");

  await browser.close();
  console.log("done");
})().catch((e) => { console.error("ERR", e && e.message ? e.message : e); process.exit(1); });
