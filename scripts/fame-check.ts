import assert from 'node:assert/strict'

import { V3_AWARD_PERIOD_TICKS } from '../src/game/v3/awards'
import { V3_FAME_LEVELS } from '../src/game/v3/data'
import { getV3CrudeUnitPriceCents, getV3Fame } from '../src/game/v3/fame'
import { runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'
import { getV3StaffCap } from '../src/game/v3/workforce'
import { act, legalChapterTwo } from './v3-check-helpers'

const withReputation = (state: V3GameState, reputation: number): V3GameState => ({ ...state, world: { ...state.world, reputation } })

// ---- Levels are monotonic and derived only from reputation ----
for (let index = 1; index < V3_FAME_LEVELS.length; index++) {
  assert.ok(V3_FAME_LEVELS[index].threshold > V3_FAME_LEVELS[index - 1].threshold)
  assert.ok(V3_FAME_LEVELS[index].crudeDiscount >= V3_FAME_LEVELS[index - 1].crudeDiscount)
  assert.ok(V3_FAME_LEVELS[index].staffBonus >= V3_FAME_LEVELS[index - 1].staffBonus)
}
const base = createInitialV3GameState()
assert.equal(getV3Fame(base).level, 1)
assert.equal(getV3Fame(withReputation(base, 9)).level, 1)
assert.equal(getV3Fame(withReputation(base, 10)).level, 2)
assert.equal(getV3Fame(withReputation(base, 149)).level, 5)
assert.equal(getV3Fame(withReputation(base, 999)).level, 6)
assert.equal(getV3Fame(withReputation(base, 999)).next, null)
close(getV3Fame(withReputation(base, 20)).progress, 0.5)
function close(a: number, b: number) { assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`) }

// ---- Legal play earns fame from milestones (C2 path = tutorial 0 + 2 trials × 5) ----
const legal = legalChapterTwo()
assert.equal(legal.world.reputation, 5, 'Local trial +5 on the legal C2 path')
assert.equal(getV3Fame(legal).level, 1)

// ---- Crude discount is applied by the shared trade action ----
let rich = { ...withReputation(base, 60), world: { ...withReputation(base, 60).world, moneyCents: 100_000, crudeOil: 0 } }
assert.equal(getV3CrudeUnitPriceCents(rich), 940)
const bought = act(rich, { type: 'trade', direction: 'buy', product: 'crude', quantity: 10 })
assert.equal(rich.world.moneyCents - bought.world.moneyCents, 9_400)
assert.equal(bought.materialCostBasis.crudeCents - rich.materialCostBasis.crudeCents, 9_400, 'basis follows the discounted price')

// ---- Staff cap bonus is real in the hire validator ----
assert.equal(getV3StaffCap(withReputation(base, 30)) - getV3StaffCap(base), 1)
let crowd = { ...withReputation(base, 30), world: { ...withReputation(base, 30).world, moneyCents: 10_000_000 } }
for (let index = 0; index < getV3StaffCap(base); index++) {
  if (crowd.world.employees.length < getV3StaffCap(crowd)) crowd = act(crowd, { type: 'hire_employee', role: 'operator' })
}
assert.equal(crowd.world.employees.length, getV3StaffCap(base) + 1, 'fame slot usable')

// ---- Yearly awards add reputation by grade; nothing when grade is "-" ----
let award = { ...base, world: { ...base.world, tickCount: V3_AWARD_PERIOD_TICKS - 25 } }
award = { ...award, awards: { ...award.awards, current: { ...award.awards.current, qualifiedUnits: 60, qualifiedFamilies: ['gasoline'] } } }
award = { ...award, operatingLedger: { ...award.operatingLedger, lifetimeRecognizedProfitCents: 1_000 } }
award = runV3ProductionTick(award, 25).state
assert.equal(award.awards.history.at(-1)!.grade, 'S')
assert.equal(award.world.reputation, 5)
award = { ...award, world: { ...award.world, tickCount: 2 * V3_AWARD_PERIOD_TICKS - 25 } }
award = runV3ProductionTick(award, 25).state
assert.equal(award.awards.history.at(-1)!.grade, '-')
assert.equal(award.world.reputation, 5, 'a poor year costs nothing and gives nothing')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(award))).status, 'loaded', 'no new saved state: fame is derived')

console.log('PASS: V3-21a fame — derived levels, legal milestone gain, crude discount through trade, staff slot, yearly award reputation')
