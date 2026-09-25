import { createAnchoredSquareIndexMap, remapAnchoredSquareArray } from '../utils/gridExpansion'
import { V3_GRID_EXPANSIONS } from './data'
import type { V3EmployeeDuty, V3GameState, V3PlantProgram } from './types'

export type V3GridExpansionOffer = {
  fromSize: number
  toSize: number
  costCents: number
  chapter: number
}

export function getV3GridSize(state: V3GameState): number {
  return Math.round(Math.sqrt(state.world.grid.length))
}

/** Next purchasable expansion, or null when none is defined in V3 data yet. */
export function getV3NextGridExpansion(state: V3GameState): V3GridExpansionOffer | null {
  const size = getV3GridSize(state)
  const next = V3_GRID_EXPANSIONS.find((expansion) => expansion.fromSize === size)
  return next
    ? { fromSize: next.fromSize, toSize: next.toSize, costCents: next.costDollars * 100, chapter: next.chapter }
    : null
}

export type V3ExpansionResult =
  | { state: V3GameState; blocker: null; params?: undefined }
  | { state: V3GameState; blocker: 'unavailable' | 'locked' | 'insufficient_cash'; params?: Record<string, number> }

/**
 * Expands the square yard keeping every building at the same row/column.
 * All cell-keyed V3 state (programs, duties, lab project, loaners) moves with it.
 */
export function expandV3Grid(state: V3GameState): V3ExpansionResult {
  const offer = getV3NextGridExpansion(state)
  if (!offer) return { state, blocker: 'unavailable' }
  if (state.campaignProgress.chapter < offer.chapter) return { state, blocker: 'locked', params: { chapter: offer.chapter } }
  if (state.world.moneyCents < offer.costCents) return { state, blocker: 'insufficient_cash', params: { costCents: offer.costCents } }
  const indexMap = createAnchoredSquareIndexMap(offer.fromSize, offer.toSize)
  const move = (cellIndex: number) => indexMap[cellIndex] ?? cellIndex
  const plantPrograms: Record<number, V3PlantProgram> = {}
  for (const program of Object.values(state.plantPrograms)) {
    const cellIndex = move(program.cellIndex)
    plantPrograms[cellIndex] = { ...program, cellIndex }
  }
  const employeeDuties: Record<string, V3EmployeeDuty> = {}
  for (const [employeeId, duty] of Object.entries(state.employeeDuties)) {
    if (duty.kind === 'line') employeeDuties[employeeId] = { kind: 'line', cellIndex: move(duty.cellIndex) }
    else if (duty.kind === 'development') {
      employeeDuties[employeeId] = { ...duty, returnCellIndex: duty.returnCellIndex === null ? null : move(duty.returnCellIndex) }
    } else employeeDuties[employeeId] = duty
  }
  return {
    blocker: null,
    state: {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - offer.costCents,
        grid: remapAnchoredSquareArray(state.world.grid, offer.fromSize, offer.toSize, null),
        gridLevels: remapAnchoredSquareArray(state.world.gridLevels, offer.fromSize, offer.toSize, 1),
        gridExpansionLevel: state.world.gridExpansionLevel + 1,
      },
      plantPrograms,
      employeeDuties,
      developmentProject: state.developmentProject
        ? { ...state.developmentProject, labCellIndex: move(state.developmentProject.labCellIndex) }
        : null,
      recoveryState: state.recoveryState
        ? { ...state.recoveryState, loanerCellIndices: state.recoveryState.loanerCellIndices.map(move) }
        : null,
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + offer.costCents,
      },
    },
  }
}
