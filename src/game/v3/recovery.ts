import { V3_BUILDINGS, V3_CRUDE_PRICE_CENTS, V3_SPOT_PRICE_CENTS } from './data'
import { getV3SellableQuantity } from './productInventory'
import { V3_DEFAULT_BLUEPRINT_ID } from './state'
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
  const missingBuildings = STARTER_ROUTE.filter((building) => !state.world.grid.includes(building))
  const restoreCostCents = missingBuildings.reduce((sum, building) => sum + V3_BUILDINGS[building].buildCostDollars * 100, 0)
  const emptySlots = state.world.grid.filter((cell) => cell === null).length
  return {
    tollingAvailable: state.recoveryState?.status !== 'running' && cashDeficitCents > 0 && saleableValueCents + 1e-8 < cashDeficitCents,
    missingBuildings: [...missingBuildings],
    loanersAvailable: missingBuildings.length > 0 && state.world.moneyCents + 1e-8 < restoreCostCents && emptySlots >= missingBuildings.length,
    emptySlotsNeeded: Math.max(0, missingBuildings.length - emptySlots),
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
      loanerCellIndices: state.recoveryState?.loanerCellIndices ?? [],
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
  const grid = [...state.world.grid]
  const gridLevels = [...state.world.gridLevels]
  const programs = { ...state.plantPrograms }
  const loanerCellIndices = [...(state.recoveryState?.loanerCellIndices ?? [])]
  for (const building of offer.missingBuildings) {
    const cellIndex = grid.findIndex((cell) => cell === null)
    if (cellIndex < 0) return null
    grid[cellIndex] = building
    gridLevels[cellIndex] = 1
    loanerCellIndices.push(cellIndex)
    if (building === 'distillationUnit') {
      programs[cellIndex] = {
        cellIndex,
        blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline,
        installedModule: 'none',
        setupRemainingTicks: 0,
        paused: false,
      }
    }
  }
  return {
    ...state,
    world: { ...state.world, grid, gridLevels },
    plantPrograms: programs,
    recoveryState: {
      rescueJobId: state.recoveryState?.rescueJobId ?? 'loaner:starter',
      loanerCellIndices,
      status: state.recoveryState?.status ?? 'completed',
      quoteCents: state.recoveryState?.quoteCents ?? V3_CRUDE_PRICE_CENTS,
      targetCashCents: state.recoveryState?.targetCashCents ?? 0,
      startedAtTick: state.recoveryState?.startedAtTick ?? state.world.tickCount,
      remainingTicks: state.recoveryState?.remainingTicks ?? 0,
      paidCents: state.recoveryState?.paidCents ?? 0,
    },
  }
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

export function isV3LoanerCell(state: V3GameState, cellIndex: number): boolean {
  return state.recoveryState?.loanerCellIndices.includes(cellIndex) ?? false
}
