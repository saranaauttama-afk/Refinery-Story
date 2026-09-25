import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { getV3CrudeCapacity, getV3SellableQuantity } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState } from '../src/game/v3/state'
import type { V3Action, V3ActionResult, V3GameState, V3ProductFamily } from '../src/game/v3/types'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
export type V3ActionInput = WithoutSequence<V3Action>

export const close = (actual: number, expected: number, message?: string, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${message ?? 'value'}: ${actual} != ${expected}`)

export function attempt(state: V3GameState, action: V3ActionInput): V3ActionResult {
  return reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
}

/** Applies an action and asserts that the shared reducer accepted it. */
export function act(state: V3GameState, action: V3ActionInput): V3GameState {
  const result = attempt(state, action)
  assert.equal(result.events[0]?.tone, 'success', `${action.type} blocked: ${result.events[0]?.messageId}`)
  return result.state
}

/** Asserts a blocked action changes nothing except the consumed action sequence. */
export function assertBlocked(state: V3GameState, action: V3ActionInput, messageId: string): V3GameState {
  const result = attempt(state, action)
  assert.equal(result.events[0]?.messageId, messageId, `${action.type} expected ${messageId}`)
  assert.deepEqual({ ...result.state, nextActionSequence: state.nextActionSequence }, state, `${action.type} mutated state while blocked`)
  return result.state
}

export function cycles(state: V3GameState, count: number): V3GameState {
  for (let index = 0; index < count; index++) state = runV3ProductionTick(state, 25).state
  return state
}

export function sellAllFree(state: V3GameState, family: V3ProductFamily): V3GameState {
  const free = Math.floor(getV3SellableQuantity(state, family) + 1e-8)
  return free > 0 ? act(state, { type: 'trade', direction: 'sell', product: family, quantity: free }) : state
}

/** Legal Gasoline route C0 → C2 through the same reducers as the preview UI. */
export function legalChapterTwo(): V3GameState {
  let state = createInitialV3GameState()
  state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
  state = cycles(state, 4)
  state = act(state, { type: 'accept_job', templateId: 'tutorial:gasoline' })
  state = act(state, { type: 'dispatch_job', quantity: 20 })
  state = act(state, { type: 'build', cellIndex: 0, building: 'laboratory' })
  state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 60 })
  state = cycles(state, 2)
  state = act(state, {
    type: 'start_development', family: 'gasoline', profile: 'volume', module: 'none',
    knowledgeRank: 0, leadEmployeeId: null, labCellIndex: 0,
  })
  state = cycles(state, 4)
  const developed = Object.values(state.productBlueprints).find((blueprint) => blueprint.provenance === 'developed')
  assert.ok(developed)
  state = sellAllFree(state, 'gasoline')
  state = act(state, { type: 'set_program', cellIndex: 4, blueprintId: developed!.id })
  state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 60 })
  state = cycles(state, 9)
  state = act(state, { type: 'accept_job', templateId: 'local:trial' })
  state = act(state, { type: 'dispatch_job', quantity: 40 })
  assert.equal(state.campaignProgress.chapter, 2)
  return state
}

/** Legal cash building: buy crude, refine, sell free Gasoline at spot. Returns cycles used. */
export function earnGasolineCash(state: V3GameState, targetCents: number, maxCycles = 2_000): { state: V3GameState; cycles: number } {
  let used = 0
  while (state.world.moneyCents < targetCents) {
    assert.ok(used < maxCycles, `cash target ${targetCents} not reached in ${maxCycles} cycles`)
    const room = Math.floor(getV3CrudeCapacity(state) - state.world.crudeOil + 1e-8)
    const affordable = Math.floor(state.world.moneyCents / 1_000)
    const buy = Math.min(room, affordable)
    if (buy > 0) state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: buy })
    state = cycles(state, 1)
    used += 1
    state = sellAllFree(state, 'gasoline')
  }
  return { state, cycles: used }
}

export function materialBasisTotal(state: V3GameState): number {
  const inventory = Object.values(state.variantInventory).reduce((sum, entry) => sum + entry.totalCostBasisCents, 0)
  const basis = state.materialCostBasis
  return inventory + basis.crudeCents + basis.feedstockCents + basis.electricityCents + basis.wasteCents
}
