// REAL authed admin capture of the 10.07.2026 admin-list performance change: the big Excel-style
// admin lists (drivers, dispatchers) moved from fetch-everything (tens of sequential page requests
// blocking first paint) to a two-mode loader (useAdminPaginatedList): server-paginated 50-row pages
// while browsing, fetch-all only when filtering/sorting. Captured on /en/admin/drivers.
//   node daily-report/10.07.26/capture-10-admin.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const IMG = path.join(__dirname, "img");
const LOGIN = "admin";
const PASSWORD = "admin321321";

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

  await page.goto(`${BASE}/en/admin/drivers`);
  await page.waitForTimeout(3500);
  await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(IMG, "03-admin-drivers-paginated.png"), fullPage: false });
  console.log("shot 03-admin-drivers-paginated.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message ? e.message : e); process.exit(1); });
