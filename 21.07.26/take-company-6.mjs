// Sixth pass — the company chat sidebar footer identity (bug.md 21.07 11:04).
// The footer reads the COMPANY profile out of useCompanyAuthStore, which rehydrates from the
// COMPANY_PROFILE localStorage blob on boot, so that blob is what has to be seeded.
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs')
const { chromium } = require('playwright')

const OUT = path.join(import.meta.dirname, 'img')
const CO_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const env = (data) => ({ status: 'success', code: 200, data })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
await ctx.route('**/*', (route) => {
  const u = route.request().url()
  if (!u.startsWith('https://api.sarbon.me/')) return route.continue()
  const bare = u.split('?')[0]
  if (/\/v1\/companies\/[^/]+\/group/.test(bare)) {
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(env({ id: 'grp-1', company_id: CO_ID, chat_id: 'chat-1', name: 'Sarbon Logistics International MChJ', members_count: 4 }))
    })
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

const page = await ctx.newPage()
await page.goto(`http://localhost:5173/ru/company/${CO_ID}/chat`, { waitUntil: 'networkidle' })
await page.waitForTimeout(4500)
const footer = await page.evaluate(() => document.body.innerText.includes('Алишер Каримов'))
console.log('  footer shows the company user =', footer)
await page.screenshot({ path: path.join(OUT, '13-company-chat-self-footer.png') })
await browser.close()
console.log('DONE')
