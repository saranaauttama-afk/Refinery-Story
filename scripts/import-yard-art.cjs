// Import a generated three-level atlas without resampling or altering its alpha.
// Usage: node scripts/import-yard-art.cjs name source.png widths (e.g. 192,256,288)
const sharp = require('sharp')
const fs = require('node:fs')
const path = require('node:path')
async function main() {
  const [name, source, sizes, cuts] = process.argv.slice(2)
  const widths = sizes.split(',').map(Number)
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const occupied = Array.from({ length: info.width }, (_, x) => {
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * 4 + 3] > 96) return true
    return false
  })
  const runs = []
  for (let x = 0; x < info.width;) {
    if (!occupied[x]) { x++; continue }
    const left = x
    while (x < info.width && occupied[x]) x++
    if (x - left > 30) runs.push({ left, width: x - left })
  }
  if (cuts) {
    const edges = [0, ...cuts.split(',').map(Number), info.width]
    runs.splice(0)
    for (let i = 0; i < 3; i++) {
      let left = edges[i], right = edges[i + 1] - 1
      while (!occupied[left] && left < right) left++
      while (!occupied[right] && right > left) right--
      runs.push({ left, width: right - left + 1 })
    }
  }
  if (runs.length !== 3) throw new Error(`${name}: expected 3 separated sprites, found ${runs.length}; specify reviewed cut columns`)
  const dir = path.join(__dirname, '../assets/plants/yard-v2')
  fs.mkdirSync(dir, { recursive: true })
  const anchors = []
  for (const [index, run] of runs.entries()) {
    let top = info.height, bottom = -1
    for (let y = 0; y < info.height; y++) for (let x = run.left; x < run.left + run.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 96) { top = Math.min(top, y); bottom = Math.max(bottom, y) }
    }
    let sum = 0, count = 0
    for (let y = Math.max(top, bottom - 2); y <= bottom; y++) for (let x = run.left; x < run.left + run.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 96) { sum += x - run.left + 0.5; count++ }
    }
    const anchor = sum / count / run.width
    const filename = `${name}_lv${index + 1}.png`
    await sharp(source).extract({ left: run.left, top, width: run.width, height: bottom - top + 1 })
      .resize({ width: widths[index], kernel: 'nearest' }).png().toFile(path.join(dir, filename))
    anchors.push(Number(anchor.toFixed(5)))
  }
  const manifestPath = path.join(dir, 'anchors.json')
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
  manifest[name] = anchors
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`${name}: 3 levels imported; ground anchors ${anchors.join(', ')}`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
