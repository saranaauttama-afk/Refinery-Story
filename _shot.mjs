import { chromium } from 'playwright'
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const out = '/tmp/claude-0/-home-user-Refinery-Story/da9040f6-c20e-555b-a464-3e3a4d92ea35/scratchpad'
const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 414, height: 896 } })
await page.goto('http://localhost:8099/game', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
try { await page.getByText('Skip', { exact: true }).click({ timeout: 3000 }) } catch {}
await page.waitForTimeout(600)
// go to Recruit tab
try { await page.getByText('Recruit', { exact: true }).click({ timeout: 2000 }) } catch {}
await page.waitForTimeout(1500)
// tap first candidate figure to select (top area)
for (const [x,y] of [[110,300],[207,300],[300,300]]) { await page.mouse.click(x,y); await page.waitForTimeout(400) }
await page.waitForTimeout(500)
await page.screenshot({ path: out + '/recruit_roletag.png' })
await browser.close()
