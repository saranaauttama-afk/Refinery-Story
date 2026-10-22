// Extract generated raster props; no replacement artwork is painted by this script.
import fs from 'node:fs'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { environmentSheets } from '../../src/v4/render/environmentCatalog'
const root = 'assets/v5/coast'
type Cut = { data: Buffer; w: number; h: number }
async function cells(file: string): Promise<Cut[]> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info,
    seen = new Uint8Array(W * H)
  const groups: { pixels: number[]; left: number; right: number; top: number; bottom: number }[][] =
    Array.from({ length: 9 }, () => [])
  for (let n = 0; n < W * H; n++) {
    if (seen[n] || data[n * 4 + 3] < 180) continue
    const pixels = [n]
    seen[n] = 1
    let left = W,
      right = 0,
      top = H,
      bottom = 0
    for (let j = 0; j < pixels.length; j++) {
      const p = pixels[j],
        x = p % W,
        y = Math.floor(p / W)
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy,
            q = yy * W + xx
          if (xx < 0 || xx >= W || yy < 0 || yy >= H || seen[q] || data[q * 4 + 3] < 180) continue
          seen[q] = 1
          pixels.push(q)
        }
    }
    if (pixels.length < 30) continue
    const col = Math.min(2, Math.floor((((left + right) / 2) * 3) / W)),
      row = Math.min(2, Math.floor((((top + bottom) / 2) * 3) / H))
    groups[row * 3 + col].push({ pixels, left, right, top, bottom })
  }
  return Promise.all(
    groups.map(async (items, index) => {
      const largest = Math.max(...items.map(i => i.pixels.length)),
        keep = items.filter(i => i.pixels.length >= Math.max(30, largest * 0.005))
      if (!keep.length) throw new Error(`Missing prop ${file}:${index}`)
      const left = Math.min(...keep.map(i => i.left)),
        right = Math.max(...keep.map(i => i.right)),
        top = Math.min(...keep.map(i => i.top)),
        bottom = Math.max(...keep.map(i => i.bottom))
      if (!left || !top || right >= W - 1 || bottom >= H - 1)
        throw new Error(`Clipped source prop ${file}:${index}`)
      const w = right - left + 1,
        h = bottom - top + 1,
        cropped = Buffer.alloc(w * h * 4)
      for (const item of keep)
        for (const p of item.pixels) {
          const x = (p % W) - left,
            y = Math.floor(p / W) - top,
            dest = (y * w + x) * 4
          data.copy(cropped, dest, p * 4, p * 4 + 3)
          cropped[dest + 3] = 255
        }
      return { data: cropped, w, h }
    }),
  )
}
async function main() {
  fs.mkdirSync(`${root}/sprites`, { recursive: true })
  const registry: Record<string, string[]> = {},
    manifest: Record<string, unknown> = {},
    hashes: Record<string, string> = {}
  for (const [sheet, defs] of Object.entries(environmentSheets)) {
    const source = `${root}/source/${sheet}.png`,
      cuts = await cells(source)
    hashes[`${sheet}.png`] = crypto
      .createHash('sha256')
      .update(fs.readFileSync(source))
      .digest('hex')
    for (const [index, d] of defs.entries()) {
      const cut = cuts[index],
        wind = d.id === 'envWindsock'
      const k = wind ? 80 / cut.h : d.artWidth / cut.w
      const w = Math.round(cut.w * k),
        h = Math.round(cut.h * k)
      let ax = (d.w * 64 + 16) / 2,
        width = ax * 2,
        height = Math.max(d.h * 64 + 8, h + 8),
        ay = height - 4,
        left = Math.round((width - w) / 2)
      if (wind) {
        let best = -1,
          pole = 0
        for (let x = 0; x < cut.w; x++) {
          let score = 0
          for (let y = Math.floor(cut.h * 0.3); y < cut.h * 0.93; y++) {
            const p = (y * cut.w + x) * 4
            if (cut.data[p + 3] && Math.max(cut.data[p], cut.data[p + 1], cut.data[p + 2]) < 155)
              score++
          }
          if (score > best) {
            best = score
            pole = x
          }
        }
        width = 128
        height = 88
        ax = 32
        ay = 84
        left = Math.round(ax - pole * k)
      }
      if (left < 0 || left + w > width) throw new Error(`Frame overhang ${d.id}`)
      const sprite = await sharp(cut.data, { raw: { width: cut.w, height: cut.h, channels: 4 } })
        .resize(w, h, { kernel: 'nearest' })
        .png({ palette: true, colours: 96, dither: 0 })
        .toBuffer()
      const file = `${d.id}_${d.level}.png`
      await sharp({ create: { width, height, channels: 4, background: '#00000000' } })
        .composite([{ input: sprite, left, top: ay - h }])
        .png({ palette: true, colours: 96, dither: 0 })
        .toFile(`${root}/sprites/${file}`)
      registry[d.id] ??= []
      registry[d.id].push(
        `${d.level}: {src: require('../../../${root}/sprites/${file}'),w:${width},h:${height},ax:${ax},ay:${ay},scale:0.5,smooth:false},`,
      )
      manifest[`${d.id}:${d.level}`] = {
        file,
        width,
        height,
        ax,
        ay,
        scale: 0.5,
        footprint: { w: d.w, h: d.h },
        sheet,
        index,
      }
    }
  }
  const source =
    [
      '// Generated by npm run art:coast from image_gen raster artwork.',
      "import type { SpriteImage, Tier } from './spriteImages'",
      'export const environmentSprites: Record<string, Partial<Record<Tier, SpriteImage>>> = {',
      ...Object.entries(registry).flatMap(([id, entries]) => [`${id}:{`, ...entries, '},']),
      '}',
    ].join('\n') + '\n'
  fs.writeFileSync('src/v4/render/environmentSprites.ts', source)
  fs.writeFileSync(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
  fs.writeFileSync(`${root}/source/SHA256.json`, JSON.stringify(hashes, null, 2) + '\n')
  console.log(
    `Coastal scenery: extracted ${Object.keys(manifest).length} native pixel sprites, including three aligned windsock frames`,
  )
}
main().catch(e => {
  console.error(e)
  process.exitCode = 1
})
