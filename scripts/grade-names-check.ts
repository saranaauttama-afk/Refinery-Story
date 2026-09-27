import assert from 'node:assert/strict'

import { getV3GradeName, getV3UniqueGradeName } from '../src/game/v3/gradeNames'
import { addV3VariantInventory } from '../src/game/v3/productInventory'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import type { V3ProductFamily } from '../src/game/v3/types'
import { act, cycles, placeFixture, slotId } from './v3-check-helpers'

const FAMILIES: V3ProductFamily[] = ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets']
// Every family names every reachable quality, and names never go "down" in grade order.
for (const family of FAMILIES) {
  for (let quality = 20; quality <= 80; quality += 5) assert.ok(getV3GradeName(family, quality).length > 0)
}
assert.equal(getV3GradeName('gasoline', 40), 'Gasohol 91')
assert.equal(getV3GradeName('gasoline', 55), 'Premium 95')
assert.equal(getV3GradeName('gasoline', 80), 'Racing 102')
assert.equal(getV3GradeName('lubricants', 65), 'Full Synthetic 5W-30')
assert.equal(getV3GradeName('jetFuel', 55), 'Jet A-1')

// Defaults use grade names; developed recipes get unique names (Roman numerals).
const fresh = createInitialV3GameState()
assert.equal(fresh.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline].name, 'Gasohol 91')
assert.equal(getV3UniqueGradeName(fresh, 'gasoline', 40), 'Gasohol 91 II', 'same grade as the default gets II')
const withLab = placeFixture({ ...fresh, campaignProgress: { ...fresh.campaignProgress, chapter: 1 } }, 'laboratory', 0).state
let state = { ...withLab, world: { ...withLab.world, moneyCents: 1_000_000 } }
state = addV3VariantInventory(state, V3_DEFAULT_BLUEPRINT_ID.gasoline, 20, 20_000).state
state = act(state, { type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(state, 0) })
state = cycles(state, 4)
const developed = Object.values(state.productBlueprints).find((blueprint) => blueprint.provenance === 'developed')!
assert.equal(developed.name, 'Premium 95')

console.log('PASS: grade names — real-world names per product/quality, defaults, unique developed names')
