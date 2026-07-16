// Re-capture the moderation tab panes scrolled to the queue itself — the page opens on the Overview
// cards, so an unscrolled shot hides the search box the report is about.
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

// Credentials come from the environment — never hardcode them here: this file is committed to a
// GitHub repo, and a staging admin password in it is a published credential.
//   ADMIN_USER=admin ADMIN_PASS=... node take-screenshots.mjs
const ADMIN_USER = process.env.ADMIN_USER
const ADMIN_PASS = process.env.ADMIN_PASS
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error('Set ADMIN_USER and ADMIN_PASS in the environment before running this capture.')
  process.exit(1)
}

const OUT = path.join(import.meta.dirname, 'img')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto('http://localhost:5173/en/admin/login', { waitUntil: 'networkidle' })
await page.fill('input[autocomplete="username"]', ADMIN_USER)
await page.fill('input[autocomplete="current-password"]', ADMIN_PASS)
await page.click('button[type="submit"]')
await page.waitForSelector('header', { timeout: 25000 })
await page.waitForTimeout(2500)

await page.goto('http://localhost:5173/en/admin/moderation', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// Collapse the Overview block so the queue + its new search box are what the shot shows.
const collapse = await page.$('.ant-collapse-header, [aria-expanded="true"]')
if (collapse) {
  await collapse.click()
  await page.waitForTimeout(900)
}

for (const [label, file] of [
  ['Drivers', '06-moderation-drivers-search.png'],
  ['Managers', '07-moderation-managers-search.png'],
  ['Passport', '08-moderation-passport-search.png'],
  ['Companies', '09-moderation-companies-search.png']
]) {
  const tab = await page.$(`.ant-tabs-tab:has-text("${label}")`)
  if (!tab) {
    console.log('tab missing:', label)
    continue
  }
  await tab.click()
  await page.waitForTimeout(3200)
  const pane = await page.$('.ant-tabs-tabpane-active input[placeholder]')
  if (pane) await pane.scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  await page.screenshot({ path: path.join(OUT, file) })
  const ph = pane ? await pane.getAttribute('placeholder') : null
  const rows = (await page.$$('.ant-tabs-tabpane-active .ant-table-row')).length
  console.log(`${file}  searchBox=${!!pane}  placeholder=${JSON.stringify(ph)}  rows=${rows}`)
}
await browser.close()
console.log('done')
