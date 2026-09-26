import type { BuildingType } from '../types'
import { V3_BUILDINGS, V3_CAPS, V3_MAINTENANCE, V3_TICKS_PER_CYCLE, isV3ProcessBuilding } from './data'
import { getV3Modifiers } from './modifiers'
import { recordV3Ledger } from './productInventory'
import type { V3GameState } from './types'
import { getV3LineEmployee } from './workforce'

const CORE: ReadonlySet<BuildingType> = new Set<BuildingType>(['distillationUnit', 'crudeTank', 'gasolineTank'])

export type V3MaintenanceLine = {
  cellIndex: number
  building: BuildingType
  baseCents: number
  cut: number
  dueCents: number
  waivedReason: 'starter' | 'emergency' | 'recovery' | null
}

export type V3MaintenancePlan = {
  lines: V3MaintenanceLine[]
  dueCents: number
  globalCut: number
  perMinuteCents: number
}

/** Highest workshop only (never stacked). */
function workshopCut(state: V3GameState): number {
  let best = 0
  state.world.grid.forEach((cell, index) => {
    if (cell === 'maintenanceWorkshop') best = Math.max(best, V3_MAINTENANCE.workshopCutByLevel[state.world.gridLevels[index] ?? 1] ?? 0)
  })
  return best
}

export function isV3EmergencyWaived(state: V3GameState, cellIndex: number): boolean {
  const emergency = state.maintenanceEmergency
  if (!emergency) return false
  const building = state.world.grid[cellIndex]
  if (cellIndex === emergency.cellIndex) return true
  // One core tank of each kind (lowest index) keeps the emergency line alive.
  return (building === 'crudeTank' || building === 'gasolineTank') &&
    state.world.grid.findIndex((cell) => cell === building) === cellIndex
}

export function evaluateV3Maintenance(state: V3GameState, deltaTicks = V3_TICKS_PER_CYCLE): V3MaintenancePlan {
  const modifiers = getV3Modifiers(state)
  const globalCut = workshopCut(state) + modifiers.upkeep.raw
  const lines: V3MaintenanceLine[] = []
  state.world.grid.forEach((building, cellIndex) => {
    if (!building) return
    const cost = V3_BUILDINGS[building]?.buildCostDollars ?? 0
    if (cost <= 0) return
    const level = state.world.gridLevels[cellIndex] ?? 1
    const processing = isV3ProcessBuilding(building)
    const levelRate = (processing ? V3_MAINTENANCE.processingLevelRate : V3_MAINTENANCE.supportLevelRate)[level] ?? 1
    const program = state.plantPrograms[cellIndex]
    const pausedRate = processing && program?.paused ? V3_MAINTENANCE.pausedRate : 1
    const baseCents = cost * 100 * V3_MAINTENANCE.rateOfBuildCostPerCycle * levelRate * pausedRate * deltaTicks / V3_TICKS_PER_CYCLE
    // Local crew upkeep skills apply to that line only, inside the shared 25% cap.
    const lineEmployee = processing ? getV3LineEmployee(state, cellIndex) : null
    const localCut = lineEmployee && !state.unpaidEmployeeIds.includes(lineEmployee.id)
      ? (lineEmployee.skills ?? []).filter((skill) => skill.channel === 'upkeep').reduce((sum, skill) => sum + skill.value, 0)
      : 0
    const cut = Math.min(V3_CAPS.upkeep, globalCut + localCut)
    let waivedReason: V3MaintenanceLine['waivedReason'] = null
    if (state.recoveryState?.status === 'running') waivedReason = 'recovery'
    else if (CORE.has(building) && state.campaignProgress.chapter < V3_MAINTENANCE.starterFreeUntilChapter) waivedReason = 'starter'
    else if (state.maintenanceEmergency) waivedReason = 'emergency'
    lines.push({ cellIndex, building, baseCents, cut, dueCents: waivedReason ? 0 : baseCents * (1 - cut), waivedReason })
  })
  const dueCents = lines.reduce((sum, line) => sum + line.dueCents, 0)
  return { lines, dueCents, globalCut: Math.min(V3_CAPS.upkeep, globalCut), perMinuteCents: dueCents * 300 / deltaTicks }
}

/**
 * Pays maintenance as incurred. If cash cannot cover it, no debt accrues: the
 * factory enters Emergency operation (lowest Distillation at baseline, others
 * paused, maintenance suspended) until the player confirms restoration.
 */
export function settleV3Maintenance(state: V3GameState, deltaTicks: number): V3GameState {
  if (state.maintenanceEmergency || state.recoveryState?.status === 'running') return state
  const plan = evaluateV3Maintenance(state, deltaTicks)
  if (plan.dueCents <= 1e-9) return state
  if (state.world.moneyCents + 1e-8 >= plan.dueCents) {
    return recordV3Ledger({
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents - plan.dueCents },
    }, { maintenanceCents: plan.dueCents, cashOutflowsCents: plan.dueCents })
  }
  const cellIndex = state.world.grid.findIndex((cell) => cell === 'distillationUnit')
  return { ...state, maintenanceEmergency: { sinceTick: state.world.tickCount, cellIndex } }
}

/** Cash needed to leave Emergency: one minute of normal maintenance. */
export function getV3EmergencyExitCents(state: V3GameState): number {
  return evaluateV3Maintenance({ ...state, maintenanceEmergency: null }, 300).dueCents
}
