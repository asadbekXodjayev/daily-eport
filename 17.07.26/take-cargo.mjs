// Fill cargo-create Step 1, advance to Step 2 (Route → ASAP checkboxes), then try Step 3 (Transport).
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
  await submit.click(); await page.waitForTimeout(6500)
})

await step('fill step 1', async () => {
  await page.goto(`${BASE}/uz/cargo-create`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  // Qisqa nom
  const name = await page.$('input[placeholder^="Masalan: Bug"]')
  if (name) await name.fill('Test yuk Toshkent → Samarqand')
  // Yuk turi (AntD select) — open and pick first option
  const sel = await page.$('.ant-select-selector')
  if (sel) {
    await sel.click()
    await page.waitForSelector('.ant-select-item-option', { timeout: 6000 })
    await page.waitForTimeout(400)
    const opt = await page.$('.ant-select-item-option')
    if (opt) await opt.click()
    await page.waitForTimeout(400)
  }
  // Og'irlik / Hajm number inputs
  const nums = await page.$$('.ant-input-number-input')
  if (nums[0]) await nums[0].fill('22')
  if (nums[1]) await nums[1].fill('20')
  await page.waitForTimeout(500)
})

await step('12 cargo-create Step 2 — Route with ASAP checkboxes', async () => {
  await page.getByText('Davom etish', { exact: false }).first().click().catch(() => {})
  await page.waitForTimeout(3000)
  await shot(page, '12-cargo-create-step2-route.png')
})

await step('13 cargo-create Step 3 — Transport (trailer type / temperature gate)', async () => {
  // try to jump to Step 3 tab now that Step 1 is valid (Step 2 may still gate — best effort)
  await page.getByText('3. Transport', { exact: false }).first().click().catch(() => {})
  await page.waitForTimeout(2500)
  await shot(page, '13-cargo-create-step3-transport.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE')
