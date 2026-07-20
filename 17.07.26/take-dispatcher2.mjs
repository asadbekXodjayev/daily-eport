// Focused re-capture: Trips History (Tarix) tab + cargo-create Step 2 (ASAP) / Step 3 (trailer+temp).
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = path.join(import.meta.dirname, 'img')
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
  await page.getByText('Parol', { exact: true }).first().click().catch(() => {})
  await page.waitForTimeout(600)
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  const phone = await page.$('input.react-international-phone-input')
  await phone.click(); await phone.type(CM.phone, { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', CM.pass)
  const submit = (await page.$('#login-submit')) || (await page.$('button[type="submit"]'))
  await submit.click()
  await page.waitForTimeout(6500)
})

await step('08b trips — Tarix (history) tab tracker', async () => {
  await page.goto(`${BASE}/uz/trips`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  await page.getByText('Tarix', { exact: true }).first().click().catch(() => {})
  await page.waitForTimeout(4500)
  await shot(page, '08-trips-history.png')
})

await step('10 cargo-create — Step 2 Route (ASAP checkboxes)', async () => {
  await page.goto(`${BASE}/uz/cargo-create`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await page.getByText('2. Marshrut va vaqt', { exact: false }).first().click().catch(() => {})
  await page.waitForTimeout(2500)
  await shot(page, '10-cargo-create-step2-route.png')
})

await step('11 cargo-create — Step 3 Transport (trailer type + temperature gate)', async () => {
  await page.getByText('3. Transport', { exact: false }).first().click().catch(() => {})
  await page.waitForTimeout(2500)
  await shot(page, '11-cargo-create-step3-transport.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE')
