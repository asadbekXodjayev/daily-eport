// Live capture of the Email-OTP auth feature (Telegram default + new Email channel, WhatsApp
// commented out) across register / login / forgot. These are PUBLIC pages — no login needed.
// Run against a local dev server:
//   1) in sarbon-frontend-main: `pnpm dev`  (http://localhost:5173)
//   2) node daily-report/06.07.26/capture-auth-email-otp.mjs
import { chromium } from 'file:///C:/Users/hp/AppData/Roaming/npm/node_modules/playwright/index.mjs'
import { mkdirSync } from 'fs'
import { join } from 'path'

const BASE = 'http://localhost:5173'
const IMG_DIR = 'C:/Users/hp/Desktop/report/daily-report/06.07.26/img'
mkdirSync(IMG_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })

async function shot(page, name) {
  await page.screenshot({ path: join(IMG_DIR, name), fullPage: false })
  console.log('saved', name)
}
async function pickChannel(page, label) {
  await page.locator('.ant-segmented-item', { hasText: label }).first().click()
  await page.waitForTimeout(600)
}

// ---- Desktop 1280 ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // Register — Telegram (default)
  await page.goto(BASE + '/en/auth/register', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await shot(page, 'auth-register-telegram.png')

  // Register — Email selected (input adapts to email)
  await pickChannel(page, 'Email')
  await shot(page, 'auth-register-email.png')

  // Register — invalid email → localized error (no native browser tooltip)
  await page.locator('input[name="email"]').fill('not-an-email')
  await page.locator('input[name="email"]').blur()
  await page.waitForTimeout(600)
  await shot(page, 'auth-register-email-invalid.png')

  // Login — Confirmation code → Email
  await page.goto(BASE + '/en/auth/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  await pickChannel(page, 'Confirmation code')
  await shot(page, 'auth-login-telegram.png')
  await pickChannel(page, 'Email')
  await shot(page, 'auth-login-email.png')

  // Forgot password — Email
  await page.goto(BASE + '/en/auth/forgot', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1000)
  await pickChannel(page, 'Email')
  await shot(page, 'auth-forgot-email.png')

  await ctx.close()
}

// ---- Mobile 390 ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/en/auth/register', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await pickChannel(page, 'Email')
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log('mobile 390 horizontal overflow =', ov, ov <= 1 ? 'OK' : 'FAIL')
  await shot(page, 'auth-register-email-mobile.png')
  await ctx.close()
}

await browser.close()
console.log('Done')
