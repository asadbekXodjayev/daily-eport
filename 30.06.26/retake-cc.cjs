const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  await page.goto("http://localhost:5173/en/admin/login");
  await page.waitForSelector("input[autocomplete='username']", { timeout: 10000 });
  await page.fill("input[autocomplete='username']", "admin");
  await page.fill("input[autocomplete='current-password']", "admin321321");
  await page.click("button[type='submit']");
  await page.waitForURL(/admin\/(?!login)/, { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.goto("http://localhost:5173/en/admin/command-center");
  // Wait for a heading or any content to appear (not the spinner)
  await page.waitForSelector("h1, h2, .ant-table, .admin-kpi-tile, [class*='section']", { timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, "img", "cc-command-center.png"), fullPage: false });
  console.log("✓ Command Center re-taken");

  await browser.close();
})();
