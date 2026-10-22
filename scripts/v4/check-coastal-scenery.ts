import assert from 'node:assert/strict'
import fs from 'node:fs'
import { environmentSheets, environmentSizes } from '../../src/v4/render/environmentCatalog'
import {
  environmentProps,
  sceneryPatches,
  neighbourhoodPeople,
  naturalCoast,
  coastalShoreY,
  onPier,
} from '../../src/v4/render/environmentLayout'
import { artDefinition } from '../../src/v4/render/topdownArt'
import { groundCommands } from '../../src/v4/render/scenery'
import { overviewCamera } from '../../src/v4/render/camera'
const manifest = JSON.parse(fs.readFileSync('assets/v5/coast/manifest.json', 'utf8'))
const registry = fs.readFileSync('src/v4/render/environmentSprites.ts', 'utf8')
assert.equal(Object.keys(manifest).length, 36)
for (const d of Object.values(environmentSheets).flat()) {
  const m = manifest[`${d.id}:${d.level}`],
    png = fs.readFileSync(`assets/v5/coast/sprites/${m.file}`)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [m.width, m.height])
  assert.deepEqual(m.footprint, { w: d.w, h: d.h })
  assert.equal(m.scale, 0.5)
  assert.ok(registry.includes(m.file))
}
assert.deepEqual(
  [1, 2, 3].map(i => {
    const m = manifest[`envWindsock:${i}`]
    return [m.width, m.height, m.ax, m.ay]
  }),
  Array(3).fill([128, 88, 32, 84]),
)
const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
const yard = { x: 0, y: 0, w: 32, h: 24 }
const roads = [
  { x: -8, y: -3, w: 48, h: 2 },
  { x: -3, y: -4, w: 2, h: 36 },
  { x: 33, y: -4, w: 2, h: 36 },
  { x: -8, y: 25, w: 48, h: 2 },
]
for (const p of environmentProps) {
  const d = artDefinition(p.id),
    box = { ...p, w: d.w, h: d.h }
  assert.ok(!overlaps(box, yard), `${p.id}: overlaps future purchasable land`)
  assert.ok(!roads.some(r => overlaps(box, r)), `${p.id}: blocks the public road`)
  assert.ok(p.x >= -8 && p.x + d.w <= 40 && p.y >= -16 && p.y + d.h <= 32, `${p.id}: outside scene`)
  assert.ok(Number.isInteger(p.x * 64) && Number.isInteger(p.y * 64))
  assert.ok(d.w && d.h && (!p.id.startsWith('env') || environmentSizes[p.id]))
}
for (const patch of sceneryPatches) {
  assert.ok(!overlaps(patch, yard))
  assert.ok(!roads.some(r => overlaps(patch, r)), 'Scenery paving covers a public road')
}
for (let t = 0; t < 200; t += 0.7)
  for (const p of neighbourhoodPeople(t)) assert.ok(p.x < 0 || p.x >= 32 || p.y < 0 || p.y >= 24)
assert.ok(naturalCoast(-5, -8) && !naturalCoast(10, -8))
assert.ok(Math.abs(coastalShoreY(-6) - coastalShoreY(0)) > 0.1)
assert.ok(onPier(31, -9) && !onPier(20, -12))
const start = ['0,0', '1,0', '0,1', '1,1'],
  full = Array.from({ length: 12 }, (_, i) => `${i % 4},${Math.floor(i / 4)}`)
const exterior = (p: string[]) =>
  groundCommands(p, []).filter(
    c => c.kind === 'rect' && (c.x < 0 || c.y < 0 || c.x >= 1024 || c.y >= 768),
  )
assert.deepEqual(exterior(start), exterior(full), 'Scenery moved when land expanded')
const wide = overviewCamera({ w: 390, h: 475 }, full),
  land = overviewCamera({ w: 390, h: 475 }, full, 0, 1)
assert.ok(
  wide.zoom < land.zoom,
  'Scenery overview needs room around the yard; land mode stays close',
)
assert.ok(48 * 32 * wide.zoom <= 390)
console.log(
  `Coastal scene: 36 generated frames / ${environmentProps.length} placed props / clear roads and all future parcels / fixed world and ambient paths passed`,
)
