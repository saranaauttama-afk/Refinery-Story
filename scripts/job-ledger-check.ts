import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { runV3AutoDispatch } from '../src/game/v3/jobs'
import { runV3ProductionTick } from '../src/game/v3/production'
import { addV3VariantInventory } from '../src/game/v3/productInventory'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProductBlueprint } from '../src/game/v3/types'

function stocked(quantity: number, chapter: 0 | 1 = 0): V3GameState {
  let state = createInitialV3GameState()
  state = { ...state, campaignProgress: { ...state.campaignProgress, chapter } }
  return addV3VariantInventory(state, V3_DEFAULT_BLUEPRINT_ID.gasoline, quantity, quantity * 100).state
}

function accept(state: V3GameState, templateId: string) {
  return reduceV3Action(state, { type: 'accept_job', sequence: state.nextActionSequence, templateId }).state
}

let whole = accept(stocked(20), 'tutorial:gasoline')
let result = reduceV3Action(whole, { type: 'dispatch_job', sequence: whole.nextActionSequence, quantity: 20 })
whole = result.state
assert.equal(whole.acceptedJob, null)
assert.equal(whole.world.moneyCents, 60_000 + 56_000)
assert.equal(whole.world.researchPoints, 10)
assert.equal(whole.jobReceipts.receipts.length, 1)
assert.equal(whole.jobReceipts.receipts[0].paidCents, 56_000)
assert.equal(whole.operatingLedger.lifetimeReceiptsCents, 56_000)
assert.equal(whole.operatingLedger.lifetimeCogsCents, 2_000)

let split = accept(stocked(20), 'tutorial:gasoline')
for (let index = 0; index < 20; index++) {
  split = reduceV3Action(split, { type: 'dispatch_job', sequence: split.nextActionSequence, quantity: 1 }).state
}
assert.equal(split.world.moneyCents, whole.world.moneyCents, 'split payout must equal whole payout')
assert.equal(split.jobReceipts.receipts[0].paidCents, whole.jobReceipts.receipts[0].paidCents)

const afterCompletion = split
result = reduceV3Action(afterCompletion, { type: 'dispatch_job', sequence: afterCompletion.nextActionSequence, quantity: 1 })
assert.equal(result.events[0].messageId, 'v3.job.no_active_job')
assert.equal(result.state.world.moneyCents, afterCompletion.world.moneyCents)

let partial = accept(stocked(20), 'tutorial:gasoline')
partial = reduceV3Action(partial, { type: 'dispatch_job', sequence: partial.nextActionSequence, quantity: 5 }).state
const paidBeforeCancel = partial.world.moneyCents
partial = reduceV3Action(partial, { type: 'cancel_job', sequence: partial.nextActionSequence }).state
assert.equal(partial.world.moneyCents, paidBeforeCancel)
assert.equal(partial.jobReceipts.receipts[0].status, 'cancelled')
assert.equal(partial.jobReceipts.receipts[0].deliveredQuantity, 5)
result = reduceV3Action(partial, { type: 'accept_job', sequence: partial.nextActionSequence, templateId: 'tutorial:gasoline' })
assert.equal(result.events[0].messageId, 'v3.job.cooldown')

let protectedState = accept(stocked(40, 1), 'local:trial')
result = reduceV3Action(protectedState, {
  type: 'trade', sequence: protectedState.nextActionSequence, direction: 'sell', product: 'gasoline', quantity: 1,
})
assert.equal(result.events[0].messageId, 'v3.trade.insufficient_stock')

let lowQuality = stocked(35, 1)
const q30: V3ProductBlueprint = {
  ...lowQuality.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline],
  id: 'blueprint:gasoline:test-q30', signature: 'gasoline|test-q30', revision: 2,
  name: 'Test Q30', quality: 30, profile: 'volume', provenance: 'developed', commissionedAtTick: 0,
}
lowQuality = {
  ...lowQuality,
  productBlueprints: { ...lowQuality.productBlueprints, [q30.id]: q30 },
  variantInventory: {},
}
lowQuality = addV3VariantInventory(lowQuality, q30.id, 35, 3_500).state
lowQuality = accept(lowQuality, 'performance:trial')
result = reduceV3Action(lowQuality, { type: 'dispatch_job', sequence: lowQuality.nextActionSequence, quantity: 1 })
assert.equal(result.events[0].messageId, 'v3.job.insufficient_qualified_stock')

let auto = accept(stocked(40, 1), 'local:trial')
auto = {
  ...auto,
  stockPolicies: {
    [V3_DEFAULT_BLUEPRINT_ID.gasoline]: { keepQuantity: 0, autoSell: false, autoDispatch: true },
  },
}
auto = runV3AutoDispatch(auto)
assert.equal(auto.acceptedJob, null)
assert.equal(auto.jobReceipts.receipts[0].paidCents, 87_120)
assert.equal(auto.world.researchPoints, 5)
assert.equal(auto.world.reputation, 5)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(auto))).status, 'loaded')

let contributionFixture = createInitialV3GameState()
contributionFixture = {
  ...contributionFixture,
  world: { ...contributionFixture.world, crudeOil: 60 },
  materialCostBasis: { ...contributionFixture.materialCostBasis, crudeCents: 60_000 },
}
let contributed = accept(contributionFixture, 'tutorial:gasoline')
const contributorId = contributed.world.employees[0].id
for (let cycle = 0; cycle < 4; cycle++) contributed = runV3ProductionTick(contributed, 25).state
assert.ok((contributed.acceptedJob?.contributorWork[contributorId] ?? 0) > 0)
const xpBeforeCompletion = contributed.world.employees[0].xp
contributed = reduceV3Action(contributed, {
  type: 'dispatch_job', sequence: contributed.nextActionSequence, quantity: 20,
}).state
assert.equal(contributed.world.employees[0].xp, xpBeforeCompletion + 5)

let selected = stocked(20, 1)
const developedQ55: V3ProductBlueprint = {
  ...selected.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline],
  id: 'blueprint:gasoline:developed-q55', signature: 'gasoline|precision|none|0|0', revision: 2,
  name: 'Developed Q55', quality: 55, profile: 'precision', provenance: 'developed', commissionedAtTick: 0,
}
selected = {
  ...selected,
  productBlueprints: { ...selected.productBlueprints, [developedQ55.id]: developedQ55 },
}
selected = addV3VariantInventory(selected, developedQ55.id, 40, 8_000).state
selected = accept(selected, 'local:trial')
selected = reduceV3Action(selected, {
  type: 'dispatch_job', sequence: selected.nextActionSequence, quantity: 40, blueprintId: developedQ55.id,
}).state
assert.equal(selected.campaignProgress.chapter, 2, 'explicit blueprint dispatch must allow the developed C2 route')
assert.equal(selected.jobReceipts.receipts.at(-1)?.deliveredByBlueprint[developedQ55.id], 40)

console.log('PASS: V3-08 locked quote, split payout, reservation, quality, cancellation, auto-dispatch, rewards, and reload')
