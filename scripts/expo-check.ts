import assert from 'node:assert/strict'

import { V3_EXPO_MONTH, V3_EXPO_PRIZES, getV3ExpoScore, getV3RivalExpoScore } from '../src/game/v3/expo'
import { addV3VariantInventory, getV3RollingOperatingProfit } from '../src/game/v3/productInventory'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProductBlueprint } from '../src/game/v3/types'
import { act, assertBlocked } from './v3-check-helpers'

/** Labelled fixture: calendar month, fame and a developed recipe set directly. */
function fixture(month: number, reputation: number, quality: number, year = 1): { state: V3GameState; id: string } {
  const base = createInitialV3GameState()
  const id = `blueprint:fixture:gasoline:${quality}`
  const blueprint: V3ProductBlueprint = { ...base.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline], id, signature: id, revision: 9, quality, provenance: 'developed', name: `Fixture Q${quality}` }
  let state: V3GameState = {
    ...base,
    productBlueprints: { ...base.productBlueprints, [id]: blueprint },
    world: { ...base.world, reputation, tickCount: ((year - 1) * 12 + month - 1) * 300 + 10 },
  }
  state = addV3VariantInventory(state, id, 20, 2_000).state
  return { state, id }
}

// ---- Rivals rise each year and are deterministic ----
for (let index = 0; index < 4; index++) {
  assert.ok(getV3RivalExpoScore(index, 5) > getV3RivalExpoScore(index, 1))
  assert.equal(getV3RivalExpoScore(index, 3), getV3RivalExpoScore(index, 3))
}

// ---- Gates: month, fame, developed recipe, samples, once per year ----
let gate = fixture(V3_EXPO_MONTH - 1, 20, 70)
assertBlocked(gate.state, { type: 'enter_expo', blueprintId: gate.id }, 'v3.expo.not_expo_month')
gate = fixture(V3_EXPO_MONTH, 5, 70)
assertBlocked(gate.state, { type: 'enter_expo', blueprintId: gate.id }, 'v3.expo.fame_locked')
gate = fixture(V3_EXPO_MONTH, 20, 70)
assertBlocked(gate.state, { type: 'enter_expo', blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline }, 'v3.expo.invalid_recipe')
const noStock = { ...gate.state, variantInventory: {} }
assertBlocked(noStock, { type: 'enter_expo', blueprintId: gate.id }, 'v3.expo.insufficient_samples')

// ---- A flagship (Q80, fame Lv6) wins year 1; prize is a grant, samples are debited ----
// V3-18 calibration: rivals open at ~88–89, so ordinary recipes cannot win.
assert.ok(act(gate.state, { type: 'enter_expo', blueprintId: gate.id }).expoResults[0].rank > 1, 'Q70 at fame Lv2 loses')
const flagship = fixture(V3_EXPO_MONTH, 150, 80)
const before = flagship.state
const won = act(flagship.state, { type: 'enter_expo', blueprintId: flagship.id })
const entry = won.expoResults[0]
assert.equal(entry.rank, 1)
assert.equal(entry.score, getV3ExpoScore(before, 80))
assert.equal(won.world.moneyCents - before.world.moneyCents, V3_EXPO_PRIZES[0].cashCents)
assert.equal(won.world.reputation - before.world.reputation, V3_EXPO_PRIZES[0].reputation)
assert.equal(won.variantInventory[flagship.id].quantity, 10, '10 sample units consumed')
assert.ok(getV3RollingOperatingProfit({ ...won, world: { ...won.world, tickCount: 2_000 } }).cents <= 0, 'prize never counts as operating profit')
assertBlocked(won, { type: 'enter_expo', blueprintId: flagship.id }, 'v3.expo.already_entered')

// ---- A weak recipe late in the game ranks low but still earns participation fame ----
const late = fixture(V3_EXPO_MONTH, 20, 45, 6)
const lost = act(late.state, { type: 'enter_expo', blueprintId: late.id })
assert.equal(lost.expoResults[0].rank, 5)
assert.equal(lost.world.moneyCents, late.state.world.moneyCents)
assert.equal(lost.world.reputation - late.state.world.reputation, 1)

// ---- Next year's expo is a fresh entry; history round-trips ----
let next = { ...won, world: { ...won.world, tickCount: won.world.tickCount + 12 * 300 } }
next = act(next, { type: 'enter_expo', blueprintId: flagship.id })
assert.deepEqual(next.expoResults.map((result) => result.year), [1, 2])
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(next))).status, 'loaded')
const tampered = JSON.parse(JSON.stringify(next))
tampered.expoResults[1].year = 1
assert.equal(parseV3GameState(tampered).status, 'invalid', 'two entries in one year are rejected')

console.log('PASS: V3-21d expo — month/fame/recipe/sample gates, deterministic judging, grant prize, once per year, history')
