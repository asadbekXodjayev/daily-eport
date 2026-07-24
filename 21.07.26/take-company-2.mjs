// Follow-up company pass — the four shots the first run framed wrong:
//   03c roles: confirm the AntD modal so the AFTER-SAVE toggle state is what's captured
//   05  audit: open the real "Подробнее" change drawer (the first run hit the actor filter chip)
//   09b profile: the "Мои компании" tab, where the previously-raw rating labels live
//   10c create: the INN field error framed on the field itself
//   01f/06f overview fullPage: the fleet seat/quota tiles that sit below the fold
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const API = 'https://api.sarbon.me/'
const OUT = path.join(import.meta.dirname, 'img')
const shot = (t, name, opts = {}) => t.screenshot({ path: path.join(OUT, name), ...opts })
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}

const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER = 'user-1'
const env = (data) => ({ status: 'success', code: 200, data })

const company = (type) => ({
  id: CO_ID,
  name: type === 'SHIPPER' ? 'Sarbon Trade Group MChJ' : 'Sarbon Logistics International MChJ',
  type, company_type_canonical: type, status: 'active', inn: '123456789',
  phone: '+998901234567', email: 'owner@sarbon.me', website: 'sarbon.me',
  legal_address: 'г. Ташкент, Мирзо-Улугбекский район, ул. Мустакиллик 12',
  director_name: 'Каримов Алишер Рустамович', director_position: 'Директор',
  bank_name: 'АКБ «Асака банк»', bank_account: '20208000900123456789', bank_mfo: '00423', bank_inn: '123456789',
  owner_id: USER, rating: 4.5, rating_as_shipper: 4.2, rating_as_carrier: 4.7,
  max_cargo: 100, max_managers: 10, max_top_managers: 3, max_vehicles: 25, max_trailers: 25, max_drivers: 30,
  created_at: '2026-06-02T09:00:00Z'
})

const QUOTA = { items: [
  { resource: 'cargo', limit: 100, used: 47, remaining: 53, exceeded: false },
  { resource: 'managers', limit: 10, used: 4, remaining: 6, exceeded: false },
  { resource: 'top_managers', limit: 3, used: 1, remaining: 2, exceeded: false },
  { resource: 'vehicles', limit: 25, used: 18, remaining: 7, exceeded: false },
  { resource: 'trailers', limit: 25, used: 16, remaining: 9, exceeded: false },
  { resource: 'drivers', limit: 30, used: 22, remaining: 8, exceeded: false }
] }

const DASHBOARD = {
  trips_by_status: { IN_PROGRESS: 6, IN_TRANSIT: 3, DELIVERED: 12, COMPLETED: 41, CANCELLED: 2 },
  finance: { period: 'month', by_currency: [{ currency: 'UZS', revenue: 412000000, expense: 288000000, profit: 124000000 }] },
  resources: { drivers: 22, vehicles: 18, trailers: 16, cargo: 47 },
  rating: { overall: 4.5, as_shipper: 4.2, as_carrier: 4.7 },
  quota: QUOTA.items,
  alerts: { fleet_in_maintenance: 2, unpaid_by_currency: [{ currency: 'UZS', accrued: 96000000, paid: 74000000, remaining: 22000000 }] }
}

const CATALOG = { groups: [
  { key: 'cargo', label: 'Грузы', permissions: [
    { key: 'cargo.view', label: 'Просмотр грузов' }, { key: 'cargo.create', label: 'Создание груза' },
    { key: 'cargo.publish', label: 'Публикация груза' }, { key: 'cargo.delete', label: 'Удаление груза' }] },
  { key: 'trips', label: 'Рейсы', permissions: [
    { key: 'trips.view', label: 'Просмотр рейсов' }, { key: 'trips.assign_driver', label: 'Назначение водителя' },
    { key: 'trips.cancel', label: 'Отмена рейса' }] }
], all: [] }
CATALOG.all = CATALOG.groups.flatMap((g) => g.permissions)

const AUDIT = { entries: [
  { id: 'a-2', actor: { id: USER, type: 'company_user', user_id: USER }, action: 'update',
    entity_type: 'company', entity_id: CO_ID,
    old_data: { name: 'Sarbon Logistics MChJ', phone: '+998901112233', max_drivers: 20, status: 'pending' },
    new_data: { name: 'Sarbon Logistics International MChJ', phone: '+998901234567', max_drivers: 30, status: 'active' },
    created_at: '2026-07-21T10:02:00Z' },
  { id: 'a-1', actor: { id: USER, type: 'company_user', user_id: USER }, action: 'create',
    entity_type: 'user_company_role', entity_id: 'ucr-1001',
    old_data: null, new_data: { role: 'CargoManager', user_id: 'u-88' }, created_at: '2026-07-21T09:14:00Z' }
], total: 2, page: 1, limit: 20 }

const routes = (type) => [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...company(type), role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: null, email: 'owner@sarbon.me', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/quota/, () => env(QUOTA)],
  [/\/v1\/companies\/[^/]+\/dashboard/, () => env(DASHBOARD)],
  [/\/v1\/companies\/[^/]+\/audit/, () => env(AUDIT)],
  [/\/v1\/companies\/[^/]+\/roles\/[^/]+\/permissions/, () => env({ permissions: [] })],
  [/\/v1\/reference\/permissions/, () => env(CATALOG)],
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
        const r = body()
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

// ---- CARRIER: overview fullPage + roles save-confirm + audit drawer -------------------------
let ctx = await makeCtx(browser, 'CARRIER')
let page = await ctx.newPage()

await step('01f overview fullPage — CARRIER (fleet seat + quota tiles present)', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=overview`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '01f-company-overview-carrier-full.png', { fullPage: true })
})

await step('03c roles — toggle stays on "Разрешено" after a CONFIRMED save', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=roles`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const seg = page.locator('.ant-segmented').first()
  await seg.locator('.ant-segmented-item').nth(1).click({ timeout: 8000 })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Сохранить изменения/ }).first().click()
  await page.waitForTimeout(1200)
  // AntD 6 renders the confirm inside .ant-modal-container — the confirm button is the primary one.
  const confirm = page.locator('.ant-modal-confirm-btns button.ant-btn-primary, .ant-modal button.ant-btn-primary').last()
  await confirm.click({ timeout: 8000 })
  await page.waitForTimeout(2500)
  await shot(page, '03c-company-roles-persisted-after-save.png')
})

await step('05b audit — "было → стало" change drawer', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=audit`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: /Подробнее/ }).first().click({ timeout: 10000 })
  await page.waitForTimeout(1800)
  await shot(page, '05b-company-audit-change-drawer.png')
})

await ctx.close()

// ---- SHIPPER: overview fullPage ---------------------------------------------------------------
ctx = await makeCtx(browser, 'SHIPPER')
page = await ctx.newPage()
await step('06f overview fullPage — SHIPPER (fleet seat/quota tiles + maintenance alert gone)', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=overview`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '06f-company-overview-shipper-full.png', { fullPage: true })
})
await ctx.close()

// ---- Profile: "Мои компании" — the rating labels that used to render as raw keys ---------------
ctx = await makeCtx(browser, 'CARRIER')
page = await ctx.newPage()
await step('09b profile — "Мои компании": localized rating labels', async () => {
  await page.goto(`${BASE}/ru/company/profile`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.getByText('Мои компании', { exact: false }).first().click({ timeout: 8000 })
  await page.waitForTimeout(2500)
  await shot(page, '09b-company-profile-companies-ratings.png')
})
await ctx.close()

// ---- Create: 409 pinned to the INN field, framed on the field ---------------------------------
ctx = await makeCtx(browser, 'CARRIER', [
  [/\/v1\/companies$/, () => ({ __status: 409, __body: { status: 'error', code: 409, description: 'already_exists' } })]
])
page = await ctx.newPage()
await step('10c create — taken INN shown on the INN field (framed)', async () => {
  await page.goto(`${BASE}/ru/company/create`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.locator('#name').first().fill('Sarbon Test Logistics MChJ')
  await page.locator('#inn').first().fill('123456789')
  const phone = page.locator('.react-international-phone-input').first()
  if (await phone.count()) { await phone.click(); await phone.pressSequentially('901234567', { delay: 40 }) }
  const typeSel = page.locator('.ant-select').first()
  await typeSel.click()
  await page.waitForTimeout(500)
  await page.locator('.ant-select-item-option').first().click()
  await page.waitForTimeout(300)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(2500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
  await shot(page, '10c-company-create-inn-taken-field.png')
})
await ctx.close()

await browser.close()
console.log('\nDONE ->', OUT)
