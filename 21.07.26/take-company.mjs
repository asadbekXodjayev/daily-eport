// Company-surface pass for the 21.07.2026 report.
// Seeded company session + stubbed staging responses (the same harness the day's fixes were
// verified with), because the company owner surface has no shareable staging account.
// Shoots: workspace overview (CARRIER vs SHIPPER fleet gating), Roles tab (type-filtered chips +
// permission toggles that now survive Save), humanized Audit log + change drawer, company profile
// (ratings + email identity), create form (INN-taken field error), login (method tabs + localized
// error), OTP guard.
// Run: node take-company.mjs   (dev server on :5173)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const API = 'https://api.sarbon.me/'
const OUT = path.join(import.meta.dirname, 'img')
fs.mkdirSync(OUT, { recursive: true })
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}

const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER = 'user-1'
const env = (data) => ({ status: 'success', code: 200, data })

const company = (type) => ({
  id: CO_ID,
  name: type === 'SHIPPER' ? 'Sarbon Trade Group MChJ' : 'Sarbon Logistics International MChJ',
  type,
  company_type_canonical: type,
  status: 'active',
  inn: '123456789',
  phone: '+998901234567',
  email: 'owner@sarbon.me',
  website: 'sarbon.me',
  legal_address: 'г. Ташкент, Мирзо-Улугбекский район, ул. Мустакиллик 12',
  director_name: 'Каримов Алишер Рустамович',
  director_position: 'Директор',
  bank_name: 'АКБ «Асака банк»',
  bank_account: '20208000900123456789',
  bank_mfo: '00423',
  bank_inn: '123456789',
  owner_id: USER,
  rating: 4.5,
  rating_as_shipper: 4.2,
  rating_as_carrier: 4.7,
  max_cargo: 100,
  max_managers: 10,
  max_top_managers: 3,
  max_vehicles: 25,
  max_trailers: 25,
  max_drivers: 30,
  created_at: '2026-06-02T09:00:00Z'
})

const QUOTA = {
  items: [
    { resource: 'cargo', limit: 100, used: 47, remaining: 53, exceeded: false },
    { resource: 'managers', limit: 10, used: 4, remaining: 6, exceeded: false },
    { resource: 'top_managers', limit: 3, used: 1, remaining: 2, exceeded: false },
    { resource: 'vehicles', limit: 25, used: 18, remaining: 7, exceeded: false },
    { resource: 'trailers', limit: 25, used: 16, remaining: 9, exceeded: false },
    { resource: 'drivers', limit: 30, used: 22, remaining: 8, exceeded: false }
  ]
}

const DASHBOARD = {
  trips_by_status: { IN_PROGRESS: 6, IN_TRANSIT: 3, DELIVERED: 12, COMPLETED: 41, CANCELLED: 2 },
  finance: { period: 'month', by_currency: [{ currency: 'UZS', revenue: 412000000, expense: 288000000, profit: 124000000 }] },
  resources: { drivers: 22, vehicles: 18, trailers: 16, cargo: 47 },
  rating: { overall: 4.5, as_shipper: 4.2, as_carrier: 4.7 },
  quota: QUOTA.items,
  alerts: { fleet_in_maintenance: 2, unpaid_by_currency: [{ currency: 'UZS', accrued: 96000000, paid: 74000000, remaining: 22000000 }] }
}

const ANALYTICS = {
  cargo: { total: 47, active: 12, completed: 31, cancelled: 4 },
  trips: { total: 64, completed: 41, cancelled: 2, average_duration_hours: 28.4 },
  finance: { period: 'month', by_currency: [{ currency: 'UZS', revenue: 412000000, expense: 288000000, profit: 124000000 }] },
  rating: { overall: 4.5, as_shipper: 4.2, as_carrier: 4.7 }
}

const PERMISSIONS_CATALOG = {
  groups: [
    { key: 'cargo', label: 'Грузы', permissions: [
      { key: 'cargo.view', label: 'Просмотр грузов' },
      { key: 'cargo.create', label: 'Создание груза' },
      { key: 'cargo.publish', label: 'Публикация груза' },
      { key: 'cargo.delete', label: 'Удаление груза' }
    ] },
    { key: 'trips', label: 'Рейсы', permissions: [
      { key: 'trips.view', label: 'Просмотр рейсов' },
      { key: 'trips.assign_driver', label: 'Назначение водителя' },
      { key: 'trips.cancel', label: 'Отмена рейса' }
    ] },
    { key: 'fleet', label: 'Автопарк', permissions: [
      { key: 'fleet.view', label: 'Просмотр автопарка' },
      { key: 'fleet.manage', label: 'Управление автопарком' }
    ] },
    { key: 'finance', label: 'Финансы', permissions: [
      { key: 'finance.view', label: 'Просмотр финансов' },
      { key: 'finance.manage', label: 'Управление платежами' }
    ] }
  ],
  all: []
}
PERMISSIONS_CATALOG.all = PERMISSIONS_CATALOG.groups.flatMap((g) => g.permissions)

const AUDIT = {
  entries: [
    { id: 'a-1', actor: { id: USER, type: 'company_user', user_id: USER }, action: 'create',
      entity_type: 'user_company_role', entity_id: 'ucr-1001',
      old_data: null, new_data: { role: 'CargoManager', user_id: 'u-88', company_id: CO_ID },
      created_at: '2026-07-21T09:14:00Z' },
    { id: 'a-2', actor: { id: USER, type: 'company_user', user_id: USER }, action: 'update',
      entity_type: 'company', entity_id: CO_ID,
      old_data: { name: 'Sarbon Logistics MChJ', phone: '+998901112233', max_drivers: 20 },
      new_data: { name: 'Sarbon Logistics International MChJ', phone: '+998901234567', max_drivers: 30 },
      created_at: '2026-07-21T10:02:00Z' },
    { id: 'a-3', actor: { id: null, type: 'system', user_id: null }, action: 'delete',
      entity_type: 'company_invitation', entity_id: 'inv-42',
      old_data: { phone: '+998907776655', role_id: 'role-cm', status: 'pending' }, new_data: null,
      created_at: '2026-07-21T11:40:00Z' },
    { id: 'a-4', actor: { id: USER, type: 'company_user', user_id: USER }, action: 'update',
      entity_type: 'company_user', entity_id: 'cu-7',
      old_data: { first_name: 'Жамшид', last_name: 'Рахимов' },
      new_data: { first_name: 'Жамшид', last_name: 'Рахимов-Юсупов' },
      created_at: '2026-07-21T13:26:00Z' }
  ],
  total: 4, page: 1, limit: 20
}

const routes = (type) => [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...company(type), role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: null, email: 'owner@sarbon.me', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/quota/, () => env(QUOTA)],
  [/\/v1\/companies\/[^/]+\/dashboard/, () => env(DASHBOARD)],
  [/\/v1\/companies\/[^/]+\/analytics/, () => env(ANALYTICS)],
  [/\/v1\/companies\/[^/]+\/audit/, () => env(AUDIT)],
  [/\/v1\/companies\/[^/]+\/roles\/[^/]+\/permissions/, () => env({ permissions: [] })],
  [/\/v1\/reference\/permissions/, () => env(PERMISSIONS_CATALOG)],
  [/\/v1\/companies\/[^/]+\/users/, () => env({ users: [{ id: USER, first_name: 'Алишер', last_name: 'Каримов', phone: '+998901234567', role: { id: null, name: 'Owner' }, assigned_by: null }], total: 1, page: 1, limit: 200 })],
  [/\/v1\/companies\/[^/]+$/, () => env(company(type))]
]

async function makeCtx(browser, type, extra = []) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1050 } })
  const table = [...extra, ...routes(type)]
  await ctx.route('**/*', (route) => {
    const url = route.request().url()
    if (!url.startsWith(API)) return route.continue()
    const bare = url.split('?')[0]
    for (const [re, body] of table) {
      if (re.test(bare)) {
        const r = body(route)
        return route.fulfill({ status: r.__status ?? 200, contentType: 'application/json', body: JSON.stringify(r.__body ?? r) })
      }
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env({ items: [], total: 0 })) })
  })
  await ctx.addInitScript(() => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem('sarbon_company_app_token', 'seeded-access-token')
    localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
    localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
    localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
    localStorage.setItem('sarbon_theme', 'light')
  })
  return ctx
}

const browser = await chromium.launch()

// ---- 1. Workspace overview: CARRIER (fleet visible) -----------------------------------------
let ctx = await makeCtx(browser, 'CARRIER')
let page = await ctx.newPage()

await step('01 overview — CARRIER (fleet tiles present, one identity, card elevation)', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=overview`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '01-company-overview-carrier.png')
})

await step('02 roles — CARRIER shows all 7 configurable roles', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=roles`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '02-company-roles-carrier-all-roles.png')
})

await step('03 roles — permission stays on "Разрешено" after Save', async () => {
  const seg = page.locator('.ant-segmented').first()
  if (await seg.count()) {
    const allowed = seg.locator('.ant-segmented-item').nth(1)
    await allowed.click({ timeout: 8000 })
    await page.waitForTimeout(600)
    await shot(page, '03a-company-roles-allowed-before-save.png')
    const save = page.getByRole('button', { name: /Сохранить/ }).first()
    if (await save.count()) {
      await save.click()
      await page.waitForTimeout(2000)
    }
    await shot(page, '03b-company-roles-allowed-after-save.png')
  }
})

await step('04 audit — humanized action/entity/actor columns', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=audit`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '04-company-audit-humanized.png')
})

await step('05 audit — "before → after" change drawer (no raw JSON)', async () => {
  const btn = page.locator('.ant-table-row button').first()
  if (await btn.count()) {
    await btn.click({ timeout: 8000 })
    await page.waitForTimeout(1800)
    await shot(page, '05-company-audit-change-drawer.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }
})

await ctx.close()

// ---- 2. Workspace overview: SHIPPER (fleet suppressed) --------------------------------------
ctx = await makeCtx(browser, 'SHIPPER')
page = await ctx.newPage()

await step('06 overview — SHIPPER (fleet seat/quota tiles + maintenance alert hidden)', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=overview`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '06-company-overview-shipper-no-fleet.png')
})

await step('07 roles — SHIPPER hides the three fleet roles', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=roles`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '07-company-roles-shipper-filtered.png')
})

await step('08 sidebar — fleet nav group hidden for SHIPPER', async () => {
  const aside = page.locator('aside').first()
  if (await aside.count()) await shot(aside, '08-company-sidebar-shipper.png')
})

await ctx.close()

// ---- 3. Profile: ratings + email identity ----------------------------------------------------
ctx = await makeCtx(browser, 'CARRIER')
page = await ctx.newPage()

await step('09 profile — localized rating labels + email as the login identity', async () => {
  await page.goto(`${BASE}/ru/company/profile`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '09-company-profile-ratings-email.png')
})

await ctx.close()

// ---- 4. Create form: taken INN pinned to the field -------------------------------------------
ctx = await makeCtx(browser, 'CARRIER', [
  [/\/v1\/companies$/, () => ({ __status: 409, __body: { status: 'error', code: 409, description: 'already_exists' } })]
])
page = await ctx.newPage()

await step('10 create — 409 on a taken INN renders on the field, not as a raw code toast', async () => {
  await page.goto(`${BASE}/ru/company/create`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const fill = async (label, value) => {
    const el = page.locator(`#${label}`).first()
    if (await el.count()) await el.fill(value)
  }
  await fill('name', 'Sarbon Test Logistics MChJ')
  await fill('inn', '123456789')
  const phone = page.locator('.react-international-phone-input').first()
  if (await phone.count()) { await phone.click(); await phone.pressSequentially('901234567', { delay: 40 }) }
  const typeSel = page.locator('.ant-select').first()
  if (await typeSel.count()) {
    await typeSel.click()
    await page.waitForTimeout(600)
    await page.locator('.ant-select-item-option').first().click().catch(() => {})
  }
  await page.waitForTimeout(400)
  await shot(page, '10a-company-create-form.png')
  const submit = page.locator('button[type="submit"]').first()
  if (await submit.count()) { await submit.click(); await page.waitForTimeout(2500) }
  await shot(page, '10b-company-create-inn-taken.png')
})

await ctx.close()

// ---- 5. Company login: method tabs + localized backend error ---------------------------------
ctx = await makeCtx(browser, 'CARRIER', [
  [/\/v1\/company-users\/auth\/login\/password/, () => ({ __status: 401, __body: { status: 'error', code: 401, description: 'invalid_credentials' } })]
])
page = await ctx.newPage()
await page.addInitScript(() => {
  localStorage.removeItem('sarbon_company_app_token')
  localStorage.removeItem('sarbon_company_app_refresh_token')
})

await step('11 login — identity/method toggles + localized 401 (was a raw code)', async () => {
  await page.goto(`${BASE}/ru/company/login`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.removeItem('sarbon_company_app_token')
    localStorage.removeItem('sarbon_company_app_refresh_token')
    localStorage.removeItem('sarbon_company_app_access_token_expiry')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '11a-company-login.png')
  const pwTab = page.getByRole('tab', { name: /парол/i }).first()
  if (await pwTab.count()) { await pwTab.click(); await page.waitForTimeout(800) }
  const phone = page.locator('.react-international-phone-input').first()
  if (await phone.count()) { await phone.click(); await phone.pressSequentially('901234567', { delay: 40 }) }
  const pw = page.locator('input[type="password"]').first()
  if (await pw.count()) await pw.fill('WrongPass123')
  await page.waitForTimeout(300)
  const submit = page.locator('button[type="submit"]').first()
  if (await submit.count()) { await submit.click(); await page.waitForTimeout(2500) }
  await shot(page, '11b-company-login-localized-error.png')
})

await step('12 OTP — direct visit with no identity is guarded, not a live blank code screen', async () => {
  await page.goto(`${BASE}/ru/company/otp`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot(page, '12-company-otp-guarded.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
