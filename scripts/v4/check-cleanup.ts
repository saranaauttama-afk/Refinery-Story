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
import { tick } from '../../src/v4/sim/tick'
import { starterLayout } from '../../src/v4/data/starter'
import { buildingDef } from '../../src/v4/data/buildings'
import { canBorrow, takeLoan } from '../../src/v4/sim/systems/loan'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { MONTH, LOAN } from '../../src/v4/data/balance'

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

// Reported softlock: blend placed but no product tank, cash ran out on crude and bills.
let slow = createNewGame()
for (const [id, x, y] of starterLayout.filter(([id]) => id !== 'tank')) slow = place(slow, id, x, y)
const before = slow.money
for (let i = 0; i < 4 * MONTH; i++) slow = tick(slow)
assert.equal(slow.money, before, 'no crude bought or bills paid before the chain is complete')
// An old save already in debt can borrow and finish the layout.
let broke = { ...slow, money: -4409 }
assert.ok(canBorrow(broke, buildingDef('tank').cost))
broke = takeLoan(broke)
assert.ok(!canBorrow(broke, 1e9), 'one loan at a time')
broke = place(broke, 'tank', 9, 3)
assert.ok(broke.yard.buildings.some(b => b.defId === 'tank'))
for (let i = 0; i < 2 * MONTH && broke.loan === LOAN.repay; i++) broke = tick(broke)
assert.ok(broke.loan < LOAN.repay && broke.opened, 'sales repay the loan and open the refinery')
// Older v4 saves without the new fields still load.
const legacy = JSON.parse(serialize(slow))
delete legacy.loan
delete legacy.opened
const loaded = deserialize(JSON.stringify(legacy))
assert.equal(loaded.loan, 0)
assert.equal(loaded.opened, false)

console.log(
  'M9 gate edge / guided layout / foreman / approach road / buyers / clearance / setup softlock / loan / legacy save passed',
)
