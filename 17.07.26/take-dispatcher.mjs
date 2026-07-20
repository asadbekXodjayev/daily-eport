// Dispatcher (cargo-manager) pass — password login, then Dashboard / Trips-history / cargo-create.
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
const CM = { phone: '994878460', pass: 'Asadxad123' }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

await step('login', async () => {
  await page.goto(`${BASE}/uz/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.react-international-phone-input', { timeout: 20000 })
  // click the "Parol" (password) method tab by visible text
  await page.getByText('Parol', { exact: true }).first().click().catch(() => {})
  await page.waitForTimeout(600)
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  const phone =
    (await page.$('input.react-international-phone-input')) ||
    (await page.$('.react-international-phone-input input')) ||
    (await page.$('input[type="tel"]'))
  await phone.click()
  await phone.type(CM.phone, { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', CM.pass)
  await page.waitForTimeout(400)
  await shot(page, 'dbg-login-filled.png')
  // submit
  const submit =
    (await page.$('#login-submit')) ||
    (await page.$('button[type="submit"]')) ||
    (await page.$('form button'))
  await submit.click()
  await page.waitForTimeout(6500)
  await shot(page, 'dbg-after-login.png')
  const url = page.url()
  if (url.includes('/auth/login')) throw new Error('still on login: ' + url)
})

await step('06 dashboard — activity chart (bar value labels)', async () => {
  await page.goto(`${BASE}/uz/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.recharts-responsive-container, canvas, svg')].find(
      (n) => (n.closest('*')?.textContent || '').length
    )
    el?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(1500)
  await shot(page, '06-dashboard-activity-chart.png')
})

await step('07 dashboard — bucket toggle (day/week/month) opened', async () => {
  // find the segmented that contains day/week/month labels and screenshot the card region
  await page.evaluate(() => {
    const segs = [...document.querySelectorAll('.ant-segmented')]
    const target = segs.find((s) => /kun|hafta|oy|day|week|month|дн|недел|месяц/i.test(s.textContent || ''))
    ;(target || segs[segs.length - 1])?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(1000)
  await shot(page, '07-dashboard-bucket-toggle.png')
})

await step('08 trips — history tracker', async () => {
  await page.goto(`${BASE}/uz/trips`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  const tab =
    (await page.$('[role="tab"]:has-text("Tarix")')) ||
    (await page.$('button:has-text("Tarix")')) ||
    (await page.$('[role="tab"]:has-text("История")')) ||
    (await page.$('[role="tab"]:has-text("History")'))
  if (tab) { await tab.click(); await page.waitForTimeout(4000) }
  await shot(page, '08-trips-history.png')
})

await step('09 cargo-create — Step 3 transport (temperature gate context)', async () => {
  await page.goto(`${BASE}/uz/cargo-create`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await shot(page, '09-cargo-create.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE')
