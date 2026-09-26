import type { BuildingType } from '../types'
import { V3_BUILDINGS, V3_CRUDE_PRICE_CENTS, V3_SPOT_PRICE_CENTS } from './data'
import { getV3SellableQuantity } from './productInventory'
import { V3_DEFAULT_BLUEPRINT_ID, V3_STARTER_BUILDINGS } from './state'
import { findV3PlacementSpot, hasV3Building, validateV3Placement } from './yard'
import type { V3GameState } from './types'

export const V3_RECOVERY_INPUT_QUANTITY = 6
export const V3_RECOVERY_TICKS = 100

const STARTER_ROUTE = ['crudeTank', 'distillationUnit', 'gasolineTank'] as const

export type V3RecoveryOffer = {
  tollingAvailable: boolean
  missingBuildings: Array<(typeof STARTER_ROUTE)[number]>
  loanersAvailable: boolean
  emptySlotsNeeded: number
  cashDeficitCents: number
}

export function getV3RecoveryOffer(state: V3GameState): V3RecoveryOffer {
  const targetCashCents = V3_RECOVERY_INPUT_QUANTITY * V3_CRUDE_PRICE_CENTS
  const cashDeficitCents = Math.max(0, targetCashCents - state.world.moneyCents)
  const saleableValueCents = getV3SellableQuantity(state, 'gasoline') * V3_SPOT_PRICE_CENTS.gasoline
  const missingBuildings = STARTER_ROUTE.filter((building) => !hasV3Building(state, building))
  const restoreCostCents = missingBuildings.reduce((sum, building) => sum + V3_BUILDINGS[building].buildCostDollars * 100, 0)
  const placed = placeV3StarterLoaners(state, missingBuildings)
  const placeable = placed ? missingBuildings.length : 0
  return {
    tollingAvailable: state.recoveryState?.status !== 'running' && cashDeficitCents > 0 && saleableValueCents + 1e-8 < cashDeficitCents,
    missingBuildings: [...missingBuildings],
    loanersAvailable: missingBuildings.length > 0 && state.world.moneyCents + 1e-8 < restoreCostCents && Boolean(placed),
    emptySlotsNeeded: Math.max(0, missingBuildings.length - placeable),
    cashDeficitCents,
  }
}

export function startV3Recovery(state: V3GameState, sequence: number): V3GameState | null {
  const offer = getV3RecoveryOffer(state)
  if (!offer.tollingAvailable) return null
  return {
    ...state,
    recoveryState: {
      rescueJobId: `rescue:${String(sequence).padStart(8, '0')}`,
      loanerBuildingIds: state.recoveryState?.loanerBuildingIds ?? [],
      status: 'running',
      quoteCents: V3_CRUDE_PRICE_CENTS,
      targetCashCents: V3_RECOVERY_INPUT_QUANTITY * V3_CRUDE_PRICE_CENTS,
      startedAtTick: state.world.tickCount,
      remainingTicks: V3_RECOVERY_TICKS,
      paidCents: 0,
    },
  }
}

export function restoreV3StarterLoaners(state: V3GameState): V3GameState | null {
  const offer = getV3RecoveryOffer(state)
  if (!offer.loanersAvailable) return null
  const placed = placeV3StarterLoaners(state, offer.missingBuildings)
  if (!placed) return null
  return {
    ...state,
    world: { ...state.world, buildingsById: placed.buildingsById },
    plantPrograms: placed.programs,
    recoveryState: {
      rescueJobId: state.recoveryState?.rescueJobId ?? 'loaner:starter',
      loanerBuildingIds: placed.loanerBuildingIds,
      status: state.recoveryState?.status ?? 'completed',
      quoteCents: state.recoveryState?.quoteCents ?? V3_CRUDE_PRICE_CENTS,
      targetCashCents: state.recoveryState?.targetCashCents ?? 0,
      startedAtTick: state.recoveryState?.startedAtTick ?? state.world.tickCount,
      remainingTicks: state.recoveryState?.remainingTicks ?? 0,
      paidCents: state.recoveryState?.paidCents ?? 0,
    },
  }
}

/**
 * Places missing starter buildings as loaners: the original starter anchor when
 * free, otherwise the first valid spot. Returns null when any of them cannot fit.
 */
function placeV3StarterLoaners(state: V3GameState, missing: readonly BuildingType[]) {
  let working = state
  const programs = { ...state.plantPrograms }
  const loanerBuildingIds = [...(state.recoveryState?.loanerBuildingIds ?? [])]
  for (const type of missing) {
    const starter = Object.values(V3_STARTER_BUILDINGS).find((entry) => entry.type === type)!
    const id = `building:loaner:${type}`
    const spot = !validateV3Placement(working, type, 1, starter.x, starter.y)
      ? { x: starter.x, y: starter.y }
      : findV3PlacementSpot(working, type, 1)
    if (!spot || working.world.buildingsById[id]) return null
    working = { ...working, world: { ...working.world, buildingsById: { ...working.world.buildingsById, [id]: { id, type, level: 1, ...spot } } } }
    loanerBuildingIds.push(id)
    if (type === 'distillationUnit') {
      programs[id] = { buildingId: id, blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline, installedModule: 'none', setupRemainingTicks: 0, paused: false }
    }
  }
  return { buildingsById: working.world.buildingsById, programs, loanerBuildingIds }
}

export function advanceV3Recovery(state: V3GameState, deltaTicks: number): V3GameState {
  const recovery = state.recoveryState
  if (!recovery || recovery.status !== 'running' || deltaTicks <= 0) return state
  const remainingTicks = Math.max(0, recovery.remainingTicks - deltaTicks)
  if (remainingTicks > 0) return { ...state, recoveryState: { ...recovery, remainingTicks } }
  const paidCents = Math.max(0, recovery.targetCashCents - state.world.moneyCents)
  return {
    ...state,
    world: { ...state.world, moneyCents: state.world.moneyCents + paidCents },
    operatingLedger: {
      ...state.operatingLedger,
      grantsCents: state.operatingLedger.grantsCents + paidCents,
    },
    recoveryState: { ...recovery, status: 'completed', remainingTicks: 0, paidCents },
  }
}

export function isV3LoanerBuilding(state: V3GameState, buildingId: string): boolean {
  return state.recoveryState?.loanerBuildingIds.includes(buildingId) ?? false
}
