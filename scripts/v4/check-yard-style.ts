import { approachTile } from '../../src/v4/render/truckApproach'
import { SALES } from '../../src/v4/data/balance'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { yardDecor } from '../../src/v4/data/yardDecor'
import { buildingDef } from '../../src/v4/data/buildings'
import { roadMask, yardRoadCommands, signalPhase } from '../../src/v4/render/roads'
import { trafficPositions } from '../../src/v4/render/traffic'
import {
  coastalShoreY,
  environmentProps,
  sceneryPatches,
} from '../../src/v4/render/environmentLayout'
import { createNewGame } from '../../src/v4/sim/state'
import { place, move, demolish } from '../../src/v4/sim/systems/yard'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { fenceSections } from '../../src/v4/render/scenery'
const manifest = JSON.parse(fs.readFileSync('assets/v5/yard/manifest.json', 'utf8'))
let state = createNewGame()
for (const [i, d] of yardDecor.entries()) {
  const b = buildingDef(d.id),
    m = manifest[d.id]
  assert.deepEqual([b.w, b.h, b.rank], [1, 1, 1])
  assert.equal(b.category, 'deco')
  const png = fs.readFileSync(`assets/v5/yard/sprites/${m.file}`)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [m.width, m.height])
  assert.equal(m.scale, 0.5)
  const before = state.money
  state = place(state, d.id, i % 6, 5 + Math.floor(i / 6))
  assert.equal(state.money, before - b.cost)
}
assert.deepEqual(deserialize(serialize(state)), state)
const uid = state.yard.buildings[0].uid
state = move(state, uid, 10, 10)
assert.equal(state.yard.buildings.find(b => b.uid === uid)!.x, 10)
state = demolish(state, uid)
assert.ok(!state.yard.buildings.some(b => b.uid === uid))
const road = (x: number, y: number) => ({ x, y, defId: 'road' })
assert.equal(roadMask(5, 5, [road(5, 4), road(6, 5), road(5, 6), road(4, 5)]), 15)
assert.equal(roadMask(5, 5, [road(5, 4), road(5, 6)]), 5)
assert.equal(roadMask(5, 5, [road(6, 5), road(5, 6)]), 6)
assert.equal(roadMask(5, 5, [road(5, 4), road(6, 5), road(5, 6)]), 7)
assert.equal(roadMask(5, 5, [{ x: 4, y: 4, defId: 'loading' }]), 9)
for (let mask = 0; mask < 16; mask++)
  for (const c of yardRoadCommands(0, 0, mask)) {
    assert.equal(c.kind, 'rect')
    if (c.kind === 'rect') assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= 32 && c.y + c.h <= 32)
  }
assert.equal(signalPhase(0), 'horizontal')
assert.equal(signalPhase(9), 'vertical')
assert.equal(signalPhase(8.5), 'allRed')
for (let t = 0; t < 400; t += 0.05) {
  const a = trafficPositions(t),
    b = trafficPositions(t + 0.05)
  assert.equal(a.length, 4)
  a.forEach((p, i) => {
    assert.ok(p.x < 0 || p.x >= 32 || p.y < 0 || p.y >= 24, 'car entered yard')
    assert.ok(
      Math.hypot(p.x - b[i].x, p.y - b[i].y) <= 2.2 * 0.05 + 1e-7,
      'car respawned at visible road junction',
    )
    assert.ok(
      (p.y >= -3 && p.y <= -1) ||
        (p.y >= 25 && p.y <= 27) ||
        (p.x >= -3 && p.x <= -1) ||
        (p.x >= 33 && p.x <= 35),
      'car left road',
    )
  })
}
assert.equal(coastalShoreY(5), -8)
assert.equal(coastalShoreY(35), -8)
assert.ok(Math.abs(coastalShoreY(4.999) + 8) < 0.001)
assert.ok(!environmentProps.some(p => ['envFootbridge', 'envCulvert'].includes(p.id)))
assert.ok(!sceneryPatches.some(p => p.color === '#3D92B2'))
// The permanent roadside wall has a clear north/west truck opening.
const parcels = ['0,0', '1,0', '0,1', '1,1']
const closed = fenceSections(parcels, []),
  open = fenceSections(parcels, [
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ])
assert.equal(closed.length - open.length, 3)
console.log(
  'Yard style: 12 native decorations / save-place-move-remove / connecting road shapes / continuous lane traffic / coast joins / roadside wall gates passed',
)

for (const gate of [
  { x: 2, y: 0 },
  { x: 31, y: 0 },
  { x: 0, y: 2 },
  { x: 0, y: 22 },
])
  for (const out of [false, true]) {
    const north = gate.x !== 0
    const lead = Array.from({ length: SALES.approachTiles }, (_, j) =>
      north ? { x: gate.x, y: j - SALES.approachTiles } : { x: j - SALES.approachTiles, y: gate.y },
    )
    const visual = [...lead, gate].map(p => approachTile(p, gate, out))
    assert.ok(
      north ? visual[0].x < -8 : visual[0].y >= 32,
      'truck must appear/disappear outside world',
    )
    for (let i = 1; i < visual.length; i++)
      assert.ok(
        visual[i].x === visual[i - 1].x || visual[i].y === visual[i - 1].y,
        'truck cut diagonally across paving',
      )
    assert.deepEqual(visual.at(-1), gate)
  }
console.log(
  'Delivery truck visual approaches: off-world endpoints, legal lane turns and unchanged logical route passed',
)
