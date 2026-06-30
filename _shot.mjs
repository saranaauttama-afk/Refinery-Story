import { chromium } from 'playwright'
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const out = '/tmp/claude-0/-home-user-Refinery-Story/da9040f6-c20e-555b-a464-3e3a4d92ea35/scratchpad'
const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 414, height: 896 } })
await page.goto('http://localhost:8099/game', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
try { await page.getByText('Skip', { exact: true }).click({ timeout: 3000 }) } catch {}
await page.waitForTimeout(700)
// place 3 buildings on distinct empty cells, closing any sheet between
const tiles = [[207,600],[150,630],[265,630]]
for (const [x,y] of tiles) {
  await page.mouse.click(x,y); await page.waitForTimeout(500)
  for (const name of ['Crude Tank','Distillation Unit','Product Tank','Laboratory']) {
    try { await page.getByText(name, { exact: true }).first().click({ timeout: 1000 }); break } catch {}
  }
  await page.waitForTimeout(400)
  try { await page.getByText('Close', { exact: true }).first().click({ timeout: 800 }) } catch {}
  await page.waitForTimeout(300)
}
// make sure nothing is open
try { await page.getByText('Close', { exact: true }).first().click({ timeout: 600 }) } catch {}
await page.waitForTimeout(500)
await page.screenshot({ path: out + '/factory_hidden_final.png' })
await browser.close()
