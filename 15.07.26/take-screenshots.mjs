// Real Playwright captures for the 15.07.2026 daily report — live app on the STAGING API.
// Run: node take-screenshots.mjs   (dev server must be up on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const login = async () => {
  await page.goto('http://localhost:5173/en/admin/login', { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'admin321321')
  await page.click('button[type="submit"]')
  await page.waitForSelector('header', { timeout: 25000 })
  await page.waitForTimeout(2500)
}
const openViewOnRow = async (i = 0) => {
  const rows = await page.$$('.ant-table-row')
  const btn = await rows[i].$('button:has-text("View")')
  await btn.click()
  await page.waitForSelector('.ant-drawer-body', { timeout: 20000 })
  await page.waitForTimeout(3000)
}
const closeDrawer = async () => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(900)
}

await login()

// ── 1-4 · Dispatchers ───────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/en/admin/dispatchers', { waitUntil: 'networkidle' })
await page.waitForSelector('.ant-table-row', { timeout: 40000 })
await page.waitForTimeout(2000)
await shot(page, '01-dispatchers-table.png')
console.log('01 dispatchers table')

// horizontal scroll to reveal the three new date columns + actions
await page.evaluate(() => {
  const b = document.querySelector('.ant-table-body') || document.querySelector('.ant-table-content')
  if (b) b.scrollLeft = b.scrollWidth
})
await page.waitForTimeout(900)
await shot(page, '02-dispatchers-date-columns.png')
console.log('02 dispatchers date columns')

// the row that has BOTH phone and email (index 3 on staging)
const contacts = await page.$$eval('.ant-table-row', (rows) =>
  rows.map((r) => {
    const c = r.querySelector('td:nth-child(3)')
    return c ? c.innerText.trim().split('\n').filter(Boolean).length : 0
  })
)
const bothIdx = Math.max(0, contacts.findIndex((n) => n > 1))
await page.evaluate(() => {
  const b = document.querySelector('.ant-table-body') || document.querySelector('.ant-table-content')
  if (b) b.scrollLeft = 0
})
await page.waitForTimeout(600)
await openViewOnRow(bothIdx)
await shot(page, '03-dispatcher-drawer.png')
console.log('03 dispatcher drawer (photo + contact)')
await page.$eval('.ant-drawer-body', (el) => el.scrollTo(0, el.scrollHeight))
await page.waitForTimeout(800)
await shot(page, '04-dispatcher-drawer-system.png')
console.log('04 dispatcher drawer system')
await closeDrawer()

// ── 5 · Dispatchers RU ──────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/ru/admin/dispatchers', { waitUntil: 'networkidle' })
await page.waitForSelector('.ant-table-row', { timeout: 40000 })
await page.waitForTimeout(2000)
await shot(page, '05-dispatchers-ru.png')
console.log('05 dispatchers RU')

// ── 6-9 · Moderation tabs search ────────────────────────────────────────────────
await page.goto('http://localhost:5173/en/admin/moderation', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
const tabShots = [
  ['Drivers', '06-moderation-drivers-search.png'],
  ['Managers', '07-moderation-managers-search.png'],
  ['Passport', '08-moderation-passport-search.png'],
  ['Companies', '09-moderation-companies-search.png']
]
for (const [label, file] of tabShots) {
  const tab = await page.$(`.ant-tabs-tab:has-text("${label}")`)
  if (!tab) {
    console.log('   tab missing:', label)
    continue
  }
  await tab.click()
  await page.waitForTimeout(3200)
  await shot(page, file)
  console.log(file.slice(0, 2), label, 'tab')
}

// ── 10-11 · Moderation log search ───────────────────────────────────────────────
await page.goto('http://localhost:5173/en/admin/moderation-log', { waitUntil: 'networkidle' })
await page.waitForSelector('.ant-table-row', { timeout: 60000 })
await page.waitForTimeout(3500)
await shot(page, '10-moderation-log.png')
console.log('10 moderation log')
const logBox = await page.$('input[placeholder*="Search"]')
if (logBox) {
  const label = await page.$eval('.ant-table-row td:nth-child(4)', (td) => td.innerText.trim()).catch(() => '')
  await logBox.fill((label.split(',')[0] || label).slice(0, 12) || 'a')
  await page.waitForTimeout(1400)
  await shot(page, '11-moderation-log-search-active.png')
  console.log('11 moderation log search active')
}

// ── 12-14 · Trips ───────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/en/admin/trips', { waitUntil: 'networkidle' })
await page.waitForSelector('.ant-table-row', { timeout: 40000 })
await page.waitForTimeout(2500)
await shot(page, '12-trips-table.png')
console.log('12 trips table (Created + Updated, formatted price)')
await openViewOnRow(0)
await shot(page, '13-trip-drawer.png')
console.log('13 trip drawer')
await page.$eval('.ant-drawer-body', (el) => el.scrollTo(0, el.scrollHeight))
await page.waitForTimeout(800)
await shot(page, '14-trip-drawer-vehicle-system.png')
console.log('14 trip drawer vehicle + system')
await closeDrawer()

// ── 15 · Trips RU ───────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/ru/admin/trips', { waitUntil: 'networkidle' })
await page.waitForSelector('.ant-table-row', { timeout: 40000 })
await page.waitForTimeout(2000)
await shot(page, '15-trips-ru.png')
console.log('15 trips RU')

await browser.close()
console.log('\nDONE →', OUT)
