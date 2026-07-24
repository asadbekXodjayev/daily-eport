// Capture pass for the 24.07.2026 report — the four changes shipped today:
//   01    Admin → Рейсы: new Driver / Tractor / Last-online / Dispatcher columns (joined by id)
//   02/03 Company workspace: Cargo tab HIDDEN for a CARRIER company, SHOWN for a SHIPPER
//   04/05 Dispatcher → Мои грузы: share button now on every table row (+ the share menu open)
//   06    Dispatcher GPS: driver modal now shows phone + full tractor/trailer breakdown
// Seeded sessions + stubbed staging responses (same harness family as the qa-tester browser).
// Run: node take-24.mjs   (dev server on :5173, feature branch)
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
const env = (data) => ({ status: 'success', code: 200, description: '', data })

// Paged endpoints (fetchAllPages / useAdminFetchAll) walk pages until a short/empty one — return the
// full list on page 1 and empty afterwards so the walk terminates instead of looping to the cap.
const isFirstPage = (url) => {
  const q = new URL(url).searchParams
  if (q.get('page') && q.get('page') !== '1') return false
  if (q.get('offset') && q.get('offset') !== '0') return false
  return true
}
const firstPage = (url, items, total) =>
  env({ items: isFirstPage(url) ? items : [], total: total ?? items.length, page: 1, page_size: 100, limit: 100, offset: 0 })

const mount = async (browser, { routes, seed, viewport = { width: 1600, height: 1050 } }) => {
  const ctx = await browser.newContext({ viewport })
  await ctx.route('**/*', (route) => {
    const url = route.request().url()
    if (!url.startsWith(API)) return route.continue()
    const bare = url.split('?')[0]
    for (const [re, body] of routes) {
      if (re.test(bare)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body(url)) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env({ items: [], total: 0 })) })
  })
  await ctx.addInitScript(seed)
  return ctx
}

const browser = await chromium.launch()

// ---- 01  Admin → Trips: joined driver / tractor / last-online / dispatcher columns --------------
{
  const DRIVERS = [
    { id: 'drv-1', name: 'Sayat Nurlanov', phone: '+998941780618', last_online_at: '2026-07-24T13:30:00Z', power_plate_number: '01 A 777 AA', freelancer_id: 'disp-1' },
    { id: 'drv-2', name: 'Сардор Абдуллаев', phone: '+998901112233', last_online_at: '2026-07-24T09:05:00Z', power_plate_number: '10 B 214 CX', freelancer_id: 'disp-2' },
    { id: 'drv-3', name: 'Жамшид Рахимов', phone: '+998935557788', last_online_at: '2026-07-23T18:40:00Z', power_plate_number: '95 C 010 KA', freelancer_id: null }
  ]
  const DISPATCHERS = [
    { id: 'disp-1', name: 'Алишер Каримов', phone: '+998901234567' },
    { id: 'disp-2', name: 'Дилшод Юсупов', phone: '+998907654321' }
  ]
  const trip = (i, status, driver, dm, price, rd, rdisp) => ({
    id: `trip-${i}`, status, driver_id: driver, driver_manager_id: dm, cargo_id: `c-${i}`, offer_id: `o-${i}`, company_id: 'co-1',
    agreed_price: price, agreed_currency: 'UZS', rating_from_driver: rd, rating_from_dispatcher: rdisp,
    vehicle_snapshot: { power_plate_number: DRIVERS.find((d) => d.id === driver)?.power_plate_number ?? null },
    created_at: `2026-07-2${i}T09:00:00Z`, updated_at: `2026-07-24T14:0${i}:00Z`
  })
  const TRIPS = [
    trip(1, 'IN_TRANSIT', 'drv-1', 'disp-1', 15250000, null, null),
    trip(2, 'DELIVERED', 'drv-2', 'disp-2', 9800000, null, null),
    trip(3, 'COMPLETED', 'drv-3', null, 12400000, 5, 4.5),
    trip(4, 'IN_PROGRESS', 'drv-1', 'disp-1', 7300000, null, null)
  ]
  const routes = [
    [/\/v1\/admin\/trips\/[^/]+$/, () => env({ trip: TRIPS[0] })],
    [/\/v1\/admin\/trips/, (u) => firstPage(u, TRIPS, TRIPS.length)],
    [/\/v1\/admin\/drivers\/[^/]+$/, () => env({ driver: DRIVERS[0] })],
    [/\/v1\/admin\/drivers/, (u) => firstPage(u, DRIVERS, DRIVERS.length)],
    [/\/v1\/admin\/dispatchers/, (u) => firstPage(u, DISPATCHERS, DISPATCHERS.length)]
  ]
  const seed = () => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem('sarbon_admin_app_token', 'seeded-admin-token')
    localStorage.setItem('sarbon_admin_app_refresh_token', 'seeded-admin-refresh')
    localStorage.setItem('sarbon_admin_app_access_token_expiry', String(now + 3600))
    localStorage.setItem('sarbon_admin_app_refresh_token_expiry', String(now + 604800))
    localStorage.setItem('sarbon_admin_app_profile', JSON.stringify({ id: 'adm-1', login: 'creator', name: 'Администратор', status: 'active', type: 'creator' }))
    localStorage.setItem('sarbon_theme', 'light')
  }
  const ctx = await mount(browser, { routes, seed })
  const page = await ctx.newPage()
  await step('01 admin trips — driver/tractor/last-online/dispatcher columns', async () => {
    await page.goto(`${BASE}/ru/admin/trips`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3500)
    await shot(page, '01-admin-trips-driver-dispatcher-columns.png')
  })
  await ctx.close()
}

// ---- 02/03  Company workspace nav: Cargo hidden for CARRIER, shown for SHIPPER -------------------
{
  const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
  const USER = 'user-1'
  const co = (type) => ({
    id: CO_ID, name: type === 'CARRIER' ? 'Sarbon Transport MChJ (перевозчик)' : 'Sarbon Trade MChJ (грузовладелец)',
    type, company_type_canonical: type, status: 'active', inn: '123456789', phone: '+998901234567',
    owner_id: USER, created_at: '2026-06-02T09:00:00Z'
  })
  const seed = () => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem('sarbon_company_app_token', 'seeded-access-token')
    localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
    localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
    localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
    localStorage.setItem('sarbon_company_app_profile', JSON.stringify({ id: 'user-1', phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов' }))
    localStorage.setItem('sarbon_theme', 'light')
  }
  const routesFor = (type) => [
    [/\/v1\/auth\/companies/, () => env({ companies: [{ ...co(type), role: 'Owner', is_current: true }] })],
    [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: '+998901234567', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
    [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
    [/\/v1\/companies\/[^/]+\/cargo/, (u) => firstPage(u, [], 0)],
    [/\/v1\/companies\/[^/]+$/, () => env(co(type))]
  ]
  for (const [type, name] of [['CARRIER', '02-company-carrier-no-cargo-tab.png'], ['SHIPPER', '03-company-shipper-cargo-tab.png']]) {
    const ctx = await mount(browser, { routes: routesFor(type), seed })
    const page = await ctx.newPage()
    await step(`${name.slice(0, 2)} company ${type} — workspace nav`, async () => {
      await page.goto(`${BASE}/ru/company/${CO_ID}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(3500)
      await shot(page, name)
    })
    await ctx.close()
  }
}

// ---- 04/05  Dispatcher → My cargos: share button on every table row + the share menu ------------
{
  const cargoRow = (i, status) => ({
    id: `mc-${i}`, name: ['Металлопрокат холоднокатаный', 'Строительные материалы', 'Оборудование в ящиках', 'Текстильное сырьё'][i - 1],
    status, weight: 12 + i, volume: 60 + i, vehicles_amount: 2, vehicles_left: 1,
    trailer_plate_type: 'TENTED', power_plate_type: 'TRACTOR', shipment_type: 'FTL', created_by_id: 'disp-1',
    contact_name: 'Алишер Каримов', contact_phone: '+998901234567',
    cargo_type: { id: 'ct-1', code: 'METAL', name_uz: 'Metall', name_ru: 'Металлопрокат', name_en: 'Metal' },
    route_points: [
      { id: `mc-${i}-1`, type: 'LOAD', country_code: 'UZ', city_code: 'TAS', address: 'Ташкент, Сергели', lat: 41.31, lng: 69.24, point_order: 1, is_main_load: true },
      { id: `mc-${i}-2`, type: 'UNLOAD', country_code: 'UZ', city_code: 'SAM', address: 'Самарканд, терминал 2', lat: 39.63, lng: 66.97, point_order: 2, is_main_unload: true, date: '2026-08-10T08:00:00Z', date_local: '2026-08-10T13:00:00+05:00' }
    ],
    payment: { is_negotiable: false, price_request: false, total_amount: 1400 + i * 120, total_currency: 'USD', with_prepayment: false, without_prepayment: true },
    created_at: `2026-07-2${i}T09:00:00Z`, updated_at: `2026-07-24T10:0${i}:00Z`
  })
  const MINE = [cargoRow(1, 'SEARCHING_ALL'), cargoRow(2, 'SEARCHING_ALL'), cargoRow(3, 'SEARCHING_COMPANY'), cargoRow(4, 'SEARCHING_ALL')]
  const routes = [
    [/\/v1\/dispatchers\/profile/, () => env({ dispatcher: { id: 'disp-1', phone: '+998901234567', name: 'Алишер Каримов', role: 'CARGO_MANAGER' } })],
    [/\/v1\/dispatchers\/cargo\/mine/, (u) => firstPage(u, MINE, MINE.length)],
    [/\/v1\/reference\/cargo-types/, () => env({ items: [{ id: 'ct-1', code: 'METAL', names: { uz: 'Metall', ru: 'Металлопрокат', en: 'Metal' } }] })],
    [/\/v1\/reference\/cargo/, () => env({ shipment_type: [{ value: 'FTL', label: 'FTL' }], loading_type: [], unloading_type: [], total_payment_type: [{ value: 'BANK_TRANSFER', label: 'Банковский перевод' }] })],
    [/\/v1\/reference\/currencies\/hint/, () => env({ items: [{ code: 'USD', name: 'Доллар США' }] })],
    [/\/v1\/reference\/cities/, () => env({ items: [{ code: 'TAS', name: 'Ташкент', country_code: 'UZ' }, { code: 'SAM', name: 'Самарканд', country_code: 'UZ' }] })],
    [/\/v1\/driver\/transport-options/, () => env({ power_plate_types: [{ value: 'TRACTOR', label: 'Тягач' }], trailer_plate_types_by_power: { TRACTOR: [{ value: 'TENTED', label: 'Тентованный' }] } })]
  ]
  const seed = () => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem('sarbon_web_app_token', 'seeded-token')
    localStorage.setItem('sarbon_web_app_refresh_token', 'seeded-refresh')
    localStorage.setItem('sarbon_web_app_access_token_expiry', String(now + 3600))
    localStorage.setItem('sarbon_web_app_refresh_token_expiry', String(now + 604800))
    localStorage.setItem('sarbon:view', 'table')
    localStorage.setItem('sarbon_theme', 'light')
  }
  const ctx = await mount(browser, { routes, seed })
  const page = await ctx.newPage()
  await step('04 my cargos — table rows with the share button', async () => {
    // Dispatcher pages hold an open SSE stream, so the network never goes idle — wait on the DOM.
    await page.goto(`${BASE}/ru/my-cargos`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5500)
    await shot(page, '04-my-cargos-share-button.png')
  })
  await step('05 my cargos — share menu open', async () => {
    const shareBtn = page.getByRole('button', { name: /Поделиться|Share|улаш/i }).first()
    if (await shareBtn.count()) {
      await shareBtn.click({ timeout: 8000 })
      await page.waitForTimeout(1200)
      await shot(page, '05-my-cargos-share-menu.png')
    } else {
      console.log('    note: share button not located by aria-label — table shot already captured')
    }
  })
  await ctx.close()
}

// ---- 06  Dispatcher GPS: driver modal with phone + tractor/trailer breakdown --------------------
{
  const DRIVER = {
    id: 'drv-1', phone: '+998941780618', email: null, name: 'Sayat Nurlanov', driver_type: 'driver',
    work_status: 'busy', work_state: 'ON_TRIP', registration_status: 'completed', rating: 4.0,
    latitude: 41.3116, longitude: 69.2797, is_online: true, last_online_at: '2026-07-24T13:30:00Z',
    kyc_status: 'APPROVED', has_photo: false, freelancer_id: 'me',
    power_plate_type: 'TRACTOR', power_plate_number: '01 A 777 AA', power_vehicle_model: 'MAN TGX 18.480',
    power_owner_name: 'Sayat Nurlanov', power_tech_series: 'AAF', power_tech_number: '1234567',
    trailer_plate_type: 'TENTED', trailer_plate_number: '01 B 555 CC', trailer_model: 'Schmitz Cargobull',
    trailer_owner_name: 'Sayat Nurlanov', trailer_tech_series: 'AAG', trailer_tech_number: '7654321',
    created_at: '2026-06-01T09:00:00Z', updated_at: '2026-07-24T13:30:00Z'
  }
  const routes = [
    [/\/v1\/dispatchers\/profile/, () => env({ dispatcher: { id: 'me', phone: '+998900000000', name: 'Driver Manager', role: 'DRIVER_MANAGER' } })],
    [/\/v1\/dispatchers\/drivers\/all/, (u) => firstPage(u, [DRIVER], 1)],
    [/\/v1\/dispatchers\/drivers\/[^/]+$/, () => env({ driver: DRIVER })],
    [/\/v1\/dispatchers\/drivers$/, (u) => firstPage(u, [DRIVER], 1)],
    [/\/v1\/dispatchers\/trips/, (u) => firstPage(u, [], 0)],
    [/\/v1\/dispatchers\/cargo\/all/, (u) => firstPage(u, [], 0)],
    [/\/v1\/driver\/transport-options/, () => env({ power_plate_types: [{ value: 'TRACTOR', label: 'Тягач' }], trailer_plate_types_by_power: { TRACTOR: [{ value: 'TENTED', label: 'Тентованный' }] } })]
  ]
  const seed = () => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem('sarbon_web_app_token', 'seeded-token')
    localStorage.setItem('sarbon_web_app_refresh_token', 'seeded-refresh')
    localStorage.setItem('sarbon_web_app_access_token_expiry', String(now + 3600))
    localStorage.setItem('sarbon_web_app_refresh_token_expiry', String(now + 604800))
    localStorage.setItem('sarbon_theme', 'light')
  }
  const ctx = await mount(browser, { routes, seed })
  const page = await ctx.newPage()
  await step('06 gps — driver modal (phone + vehicle breakdown)', async () => {
    await page.goto(`${BASE}/ru/gps-tracking?detail=driver&id=drv-1`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(6500)
    const sidebar = page.getByText(/Sayat Nurlanov/).first()
    console.log('    driver sidebar visible:', await sidebar.count())
    await shot(page, '06-gps-driver-modal-phone-vehicle.png', { clip: { x: 0, y: 0, width: 720, height: 1050 } })
    await shot(page, '06b-gps-driver-modal-full.png')
  })
  await ctx.close()
}

await browser.close()
console.log('\nDONE ->', OUT)
