// Clean my-cargos TABLE view shot: click the 2-item view Segmented (card|table) -> table,
// close the Колонки panel, screenshot the row send-offer icons.
//   node daily-report/11.07.26/capture-11-mycargos.cjs
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
  await page.waitForTimeout(7000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + phone + " " + page.url());
  console.log("logged in", phone, "->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  await login(page, CARGO_MGR);
  await page.goto(`${BASE}/${LANG}/my-cargos`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Click the view Segmented's TABLE item (the 2-item segmented; status tabs have 8 text items).
  const segs = page.locator(".ant-segmented");
  const nSeg = await segs.count();
  for (let i = 0; i < nSeg; i++) {
    const items = segs.nth(i).locator(".ant-segmented-item");
    if ((await items.count()) === 2) {
      await items.last().click();
      console.log("clicked table view on 2-item segmented #" + i);
      break;
    }
  }
  await page.waitForTimeout(2500);

  // Collapse the Колонки panel that auto-opens on first table view (toggle the Колонки button).
  await page.getByRole("button", { name: /Колонки/i }).first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const p = await page.evaluate(() => ({
    antTable: document.querySelectorAll(".ant-table").length,
    sendIcons: document.querySelectorAll("svg.lucide-send, .anticon-send, svg.lucide-navigation").length,
    colPanel: document.querySelectorAll(".ant-checkbox-group").length,
  }));
  console.log("PROBE:", JSON.stringify(p));
  await page.screenshot({ path: path.join(IMG, "04-my-cargos-row-offer.png"), fullPage: false });
  console.log("shot 04-my-cargos-row-offer.png");

  await browser.close();
  console.log("DONE mycargos");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
