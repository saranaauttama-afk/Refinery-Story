import assert from 'node:assert/strict'

import {
  V3_MARKET_HOT_BONUS,
  V3_MARKET_SEASON_AMPLITUDE,
  getV3HotFamily,
  getV3MarketForecast,
  getV3MarketMultiplier,
  getV3MarketMultiplierAt,
} from '../src/game/v3/market'
import { addV3VariantInventory } from '../src/game/v3/productInventory'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import type { V3GameState, V3ProductFamily } from '../src/game/v3/types'
import { act } from './v3-check-helpers'

const FAMILIES: V3ProductFamily[] = ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets']
const atMonth = (state: V3GameState, monthIndex: number): V3GameState => ({ ...state, world: { ...state.world, tickCount: monthIndex * 300 } })

// ---- Deterministic, bounded, seasonal with a yearly hot product ----
for (const family of FAMILIES) {
  for (let month = 0; month < 60; month++) {
    const value = getV3MarketMultiplierAt(family, month)
    assert.equal(value, getV3MarketMultiplierAt(family, month), 'deterministic')
    assert.ok(value >= 1 - V3_MARKET_SEASON_AMPLITUDE - 1e-9 && value <= 1 + V3_MARKET_SEASON_AMPLITUDE + V3_MARKET_HOT_BONUS + 1e-9, `${family} m${month} bounded`)
  }
}
assert.equal(getV3MarketMultiplierAt('gasoline', 6), 1.2 + 0.1, 'gasoline peaks in July of year 1 (hot product year 1)')
assert.equal(getV3MarketMultiplierAt('gasoline', 12 + 0), 0.8, 'gasoline low in January of year 2 (not hot)')
assert.deepEqual([1, 2, 3, 4, 5, 6].map(getV3HotFamily), ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets', 'gasoline'])

// ---- Forecast is exactly the future months ----
const july = atMonth(createInitialV3GameState(), 6)
assert.deepEqual(getV3MarketForecast(july, 'jetFuel', 3), [6, 7, 8, 9].map((month) => getV3MarketMultiplierAt('jetFuel', month)))

// ---- Spot sale uses the market price; contract quotes do not ----
function sell(state: V3GameState): number {
  const stocked = addV3VariantInventory({ ...state, world: { ...state.world, moneyCents: 0 } }, V3_DEFAULT_BLUEPRINT_ID.gasoline, 10, 1_000).state
  return act(stocked, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: 10 }).world.moneyCents
}
const high = atMonth(createInitialV3GameState(), 6)
const low = atMonth(createInitialV3GameState(), 12)
assert.equal(sell(high), Math.round(10 * 1_800 * getV3MarketMultiplier(high, 'gasoline')))
assert.equal(sell(low), Math.round(10 * 1_800 * 0.8))
assert.ok(sell(high) > sell(low), 'timing matters')
let job: V3GameState = high
job = act(job, { type: 'accept_job', templateId: 'tutorial:gasoline' })
assert.equal(job.acceptedJob!.lockedUnitPriceCents, 1_800, 'contracts ignore the spot market')

console.log('PASS: V3-21b seasonal market — deterministic bounded seasons, yearly hot product, forecast, spot-only pricing')
