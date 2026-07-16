// Real Playwright captures for the 16.07.2026 daily report — live app on the STAGING API.
// Covers the admin Drivers + Dispatchers changes: effective Account status (no more "No data"),
// the slimmed View/Edit/Delete actions column, and the Edit-drawer status editors (Account / KYC /
// Moderation). Run:  ADMIN_USER=admin ADMIN_PASS=... node take-screenshots.mjs   (dev server on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

// Creds come from the environment, falling back to the project's committed QA smoke config
// (qa/qa-smoke-admin.json) so no password is ever typed on the command line.
const readCredsFromSmokeConfig = () => {
  try {
    const cfg = JSON.parse(
      fs.readFileSync('C:/Users/hp/Desktop/sarbon-frontend-main/qa/qa-smoke-admin.json', 'utf8')
    )
    const steps = cfg.auth?.steps ?? []
    const pick = (autocomplete) =>
      steps.find((s) => s.action === 'fill' && (s.selector || '').includes(autocomplete))?.value
    return { user: pick('username'), pass: pick('current-password') }
  } catch {
    return {}
  }
}
const fromCfg = readCredsFromSmokeConfig()
const ADMIN_USER = process.env.ADMIN_USER || fromCfg.user
const ADMIN_PASS = process.env.ADMIN_PASS || fromCfg.pass
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error('No admin creds: set ADMIN_USER/ADMIN_PASS or provide qa/qa-smoke-admin.json.')
  process.exit(1)
}

const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try {
    await fn()
    console.log('  ok  ', name)
  } catch (e) {
    console.log('  FAIL', name, '::', e.message)
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const login = async () => {
  await page.goto('http://localhost:5173/en/admin/login', { waitUntil: 'networkidle' })
  await page.fill('input[autocomplete="username"]', ADMIN_USER)
  await page.fill('input[autocomplete="current-password"]', ADMIN_PASS)
  await page.click('button[type="submit"]')
  await page.waitForSelector('header', { timeout: 25000 })
  await page.waitForTimeout(2500)
}

const scrollTableRight = async () => {
  await page.evaluate(() => {
    const b = document.querySelector('.ant-table-body') || document.querySelector('.ant-table-content')
    if (b) b.scrollLeft = b.scrollWidth
  })
  await page.waitForTimeout(900)
}
const scrollTableLeft = async () => {
  await page.evaluate(() => {
    const b = document.querySelector('.ant-table-body') || document.querySelector('.ant-table-content')
    if (b) b.scrollLeft = 0
  })
  await page.waitForTimeout(600)
}
const openEditOnRow = async (i = 0) => {
  const rows = await page.$$('.ant-table-row')
  const btn = await rows[i].$('button:has-text("Edit")')
  await btn.click()
  await page.waitForSelector('.ant-drawer-body', { timeout: 20000 })
  await page.waitForTimeout(3200)
}
const closeDrawer = async () => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(900)
}

await login()

// ── Drivers ───────────────────────────────────────────────────────────────────────
await step('01 drivers table (Account column = effective status, no "No data")', async () => {
  await page.goto('http://localhost:5173/en/admin/drivers', { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2500)
  await shot(page, '01-drivers-table-account.png')
})

await step('02 drivers actions column = View / Edit / Delete only', async () => {
  await scrollTableRight()
  await shot(page, '02-drivers-actions-column.png')
  await scrollTableLeft()
})

await step('03 driver Edit drawer — Account / KYC / Moderation status editor', async () => {
  await openEditOnRow(0)
  await shot(page, '03-driver-edit-status-editor.png')
})

await step('04 driver "Account status" dropdown (status-gated lifecycle actions)', async () => {
  const btn = await page.$('.ant-drawer-body button:has-text("Account status")')
  await btn.click()
  await page.waitForSelector('.ant-dropdown-menu', { timeout: 8000 })
  await page.waitForTimeout(700)
  await shot(page, '04-driver-account-status-menu.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await closeDrawer()
})

await step('05 drivers table — Russian locale', async () => {
  await page.goto('http://localhost:5173/ru/admin/drivers', { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2200)
  await shot(page, '05-drivers-ru.png')
})

// ── Dispatchers ─────────────────────────────────────────────────────────────────────
await step('06 dispatchers table', async () => {
  await page.goto('http://localhost:5173/en/admin/dispatchers', { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2500)
  await shot(page, '06-dispatchers-table.png')
})

await step('07 dispatchers actions column = View / Edit / Delete only', async () => {
  await scrollTableRight()
  await shot(page, '07-dispatchers-actions-column.png')
  await scrollTableLeft()
})

await step('08 dispatcher Edit drawer — Moderation lifecycle section', async () => {
  await openEditOnRow(0)
  await shot(page, '08-dispatcher-edit-moderation.png')
})

await step('09 dispatcher Moderation dropdown (lifecycle actions)', async () => {
  const btn = await page.$('.ant-drawer-body button:has-text("Moderation")')
  await btn.click()
  await page.waitForSelector('.ant-dropdown-menu', { timeout: 8000 })
  await page.waitForTimeout(700)
  await shot(page, '09-dispatcher-moderation-menu.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await closeDrawer()
})

await step('10 dispatchers table — Russian locale', async () => {
  await page.goto('http://localhost:5173/ru/admin/dispatchers', { waitUntil: 'networkidle' })
  await page.waitForSelector('.ant-table-row', { timeout: 40000 })
  await page.waitForTimeout(2200)
  await shot(page, '10-dispatchers-ru.png')
})

await browser.close()
console.log('\nDONE →', OUT)
