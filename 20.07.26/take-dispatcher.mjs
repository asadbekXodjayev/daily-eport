// Dispatcher pass for 20.07.2026 report — password login, then:
//   notification bell (company invitation), /offers (invitation card + modal),
//   /all-cargos city-name display (ru locale, "обл." abbreviation), Excel export viewer
//   (columns beyond Z + right-click context menu locale).
// Run: node take-dispatcher.mjs  (dev server on :5173, staging API)
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
  await page.goto(`${BASE}/ru/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.react-international-phone-input', { timeout: 20000 })
  const pwTab = page.getByRole('tab', { name: /парол/i }).first()
  console.log('  password tab count =', await pwTab.count())
  await pwTab.click({ timeout: 10000 })
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  await page.waitForTimeout(500)
  const phone = page.locator('.react-international-phone-input')
  await phone.click()
  await phone.pressSequentially(CM.phone, { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', CM.pass)
  await shot(page, 'dbg-login-filled.png')
  await page.click('#login-submit')
  await page.waitForURL((u) => !String(u).includes('/auth/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
})

await step('01 notification bell — company invitation', async () => {
  await page.goto(`${BASE}/ru/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const bell = page.locator('button:has(svg.lucide-bell)').first()
  await bell.click({ timeout: 15000 })
  await page.waitForTimeout(2500)
  const invRow = page.getByText('Приглашение в компанию', { exact: false }).first()
  if (await invRow.count()) {
    await invRow.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
  } else {
    console.log('  note: invitation row not in current notification list (may be read/older) — scrolling drawer')
    await page.locator('.ant-drawer-body').evaluate((el) => { el.scrollTop = el.scrollHeight }).catch(() => {})
    await page.waitForTimeout(800)
  }
  await shot(page, '01-dispatcher-invitation-bell.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
})

await step('02 offers — company invitation card + modal', async () => {
  await page.goto(`${BASE}/ru/offers`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await shot(page, '02-offers-invitation-card.png')
  const openBtn = page.getByRole('button', { name: /открыть приглашение|open invitation|taklifni ochish/i }).first()
  console.log('  open-invitation button count =', await openBtn.count())
  if (await openBtn.count()) {
    await openBtn.click()
    await page.waitForTimeout(1500)
    await shot(page, '03-offers-invitation-modal.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  } else {
    console.log('  note: no invitation action button found (invitation may already be resolved)')
  }
})

await step('04 all-cargos — city name display (обл. abbreviation)', async () => {
  await page.goto(`${BASE}/ru/all-cargos`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await shot(page, '04-all-cargos-city-name.png')
})

await step('05/06 all-cargos — Excel export viewer (columns beyond Z + context menu locale)', async () => {
  await page.goto(`${BASE}/ru/all-cargos`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  const excelBtn = page.getByRole('button', { name: /excel/i }).first()
  console.log('  excel button count =', await excelBtn.count())
  await excelBtn.click({ timeout: 15000 })
  await page.waitForTimeout(4000)
  await shot(page, '05-excel-viewer-columns.png')
  // Scroll the spreadsheet grid horizontally to prove columns exist well past Z.
  const scroller = page.locator('.x-spreadsheet-sheet, .excel-viewer-container').first()
  const scrollCount = await scroller.count()
  console.log('  scrollable grid count =', scrollCount)
  if (scrollCount) {
    await scroller.evaluate((el) => { el.scrollLeft = el.scrollWidth }).catch(() => {})
    await page.waitForTimeout(700)
    await shot(page, '05b-excel-viewer-scrolled.png')
    await scroller.evaluate((el) => { el.scrollLeft = 0 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  // Right-click a cell -> context menu must be in the app's own language, not Chinese.
  const canvas = page.locator('.x-spreadsheet-sheet canvas, .x-spreadsheet canvas, #excel-view canvas').first()
  console.log('  spreadsheet canvas count =', await canvas.count())
  if (await canvas.count()) {
    await canvas.click({ button: 'right', position: { x: 200, y: 120 }, force: true, timeout: 8000 })
    await page.waitForTimeout(1000)
    await shot(page, '06-excel-viewer-context-menu.png')
    await page.keyboard.press('Escape')
  }
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
