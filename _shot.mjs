import { chromium } from 'playwright'
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch({ executablePath: exe })
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 }, hasTouch: true, isMobile: true })
const page = await ctx.newPage()
await page.goto('http://localhost:8099/game', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
try { await page.getByText('Skip', { exact: true }).click({ timeout: 3000 }) } catch {}
await page.waitForTimeout(700)
let opened = false
for (const [x,y] of [[207,560],[160,590],[255,590]]) {
  await page.touchscreen.tap(x,y); await page.waitForTimeout(500)
  if (await page.getByText('Build', { exact: true }).count() > 0) { opened = true; console.log('BUILD OPENED at', x, y); break }
}
if (!opened) console.log('BUILD NEVER OPENED')
await browser.close()
