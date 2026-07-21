// Admin pass for the 20.07.2026 report — live STAGING API.
//   /admin/trips + /admin/offers snake_case fix (was PascalCase-broken) + Cancel-trip relabel,
//   plus two teammate merges landed today: manager-moderation per-role tabs (PR #297) and
//   trip-detail Yuk ID / Haydovchi ID clickable drawers (PR #298).
// Run: node take-admin.mjs  (dev server on :5173)
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
  await page.goto(`${BASE}/ru/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', ADMIN.user)
  await page.fill('input[autocomplete="current-password"]', ADMIN.pass)
  await page.click('button[type="submit"]')
  await page.waitForSelector('header', { timeout: 25000 })
  await page.waitForTimeout(2500)
})

await step('08 admin trips — snake_case fields + Cancel action', async () => {
  await page.goto(`${BASE}/ru/admin/trips`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2500)
  await shot(page, '08-admin-trips.png')
})

await step('09 admin trips — trip detail drawer (Yuk ID / Haydovchi ID clickable)', async () => {
  const viewBtn = page.locator('button:has-text("Просмотр")').first()
  await viewBtn.click({ timeout: 15000 })
  await page.waitForSelector('.ant-drawer-body, .ant-modal-body', { timeout: 20000 })
  await page.waitForTimeout(2500)
  await shot(page, '09-admin-trip-detail-drawer.png')
  // Scroll to "Системная информация" (Yuk ID / Haydovchi ID clickable links) and shoot that section.
  await page.locator('.ant-drawer-body').first().evaluate((el) => { el.scrollTop = el.scrollHeight }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, '09b-admin-trip-system-info.png')
  const cargoLink = page.locator('.ant-drawer-body a').first()
  if (await cargoLink.count()) {
    await cargoLink.click().catch(() => {})
    await page.waitForTimeout(2000)
    await shot(page, '10-admin-trip-cargo-drawer.png')
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
})

await step('11 admin offers — snake_case fields render correctly', async () => {
  await page.goto(`${BASE}/ru/admin/offers`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2500)
  await shot(page, '11-admin-offers.png')
})

await step('12 admin moderation — Cargo managers / Driver managers per-role tabs', async () => {
  await page.goto(`${BASE}/ru/admin/moderation?tab=cargo_managers`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const tabs = page.locator('.ant-tabs-nav').first()
  await tabs.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, '12-admin-moderation-cargo-managers.png')
  await page.goto(`${BASE}/ru/admin/moderation?tab=driver_managers`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await tabs.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, '13-admin-moderation-driver-managers.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
