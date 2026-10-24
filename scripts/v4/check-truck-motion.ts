import assert from 'node:assert/strict'
import { SALES } from '../../src/v4/data/balance'
import { stepTicks } from '../../src/v4/sim/systems/customers'
import { truckPose } from '../../src/v4/render/truckApproach'

// Drive trucks along full routes (off-map approach + a short yard road) the way the sim does,
// sampling the drawn position 20 times per tick. Trucks must move without jumps and at a
// sensible speed: at most ~1 tile per tick (4 tiles/s at 1×) anywhere on the route.
const yardRoad = (gate: { x: number; y: number }) =>
  Array.from({ length: 5 }, (_, i) =>
    gate.x === 0 ? { x: gate.x + i, y: gate.y } : { x: gate.x, y: gate.y + i },
  )
let fastest = 0
for (const gate of [
  { x: 2, y: 0 },
  { x: 16, y: 0 },
  { x: 31, y: 0 },
  { x: 0, y: 2 },
  { x: 0, y: 22 },
])
  for (const out of [false, true]) {
    const lead = Array.from({ length: SALES.approachTiles }, (_, j) => {
      const o = j - SALES.approachTiles
      return gate.x === 0 ? { x: o, y: gate.y } : { x: gate.x, y: o }
    })
    let path = [...lead, ...yardRoad(gate)]
    if (out) path = [...path].reverse()
    let prev: { x: number; y: number } | null = null
    for (let step = 0; step < path.length - 1; step++) {
      const ticks = stepTicks(path, step)
      for (let k = 0; k <= ticks * 20; k++) {
        const p = truckPose(path, step, k / (ticks * 20), gate, out)
        if (prev) {
          const d = Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y)
          fastest = Math.max(fastest, d * 20)
          assert.ok(d * 20 <= 1.05, `gate ${JSON.stringify(gate)} out=${out}: ${d * 20} tiles/tick`)
        }
        prev = p
      }
    }
  }
// The approach is slower than before but not a crawl: a far gate still arrives within ~16 s at 1×.
const far = stepTicks(
  [
    ...Array.from({ length: SALES.approachTiles }, (_, j) => ({ x: 31, y: j - 6 })),
    { x: 31, y: 0 },
  ],
  0,
)
assert.ok(far * SALES.approachTiles <= 64)
console.log(
  `Truck motion: no jumps, fastest ${fastest.toFixed(2)} tiles/tick (${(fastest * 4).toFixed(1)} tiles/s at 1×) passed`,
)
