// Admin pass for the 17.07.2026 report — live STAGING API.
//   Drivers server-side filter panel (SARB-ADMIN 17:30) + status-gated Account dropdown & edit-gate
//   (SARB-ADMIN 16:45 / 17:19). Run: node take-admin.mjs  (dev server on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}
const ADMIN = { user: 'admin', pass: 'admin321321' }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

await step('admin login', async () => {
  await page.goto(`${BASE}/en/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', ADMIN.user)
  await page.fill('input[autocomplete="current-password"]', ADMIN.pass)
  await page.click('button[type="submit"]')
  await page.waitForSelector('header', { timeout: 25000 })
  await page.waitForTimeout(2500)
})

await step('01 drivers — server-side filter panel', async () => {
  await page.goto(`${BASE}/en/admin/drivers`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2500)
  await shot(page, '01-admin-drivers-filters.png')
})

await step('03/04 driver Edit drawer — gate alert + status-gated Account dropdown', async () => {
  const rows = await page.$$('.ant-table-row')
  for (const r of rows.slice(0, 6)) {
    const btn = await r.$('button:has-text("Edit")')
    if (btn) { await btn.click(); break }
  }
  await page.waitForSelector('.ant-drawer-body', { timeout: 20000 })
  await page.waitForTimeout(3200)
  await shot(page, '03-admin-driver-edit-drawer.png')
  const acc = await page.$('.ant-drawer-body button:has-text("Account status")')
  if (acc) {
    await acc.click()
    await page.waitForSelector('.ant-dropdown-menu', { timeout: 8000 })
    await page.waitForTimeout(700)
    await shot(page, '04-admin-driver-account-dropdown.png')
    await page.keyboard.press('Escape')
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
})

await step('05 drivers — Russian locale (filter labels)', async () => {
  await page.goto(`${BASE}/ru/admin/drivers`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2200)
  await shot(page, '05-admin-drivers-ru.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE →', OUT)
