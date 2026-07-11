// REAL authed captures of the 09.07.2026 cargo-manager-facing changes, ru UI, live staging backend.
//  1) Cargo create form (Step 1) — the new field "?" help tooltips + the two live calculators added
//     09.07: packaging weight cross-check (per-unit kg x count -> total, mismatch warning + Apply)
//     and dimensions volume (L x W x H metres -> m3 hint + Apply). Shared by manual + AI create.
//  2) Profile page (ProfilePage / ProfileSidebarCard tweaks).
//  3) My cargos list (cargoListDisplay / cargoPaymentDisplay).
//   node daily-report/09.07.26/capture-09-dispatcher.cjs
const { chromium } = require("C:/Users/hp/AppData/Roaming/npm/node_modules/playwright");
const path = require("path");

const BASE = "http://localhost:5173";
const LANG = "ru";
const IMG = path.join(__dirname, "img");
const PHONE = "+998994878460"; // cargo manager
const PASSWORD = "Asadxad123";

async function login(page) {
  await page.goto(`${BASE}/${LANG}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".react-international-phone-input", { timeout: 20000 });
  await page.locator('button[role="tab"]').nth(0).click();
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
  await page.fill(".react-international-phone-input", "");
  await page.type(".react-international-phone-input", PHONE, { delay: 40 });
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click("#login-submit");
  await page.waitForTimeout(6000);
  if (/\/auth\//.test(page.url())) throw new Error("login failed: " + page.url());
  console.log("logged in ->", page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await login(page);

  // ---- 1) Cargo create form: tooltips + live packaging weight + dimensions volume ----
  await page.goto(`${BASE}/${LANG}/cargo-create`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3500);
  await page.fill("#name", "Пшеница, Ташкент → Самарканд");
  await page.fill("#weight", "22");
  await page.fill("#volume", "20");
  // open BOTH optional sections up front (opening one after filling the other can drop it)
  await page.getByRole("button", { name: /Габариты|lchamlar/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Упаковка$|Qadoqlash/i }).click();
  await page.waitForTimeout(400);
  // dimensions L x W x H (metres) -> live volume hint
  await page.fill("#length", "2.4");
  await page.fill("#width", "1.6");
  await page.fill("#height", "1.5");
  // packaging count x per-unit kg -> live weight cross-check (mismatch vs the 22 t "Вес")
  await page.fill("#packaging_amount", "200");
  await page.fill("#packaging_unit_weight", "100");
  // blur so the watchers recompute, then let both hints render
  await page.locator("#name").click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(IMG, "01-cargo-create-form.png"), fullPage: true });
  console.log("shot 01-cargo-create-form.png");

  // ---- 2) Profile ----
  await page.goto(`${BASE}/${LANG}/profile`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(IMG, "02-profile.png"), fullPage: false });
  console.log("shot 02-profile.png");

  // ---- 3) My cargos list ----
  await page.goto(`${BASE}/${LANG}/my-cargos`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(IMG, "03-my-cargos-list.png"), fullPage: false });
  console.log("shot 03-my-cargos-list.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
