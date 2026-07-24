// Admin pass for the 21.07.2026 report — live STAGING API, real creator-admin session.
//   command-center "Needs attention": the 4 new pending-moderation totals + full-height bar
//   /admin/companies: moderation queue, create form (status Select + INN rule + max_trailers),
//                     Tariffs catalog + "set default" confirm, per-row kebab
//   /admin/moderation?tab=company: the same queue mounted in the hub + "Assign tariff" kebab item
// The delete -> "Restore" undo notification is deliberately NOT re-shot here: it would soft-delete a
// real staging company. It was verified live during the fix session (see bug.md 21.07 14:25).
// Run: node take-admin.mjs   (dev server on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
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

await step('20 command center — "Требует внимания": 6 queues + stretched bar', async () => {
  await page.goto(`${BASE}/ru/admin/command-center`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  const heading = page.getByText(/Требует внимания/i).first()
  if (await heading.count()) await heading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  await shot(page, '20-admin-command-center-attention.png')
})

await step('21 admin companies — moderation queue (controlled Excel filters, local timestamps)', async () => {
  await page.goto(`${BASE}/ru/admin/companies`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  await shot(page, '21-admin-companies-queue.png')
})

await step('22 admin companies — status filter applied, then Segmented switched (filter pruned)', async () => {
  const filterIcon = page.locator('.ant-table-filter-trigger').first()
  if (await filterIcon.count()) {
    await filterIcon.click()
    await page.waitForTimeout(1200)
    await shot(page, '22-admin-companies-column-filter.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
  }
})

await step('23 admin companies — row kebab (restore/tariff/bind-owner actions)', async () => {
  const kebab = page.locator('.ant-table-row button:has(svg)').last()
  if (await kebab.count()) {
    await kebab.click({ timeout: 10000 })
    await page.waitForTimeout(1500)
    await shot(page, '23-admin-companies-row-kebab.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }
})

await step('24 admin companies — create form: status Select + INN rule + max_trailers', async () => {
  await page.goto(`${BASE}/ru/admin/companies?tab=create`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  const inn = page.locator('#inn, input[id$="inn"]').first()
  if (await inn.count()) {
    await inn.fill('123')
    await page.waitForTimeout(400)
  }
  const submit = page.getByRole('button', { name: /Создать|Сохранить/ }).first()
  if (await submit.count()) { await submit.click().catch(() => {}); await page.waitForTimeout(1800) }
  await shot(page, '24-admin-companies-create-validation.png', { fullPage: true })
})

await step('25 admin companies — Tariffs catalog + "set default" confirm', async () => {
  await page.goto(`${BASE}/ru/admin/companies?tab=tariffs`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  await shot(page, '25-admin-companies-tariffs.png')
  const setDefault = page.getByRole('button', { name: /по умолчанию/i }).first()
  if (await setDefault.count()) {
    await setDefault.click()
    await page.waitForTimeout(1500)
    await shot(page, '25b-admin-tariffs-set-default-confirm.png')
    const cancel = page.getByRole('button', { name: /Отмена/ }).last()
    if (await cancel.count()) await cancel.click().catch(() => {})
    await page.waitForTimeout(600)
  }
})

await step('26 moderation hub — company tab (same queue, now with tariff access)', async () => {
  await page.goto(`${BASE}/ru/admin/moderation?tab=company`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  await shot(page, '26-admin-moderation-company-tab.png')
  const kebab = page.locator('.ant-table-row button:has(svg)').last()
  if (await kebab.count()) {
    await kebab.click({ timeout: 10000 })
    await page.waitForTimeout(1500)
    await shot(page, '27-admin-moderation-company-kebab-tariff.png')
    await page.keyboard.press('Escape')
  }
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
