// Focused re-capture of the 11.07.2026 dashboard activity-chart change (line<->bar toggle +
// add/removable series chips + new revenue KPI). Scrolls the activity chart into view and toggles.
//   node daily-report/11.07.26/capture-11-dashboard.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");
const CARGO_MGR = "+998994878460";
const PASSWORD = "Asadxad123";

async function login(page, phone, lang = LANG) {
  await page.goto(`${BASE}/${lang}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", phone, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(6000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + page.url());
  console.log("logged in", phone, "->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  await login(page, CARGO_MGR);

  await page.goto(`${BASE}/${LANG}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".recharts-surface", { timeout: 20000 });
  await page.waitForTimeout(2500);

  // Report the segmented controls so we can target the chart's line/bar toggle (2 items),
  // not the day/week/month range selector (3 items).
  const segInfo = await page.$$eval(".ant-segmented", (nodes) =>
    nodes.map((n, i) => ({ i, items: n.querySelectorAll(".ant-segmented-item").length,
      labels: [...n.querySelectorAll(".ant-segmented-item-label")].map((l) => (l.textContent || "").trim()) }))
  );
  console.log("SEGMENTED:", JSON.stringify(segInfo));

  // Scroll the activity chart (the recharts area/line surface) into view. The funnel is a separate
  // surface further down; the FIRST recharts surface on the dashboard is the activity chart.
  const chart = page.locator(".recharts-responsive-container").first();
  await chart.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(IMG, "01-dashboard-activity-line.png"), fullPage: false });
  console.log("shot 01-dashboard-activity-line.png (area/line + series chips)");

  // Toggle to BAR: click the last item of the 2-item segmented that lives near the chart.
  try {
    const toggle = page.locator(".ant-segmented").filter({ has: page.locator(".ant-segmented-item:nth-child(2)") });
    // Prefer a 2-item segmented (line/bar); fall back to the one nearest the chart.
    const twoItem = (await page.$$(".ant-segmented")).length;
    let clicked = false;
    for (let i = 0; i < twoItem; i++) {
      const seg = page.locator(".ant-segmented").nth(i);
      const count = await seg.locator(".ant-segmented-item").count();
      if (count === 2) {
        await seg.locator(".ant-segmented-item").last().click();
        clicked = true;
        console.log("clicked 2-item segmented #" + i + " -> bar");
        break;
      }
    }
    if (!clicked) console.log("no 2-item segmented found; bar toggle skipped");
    await page.waitForTimeout(1600);
    await chart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(IMG, "02-dashboard-activity-bar.png"), fullPage: false });
    console.log("shot 02-dashboard-activity-bar.png (bar histogram)");
  } catch (e) {
    console.error("bar toggle failed:", e && e.message);
  }

  await browser.close();
  console.log("DONE dashboard");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
