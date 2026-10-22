import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildings } from '../../src/v4/data/buildings'
const registry = fs.readFileSync('src/v4/render/pixelBuildings.ts', 'utf8')
assert.ok(fs.readFileSync('src/v4/render/spriteImages.ts', 'utf8').includes('...pixelBuildings'))
const manifest = JSON.parse(fs.readFileSync('assets/v5/pixel/manifest.json', 'utf8'))
for (const b of buildings) {
  const frames: string[] = [],
    pixels: string[] = []
  for (let level = 1; level <= 5; level++) {
    const m = manifest[`${b.id}:${level}`]
    assert.ok(
      m && registry.includes(`/buildings/${m.file}`),
      `${b.id}: missing generated L${level}`,
    )
    assert.equal(m.scale, 0.5)
    assert.deepEqual(m.footprint, { width: b.w * 64, height: b.h * 64 })
    const png = fs.readFileSync(`assets/v5/pixel/buildings/${m.file}`)
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [m.width, m.height])
    frames.push(JSON.stringify([m.width, m.height, m.ax, m.ay]))
    pixels.push(png.toString('base64'))
  }
  assert.equal(new Set(frames).size, 1, `${b.id}: upgrade changed frame or anchor`)
  if (b.category !== 'deco' && b.id !== 'road')
    assert.equal(new Set(pixels).size, 5, `${b.id}: missing upgrade pictures`)
}
for (const id of ['concrete', 'asphalt', 'quay', 'grass', 'soil', 'sea']) {
  const png = fs.readFileSync(`assets/v5/pixel/${id}.png`)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [64, 64])
}
assert.ok(manifest['gate_w:5'])
console.log(
  'Generated pixel artwork: all buildings, fixed level frames, 64 px art tiles, six ground textures and west gate passed',
)
