// Captures the AdminCommentsDrawer (notes) screenshot for the 13.07.26 report.
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

await page.goto('http://localhost:5173/ru/admin/login', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('input[autocomplete="username"]', { timeout: 30000 });
await page.fill('input[autocomplete="username"]', 'admin');
await page.fill('input[autocomplete="current-password"]', 'admin321321');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });

const ROWS = '.ant-table-tbody tr:not(.ant-table-measure-row)';
await page.goto('http://localhost:5173/ru/admin/moderation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector(ROWS, { timeout: 45000 });
await page.waitForTimeout(3000);

// The notes cell is a button with aria-label "Заметки" (lucide message-square icon inside).
const notesCell = page.locator('button[aria-label="Заметки"]').first();
if (!(await notesCell.count())) {
  log('no notes cell on this tab; scrolling table right');
  await page.locator('.ant-table-content').first().evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await page.waitForTimeout(800);
}
const cell = page.locator('button[aria-label="Заметки"]').first();
if (await cell.count()) {
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  await page.waitForSelector('.ant-drawer-open', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await shot('02-admin-notes-drawer');
  log('02 done');
} else {
  log('02 STILL NOT FOUND');
  await shot('02-debug-moderation');
}
await browser.close();
log('DONE');
