// Third pass — the audit change drawer only (the "было → стало" field list that replaced the raw
// JSON.stringify dump). Isolated so nothing earlier in a run can interfere.
import { createRequire } from 'node:module'
import fs from 'node:fs'
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

const ROUTES = [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...CO, role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: null, email: 'owner@sarbon.me', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/audit/, () => env(AUDIT)],
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
await page.goto(`${BASE}/ru/company/${CO_ID}?tab=audit`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
const btns = page.locator('.ant-table-row button')
console.log('  row buttons =', await btns.count())
const labels = await btns.allTextContents()
console.log('  labels =', JSON.stringify(labels))
const detail = btns.filter({ hasText: /Подробнее|Детали|Detail/ }).first()
if (await detail.count()) {
  await detail.click()
} else {
  await btns.last().click()
}
await page.waitForTimeout(2000)
await page.screenshot({ path: path.join(OUT, '05b-company-audit-change-drawer.png') })
await ctx.close()
await browser.close()
console.log('DONE')
