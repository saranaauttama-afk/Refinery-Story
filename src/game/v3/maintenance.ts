import { V3_ADJACENCY_WORKSHOP_CUT, getV3LineAdjacency } from './adjacency'
import { getV3BuildingType, getV3BuildingLevel, listV3Buildings } from './yard'
import type { BuildingType } from '../types'
import { V3_BUILDINGS, V3_CAPS, V3_MAINTENANCE, V3_TICKS_PER_CYCLE, isV3ProcessBuilding } from './data'
import { getV3Modifiers } from './modifiers'
import { recordV3Ledger } from './productInventory'
import type { V3GameState } from './types'
import { getV3LineEmployee } from './workforce'

const CORE: ReadonlySet<BuildingType> = new Set<BuildingType>(['distillationUnit', 'crudeTank', 'gasolineTank'])

export type V3MaintenanceLine = {
  buildingId: string
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
  for (const building of listV3Buildings(state)) {
    if (building.type === 'maintenanceWorkshop') best = Math.max(best, V3_MAINTENANCE.workshopCutByLevel[building.level] ?? 0)
  }
  return best
}

export function isV3EmergencyWaived(state: V3GameState, buildingId: string): boolean {
  const emergency = state.maintenanceEmergency
  if (!emergency) return false
  const building = getV3BuildingType(state, buildingId)
  if (buildingId === emergency.buildingId) return true
  // One core tank of each kind (first by ID) keeps the emergency line alive.
  return (building === 'crudeTank' || building === 'gasolineTank') &&
    listV3Buildings(state).find((entry) => entry.type === building)?.id === buildingId
}

export function evaluateV3Maintenance(state: V3GameState, deltaTicks = V3_TICKS_PER_CYCLE): V3MaintenancePlan {
  const modifiers = getV3Modifiers(state)
  const globalCut = workshopCut(state) + modifiers.upkeep.raw
  const lines: V3MaintenanceLine[] = []
  for (const entry of listV3Buildings(state)) {
    const building = entry.type
    const buildingId = entry.id
    const cost = V3_BUILDINGS[building]?.buildCostDollars ?? 0
    if (cost <= 0) continue
    const level = getV3BuildingLevel(state, buildingId)
    const processing = isV3ProcessBuilding(building)
    const levelRate = (processing ? V3_MAINTENANCE.processingLevelRate : V3_MAINTENANCE.supportLevelRate)[level] ?? 1
    const program = state.plantPrograms[buildingId]
    const pausedRate = processing && program?.paused ? V3_MAINTENANCE.pausedRate : 1
    const baseCents = cost * 100 * V3_MAINTENANCE.rateOfBuildCostPerCycle * levelRate * pausedRate * deltaTicks / V3_TICKS_PER_CYCLE
    // Local crew upkeep skills apply to that line only, inside the shared 25% cap.
    const lineEmployee = processing ? getV3LineEmployee(state, buildingId) : null
    const localCut = lineEmployee && !state.unpaidEmployeeIds.includes(lineEmployee.id)
      ? (lineEmployee.skills ?? []).filter((skill) => skill.channel === 'upkeep').reduce((sum, skill) => sum + skill.value, 0)
      : 0
    // A workshop touching this line adds a local 10% cut; all cuts share the 25% cap.
    const adjacencyCut = isV3ProcessBuilding(building) && getV3LineAdjacency(state, buildingId).workshop ? V3_ADJACENCY_WORKSHOP_CUT : 0
    const cut = Math.min(V3_CAPS.upkeep, globalCut + localCut + adjacencyCut)
    let waivedReason: V3MaintenanceLine['waivedReason'] = null
    if (state.recoveryState?.status === 'running') waivedReason = 'recovery'
    else if (CORE.has(building) && state.campaignProgress.chapter < V3_MAINTENANCE.starterFreeUntilChapter) waivedReason = 'starter'
    else if (state.maintenanceEmergency) waivedReason = 'emergency'
    lines.push({ buildingId, building, baseCents, cut, dueCents: waivedReason ? 0 : baseCents * (1 - cut), waivedReason })
  }
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
  const buildingId = listV3Buildings(state).find((entry) => entry.type === 'distillationUnit')?.id ?? null
  return { ...state, maintenanceEmergency: { sinceTick: state.world.tickCount, buildingId } }
}

/** Cash needed to leave Emergency: one minute of normal maintenance. */
export function getV3EmergencyExitCents(state: V3GameState): number {
  return evaluateV3Maintenance({ ...state, maintenanceEmergency: null }, 300).dueCents
}
