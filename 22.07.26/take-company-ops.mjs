// Company Operations pass for the 22.07.2026 report — the cargo create/edit surface seam, the paged
// cargo list, the board drill-through, the offers Driver column, and the Roles overlay now read back
// from the server. Seeded company session + stubbed staging responses (same harness the change was
// verified with: qa/verify-company-cargo-create.mjs).
// Run: node take-company-ops.mjs   (dev server on :5173)
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
const TOKEN = 'seeded-access-token'
const env = (data) => ({ status: 'success', code: 200, data })

const CO = {
  id: CO_ID, name: 'Sarbon Logistics International MChJ', type: 'CARRIER',
  company_type_canonical: 'CARRIER', status: 'active', inn: '123456789',
  phone: '+998901234567', owner_id: USER, max_cargo: 100, created_at: '2026-06-02T09:00:00Z'
}

const cargoRow = (i, status, name) => ({
  id: i === 1 ? CARGO_ID : `cargo-${i}`,
  name,
  status,
  weight: 12.5 + i,
  volume: 82,
  vehicles_amount: 1,
  trailer_plate_type: 'TENTED',
  power_plate_type: 'TRACTOR',
  shipment_type: 'FTL',
  adr_enabled: false,
  assigned_manager_id: i % 2 === 0 ? USER : null,
  cargo_type: { id: 'ct-1', code: 'METAL', name_uz: 'Metall', name_ru: 'Металлопрокат холоднокатаный', name_en: 'Metal' },
  route_points: [
    { id: `rp-${i}-1`, type: 'LOAD', country_code: 'UZ', city_code: 'TAS', address: 'Ташкент, Сергелийский район, склад 5',
      lat: 41.311081, lng: 69.240562, point_order: 1, is_main_load: true, is_main_unload: false, ready_enabled: true, timezone: 'Asia/Tashkent' },
    { id: `rp-${i}-2`, type: 'UNLOAD', country_code: 'UZ', city_code: 'SAM', address: 'Самарканд, терминал 2',
      lat: 39.627, lng: 66.975, point_order: 2, is_main_load: false, is_main_unload: true,
      date: '2026-08-10T08:00:00Z', date_local: '2026-08-10T13:00:00+05:00', timezone: 'Asia/Tashkent' }
  ],
  payment: { is_negotiable: false, price_request: false, total_amount: 1500 + i * 100, total_currency: 'USD', with_prepayment: false, without_prepayment: true }
})

const CARGOS = [
  cargoRow(1, 'SEARCHING_ALL', 'Металлопрокат холоднокатаный'),
  cargoRow(2, 'SEARCHING_COMPANY', 'Строительные материалы'),
  cargoRow(3, 'PENDING_MODERATION', 'Оборудование в ящиках'),
  cargoRow(4, 'IN_TRANSIT', 'Продукты глубокой заморозки'),
  cargoRow(5, 'COMPLETED', 'Текстильное сырьё')
]

// carrier.name is the nested shape the spec documents - the Driver column was empty for every row
// shaped this way until today's fix; price_text is deliberately sent for one row only, so the
// fallback formatting of the other is visible.
const OFFERS = {
  items: [
    { id: 'off-1', cargo_id: CARGO_ID, carrier: { id: 'drv-1', name: 'Сардор Абдуллаев' },
      price: 14500000, currency: 'UZS', price_text: '14 500 000 UZS', status: 'PENDING_COMPANY_APPROVAL',
      created_at: '2026-07-22T09:00:00Z', comment: 'Готов выехать завтра утром, машина в Ташкенте.',
      cargo_name: 'Металлопрокат холоднокатаный' },
    { id: 'off-2', cargo_id: 'cargo-2', carrier: { id: 'drv-2', name: 'Жамшид Рахимов' },
      price: 9800000, currency: 'UZS', status: 'PENDING_COMPANY_APPROVAL',
      created_at: '2026-07-22T11:20:00Z', cargo_name: 'Строительные материалы' }
  ],
  total: 2, page: 1, limit: 20
}

const BOARD = {
  company_id: CO_ID,
  columns: [
    { stage: 'SEARCH', count: 2, truncated: false, cards: [
      { unit_type: 'cargo', id: 'cargo-2', cargo_id: 'cargo-2', status: 'SEARCHING_COMPANY',
        route: { from: 'TAS', to: 'SAM' }, company_role: 'shipper', vehicles_left: 2,
        price: { amount: 15250000, currency: 'UZS' }, stage_since: '2026-07-21T08:00:00+05:00' }] },
    { stage: 'IN_PROGRESS', count: 1, truncated: false, cards: [
      { unit_type: 'trip', id: TRIP_ID, cargo_id: CARGO_ID, status: 'IN_TRANSIT',
        route: { from: 'TAS', to: 'SAM' }, driver: { id: 'drv-1', name: 'Сардор Абдуллаев' },
        company_role: 'carrier', price: { amount: 15250000, currency: 'UZS' },
        stage_since: '2026-07-20T08:00:00+05:00' }] },
    { stage: 'IN_TRANSIT', count: 0, truncated: false, cards: [] },
    { stage: 'DELIVERED', count: 0, truncated: false, cards: [] },
    { stage: 'COMPLETED', count: 3, truncated: false, cards: [] },
    { stage: 'CANCELLED', count: 0, truncated: false, cards: [] }
  ]
}

const TRIPS = [{
  id: TRIP_ID, cargo_id: CARGO_ID, offer_id: 'off-9', status: 'IN_TRANSIT',
  driver_id: 'drv-1', driver: { id: 'drv-1', name: 'Сардор Абдуллаев' },
  agreed_price: 15250000, agreed_currency: 'UZS', company_role: 'carrier',
  assigned_manager_id: USER, assigned_manager: { id: USER, name: 'Алишер Каримов' },
  cargo_type: { id: 'ct-1', code: 'METAL', name: 'Металлопрокат холоднокатаный' },
  created_at: '2026-07-20T09:00:00Z', updated_at: '2026-07-22T14:30:00Z'
}]

const ROLE_OVERLAY = { role: 'Director', permissions: [
  { permission_key: 'cargo.publish', allowed: true },
  { permission_key: 'cargo.delete', allowed: false }
] }

const CATALOG = { groups: [
  { key: 'cargo', label: 'Грузы', permissions: [
    { key: 'cargo.view', label: 'Просмотр грузов' }, { key: 'cargo.create', label: 'Создание груза' },
    { key: 'cargo.publish', label: 'Публикация груза' }, { key: 'cargo.delete', label: 'Удаление груза' }] }
], all: [] }
CATALOG.all = CATALOG.groups.flatMap((g) => g.permissions)

const ROUTES = [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...CO, role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/reference\/cargo-types/, () => env({ items: [{ id: 'ct-1', code: 'METAL', names: { uz: 'Metall', ru: 'Металлопрокат холоднокатаный', en: 'Metal' } }] })],
  [/\/v1\/reference\/cargo/, () => env({
    shipment_type: [{ value: 'FTL', label: 'FTL' }],
    loading_type: [{ value: 'TOP', label: 'Верхняя' }, { value: 'SIDE', label: 'Боковая' }],
    unloading_type: [{ value: 'REAR', label: 'Задняя' }],
    packaging_type: [{ value: 'PALLET', label: 'Паллеты' }],
    total_payment_type: [{ value: 'BANK_TRANSFER', label: 'Банковский перевод' }],
    prepayment_type: [{ value: 'BANK_TRANSFER', label: 'Банковский перевод' }],
    remaining_type: [{ value: 'ON_LOADING', label: 'При погрузке' }]
  })],
  [/\/v1\/reference\/currencies\/hint/, () => env({ items: [{ code: 'USD', name: 'Доллар США' }, { code: 'UZS', name: 'Узбекский сум' }] })],
  [/\/v1\/reference\/cities/, () => env({ items: [{ code: 'TAS', name: 'Ташкент', country_code: 'UZ' }, { code: 'SAM', name: 'Самарканд', country_code: 'UZ' }] })],
  [/\/v1\/reference\/timezones/, () => env({ items: [{ country_code: 'UZ', timezone: 'Asia/Tashkent' }] })],
  [/\/v1\/reference\/permissions/, () => env(CATALOG)],
  [/\/v1\/driver\/transport-options/, () => env({ trailer_plate_types_by_power: { TRACTOR: [{ value: 'TENTED', label: 'Тент' }] } })],
  [/\/api\/cargo\/[^/]+\/photos/, () => env({ items: [] })],
  [/\/v1\/companies\/[^/]+\/roles\/[^/]+\/permissions/, () => env(ROLE_OVERLAY)],
  [/\/v1\/companies\/[^/]+\/users/, () => env({ users: [{ id: USER, first_name: 'Алишер', last_name: 'Каримов', phone: '+998901234567', role: { id: null, name: 'Owner' }, assigned_by: null }], total: 1, page: 1, limit: 200 })],
  [/\/v1\/companies\/[^/]+\/board/, () => env(BOARD)],
  [/\/v1\/companies\/[^/]+\/trips\/[^/]+$/, () => env({ ...TRIPS[0], route_points: [], way_points: [] })],
  [/\/v1\/companies\/[^/]+\/trips/, () => env({ items: TRIPS, total: 1, limit: 20, offset: 0 })],
  [/\/v1\/companies\/[^/]+\/offers\/pending-approval/, () => env(OFFERS)],
  [/\/v1\/companies\/[^/]+\/cargo\/[^/]+\/offers/, () => env(OFFERS)],
  [/\/v1\/companies\/[^/]+\/cargo/, () => env({ items: CARGOS, total: 45, page: 1, limit: 20 })],
  [/\/v1\/companies\/[^/]+$/, () => env(CO)]
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1050 } })
await ctx.route('**/*', (route) => {
  const url = route.request().url()
  if (!url.startsWith(API)) return route.continue()
  const bare = url.split('?')[0]
  for (const [re, body] of ROUTES) {
    if (re.test(bare)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body()) })
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env({ items: [], total: 0 })) })
})
await ctx.addInitScript((token) => {
  const now = Math.floor(Date.now() / 1000)
  localStorage.setItem('sarbon_company_app_token', token)
  localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
  localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
  localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
  localStorage.setItem('sarbon_company_app_profile', JSON.stringify({ id: 'user-1', phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов' }))
  localStorage.setItem('sarbon_theme', 'light')
}, TOKEN)

const page = await ctx.newPage()
const listUrls = []
page.on('request', (r) => { if (/\/v1\/companies\/[^/]+\/cargo\?/.test(r.url())) listUrls.push(r.url()) })

await step('01 cargo tab — paged list, status facets, "Add cargo"', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=cargo`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  console.log('    list request:', listUrls[0]?.split('/cargo')[1] ?? '(none)')
  await shot(page, '01-company-cargo-list-paged.png')
})

await step('02 create drawer — wizard + the create-only visibility control', async () => {
  const btn = page.getByRole('button', { name: /Добавить груз|Новый груз|Создать груз/ }).first()
  await btn.click({ timeout: 12000 })
  await page.waitForTimeout(3500)
  await shot(page, '02-company-cargo-create-drawer.png')
  const vis = page.locator('.ant-drawer-body').getByText(/Кто видит|видимост|Все водители/i).first()
  if (await vis.count()) {
    await vis.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await shot(page, '03-company-cargo-visibility-control.png')
  } else {
    console.log('    note: visibility control not located by text - full drawer shot only')
  }
  await page.locator('.ant-drawer-close').first().click().catch(() => {})
  await page.waitForTimeout(800)
  const confirmLeave = page.getByRole('button', { name: /Да|Выйти|Покинуть/ }).last()
  if (await confirmLeave.count()) await confirmLeave.click().catch(() => {})
  await page.waitForTimeout(600)
})

await step('04 edit drawer — same wizard, no visibility control', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=cargo`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const edit = page.getByRole('button', { name: /Редактировать|Изменить/ }).first()
  if (await edit.count()) {
    await edit.click({ timeout: 12000 })
    await page.waitForTimeout(3500)
    await shot(page, '04-company-cargo-edit-drawer.png')
    const hasVis = await page.locator('.ant-drawer-body').getByText(/Кто видит|Все водители/i).count()
    console.log('    visibility control present on edit (must be 0):', hasVis)
    await page.locator('.ant-drawer-close').first().click().catch(() => {})
    await page.waitForTimeout(800)
    const confirmLeave = page.getByRole('button', { name: /Да|Выйти|Покинуть/ }).last()
    if (await confirmLeave.count()) await confirmLeave.click().catch(() => {})
  } else {
    console.log('    note: edit action not found on the card')
  }
})

await step('05 board tab — trip card is an activatable control', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=board`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '05-company-board.png')
})

await step('06 board → trip detail drill-through', async () => {
  const card = page.locator('[role="button"], button').filter({ hasText: /Сардор|TAS|Ташкент/ }).first()
  if (await card.count()) {
    await card.click({ timeout: 10000 })
    await page.waitForTimeout(3500)
    await shot(page, '06-company-board-trip-drilldown.png')
    console.log('    landed on:', page.url().split('?')[1])
  } else {
    console.log('    note: no board card matched')
  }
})

await step('07 offers tab — Driver column + consistent price formatting', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=offers`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '07-company-offers-driver-column.png')
})

await step('08 trips tab — headers on one line, role tag inside its column', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=trips`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '08-company-trips-table.png')
})

await step('09 roles tab — saved overlay read back from the server, survives a reload', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}?tab=roles`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await shot(page, '09-company-roles-server-overlay.png')
})

await ctx.close()
await browser.close()
console.log('\nDONE ->', OUT)
