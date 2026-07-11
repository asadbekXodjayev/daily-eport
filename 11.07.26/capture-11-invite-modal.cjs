// Clean my-cargos table shot (no Колонки panel) + invite modal with post-click DOM probe.
//   node daily-report/11.07.26/capture-11-final2.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");
const CARGO_MGR = "+998994878460";
const DRIVER_MGR = "+998998809935";
const PASSWORD = "Asadxad123";

async function login(page, phone, wait = 8000, lang = LANG) {
  await page.goto(`${BASE}/${lang}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", phone, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(wait);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + phone + " " + page.url());
  console.log("logged in", phone, "->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ---- my-cargos TABLE view, clean ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    await login(page, CARGO_MGR);
    await page.goto(`${BASE}/${LANG}/my-cargos`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    // The view toggle is the pair of icon buttons at the far right of the tab row. Click the LAST
    // icon-only button in that cluster (the table icon), avoiding the "Колонки" text button.
    const iconBtns = page.locator('button:has(svg)').filter({ hasNotText: /Колонки|Excel|Добавить|груз|AI/i });
    const count = await iconBtns.count();
    // click the last two candidates' table one: try the very last icon-only button in header area
    try { await iconBtns.nth(count - 1).click({ timeout: 4000 }); console.log("clicked view toggle (last icon)"); } catch {}
    await page.waitForTimeout(2500);
    // Close any open Колонки popover by clicking the heading area
    await page.mouse.click(700, 190);
    await page.waitForTimeout(800);
    const p = await page.evaluate(() => ({ antTable: document.querySelectorAll(".ant-table").length,
      sendIcons: document.querySelectorAll("svg.lucide-send, .anticon-send").length }));
    console.log("PROBE:", JSON.stringify(p));
    await page.screenshot({ path: path.join(IMG, "04-my-cargos-row-offer.png"), fullPage: false });
    console.log("shot 04-my-cargos-row-offer.png");
    await ctx.close();
  }

  // ---- Invite modal (post-click probe) ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
    const page = await ctx.newPage();
    try {
      await login(page, DRIVER_MGR, 9000);
      await page.goto(`${BASE}/${LANG}/drivers`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4500);
      const invite = page.getByRole("button", { name: /Пригласить водител/i }).first();
      await invite.click({ timeout: 8000 });
      await page.waitForTimeout(2000);
      const dlg = await page.evaluate(() => ({
        modal: document.querySelectorAll(".ant-modal-content").length,
        modalRoot: document.querySelectorAll(".ant-modal-root, .ant-modal-wrap").length,
        drawer: document.querySelectorAll(".ant-drawer-content").length,
        dialog: document.querySelectorAll('[role="dialog"]').length,
        titles: [...document.querySelectorAll(".ant-modal-title, .ant-drawer-title, [role=dialog] h1, [role=dialog] h2, [role=dialog] label")].map(e=>(e.textContent||"").trim()).slice(0,6),
      }));
      console.log("DIALOG PROBE:", JSON.stringify(dlg));
      await page.screenshot({ path: path.join(IMG, "08-invite-driver-modal.png"), fullPage: false });
      console.log("shot 08-invite-driver-modal.png");
    } catch (e) { console.error("SKIP 08 -", e && e.message); }
    await ctx.close();
  }

  await browser.close();
  console.log("DONE final2");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
