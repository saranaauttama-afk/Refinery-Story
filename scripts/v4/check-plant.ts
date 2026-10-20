import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import {
  wearSystem,
  plantFactor,
  conditionOf,
  overhaul,
  overhaulCost,
  flowSummary,
} from '../../src/v4/sim/systems/plant'
import { buyProject, projectCost, landPrice } from '../../src/v4/sim/systems/projects'
import { salePrice } from '../../src/v4/sim/systems/customers'
import { levelUp } from '../../src/v4/sim/systems/staff'
import { economy } from '../../src/v4/sim/systems/economy'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { WEAR, MONTH, B, YARD, STAFF } from '../../src/v4/data/balance'
import type { GameState } from '../../src/v4/sim/types'

const base: GameState = { ...buildStarter(createNewGame(5)), money: 1e8, opened: true, rank: 10 }
const cdu = base.yard.buildings.find(b => b.defId === 'cdu')!
const gate = base.yard.buildings.find(b => b.defId === 'gate')!

// Plants wear monthly; gates and roads do not.
let s = wearSystem({ ...base, tick: MONTH + 1 })
const worn = s.yard.buildings.find(b => b.uid === cdu.uid)!
assert.equal(conditionOf(worn), 100 - WEAR.perMonth)
assert.equal(conditionOf(s.yard.buildings.find(b => b.uid === gate.uid)!), 100)
// Worn plants produce less.
const at = (c: number) => ({ ...cdu, condition: c })
assert.equal(plantFactor(s, at(80)), 1)
assert.equal(plantFactor(s, at(50)), WEAR.wornOutput)
assert.equal(plantFactor(s, at(10)), WEAR.brokenOutput)
// An engineer slows the wear.
const engineer = { ...s.staff[0], job: 'engineer' as const, assignedTo: cdu.uid, resting: false }
const helped = wearSystem({ ...base, staff: [engineer], tick: MONTH + 1 })
assert.ok(conditionOf(helped.yard.buildings.find(b => b.uid === cdu.uid)!) > 100 - WEAR.perMonth)
// Overhaul: pay, restore to 100, stop for a week.
const tired = {
  ...base,
  yard: { ...base.yard, buildings: base.yard.buildings.map(b => (b.uid === cdu.uid ? at(40) : b)) },
}
const fixed = overhaul(tired, cdu.uid)
assert.equal(fixed.money, tired.money - overhaulCost(at(40)))
const fixedCdu = fixed.yard.buildings.find(b => b.uid === cdu.uid)!
assert.equal(conditionOf(fixedCdu), 100)
assert.equal(plantFactor(fixed, fixedCdu), 0)
assert.equal(
  plantFactor({ ...fixed, tick: fixed.tick + WEAR.overhaulWeeks * B.ticksPerWeek }, fixedCdu),
  1,
)
assert.equal(overhaul(fixed, cdu.uid), fixed, 'no double overhaul')

// Projects: export raises prices and gets pricier each level.
const lot = { base: 'gasoline' as const, grade: 'B' as const }
const before = salePrice(base, lot)
const exp1 = buyProject(base, 'export')
assert.ok(salePrice(exp1, lot) > before)
assert.ok(projectCost(exp1, 'export') > projectCost(base, 'export'))
const low = { ...base, rank: 1 }
assert.equal(buyProject(low, 'export'), low, 'rank gate')

// Land gets pricier with each parcel.
const more = { ...base, yard: { ...base.yard, ownedParcels: [...base.yard.ownedParcels, '2,0'] } }
assert.equal(landPrice(base), YARD.landCost)
assert.equal(landPrice(more), Math.round(YARD.landCost * YARD.landGrowth))

// Staff level-ups cost more RD at higher levels.
const p = { ...base.staff[0], jobLevels: { ...base.staff[0].jobLevels, operator: 3 } }
const lv = levelUp({ ...base, rd: 10000, staff: [p] }, p.uid)
assert.equal(lv.rd, 10000 - STAFF.levelRDCost[3])

// Upkeep grows with building level.
const bill = (g: GameState) => g.money - economy({ ...g, tick: MONTH + 1 }).money
const up = {
  ...base,
  yard: {
    ...base.yard,
    buildings: base.yard.buildings.map(b => (b.uid === cdu.uid ? { ...b, level: 3 } : b)),
  },
}
assert.ok(bill(up) > bill(base))

// Flow overview names a bottleneck stage.
const flow = flowSummary(base)
assert.ok(flow.stages.some(st => st.id === flow.bottleneck))

// Old saves without condition load as brand-new plants.
const legacy = JSON.parse(serialize(s))
for (const b of legacy.yard.buildings) delete b.condition
delete legacy.projects
const loaded = deserialize(JSON.stringify(legacy))
assert.equal(conditionOf(loaded.yard.buildings.find(b => b.uid === cdu.uid)!), 100)
assert.deepEqual(loaded.projects, {})

console.log(
  'M13 wear / overhaul / export + research centre / land price / RD costs / upkeep / flow passed',
)
