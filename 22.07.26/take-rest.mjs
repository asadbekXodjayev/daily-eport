// Second pass for the 22.07.2026 report:
//   10/11 board -> trip drill-through (the one-shot ?trip= param)
//   12    cargo list pager (45 rows / 20 per page) - below the fold in the first pass
//   20/21 dispatcher offers feed: the company invitation now accepted/declined IN PLACE
//   30-32 the public "For companies" entry points, restored after the production push
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

const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER = 'user-1'
const CARGO_ID = 'cargo-1'
const TRIP_ID = 'trip-1'
const env = (data) => ({ status: 'success', code: 200, data })

const CO = {
  id: CO_ID, name: 'Sarbon Logistics International MChJ', type: 'CARRIER',
  company_type_canonical: 'CARRIER', status: 'active', inn: '123456789',
  phone: '+998901234567', owner_id: USER, max_cargo: 100, created_at: '2026-06-02T09:00:00Z'
}

const cargoRow = (i) => ({
  id: i === 1 ? CARGO_ID : `cargo-${i}`, name: `Груз ${i}`, status: 'SEARCHING_ALL',
  weight: 12.5 + i, volume: 82, vehicles_amount: 1, trailer_plate_type: 'TENTED',
  cargo_type: { id: 'ct-1', code: 'METAL', name_ru: 'Металлопрокат холоднокатаный' },
  route_points: [
    { type: 'LOAD', country_code: 'UZ', city_code: 'TAS', address: 'Ташкент', point_order: 1, is_main_load: true },
    { type: 'UNLOAD', country_code: 'UZ', city_code: 'SAM', address: 'Самарканд', point_order: 2, is_main_unload: true }
  ],
  payment: { total_amount: 1500 + i * 100, total_currency: 'USD' }
})

const BOARD = {
  company_id: CO_ID,
  columns: [
    { stage: 'SEARCH', count: 1, truncated: false, cards: [] },
    { stage: 'IN_PROGRESS', count: 1, truncated: false, cards: [
      { unit_type: 'trip', id: TRIP_ID, cargo_id: CARGO_ID, status: 'IN_TRANSIT',
        route: { from: 'TAS', to: 'SAM' }, driver: { id: 'drv-1', name: 'Сардор Абдуллаев' },
        company_role: 'carrier', price: { amount: 15250000, currency: 'UZS' },
        stage_since: '2026-07-20T08:00:00+05:00' }] },
    { stage: 'IN_TRANSIT', count: 0, truncated: false, cards: [] },
    { stage: 'DELIVERED', count: 0, truncated: false, cards: [] },
    { stage: 'COMPLETED', count: 0, truncated: false, cards: [] },
    { stage: 'CANCELLED', count: 0, truncated: false, cards: [] }
  ]
}

const TRIP = {
  id: TRIP_ID, cargo_id: CARGO_ID, offer_id: 'off-9', status: 'IN_TRANSIT',
  driver_id: 'drv-1', driver: { id: 'drv-1', name: 'Сардор Абдуллаев' },
  agreed_price: 15250000, agreed_currency: 'UZS', company_role: 'carrier',
  assigned_manager: { id: USER, name: 'Алишер Каримов' },
  cargo_type: { id: 'ct-1', code: 'METAL', name: 'Металлопрокат холоднокатаный' },
  created_at: '2026-07-20T09:00:00Z', updated_at: '2026-07-22T14:30:00Z',
  route_points: [], way_points: []
}

const COMPANY_ROUTES = [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...CO, role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/board/, () => env(BOARD)],
  [/\/v1\/companies\/[^/]+\/trips\/[^/]+$/, () => env(TRIP)],
  [/\/v1\/companies\/[^/]+\/trips/, () => env({ items: [TRIP], total: 1, limit: 20, offset: 0 })],
  [/\/v1\/companies\/[^/]+\/cargo/, () => env({ items: Array.from({ length: 20 }, (_, i) => cargoRow(i + 1)), total: 45, page: 1, limit: 20 })],
  [/\/v1\/companies\/[^/]+$/, () => env(CO)]
]

const browser = await chromium.launch()

// ---- Company: board drill-through + list pager -------------------------------------------------
let ctx = await browser.newContext({ viewport: { width: 1600, height: 1050 } })
await ctx.route('**/*', (route) => {
  const url = route.request().url()
  if (!url.startsWith(API)) return route.continue()
  const bare = url.split('?')[0]
  for (const [re, body] of COMPANY_ROUTES) {
    if (re.test(bare)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body()) })
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env({ items: [], total: 0 })) })
})
await ctx.addInitScript(() => {
  const now = Math.floor(Date.now() / 1000)
  localStorage.setItem('sarbon_company_app_token', 'seeded-access-token')
  localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
  localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
  localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
  localStorage.setItem('sarbon_company_app_profile', JSON.stringify({ id: 'user-1', phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов' }))
  localStorage.setItem('sarbon_theme', 'light')
})
let page = await ctx.newPage()
const tripDetailCalls = []
page.on('request', (r) => { if (/\/trips\/trip-1(\?|$)/.test(r.url())) tripDetailCalls.push(r.url()) })

await step('10/11 board card → trip detail drawer', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=board`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const card = page.locator('button, [role="button"]').filter({ hasText: 'Сардор Абдуллаев' }).last()
  console.log('    board card candidates:', await card.count())
  await card.click({ timeout: 12000 })
  await page.waitForTimeout(4000)
  console.log('    url after click:', page.url().split(CO_ID)[1])
  console.log('    trip detail requests:', tripDetailCalls.length)
  await shot(page, '10-company-board-trip-drilldown.png')
})

await step('12 cargo list — pager for 45 rows at 20 per page', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=cargo`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const pager = page.locator('.ant-pagination').first()
  if (await pager.count()) {
    await pager.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
  }
  await shot(page, '12-company-cargo-pager.png')
})
await ctx.close()

// ---- Dispatcher: invitation accepted/declined in place -----------------------------------------
const INVITATION = {
  id: 'inv-offer-1',
  offer_kind: 'company_invitation',
  invitation_id: 'inv-42',
  direct_accept_available: true,
  status: 'PENDING',
  company: { id: CO_ID, name: 'Sarbon Logistics International MChJ' },
  company_name: 'Sarbon Logistics International MChJ',
  role: { id: 'role-cm', name: 'CargoManager' },
  role_name: 'CargoManager',
  cargo: null,
  offer: null,
  created_at: '2026-07-22T09:10:00Z',
  expires_at: '2026-07-29T09:10:00Z'
}

ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
await ctx.route('**/v1/dispatchers/offers/all*', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env({ items: [INVITATION], total: 1, page: 1, limit: 20 })) })
)
page = await ctx.newPage()

await step('dispatcher login', async () => {
  await page.goto(`${BASE}/ru/auth/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.react-international-phone-input', { timeout: 25000 })
  await page.getByRole('tab', { name: /парол/i }).first().click({ timeout: 10000 })
  await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
  await page.waitForTimeout(600)
  const phone = page.locator('.react-international-phone-input')
  await phone.click()
  await phone.pressSequentially('994878460', { delay: 60 })
  await page.fill('input[autocomplete="current-password"]', 'Asadxad123')
  await page.click('#login-submit')
  await page.waitForURL((u) => !String(u).includes('/auth/login'), { timeout: 30000 })
  await page.waitForTimeout(2500)
})

await step('20 offers feed — invitation with in-place Accept / Decline', async () => {
  await page.goto(`${BASE}/ru/offers`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6000)
  await shot(page, '20-dispatcher-invitation-accept-decline.png')
  const acceptBtn = page.getByRole('button', { name: /Принять/ }).first()
  console.log('    accept buttons:', await acceptBtn.count())
})
await ctx.close()

// ---- Public: the "For companies" entry points restored after the production push ----------------
ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
page = await ctx.newPage()

await step('30 footer — "Для компаний" link restored', async () => {
  await page.goto(`${BASE}/ru`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const footer = page.locator('footer').first()
  await footer.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  await shot(footer, '30-footer-for-companies.png')
})

await step('31 header — guest "Для компаний" entry restored', async () => {
  await page.goto(`${BASE}/ru`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '31-header-for-companies.png', { clip: { x: 0, y: 0, width: 1600, height: 150 } })
})

await step('32 dispatcher login — company cross-identity hint restored', async () => {
  await page.goto(`${BASE}/ru/auth/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '32-login-cross-identity-hint.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
