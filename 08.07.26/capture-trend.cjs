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
  // let the analytics fetch + (for creation metrics) the fetch-all list + bucketing finish
  await page
    .waitForSelector(".ant-spin-spinning", { state: "detached", timeout: ms })
    .catch(() => {});
  await page.waitForTimeout(1500);
}

async function selectMetric(page, text) {
  const box = page
    .locator("div")
    .filter({ has: page.getByText("Metric", { exact: true }) })
    .filter({ has: page.locator(".ant-select") })
    .last();
  const sel = box.locator(".ant-select").first();
  await sel.scrollIntoViewIfNeeded();
  await sel.click();
  await page.waitForTimeout(500);
  await page
    .locator(".ant-select-dropdown")
    .last()
    .locator(".ant-select-item-option", { hasText: text })
    .first()
    .click();
  await settle(page);
}

async function gran(page, text) {
  const seg = page.locator(".ant-segmented").filter({ hasText: "Month" }).first();
  await seg.locator(".ant-segmented-item", { hasText: text }).first().click();
  await settle(page);
}

async function view(page, text) {
  const seg = page.locator(".ant-segmented").filter({ hasText: "Cargo managers" }).first();
  await seg.locator(".ant-segmented-item", { hasText: text }).first().click();
  await page.waitForTimeout(2500);
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
  await shot(page, "01-users-drivers-overview.png");

  // Default metric is DAU (snapshot) — controls disabled + snapshot tag
  await selectMetric(page, "Daily active users");
  await shot(page, "05-trend-dau-snapshot.png");

  // New drivers — the real FE-bucketed series; controls live
  await selectMetric(page, "New drivers");
  await shot(page, "02-trend-new-drivers-day.png");
  await gran(page, "Week");
  await shot(page, "03-trend-new-drivers-week.png");
  await gran(page, "Month");
  await shot(page, "04-trend-new-drivers-month.png");

  // Cargo managers
  await view(page, "Cargo managers");
  await shot(page, "06-cargo-managers-overview.png");
  await selectMetric(page, "New this week");
  await gran(page, "Day");
  await shot(page, "07-trend-new-cargo-managers.png");

  // Driver managers
  await view(page, "Driver managers");
  await shot(page, "08-driver-managers-overview.png");
  await selectMetric(page, "New this week");
  await gran(page, "Day");
  await shot(page, "09-trend-new-driver-managers.png");

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("ERR", e && e.message ? e.message : e);
  process.exit(1);
});
