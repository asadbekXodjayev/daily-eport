// Follow-up admin pass — the companies queue defaults to the "На модерации" segment, which is empty
// on staging. Switch to "Все" first so the rows (and therefore the row kebab, the column filters and
// the local-time "Создана" column) are actually visible.
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = path.join(import.meta.dirname, 'img')
const shot = (t, name, opts = {}) => t.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}
const ADMIN = { user: 'admin', pass: 'admin321321' }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1050 } })
const page = await ctx.newPage()

await step('admin login', async () => {
  await page.goto(`${BASE}/ru/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', ADMIN.user)
  await page.fill('input[autocomplete="current-password"]', ADMIN.pass)
  await page.click('button[type="submit"]')
  await page.waitForSelector('header', { timeout: 30000 })
  await page.waitForTimeout(3000)
})

const showAll = async () => {
  const all = page.locator('.ant-segmented-item', { hasText: /^Все$/ }).first()
  if (await all.count()) { await all.click(); await page.waitForTimeout(4000) }
}

await step('21 admin companies — queue with rows (local-time "Создана", controlled filters)', async () => {
  await page.goto(`${BASE}/ru/admin/companies`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  await showAll()
  await page.waitForSelector('.ant-table-row', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await shot(page, '21-admin-companies-queue.png')
})

await step('22 admin companies — status column filter (controlled + pruned on segment switch)', async () => {
  const triggers = page.locator('.ant-table-filter-trigger')
  const n = await triggers.count()
  if (n) {
    await triggers.nth(Math.min(1, n - 1)).click()
    await page.waitForTimeout(1500)
    await shot(page, '22-admin-companies-column-filter.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
  }
})

await step('23 admin companies — row kebab (moderation lifecycle + tariff + bind owner)', async () => {
  const row = page.locator('.ant-table-row').first()
  const kebab = row.locator('button').last()
  await kebab.click({ timeout: 10000 })
  await page.waitForTimeout(1500)
  await shot(page, '23-admin-companies-row-kebab.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
})

await step('26 moderation hub — company tab with rows + tariff kebab item', async () => {
  await page.goto(`${BASE}/ru/admin/moderation?tab=company`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  await showAll()
  await page.waitForTimeout(2000)
  await shot(page, '26-admin-moderation-company-tab.png')
  const row = page.locator('.ant-table-row').first()
  if (await row.count()) {
    await row.locator('button').last().click({ timeout: 10000 })
    await page.waitForTimeout(1500)
    await shot(page, '27-admin-moderation-company-kebab-tariff.png')
    await page.keyboard.press('Escape')
  }
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
