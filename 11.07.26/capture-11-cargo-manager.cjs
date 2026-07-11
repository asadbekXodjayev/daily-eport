// REAL authed captures of 11.07.2026 cargo-manager-facing changes, live staging, ru UI.
// Password login (test cargo-manager account). Each shot is best-effort (try/catch) so one
// failure doesn't abort the rest.
//   node daily-report/11.07.26/capture-11-cargo-manager.cjs
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
  if (/\/auth\//.test(page.url())) throw new Error("login failed for " + phone + ": " + page.url());
  console.log("logged in", phone, "->", page.url());
}

async function shot(page, name, fn) {
  try {
    await fn();
    await page.screenshot({ path: path.join(IMG, name), fullPage: false });
    console.log("shot", name);
  } catch (e) {
    console.error("SKIP", name, "-", e && e.message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  await login(page, CARGO_MGR);

  // 1) Dashboard — activity chart (line/area) + series chips + new revenue KPI tile
  await shot(page, "01-dashboard-activity-line.png", async () => {
    await page.goto(`${BASE}/${LANG}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".recharts-surface", { timeout: 20000 });
    await page.waitForTimeout(2500);
  });

  // 2) Dashboard — same chart toggled to BAR histogram (Segmented line<->bar)
  await shot(page, "02-dashboard-activity-bar.png", async () => {
    const seg = page.locator(".ant-segmented-item-label").last();
    await seg.click({ timeout: 5000 });
    await page.waitForTimeout(1800);
  });

  // 3) Cargo create — form WITHOUT the removed "Fill from template" button
  await shot(page, "03-cargo-create-no-template.png", async () => {
    await page.goto(`${BASE}/${LANG}/cargo-create`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("form, .ant-form", { timeout: 20000 });
    await page.waitForTimeout(2500);
  });

  // 4) All cargos — send-offer row button in the action column
  await shot(page, "04-all-cargos-row-offer.png", async () => {
    await page.goto(`${BASE}/${LANG}/all-cargos`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".ant-table", { timeout: 20000 });
    await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
  });

  // 5) Driver-managers — resizable table + cleaner Connect button
  await shot(page, "05-driver-managers-table.png", async () => {
    await page.goto(`${BASE}/${LANG}/driver-managers`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".ant-table", { timeout: 20000 });
    await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  // 6) Trips — History tab timeline (ratings / FIO / amount, no horizontal scroll)
  await shot(page, "06-trips-history-timeline.png", async () => {
    await page.goto(`${BASE}/${LANG}/trips?tab=history`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".ant-table, .ant-tabs", { timeout: 20000 });
    await page.waitForSelector(".ant-spin-spinning", { state: "detached", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
  });

  await browser.close();
  console.log("DONE cargo-manager");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
