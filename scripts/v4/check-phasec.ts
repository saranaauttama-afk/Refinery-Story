import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { specialize, plantFactor } from '../../src/v4/sim/systems/plant'
import { lotStats } from '../../src/v4/sim/systems/blending'
import { advertise, adCost, demandFactor, cooled } from '../../src/v4/sim/systems/market'
import { eventSystem } from '../../src/v4/sim/systems/events'
import { SPEC, ADS, MONTH } from '../../src/v4/data/balance'
import type { GameState } from '../../src/v4/sim/types'

const base: GameState = { ...buildStarter(createNewGame(9)), money: 1e8, opened: true, rank: 5 }
const cdu = base.yard.buildings.find(b => b.defId === 'cdu')!
const blend = base.yard.buildings.find(b => b.defId === 'blend')!
const lv = (s: GameState, uid: string, level: number): GameState => ({
  ...s,
  yard: { ...s.yard, buildings: s.yard.buildings.map(b => (b.uid === uid ? { ...b, level } : b)) },
})

// Specialisation needs Lv3 and happens once.
assert.equal(specialize(base, cdu.uid, 'volume'), base)
let s = specialize(lv(base, cdu.uid, 3), cdu.uid, 'volume')
const v = s.yard.buildings.find(b => b.uid === cdu.uid)!
assert.equal(v.spec, 'volume')
assert.equal(specialize(s, cdu.uid, 'eco'), s, 'only once')
assert.equal(plantFactor(s, v), 1 + SPEC.volumeOutput)
// Quality plants raise lot purity.
const q = specialize(lv(base, blend.uid, 3), blend.uid, 'quality')
assert.equal(lotStats(q).purity, lotStats(base).purity + SPEC.qualityPurity)

// Ads reset demand and lift the price for a month.
let m = cooled(cooled(base, 'gasoline'), 'gasoline')
const before = demandFactor(m, 'gasoline')
const cost = adCost(m)
m = advertise(m, 'gasoline')
assert.equal(m.money, base.money - cost)
assert.ok(demandFactor(m, 'gasoline') > before)
assert.equal(demandFactor(m, 'gasoline'), ADS.boost)
assert.equal(advertise(m, 'gasoline'), m, 'one campaign at a time')
assert.equal(demandFactor({ ...m, tick: m.tick + MONTH + 1 }, 'gasoline'), 1)

// Every event explains itself in the log.
let e = { ...base, tick: 0 }
for (let i = 1; i <= 40; i++) e = eventSystem({ ...e, tick: (MONTH / 2) * i })
const lines = e.log.map(l => l.en)
assert.ok(lines.length >= 20)
assert.ok(
  lines.every(l => l.length > 12),
  'events log an outcome, not just a name',
)

console.log('M14 specialisation / ads / event outcomes passed')
