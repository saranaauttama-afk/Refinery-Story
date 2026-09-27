import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import {
  addV3VariantInventory,
  consumeV3ProtectedInventory,
  consumeV3SellableInventory,
  getV3ProductCapacity,
  getV3ProductQuantity,
  getV3SellableQuantity,
  getV3StockAllocations,
  recordV3Ledger,
} from '../src/game/v3/productInventory'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3ProductBlueprint } from '../src/game/v3/types'
import { getV3MarketMultiplier } from '../src/game/v3/market'

const q35: V3ProductBlueprint = {
  id: 'blueprint:gasoline:volume:1',
  signature: 'gasoline|volume|none|0|0',
  revision: 1,
  family: 'gasoline',
  name: 'Fleet Volume',
  quality: 35,
  profile: 'volume',
  module: 'none',
  minPlantLevel: 1,
  provenance: 'developed',
  commissionedAtTick: 100,
  pinned: true,
  archived: false,
}
const q55: V3ProductBlueprint = {
  ...q35,
  id: 'blueprint:gasoline:precision:1',
  signature: 'gasoline|precision|none|0|0',
  name: 'Precision 55',
  quality: 55,
  profile: 'precision',
}

let state = createInitialV3GameState()
state = { ...state, productBlueprints: { ...state.productBlueprints, [q35.id]: q35, [q55.id]: q55 } }
assert.equal(getV3ProductCapacity(state, 'gasoline'), 70)

let mutation = addV3VariantInventory(state, q35.id, 10, 1_000)
state = mutation.state
mutation = addV3VariantInventory(state, q35.id, 5, 1_000)
state = mutation.state
mutation = addV3VariantInventory(state, q55.id, 10, 3_000)
state = mutation.state
assert.equal(Object.keys(state.variantInventory).length, 2, 'different revisions must remain separate')
assert.equal(state.variantInventory[q35.id].quantity, 15)
assert.equal(state.variantInventory[q35.id].totalCostBasisCents, 2_000)
assert.equal(getV3ProductQuantity(state, 'gasoline'), 25)

const capped = addV3VariantInventory(state, q35.id, 100, 10_000)
assert.equal(capped.quantity, 45, 'family inventory must stop at shared physical capacity')
assert.equal(getV3ProductQuantity(capped.state, 'gasoline'), 70)

state = {
  ...state,
  stockPolicies: { [q35.id]: { keepQuantity: 3, autoSell: true, autoDispatch: false } },
  acceptedJob: {
    id: 'job:00000001',
    templateId: 'performance:trial',
    family: 'gasoline',
    minimumQuality: 55,
    quantity: 6,
    deliveredQuantity: 0,
    lockedUnitPriceCents: 2_700,
    completionBonusCents: 0,
    paidToDateCents: 0,
    acceptedAtTick: 0,
    deadlineTick: null,
    status: 'accepted',
    contributorWork: {},
    deliveredByBlueprint: {},
  },
}
const allocations = getV3StockAllocations(state, 'gasoline')
const low = allocations.find((entry) => entry.blueprintId === q35.id)!
const high = allocations.find((entry) => entry.blueprintId === q55.id)!
assert.deepEqual({ kept: low.kept, reserved: low.jobReserved, free: low.free }, { kept: 3, reserved: 0, free: 12 })
assert.deepEqual({ kept: high.kept, reserved: high.jobReserved, free: high.free }, { kept: 0, reserved: 6, free: 4 })
assert.equal(getV3SellableQuantity(state, 'gasoline', { source: 'auto' }), 12)
assert.equal(getV3SellableQuantity(state, 'gasoline', { blueprintId: q35.id, source: 'manual', overrideKeep: true }), 15)

const blockedSample = consumeV3ProtectedInventory(state, 'gasoline', 13, {
  blueprintId: q35.id,
  purpose: 'sample',
})
assert.equal(blockedSample.quantity, 0, 'samples must respect kept stock')
const sample = consumeV3ProtectedInventory(state, 'gasoline', 12, {
  blueprintId: q35.id,
  purpose: 'sample',
})
assert.equal(sample.quantity, 12)
assert.equal(sample.state.variantInventory[q35.id].quantity, 3)

const partial = consumeV3SellableInventory(state, 'gasoline', 5, { blueprintId: q35.id })
assert.equal(partial.quantity, 5)
assert.ok(Math.abs(partial.costBasisCents - (2_000 / 3)) < 1e-8)
assert.equal(partial.state.variantInventory[q35.id].quantity, 10)
assert.ok(Math.abs(partial.state.variantInventory[q35.id].totalCostBasisCents - (4_000 / 3)) < 1e-8)
const roundTrip = parseV3GameState(JSON.parse(JSON.stringify(partial.state)))
assert.equal(roundTrip.status, 'loaded')
assert.ok(Math.abs(roundTrip.state!.variantInventory[q35.id].totalCostBasisCents - (4_000 / 3)) < 1e-8)
const orphanedInventory = JSON.parse(JSON.stringify(partial.state))
delete orphanedInventory.productBlueprints[q35.id]
assert.equal(parseV3GameState(orphanedInventory).status, 'invalid')
const corruptLedger = JSON.parse(JSON.stringify(partial.state))
corruptLedger.operatingLedger.lifetimeCogsCents = -1
assert.equal(parseV3GameState(corruptLedger).status, 'invalid')

const sale = reduceV3Action(state, {
  type: 'trade',
  sequence: state.nextActionSequence,
  direction: 'sell',
  product: 'gasoline',
  blueprintId: q55.id,
  quantity: 4,
  source: 'manual',
})
assert.equal(sale.events[0].messageId, 'v3.action.ok')
// V3-21b: spot price × seasonal market multiplier for the current month.
const saleCents = Math.round(4 * 1_800 * getV3MarketMultiplier(state, 'gasoline'))
assert.equal(sale.state.world.moneyCents, state.world.moneyCents + saleCents)
assert.equal(sale.state.variantInventory[q55.id].quantity, 6)
assert.equal(sale.state.operatingLedger.lifetimeReceiptsCents, saleCents)
assert.equal(sale.state.operatingLedger.lifetimeCogsCents, 1_200)
assert.equal(sale.state.operatingLedger.capexCents, 0, 'operating trade must not be recorded as capex')

const blockedReserved = reduceV3Action(sale.state, {
  type: 'trade',
  sequence: sale.state.nextActionSequence,
  direction: 'sell',
  product: 'gasoline',
  blueprintId: q55.id,
  quantity: 1,
  source: 'manual',
  overrideKeep: true,
})
assert.equal(blockedReserved.events[0].messageId, 'v3.trade.insufficient_stock', 'manual keep override must never steal job reservation')

const bought = reduceV3Action(createInitialV3GameState(), {
  type: 'trade', sequence: 1, direction: 'buy', product: 'crude', quantity: 100,
})
assert.equal(bought.state.world.crudeOil, 60, 'crude purchase must stop at physical capacity')
assert.equal(bought.state.world.moneyCents, 18_000)
assert.equal(bought.state.materialCostBasis.crudeCents, 60_000)
assert.equal(bought.state.operatingLedger.lifetimeCashOutflowsCents, 42_000)

let ledgerState = createInitialV3GameState()
for (let second = 0; second < 181; second++) {
  ledgerState = { ...ledgerState, world: { ...ledgerState.world, tickCount: second * 5 } }
  ledgerState = recordV3Ledger(ledgerState, { receiptsCents: 1 })
}
assert.equal(ledgerState.operatingLedger.buckets.length, 180)
assert.equal(ledgerState.operatingLedger.buckets[0].second, 1)
assert.equal(ledgerState.operatingLedger.lifetimeReceiptsCents, 181)

console.log('PASS: V3-04 variant separation, capacity, protection, weighted basis, and ledger invariants')
