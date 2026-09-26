import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { getV3GuidanceStep } from '../src/game/v3/campaign'
import { getV3EffectiveSpeed, V3_INITIAL_PAUSE_STATE, acquireV3Pause, releaseV3Pause, setV3Backgrounded, setV3SelectedSpeed } from '../src/game/v3/pause'
import { getV3ProductQuantity } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { getV3RecoveryOffer, isV3LoanerBuilding } from '../src/game/v3/recovery'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3Action, V3GameState } from '../src/game/v3/types'
import { SLOT, slotId } from './v3-check-helpers'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never

function act(state: V3GameState, action: WithoutSequence<V3Action>): V3GameState {
  return reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action).state
}

function cycles(state: V3GameState, count: number): V3GameState {
  for (let index = 0; index < count; index++) state = runV3ProductionTick(state, 25).state
  return state
}

let state = createInitialV3GameState()
assert.equal(getV3GuidanceStep(state), 'produce_tutorial_stock')
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
state = cycles(state, 4)
assert.ok(getV3ProductQuantity(state, 'gasoline') >= 20)
state = act(state, { type: 'accept_job', templateId: 'tutorial:gasoline' })
state = act(state, { type: 'dispatch_job', quantity: 20 })
assert.equal(state.campaignProgress.chapter, 1)
assert.ok(state.campaignProgress.claimedFlags.includes('chapter:1'))

state = act(state, { type: 'build', ...SLOT(0), building: 'laboratory' })
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 60 })
state = cycles(state, 2)
state = act(state, {
  type: 'start_development', family: 'gasoline', profile: 'volume', module: 'none',
  knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(state, 0),
})
state = cycles(state, 4)
const developed = Object.values(state.productBlueprints).find((blueprint) => blueprint.provenance === 'developed')
assert.ok(developed)
const defaultStock = Object.entries(state.variantInventory)
  .filter(([id]) => id !== developed!.id)
  .reduce((sum, [, entry]) => sum + entry.quantity, 0)
if (defaultStock > 0) state = act(state, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: Math.floor(defaultStock) })
state = act(state, { type: 'set_program', buildingId: slotId(state, 4), blueprintId: developed!.id })
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 60 })
state = cycles(state, 9)
assert.ok((state.variantInventory[developed!.id]?.quantity ?? 0) >= 40)
state = act(state, { type: 'accept_job', templateId: 'local:trial' })
state = act(state, { type: 'dispatch_job', quantity: 40 })
assert.equal(state.campaignProgress.chapter, 2)
assert.ok(state.campaignProgress.claimedFlags.includes('chapter:2'))
assert.equal(getV3GuidanceStep(state), 'chapter_two')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(state))).status, 'loaded')

let recovery = createInitialV3GameState()
recovery = {
  ...recovery,
  world: { ...recovery.world, moneyCents: 0, crudeOil: 0 },
  materialCostBasis: { ...recovery.materialCostBasis, crudeCents: 0 },
}
assert.equal(getV3RecoveryOffer(recovery).tollingAvailable, true)
recovery = act(recovery, { type: 'start_recovery' })
recovery = cycles(recovery, 2)
recovery = { ...recovery, world: { ...recovery.world, moneyCents: 2_000 } }
recovery = cycles(recovery, 2)
assert.equal(recovery.recoveryState?.status, 'completed')
assert.equal(recovery.recoveryState?.paidCents, 4_000)
assert.equal(recovery.world.moneyCents, 6_000)
assert.equal(recovery.operatingLedger.grantsCents, 4_000)

let loaners = createInitialV3GameState()
loaners = { ...loaners, world: { ...loaners.world, crudeOil: 0 }, materialCostBasis: { ...loaners.materialCostBasis, crudeCents: 0 } }
for (const buildingId of [3, 4, 5]) {
  loaners = act(loaners, { type: 'demolish', buildingId, expectedBuilding: getV3BuildingType(loaners, buildingId)! })
}
assert.equal(getV3RecoveryOffer(loaners).loanersAvailable, true)
loaners = act(loaners, { type: 'restore_starter_loaners' })
const loanerDistillation = loaners.world.grid.findIndex((cell, index) => cell === 'distillationUnit' && isV3LoanerBuilding(loaners, index))
assert.ok(loanerDistillation >= 0)
const beforeUpgrade = getV3BuildingLevel(loaners, loanerDistillation)
const upgrade = reduceV3Action(loaners, { type: 'upgrade', sequence: loaners.nextActionSequence, buildingId: loanerDistillation })
assert.equal(upgrade.events[0].messageId, 'v3.upgrade.unsupported')
assert.equal(getV3BuildingLevel(upgrade.state, loanerDistillation), beforeUpgrade)
const cashBeforeLoanerDemolition = loaners.world.moneyCents
loaners = act(upgrade.state, { type: 'demolish', buildingId: slotId(upgrade.state, loanerDistillation), expectedBuilding: 'distillationUnit' })
assert.equal(loaners.world.moneyCents, cashBeforeLoanerDemolition)

let pause = setV3SelectedSpeed(V3_INITIAL_PAUSE_STATE, 3)
pause = acquireV3Pause(pause, 'job-sheet')
pause = acquireV3Pause(pause, 'confirm-sheet')
assert.equal(getV3EffectiveSpeed(pause), 0)
pause = releaseV3Pause(pause, 'confirm-sheet')
assert.equal(getV3EffectiveSpeed(pause), 0)
pause = releaseV3Pause(pause, 'job-sheet')
assert.equal(getV3EffectiveSpeed(pause), 3)
pause = setV3Backgrounded(pause, true)
assert.equal(getV3EffectiveSpeed(pause), 0)
pause = setV3Backgrounded(pause, false)
assert.equal(getV3EffectiveSpeed(pause), 3)

console.log('PASS: V3-09 fresh C0-C2 path, deterministic recovery, loaners, reload, and nested pause ownership')
