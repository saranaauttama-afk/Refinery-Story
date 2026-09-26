import assert from 'node:assert/strict'

import { V3_JOB_TEMPLATES } from '../src/game/v3/jobs'
import { getV3SellableQuantity } from '../src/game/v3/productInventory'
import { V3_DEFAULT_BLUEPRINT_ID, V3_STARTER_BUILDINGS, createInitialV3GameState } from '../src/game/v3/state'
import type { V3GameState } from '../src/game/v3/types'
import { act, assertBlocked, cycles, SLOT, slotId } from './v3-check-helpers'

// Reproduces the path found by the legal full-run bot: both one-time C1 trials
// completed without 40 units of ONE developed recipe → C2 must stay reachable.
const DISTILL = V3_STARTER_BUILDINGS.distillationUnit.id
let state = createInitialV3GameState()
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
state = cycles(state, 4)
state = act(state, { type: 'accept_job', templateId: 'tutorial:gasoline' })
state = act(state, { type: 'dispatch_job', quantity: 20 })
assert.equal(state.campaignProgress.chapter, 1)

function fill(target: V3GameState, units: number): V3GameState {
  for (let guard = 0; guard < 40 && Math.floor(getV3SellableQuantity(target, 'gasoline') + 1e-8) < units; guard++) {
    const room = Math.floor(60 - target.world.crudeOil)
    if (room > 0) target = act(target, { type: 'trade', direction: 'buy', product: 'crude', quantity: room })
    target = cycles(target, 1)
  }
  return target
}

/** One production cycle with crude topped up; stale default stock is sold to free tank space. */
function produce(target: V3GameState): V3GameState {
  const stale = Math.floor(target.variantInventory[V3_DEFAULT_BLUEPRINT_ID.gasoline]?.quantity ?? 0)
  const sellable = Math.floor(getV3SellableQuantity(target, 'gasoline') + 1e-8)
  const sell = Math.min(stale, sellable)
  if (sell > 0) target = act(target, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: sell })
  const room = Math.floor(60 - target.world.crudeOil)
  if (room > 0) target = act(target, { type: 'trade', direction: 'buy', product: 'crude', quantity: room })
  return cycles(target, 1)
}

// Local Trial shipped entirely with DEFAULT (starter) stock — the trap.
assertBlocked(state, { type: 'accept_job', templateId: 'local:starter-repeat' }, 'v3.job.requires_previous')
state = fill(state, 40)
state = act(state, { type: 'accept_job', templateId: 'local:trial' })
state = act(state, { type: 'dispatch_job', quantity: 40, blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline })

// Performance Trial shipped with a developed Precision recipe: only 35 units.
state = act(state, { type: 'build', ...SLOT(0), building: 'laboratory' })
state = fill(state, 12)
state = act(state, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none',
  knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(state, 0),
})
state = cycles(state, 4)
const precision = Object.values(state.productBlueprints).find((blueprint) => blueprint.provenance === 'developed')!
state = act(state, { type: 'set_program', buildingId: DISTILL, blueprintId: precision.id })
state = act(state, { type: 'accept_job', templateId: 'performance:trial' })
for (let guard = 0; state.acceptedJob && guard < 200; guard++) {
  state = produce(state)
  const held = Math.floor(state.variantInventory[precision.id]?.quantity ?? 0)
  const remaining = state.acceptedJob!.quantity - state.acceptedJob!.deliveredQuantity
  if (held > 0) state = act(state, { type: 'dispatch_job', quantity: Math.min(held, remaining), blueprintId: precision.id })
}
assert.equal(state.campaignProgress.chapter, 1, 'both trials done, still C1 (35 < 40 developed)')
assertBlocked(state, { type: 'accept_job', templateId: 'local:trial' }, 'v3.job.locked')

// Owner decision ก: the Local starter repeat keeps C2 reachable.
const starter = V3_JOB_TEMPLATES['local:starter-repeat']
assert.equal(starter.kind, 'repeat')
assert.equal(starter.minimumChapter, 1)
assert.deepEqual([starter.completionBonusCents, starter.researchReward, starter.reputationReward], [0, 0, 0], 'income only')
const rp = state.world.researchPoints
state = { ...state, world: { ...state.world, tickCount: Math.max(state.world.tickCount, (state.jobReceipts.templateRetryAtTick['local:starter-repeat'] ?? 0)) } }
state = act(state, { type: 'accept_job', templateId: 'local:starter-repeat' })
for (let guard = 0; state.acceptedJob && guard < 200; guard++) {
  state = produce(state)
  const held = Math.floor(state.variantInventory[precision.id]?.quantity ?? 0)
  const remaining = state.acceptedJob!.quantity - state.acceptedJob!.deliveredQuantity
  if (held > 0) state = act(state, { type: 'dispatch_job', quantity: Math.min(held, remaining), blueprintId: precision.id })
}
assert.equal(state.campaignProgress.chapter, 2, 'C2 reached via the starter repeat')
assert.equal(state.world.researchPoints, rp, 'repeat pays no RP')
assertBlocked(state, { type: 'accept_job', templateId: 'local:starter-repeat' }, 'v3.job.cooldown')

console.log('PASS: C1 soft-lock regression — trials spent on default/mixed stock no longer block C2 (Local starter repeat)')
