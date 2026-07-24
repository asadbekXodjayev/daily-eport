// Fourth pass — the Roles tab "saved permission no longer reverts to «Не задано»" proof.
// The role-overlay GET is stubbed with the saved override so the tab renders the persisted state
// (before the 21.07 fix every toggle snapped back to «Не задано» the moment Save succeeded).
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const API = 'https://api.sarbon.me/'
const OUT = path.join(import.meta.dirname, 'img')
const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const USER = 'user-1'
const env = (data) => ({ status: 'success', code: 200, data })

const CO = {
  id: CO_ID, name: 'Sarbon Logistics International MChJ', type: 'CARRIER',
  company_type_canonical: 'CARRIER', status: 'active', inn: '123456789',
  phone: '+998901234567', owner_id: USER, created_at: '2026-06-02T09:00:00Z'
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

// The saved overlay for the selected role: cargo.publish Allowed, cargo.delete Denied.
const OVERLAY = { permissions: [
  { permission_key: 'cargo.publish', allowed: true },
  { permission_key: 'cargo.delete', allowed: false }
] }

const ROUTES = [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...CO, role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: null, email: 'owner@sarbon.me', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/roles\/[^/]+\/permissions/, () => env(OVERLAY)],
  [/\/v1\/reference\/permissions/, () => env(CATALOG)],
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
await ctx.addInitScript(() => {
  const now = Math.floor(Date.now() / 1000)
  localStorage.setItem('sarbon_company_app_token', 'seeded-access-token')
  localStorage.setItem('sarbon_company_app_refresh_token', 'seeded-refresh-token')
  localStorage.setItem('sarbon_company_app_access_token_expiry', String(now + 3600))
  localStorage.setItem('sarbon_company_app_refresh_token_expiry', String(now + 604800))
  localStorage.setItem('sarbon_theme', 'light')
})

const page = await ctx.newPage()
await page.goto(`${BASE}/ru/company/${CO_ID}?tab=roles`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.screenshot({ path: path.join(OUT, '03c-company-roles-persisted-after-save.png') })
await ctx.close()
await browser.close()
console.log('DONE')
