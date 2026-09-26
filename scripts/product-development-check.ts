import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { advanceV3Development } from '../src/game/v3/development'
import { addV3VariantInventory, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProcessProfile } from '../src/game/v3/types'

function developmentFixture(quantity = 30): V3GameState {
  let state = createInitialV3GameState()
  state = {
    ...state,
    world: {
      ...state.world,
      grid: state.world.grid.map((cell, index) => index === 0 ? 'laboratory' : cell),
    },
    campaignProgress: { ...state.campaignProgress, chapter: 1 },
  }
  return addV3VariantInventory(state, V3_DEFAULT_BLUEPRINT_ID.gasoline, quantity, quantity * 1_000).state
}

function start(state: V3GameState, profile: V3ProcessProfile, leadEmployeeId: string | null = null) {
  return reduceV3Action(state, {
    type: 'start_development',
    sequence: state.nextActionSequence,
    family: 'gasoline',
    profile,
    module: 'none',
    knowledgeRank: 0,
    leadEmployeeId,
    labBuildingId: 0,
  })
}

let state = developmentFixture()
let result = start(state, 'standard')
assert.equal(result.events[0].messageId, 'v3.development.duplicate_signature')
assert.equal(getV3ProductQuantity(result.state, 'gasoline'), 30)
assert.equal(result.state.world.moneyCents, 60_000)

state = developmentFixture()
result = start(state, 'volume')
assert.equal(result.events[0].messageId, 'v3.action.ok')
state = result.state
assert.equal(getV3ProductQuantity(state, 'gasoline'), 20)
assert.equal(state.world.moneyCents, 55_000)
assert.equal(state.operatingLedger.developmentExpenseCents, 5_000)
assert.equal(state.operatingLedger.lifetimeCashOutflowsCents, 5_000)
assert.equal(state.developmentProject?.quality, 35)
assert.equal(state.developmentProject?.remainingTicks, 100)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(state))).status, 'loaded')

state = advanceV3Development(state, 99)
assert.equal(state.developmentProject?.remainingTicks, 1)
state = advanceV3Development(state, 1)
assert.equal(state.developmentProject, null)
const volume = Object.values(state.productBlueprints).find((blueprint) => blueprint.profile === 'volume')!
assert.equal(volume.quality, 35)
assert.equal(volume.provenance, 'developed')
assert.equal(state.developmentHistory.length, 1)

result = start(state, 'volume')
assert.equal(result.events[0].messageId, 'v3.development.duplicate_signature')

state = developmentFixture()
const niranId = state.world.employees[0].id
result = start(state, 'precision', niranId)
state = result.state
assert.equal(state.employeeDuties[niranId].kind, 'development')
assert.equal(state.developmentProject?.quality, 55)
assert.equal(state.world.employees[0].xp, 0)
state = advanceV3Development(state, 100)
const precision = Object.values(state.productBlueprints).find((blueprint) => blueprint.profile === 'precision')!
assert.equal(precision.quality, 55)
assert.deepEqual(state.employeeDuties[niranId], { kind: 'line', buildingId: 4 })
assert.equal(state.world.employees[0].xp, 20)

result = reduceV3Action(state, {
  type: 'set_program', sequence: state.nextActionSequence, buildingId: 4, blueprintId: precision.id,
})
assert.equal(result.state.plantPrograms[4].blueprintId, precision.id)
assert.equal(result.state.plantPrograms[4].setupRemainingTicks, 25)
result = reduceV3Action(result.state, {
  type: 'set_blueprint_presentation', sequence: result.state.nextActionSequence,
  blueprintId: precision.id, name: 'Premium 55', archived: true,
})
assert.equal(result.state.productBlueprints[precision.id].name, 'Premium 55')
assert.equal(result.state.productBlueprints[precision.id].archived, true)
assert.equal(result.state.productBlueprints[precision.id].pinned, false)

state = developmentFixture()
result = start(state, 'precision', niranId)
const afterStartGas = getV3ProductQuantity(result.state, 'gasoline')
const afterStartMoney = result.state.world.moneyCents
result = reduceV3Action(result.state, { type: 'cancel_development', sequence: result.state.nextActionSequence })
assert.equal(result.state.developmentProject, null)
assert.deepEqual(result.state.employeeDuties[niranId], { kind: 'line', buildingId: 4 })
assert.equal(getV3ProductQuantity(result.state, 'gasoline'), afterStartGas)
assert.equal(result.state.world.moneyCents, afterStartMoney)
assert.equal(result.state.world.employees[0].xp, 0)

state = developmentFixture(20)
state = {
  ...state,
  stockPolicies: {
    [V3_DEFAULT_BLUEPRINT_ID.gasoline]: { keepQuantity: 20, autoSell: false, autoDispatch: false },
  },
}
result = start(state, 'volume')
assert.equal(result.events[0].messageId, 'v3.development.insufficient_samples')
assert.equal(getV3ProductQuantity(result.state, 'gasoline'), 20)
assert.equal(result.state.world.moneyCents, 60_000)

console.log('PASS: V3-07 quality, atomic sample/fee, duplicate guard, lead transfer/return, cancel, report, and presentation')
