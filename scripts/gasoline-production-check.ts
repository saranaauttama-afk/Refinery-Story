import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { addV3VariantInventory, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { evaluateV3GasolineProduction, runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProductBlueprint } from '../src/game/v3/types'

const close = (actual: number, expected: number, message?: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message ?? 'value'}: ${actual} != ${expected}`)

const createUnstaffedState = (): V3GameState => {
  const fresh = createInitialV3GameState()
  const operatorId = fresh.world.employees[0].id
  return { ...fresh, employeeDuties: { [operatorId]: { kind: 'reserve' as const } } }
}

let state = createUnstaffedState()
let preview = evaluateV3GasolineProduction(state, 25)
assert.equal(preview.length, 1)
close(preview[0].potentialOutputPerMinute, 60)
close(preview[0].actualOutputPerMinute, 60)

let result = runV3ProductionTick(state, 25)
state = result.state
close(state.world.crudeOil, 12)
close(getV3ProductQuantity(state, 'gasoline'), 5)
close(state.world.feedstock, 3)
close(state.world.waste, 0.5)
close(state.materialCostBasis.crudeCents, 12_000)
close(state.variantInventory[V3_DEFAULT_BLUEPRINT_ID.gasoline].totalCostBasisCents, 6_000 * 90 / 114)
close(state.materialCostBasis.feedstockCents, 6_000 * 24 / 114)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(state))).status, 'loaded')

const precision: V3ProductBlueprint = {
  ...state.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline],
  id: 'blueprint:gasoline:precision:1',
  signature: 'gasoline|precision|none|0|0',
  name: 'Precision Gasoline',
  quality: 55,
  profile: 'precision',
  provenance: 'developed',
  commissionedAtTick: 0,
}
state = createUnstaffedState()
state = {
  ...state,
  world: {
    ...state.world,
    crudeOil: 100,
    grid: state.world.grid.map((cell, index) => index === 0 ? 'distillationUnit' : cell),
  },
  materialCostBasis: { ...state.materialCostBasis, crudeCents: 100_000 },
  productBlueprints: { ...state.productBlueprints, [precision.id]: precision },
  plantPrograms: {
    ...state.plantPrograms,
    0: { buildingId: 0, blueprintId: precision.id, installedModule: 'none', setupRemainingTicks: 0, paused: false },
  },
}
preview = evaluateV3GasolineProduction(state, 25)
close(preview.find((line) => line.buildingId === 4)!.potentialOutputPerMinute, 60)
close(preview.find((line) => line.buildingId === 0)!.potentialOutputPerMinute, 48)
result = runV3ProductionTick(state, 25)
close(result.state.variantInventory[V3_DEFAULT_BLUEPRINT_ID.gasoline].quantity, 5)
close(result.state.variantInventory[precision.id].quantity, 4)
assert.equal(Object.keys(result.state.variantInventory).length, 2)

const scarce = {
  ...state,
  world: { ...state.world, crudeOil: 6 },
  materialCostBasis: { ...state.materialCostBasis, crudeCents: 6_000 },
  plantPrograms: {
    0: { ...state.plantPrograms[0], blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline },
    4: state.plantPrograms[4],
  },
}
preview = evaluateV3GasolineProduction(scarce, 25)
close(preview[0].actualWork, 0.5, 'equal cell 0 work')
close(preview[1].actualWork, 0.5, 'equal cell 4 work')

let nearlyFull = createUnstaffedState()
nearlyFull = addV3VariantInventory(nearlyFull, V3_DEFAULT_BLUEPRINT_ID.gasoline, 69, 69_000).state
preview = evaluateV3GasolineProduction(nearlyFull, 25)
close(preview[0].outputQuantity, 1)
result = runV3ProductionTick(nearlyFull, 25)
close(getV3ProductQuantity(result.state, 'gasoline'), 70)
close(result.state.world.crudeOil, 16.8)

const boosted = runV3ProductionTick(createUnstaffedState(), 25, 2)
close(boosted.state.world.crudeOil, 6)
close(getV3ProductQuantity(boosted.state, 'gasoline'), 10)

const fullFeedstock = {
  ...createUnstaffedState(),
  world: { ...createUnstaffedState().world, feedstock: 100 },
}
result = runV3ProductionTick(fullFeedstock, 25)
close(result.lines[0].discardedFeedstock, 3)
close(result.state.variantInventory[V3_DEFAULT_BLUEPRINT_ID.gasoline].totalCostBasisCents, 6_000)
close(result.state.materialCostBasis.feedstockCents, 0)

const setup = {
  ...createUnstaffedState(),
  plantPrograms: { 4: { ...createUnstaffedState().plantPrograms[4], setupRemainingTicks: 25 } },
}
result = runV3ProductionTick(setup, 10)
assert.equal(result.lines[0].status, 'setup')
assert.equal(result.state.plantPrograms[4].setupRemainingTicks, 15)
assert.equal(getV3ProductQuantity(result.state, 'gasoline'), 0)

let changed = reduceV3Action(state, {
  type: 'set_program', sequence: state.nextActionSequence, buildingId: 4, blueprintId: precision.id,
})
assert.equal(changed.events[0].messageId, 'v3.action.ok')
assert.equal(changed.state.plantPrograms[4].blueprintId, precision.id)
assert.equal(changed.state.plantPrograms[4].setupRemainingTicks, 25)
changed = reduceV3Action(changed.state, {
  type: 'set_pause', sequence: changed.state.nextActionSequence, buildingId: 4, paused: true,
})
assert.equal(changed.state.plantPrograms[4].paused, true)

const buildState = {
  ...createInitialV3GameState(),
  world: { ...createInitialV3GameState().world, moneyCents: 300_000 },
}
const built = reduceV3Action(buildState, {
  type: 'build', sequence: buildState.nextActionSequence, buildingId: 0, building: 'distillationUnit',
})
assert.equal(built.state.plantPrograms[0].blueprintId, V3_DEFAULT_BLUEPRINT_ID.gasoline)

console.log('PASS: V3-05 per-cell Gasoline rates, atomic resources, variant lots, costing, setup, and reload')
