// Captures dispatcher chat screenshots (video note + playback bar) for the 13.07.26 report.
// Run: node capture-13-chat.mjs  (dev server on :5173, staging API)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/Users/hp/.claude/skills/qa-tester/scripts/qa_browser.mjs');
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'img');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[capture]', ...a);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

// --- dispatcher login (password tab) ---
await page.goto('http://localhost:5173/ru/auth/login', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.react-international-phone-input', { timeout: 30000 });
const pwTab = page.locator('button[role="tab"]', { hasText: /парол|password|parol/i }).first();
if (await pwTab.count()) await pwTab.click();
await page.waitForTimeout(800);
const phone = page.locator('.react-international-phone-input');
await phone.click();
await page.keyboard.press('Control+a');
await phone.pressSequentially('998994878460', { delay: 40 });
await page.fill('input[autocomplete="current-password"]', 'Asadxad123');
await page.click('#login-submit');
await page.waitForURL((u) => !String(u).includes('/auth/login'), { timeout: 30000 });
log('dispatcher logged in, url =', page.url());

// --- chat: find a conversation containing a video note or voice message ---
await page.goto('http://localhost:5173/ru/chat', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await shot('06-chat-list');

// Open the first conversation whose preview says "Видеосообщение" (video note).
const videoConvPreview = page.locator('text=Видеосообщение').first();
await videoConvPreview.click();
await page.waitForTimeout(4000);
const videoNote = page.locator('video').first();
if (await videoNote.count()) {
  await videoNote.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000); // let the lazy IntersectionObserver loader fetch the clip
  await shot('07-chat-video-note');
  log('07 video note captured');
  await videoNote.click(); // play -> enlarge + top playback bar
  await page.waitForTimeout(3000);
  await shot('08-chat-video-note-playing');
  log('08 playing state captured');
} else {
  log('no <video> in thread; capturing thread as-is');
  await shot('07-chat-thread');
}

// Voice message conversation for the playback bar with rate control.
const voiceConvPreview = page.locator('text=Голосовое сообщение').first();
if (await voiceConvPreview.count()) {
  await voiceConvPreview.click();
  await page.waitForTimeout(3500);
  await shot('09-chat-voice-thread');
  log('09 voice thread captured');
}

await browser.close();
log('ALL DONE');
