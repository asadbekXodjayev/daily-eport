const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG_DIR = path.join(__dirname, "img");
const LOGIN = "admin";
const PASSWORD = "admin321321";

async function shot(page, name, label) {
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(IMG_DIR, name), fullPage: false });
  console.log("✓", label, "→", name);
}

async function switchTab(page, tabText) {
  const tab = page.locator(`.ant-tabs-tab:has-text("${tabText}")`).first();
  if (await tab.isVisible()) {
    await tab.click();
    await page.waitForTimeout(1200);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/login`);
  await page.waitForSelector("input[autocomplete='username']", { timeout: 10000 });
  await page.fill("input[autocomplete='username']", LOGIN);
  await page.fill("input[autocomplete='current-password']", PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL(/admin\/(?!login)/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  console.log("✓ Logged in");

  // ── Command Center ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/command-center`);
  await page.waitForTimeout(2500);
  await shot(page, "cc-command-center.png", "Command Center");

  // ── Users / Drivers tab ────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/users`);
  await page.waitForTimeout(2500);
  await shot(page, "users-drivers.png", "Users – Drivers");

  await switchTab(page, "Cargo managers");
  await shot(page, "users-cargo-managers.png", "Users – Cargo Managers");

  await switchTab(page, "Driver managers");
  await shot(page, "users-driver-managers.png", "Users – Driver Managers");

  // ── Communications ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/communications`);
  await page.waitForTimeout(2500);
  await shot(page, "comms-ratings.png", "Communications – Ratings");

  await switchTab(page, "Chat");
  await shot(page, "comms-chat.png", "Communications – Chat");

  // ── Metrics ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/metrics`);
  await page.waitForTimeout(2500);
  await shot(page, "metrics-health.png", "Metrics – System Health");

  await switchTab(page, "Audit");
  await shot(page, "metrics-audit.png", "Metrics – Audit");

  // ── Moderation Log ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/moderation-log`);
  await page.waitForTimeout(2500);
  await shot(page, "moderation-log.png", "Moderation Log");

  // ── Moderation ─────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/moderation`);
  await page.waitForTimeout(2500);
  await shot(page, "moderation.png", "Moderation");

  // ── Cargo ──────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/cargo`);
  await page.waitForTimeout(2500);
  await shot(page, "cargo.png", "Cargo");

  // ── Drivers ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/en/admin/drivers`);
  await page.waitForTimeout(2500);
  await shot(page, "drivers.png", "Drivers");

  await browser.close();
  console.log("\nAll done. Screenshots saved to", IMG_DIR);
})();
