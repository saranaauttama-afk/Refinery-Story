import { chromium } from 'playwright'
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const out = '/tmp/claude-0/-home-user-Refinery-Story/da9040f6-c20e-555b-a464-3e3a4d92ea35/scratchpad'
const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 414, height: 896 } })
await page.goto('http://localhost:8099/game', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
// dismiss onboarding
try { await page.getByText('Skip', { exact: true }).click({ timeout: 3000 }) } catch {}
await page.waitForTimeout(800)
await page.screenshot({ path: out + '/factory_empty.png' })
// place a few cheap buildings to show plants spaced out
const tiles = [[207,560],[160,585],[255,585],[207,610],[160,635]]
for (const [x,y] of tiles) {
  await page.mouse.click(x,y)
  await page.waitForTimeout(600)
  // try clicking a cheap building in the picker
  for (const name of ['Crude Tank','Distillation Unit','Product Tank']) {
    try { await page.getByText(name, { exact: true }).first().click({ timeout: 1200 }); break } catch {}
  }
  await page.waitForTimeout(500)
}
await page.screenshot({ path: out + '/factory_plants.png' })
await browser.close()
