// Fifth pass — two remaining company shots:
//   12b OTP guard on the EMAIL channel (warning + disabled form when the URL carries no identity).
//       NOTE: on the phone channel the same guard does NOT fire — ensurePlusPrefix('') returns '+',
//       which is truthy, so a phone-channel visit with no ?phone still renders a live code screen.
//       Captured as 12-company-otp-guarded.png and reported as an open finding, not as a fix.
//   13  company chat sidebar footer — the signed-in COMPANY user (was a "?" avatar + "You").
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
const step = async (name, fn) => {
  try { await fn(); console.log('  ok  ', name) } catch (e) { console.log('  FAIL', name, '::', e.message) }
}

const CO = {
  id: CO_ID, name: 'Sarbon Logistics International MChJ', type: 'CARRIER',
  company_type_canonical: 'CARRIER', status: 'active', inn: '123456789',
  phone: '+998901234567', owner_id: USER, created_at: '2026-06-02T09:00:00Z'
}

const ROUTES = [
  [/\/v1\/auth\/companies/, () => env({ companies: [{ ...CO, role: 'Owner', is_current: true }] })],
  [/\/v1\/company-users\/profile/, () => env({ user: { id: USER, phone: '+998901234567', email: 'owner@sarbon.me', first_name: 'Алишер', last_name: 'Каримов', role: 'OWNER', company_id: CO_ID } })],
  [/\/v1\/me\/permissions/, () => env({ company_id: CO_ID, role: 'Owner', permissions: [] })],
  [/\/v1\/companies\/[^/]+\/group/, () => env({ id: 'grp-1', company_id: CO_ID, chat_id: 'chat-1', name: 'Sarbon Logistics International MChJ', members_count: 4 })],
  [/\/v1\/companies\/[^/]+$/, () => env(CO)]
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
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

await step('12b OTP — email channel with no identity: warning + disabled form', async () => {
  await page.goto(`${BASE}/ru/company/otp?channel=email`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(OUT, '12b-company-otp-guard-email.png') })
})

await step('13 company chat — sidebar footer shows the company user', async () => {
  await page.goto(`${BASE}/ru/company/${CO_ID}/chat`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: path.join(OUT, '13-company-chat-self-footer.png') })
})

await ctx.close()
await browser.close()
console.log('DONE')
