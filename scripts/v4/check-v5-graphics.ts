import assert from 'node:assert/strict'
import fs from 'node:fs'
import { yardDecor } from '../../src/v4/data/yardDecor'
import { buildings } from '../../src/v4/data/buildings'
import { GRAPHICS, spriteTemplate, scenicSizes } from '../../src/v4/render/graphics'
import { topdownArt, artDefinition } from '../../src/v4/render/topdownArt'
import { ownedTiles, parcelEdges } from '../../src/v4/render/parcelEdges'
import {
  playCamera,
  overviewCamera,
  zoomAt,
  validCamera,
  pinchAt,
} from '../../src/v4/render/camera'
import { groundCommands } from '../../src/v4/render/scenery'
const start = ['0,0', '1,0', '0,1', '1,1'],
  full = Array.from({ length: 12 }, (_, i) => `${i % 4},${Math.floor(i / 4)}`)
assert.equal(ownedTiles(start).size, 256)
assert.equal(ownedTiles(full).size, 768)
assert.equal(parcelEdges(start).length, 64)
assert.equal(parcelEdges(full).length, 112)
assert.equal(parcelEdges(start, [{ x: 2, y: 0 }]).length, 63)
assert.equal(parcelEdges(start, [{ x: 0, y: 2 }]).length, 62)
// An L-shaped acquisition removes the shared fence, retaining its exposed notch.
const irregular = [...start, '2,0']
assert.equal(parcelEdges(irregular).length, 80)
assert.ok(parcelEdges(irregular).some(e => e.x === 23 && e.y === 7 && e.side === 's'))
assert.ok(!parcelEdges(irregular).some(e => e.x === 15 && e.y < 8 && e.side === 'e'))
const v = { w: 390, h: 550 },
  play = playCamera(v, []),
  overview = overviewCamera(v, full)
assert.equal(play.zoom * 32, 48)
assert.ok(overview.zoom < 1)
assert.ok(32 * 32 * overview.zoom < v.w)
const wx = 123,
  wy = 89,
  px = v.w / 2 + play.x + wx * play.zoom,
  py = play.y + wy * play.zoom
const z = zoomAt(play, 2, px, py, v)
assert.ok(Math.abs((px - v.w / 2 - z.x) / z.zoom - wx) < 1e-8)
assert.ok(Math.abs((py - z.y) / z.zoom - wy) < 1e-8)
assert.ok(!validCamera({ x: NaN, y: 0, zoom: 1.5 }))
assert.ok(!validCamera({ x: 0, y: 0, zoom: 0.35 }))
assert.ok(validCamera(play))
const movingPinch = pinchAt(play, 2, { x: px, y: py }, { x: px + 17, y: py + 23 }, v)
assert.ok(Math.abs((px + 17 - v.w / 2 - movingPinch.x) / movingPinch.zoom - wx) < 1e-8)
assert.ok(Math.abs((py + 23 - movingPinch.y) / movingPinch.zoom - wy) < 1e-8)
const metadata = JSON.parse(fs.readFileSync('assets/v5/buildings/manifest.json', 'utf8'))
for (const d of buildings.filter(b => !yardDecor.some(d => d.id === b.id))) {
  const t = spriteTemplate(d.id, d.w, d.h),
    seen = []
  for (let level = 1; level <= 5; level++) {
    const m = metadata[`${d.id}:${level}`]
    assert.ok(m, `${d.id}: missing L${level}`)
    assert.deepEqual(m.footprint, t.footprint)
    assert.deepEqual([m.width, m.height, m.ax, m.ay], [t.width, t.height, t.ax, t.ay])
    const png = fs.readFileSync(`assets/v5/buildings/${m.file}`)
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [t.width, t.height])
    const art = topdownArt(d.id, level)
    assert.ok(art.length > 3)
    for (const c of art) {
      const points =
        c.kind === 'polygon'
          ? c.points
          : c.kind === 'circle'
            ? [
                [c.x - c.r, c.y - c.r],
                [c.x + c.r, c.y + c.r],
              ]
            : [
                [c.x, c.y],
                [c.x + c.w, c.y + c.h],
              ]
      if (c.kind === 'rect' || c.kind === 'ellipse')
        assert.ok(c.w > 0 && c.h > 0, `${d.id}: negative geometry`)
      for (const [x, y] of points) {
        assert.ok(Number.isInteger(x) && Number.isInteger(y), `${d.id}: fractional art pixel`)
        assert.ok(
          x + t.ax >= 0 && x + t.ax <= t.width && y + t.ay >= 0 && y + t.ay <= t.height,
          `${d.id}: clipped L${level} at ${x},${y}`,
        )
      }
    }
    seen.push(JSON.stringify(art))
  }
  if (d.id !== 'road') assert.equal(new Set(seen).size, 5, `${d.id}: each level must differ`)
}
for (const id of Object.keys(scenicSizes)) {
  const d = artDefinition(id),
    t = spriteTemplate(id, d.w, d.h),
    m = metadata[`${id}:1`]
  assert.ok(m, `${id}: missing scenic image`)
  assert.deepEqual([m.width, m.height, m.ax, m.ay], [t.width, t.height, t.ax, t.ay])
  for (const c of topdownArt(id, 1)) {
    const pts =
      c.kind === 'polygon'
        ? c.points
        : c.kind === 'circle'
          ? [
              [c.x - c.r, c.y - c.r],
              [c.x + c.r, c.y + c.r],
            ]
          : [
              [c.x, c.y],
              [c.x + c.w, c.y + c.h],
            ]
    for (const [x, y] of pts)
      assert.ok(
        x + t.ax >= 0 && x + t.ax <= t.width && y + t.ay >= 0 && y + t.ay <= t.height,
        `${id}: clipped prop`,
      )
  }
}
assert.equal(Object.keys(metadata).length, 153)
assert.notDeepEqual(topdownArt('gate', 1), topdownArt('gate', 1, true))
// Ownership changes paint only yard surfaces, never move the fixed external scene.
const before = groundCommands(start, []).filter(c => c.kind === 'rect' && (c.x < 0 || c.y < 0))
const after = groundCommands(full, []).filter(c => c.kind === 'rect' && (c.x < 0 || c.y < 0))
assert.deepEqual(before, after)
assert.deepEqual(GRAPHICS.world, { x: -256, y: -512, width: 1536, height: 1536 })
console.log(
  'V5 graphics: 153 native PNGs / fixed L1–L5 frames / pixel bounds / gate orientations / camera focal point / irregular parcel fences / stable scenery passed',
)
