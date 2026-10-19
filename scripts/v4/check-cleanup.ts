import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { canPlace, place } from '../../src/v4/sim/systems/yard'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { truckRoute, roadPath, sellTo } from '../../src/v4/sim/systems/customers'
import { tankCapacity } from '../../src/v4/sim/systems/blending'
import { customers } from '../../src/v4/data/customers'
import { bases } from '../../src/v4/data/bases'
import { hints } from '../../src/v4/data/onboarding'
import { SALES, BASE_PRICES } from '../../src/v4/data/balance'
import type { Lot } from '../../src/v4/sim/types'

// Gate must sit on the yard edge so trucks can drive in from outside.
const fresh = createNewGame()
assert.ok(canPlace(fresh, 'gate', 0, 4))
assert.ok(canPlace(fresh, 'gate', 4, 0))
assert.ok(!canPlace(fresh, 'gate', 4, 4))

// Every guided step places a building the player can afford, in order.
let guided = fresh
for (const step of hints)
  for (const p of step.place) {
    const before = guided.yard.buildings.length
    guided = place(guided, p.id, p.x, p.y)
    assert.equal(guided.yard.buildings.length, before + 1, `guided ${p.id}`)
  }
assert.ok(guided.money >= 0)

// The starting foreman walks to the first work building.
assert.equal(fresh.staff.length, 1)
assert.ok(guided.staff[0].assignedTo, 'foreman assigned')

// Trucks approach along a public road outside the yard.
const starter = buildStarter(createNewGame())
const route = truckRoute(starter)
assert.equal(route.length, roadPath(starter).length + SALES.approachTiles)
assert.ok(route[0].x < 0 || route[0].y < 0)

// Every product has at least one buyer group.
for (const b of bases)
  assert.ok(
    customers.some(c => c.base === b.id),
    `buyer for ${b.id}`,
  )

// Below-standard lots sell at a discount only when tanks are nearly full.
const lot = (uid: string): Lot => ({
  uid,
  base: 'gasoline',
  additive: null,
  grade: 'C',
  score: 50,
  stats: { purity: 10, yield: 10, stability: 10, eco: 10 },
  units: 300,
})
const roomy = { ...starter, tanks: [lot('c1')] }
assert.equal(sellTo(roomy, 'gas0').money, roomy.money)
const lots = Math.ceil((tankCapacity(starter) * SALES.clearanceFill) / 300)
const full = { ...starter, tanks: Array.from({ length: lots }, (_, i) => lot(`c${i}`)) }
const cleared = sellTo(full, 'gas0')
assert.equal(cleared.money, full.money + BASE_PRICES.gasoline * 0.8 * 300 * SALES.clearancePrice)
assert.equal(cleared.customers.gas0.hearts, 0)
assert.equal(cleared.fame, full.fame)

console.log('M9 gate edge / guided layout / foreman / approach road / buyers / clearance passed')
