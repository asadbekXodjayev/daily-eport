// Captures real admin screenshots for the 13.07.26 daily report.
// Run: node capture-13-admin.mjs  (dev server on :5173, staging API)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs');
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'img');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[capture]', ...a);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

// --- admin login ---
await page.goto('http://localhost:5173/ru/admin/login', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('input[autocomplete="username"]', { timeout: 30000 });
await page.fill('input[autocomplete="username"]', 'admin');
await page.fill('input[autocomplete="current-password"]', 'admin321321');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
log('admin logged in');

const ROWS = '.ant-table-tbody tr:not(.ant-table-measure-row)';

// --- 1. Moderation page: summary collapsible open + Notes column ---
await page.goto('http://localhost:5173/ru/admin/moderation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector(ROWS, { timeout: 45000 });
await page.waitForTimeout(2500);
// open the Overview collapsible if it is collapsed
const collapsible = page.locator('button, [role="button"]', { hasText: /обзор|общий вид|умумий|overview/i }).first();
if (await collapsible.count()) {
  await collapsible.click();
  await page.waitForTimeout(1600);
}
await shot('01-moderation-overview-collapsible');
log('01 done');

// --- 2. Notes drawer (AdminCommentsDrawer) from a moderation row ---
const notesBtn = page.locator(`${ROWS} button`, { hasText: /замет|notes|izoh/i }).first();
const notesIconBtn = page.locator(`${ROWS} button:has(.anticon-message), ${ROWS} button:has(.anticon-comment)`).first();
const target = (await notesBtn.count()) ? notesBtn : notesIconBtn;
if (await target.count()) {
  await target.click();
  await page.waitForSelector('.ant-drawer-open', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot('02-admin-notes-drawer');
  log('02 done');
  const close = page.locator('.ant-drawer-open .ant-drawer-close').first();
  if (await close.count()) await close.click();
  await page.waitForTimeout(600);
} else {
  log('02 SKIPPED - no notes button found on moderation rows');
}

// --- 3. Moderation log: row kebab actions + sticky top scrollbar ---
await page.goto('http://localhost:5173/ru/admin/moderation-log', { waitUntil: 'domcontentloaded' });
await page.waitForSelector(ROWS, { timeout: 45000 });
await page.waitForTimeout(2500);
const kebab = page.locator(`${ROWS}`).first().locator('button:has(.anticon-ellipsis), .ant-dropdown-trigger').last();
if (await kebab.count()) {
  await kebab.click();
  await page.waitForTimeout(900);
}
await shot('03-moderation-log-row-actions');
log('03 done');
await page.keyboard.press('Escape');

// --- 4. Drivers table: № column ---
await page.goto('http://localhost:5173/ru/admin/drivers', { waitUntil: 'domcontentloaded' });
await page.waitForSelector(ROWS, { timeout: 45000 });
await page.waitForTimeout(2000);
await shot('04-drivers-row-numbers');
log('04 done');

// --- 5. Driver edit drawer: Type dropdown = Driver/Dispatcher/Owner only ---
await page.locator(ROWS).first().locator('text=/^(Edit|Изменить|Редактировать)$/').first().click();
await page.waitForSelector('.ant-drawer-open', { timeout: 15000 });
await page.waitForTimeout(1500);
const select = page
  .locator('.ant-drawer-open .ant-form-item', { hasText: /тип|type/i })
  .locator('.ant-select')
  .first();
await select.click();
await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', {
  timeout: 10000
});
await page.waitForTimeout(500);
const options = await page.$$eval(
  '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option',
  (els) => els.map((e) => e.textContent?.trim())
);
log('driver type options =', JSON.stringify(options));
await shot('05-driver-type-dropdown');
log('05 done');

await browser.close();
log('ALL DONE');
