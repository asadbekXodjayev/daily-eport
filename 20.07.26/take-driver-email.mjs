// Captures the driver detail page showing the new EMAIL row (SARB-DISP ticket, 20.07.2026).
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
  try { await fn(); console.log('  ok  ', name) }
  catch (e) { console.log('  FAIL', name, '::', e.message) }
}
// Driver-manager account (DriverDetailsPage is RoleGuardRoute-gated to DRIVER_MANAGER only).
const DM = { phone: '998809935', pass: 'Asadxad123' }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

await step('login', async () => {
  await page.goto(`${BASE}/ru/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.react-international-phone-input', { timeout: 20000 })
  await page.getByRole('tab', { name: /парол/i }).first().click()
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  const phone = page.locator('.react-international-phone-input')
  await phone.click()
  await phone.pressSequentially(DM.phone, { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', DM.pass)
  await page.click('#login-submit')
  await page.waitForURL((u) => !String(u).includes('/auth/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
})

await step('07 driver detail — email row (with fallback)', async () => {
  await page.goto(`${BASE}/ru/drivers`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.ant-table-row, .ant-list-item, [role="row"]', { timeout: 30000 })
  await page.waitForTimeout(2000)
  const row = page.locator('.ant-table-row, .ant-list-item').first()
  await row.click()
  await page.waitForURL((u) => /\/drivers\/[^/]+$/.test(u), { timeout: 15000 })
  await page.waitForTimeout(2500)
  await shot(page, '07-driver-detail-email.png')
})

await step('07b driver detail — scan other rows for a real email value', async () => {
  await page.goto(`${BASE}/ru/drivers`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.ant-table-row, .ant-list-item', { timeout: 30000 })
  await page.waitForTimeout(2000)
  const rows = await page.locator('.ant-table-row, .ant-list-item').all()
  for (let i = 1; i < Math.min(rows.length, 8); i++) {
    await page.goto(`${BASE}/ru/drivers`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.ant-table-row, .ant-list-item', { timeout: 30000 })
    await page.waitForTimeout(1500)
    const r = page.locator('.ant-table-row, .ant-list-item').nth(i)
    await r.click()
    await page.waitForURL((u) => /\/drivers\/[^/]+$/.test(u), { timeout: 15000 })
    await page.waitForTimeout(2000)
    const emailField = page.locator('label:has-text("Email")').locator('..').locator('input, div').first()
    const val = (await emailField.inputValue().catch(() => null)) ?? (await emailField.textContent().catch(() => ''))
    console.log(`  row ${i} email field ->`, JSON.stringify(val))
    if (val && !/нет данных/i.test(val)) {
      await shot(page, '07b-driver-detail-email-value.png')
      console.log('  found a real email value, stopping scan')
      break
    }
  }
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
