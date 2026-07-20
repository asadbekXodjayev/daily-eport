// Stubbed captures for the 10:50 company changes not covered by the workspace harness:
//   (a) redesigned /company company-LIST cards (3 freight types)
//   (b) a SHIPPER workspace — the AVTOPARK (fleet) group is hidden (forbiddenForTypes)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = path.join(import.meta.dirname, 'img')
const envelope = (data) => ({ status: 'success', code: 200, data })

const CO = { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'Acme Logistics LLC' }
const USER = 'user-1'
const COMPANIES = [
  { id: CO.id, name: 'Acme Logistics LLC', type: 'CARRIER', company_type_canonical: 'CARRIER', role: 'Owner', is_current: false, status: 'active', inn: '123456789', rating: 4.6 },
  { id: 'bbbbbbbb-0000-4000-8000-000000000002', name: 'Bahor Savdo', type: 'SHIPPER', company_type_canonical: 'SHIPPER', role: 'Owner', is_current: true, status: 'active', inn: '223456789', rating: 4.2 },
  { id: 'cccccccc-0000-4000-8000-000000000003', name: 'Continental Broker', type: 'BROKER', company_type_canonical: 'BROKER', role: 'Owner', is_current: false, status: 'pending', inn: '323456789', rating: 0 },
]
const shipper = COMPANIES[1]

const detailFor = (c) => envelope({
  ...c, phone: '+998901234567', address: 'Tashkent', legal_address: null, email: null, website: null,
  license_number: null, director_name: null, director_position: null, bank_name: null, bank_account: null,
  bank_mfo: null, bank_inn: null, auto_approve_limit: null, auto_approve_currency: null, reject_reason: null,
  owner_id: USER, created_at: '2026-01-01T00:00:00Z', max_vehicles: 50, max_trailers: 70, max_drivers: 50,
  max_cargo: 100, max_managers: 10, max_top_managers: 3,
})

const ROUTES = [
  [/\/v1\/auth\/companies/, () => envelope({ companies: COMPANIES })],
  [/\/v1\/company-users\/profile/, () => envelope({ user: { id: USER, phone: '+998901234567', email: 'owner@acme.com', first_name: 'Alisher', last_name: 'Karimov', role: 'OWNER', company_id: CO.id } })],
  [/\/v1\/me\/permissions/, () => envelope({ company_id: shipper.id, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/bbbbbbbb[^/]*$/, () => detailFor(shipper)],
  [/\/v1\/companies\/[^/]+\/dashboard/, () => envelope({ trips_by_status: {}, finance: { by_currency: [] }, resources: {}, rating: { overall: 4.2 }, quota: [], alerts: {} })],
  [/\/v1\/reference\//, () => envelope({ items: [], power: [], trailer: [], groups: [], types: [], statuses: [], roles: [] })],
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.route('**/v1/**', (route) => {
  const url = route.request().url().split('?')[0]
  for (const [re, body] of ROUTES) {
    if (re.test(url)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body()) })
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(envelope({ items: [] })) })
})
await ctx.addInitScript(() => {
  const now = Math.floor(Date.now() / 1000)
  localStorage.setItem('sarbon_company_app_token', 'seeded-access-token')
  localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
  localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
  localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
})
const page = await ctx.newPage()

const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}

await step('24 company list — redesigned cards (carrier/shipper/broker)', async () => {
  await page.goto(`${BASE}/uz/company`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, '24-company-list-cards.png'), fullPage: false })
})

await step('25 SHIPPER workspace — AVTOPARK (fleet) group hidden', async () => {
  await page.goto(`${BASE}/uz/company/${shipper.id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, '25-company-shipper-no-fleet.png'), fullPage: false })
})

await browser.close()
console.log('\nDONE')
