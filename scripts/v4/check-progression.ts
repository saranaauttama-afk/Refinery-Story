import assert from 'node:assert/strict'
import { simulate } from './sim-run'
import { createNewGame } from '../../src/v4/sim/state'
import { invest } from '../../src/v4/sim/systems/investments'
import { eventSystem } from '../../src/v4/sim/systems/events'
import { newGamePlus } from '../../src/v4/sim/systems/progression'
import { place } from '../../src/v4/sim/systems/yard'
import { MONTH, YEAR } from '../../src/v4/data/balance'
for (const seed of [1, 2, 3]) {
  const r = simulate(seed)
  assert.ok(r.reached[5] >= 3 && r.reached[5] <= 5, `seed ${seed} rank5 ${r.reached[5]}`)
  assert.ok(r.reached[10] >= 13 && r.reached[10] <= 16, `seed ${seed} rank10 ${r.reached[10]}`)
  assert.ok(r.unlocksFirst40Weeks >= 5, `seed ${seed} unlocks`)
  assert.ok(r.maxNegativeMonths <= 6, `seed ${seed} softlock`)
  assert.ok(r.state.evaluation !== null)
  assert.equal(r.state.history.awards.length, 16)
  const ng = newGamePlus(r.state)
  assert.equal(ng.tick, 0)
  assert.equal(ng.rank, 1)
  assert.equal(ng.carriedBuildings.cdu, 1)
  const placed = place(ng, 'cdu', 0, 0)
  assert.equal(placed.money, ng.money)
  assert.equal(placed.carriedBuildings.cdu, 0)
  console.log(
    `M7 seed ${seed}: rank5 ${r.reached[5].toFixed(2)}y; rank10 ${r.reached[10].toFixed(2)}y; unlocks ${r.unlocksFirst40Weeks}; max debt ${r.maxNegativeMonths.toFixed(2)} months`,
  )
}
let s = { ...createNewGame(), money: 1e7, rank: 5 }
s = invest(s, 'port')
assert.equal(s.investments.port, 1)
assert.equal(s.money, 9920000)
s = invest(s, 'port')
assert.equal(s.investments.port, 2)
let market = { ...createNewGame(), tick: 2 * YEAR - MONTH }
market = eventSystem(market)
assert.equal(market.notices[0].kind, 'market')
assert.equal(market.market.phase, 'normal')
market = eventSystem({ ...market, tick: 2 * YEAR })
assert.equal(market.market.phase, 'boom')
assert.ok(market.market.nextChangeTick > market.tick)
assert.equal(invest(createNewGame(), 'port').investments.port, 0)
console.log('M7 ordered investment / warning / market / evaluation / NG+ passed')
