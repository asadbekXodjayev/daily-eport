// Dispatcher pass for the 21.07.2026 report.
//   30/31: the personal ↔ company context switcher shipped in the "company invite" commit —
//          header dropdown + the sidebar "My company" entry. The switcher renders NOTHING for a
//          dispatcher with no memberships, so /v1/dispatchers/companies is stubbed with one hired
//          membership; everything else runs against live staging under a real password login.
//   32:    the company invitation inbox on the company home screen (accept by id).
// Run: node take-dispatcher.mjs   (dev server on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const API = 'https://api.sarbon.me/'
const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
const shot = (t, name, opts = {}) => t.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}
const CM = { phone: '994878460', pass: 'Asadxad123' }
const env = (data) => ({ status: 'success', code: 200, data })

const COMPANIES = env({
  companies: [
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000001',
      name: 'Sarbon Logistics International MChJ',
      role: 'CargoManager',
      status: 'active',
      is_current: false
    }
  ]
})

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
// Only the memberships list is stubbed — every other request goes to live staging.
await ctx.route('**/v1/dispatchers/companies*', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(COMPANIES) })
)
const page = await ctx.newPage()

await step('login', async () => {
  await page.goto(`${BASE}/ru/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.react-international-phone-input', { timeout: 25000 })
  await page.getByRole('tab', { name: /парол/i }).first().click({ timeout: 10000 })
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  await page.waitForTimeout(600)
  const phone = page.locator('.react-international-phone-input')
  await phone.click()
  await phone.pressSequentially(CM.phone, { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', CM.pass)
  await page.click('#login-submit')
  await page.waitForURL((u) => !String(u).includes('/auth/login'), { timeout: 30000 })
  await page.waitForTimeout(2500)
})

await step('30 header — personal ↔ company context switcher', async () => {
  await page.goto(`${BASE}/ru/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  const trigger = page.locator('header button', { hasText: /Личный|Компания|Sarbon Logistics/ }).first()
  console.log('  switcher trigger count =', await trigger.count())
  if (await trigger.count()) {
    await trigger.click({ timeout: 10000 })
    await page.waitForTimeout(1500)
  }
  await shot(page, '30-dispatcher-context-switcher.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
})

await step('31 sidebar — "Моя компания" entry for a hired dispatcher', async () => {
  await page.waitForTimeout(1000)
  const aside = page.locator('aside').first()
  if (await aside.count()) await shot(aside, '31-dispatcher-sidebar-my-company.png')
  else await shot(page, '31-dispatcher-sidebar-my-company.png')
})

await step('32 offers — company invitation in the dispatcher feed', async () => {
  await page.goto(`${BASE}/ru/offers`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6000)
  await shot(page, '32-dispatcher-offers-invitation.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
