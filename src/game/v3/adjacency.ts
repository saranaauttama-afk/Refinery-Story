import type { BuildingType } from '../types'
import { isV3ProcessBuilding, type V3ProcessBuilding } from './data'
import type { V3Building, V3GameState } from './types'
import { getV3Building, getV3FootprintCells, listV3Buildings } from './yard'

/** Master §layout: the matching product tank touching a line gives +5% rate. */
export const V3_ADJACENCY_TANK_RATE = 0.05
/** A workshop touching a line cuts that line's upkeep by 10% (inside the 25% cap). */
export const V3_ADJACENCY_WORKSHOP_CUT = 0.1

export const V3_LINE_TANK: Record<V3ProcessBuilding, BuildingType> = {
  distillationUnit: 'gasolineTank',
  lubricantPlant: 'lubricantTank',
  jetFuelPlant: 'jetFuelTank',
  petrochemicalPlant: 'petrochemicalTank',
  polymerPlant: 'pelletSilo',
  wasteTreatmentPlant: 'recyclingBunker',
}

export type V3AdjacencyKind = 'tank' | 'workshop'

const cellsOf = (building: Pick<V3Building, 'type' | 'level' | 'x' | 'y'>) =>
  getV3FootprintCells(building.type, building.level, building.x, building.y)

/** Edge-sharing on the logical tile grid (4 directions; never pixel distance). */
export function areV3Adjacent(a: Pick<V3Building, 'type' | 'level' | 'x' | 'y'>, b: Pick<V3Building, 'type' | 'level' | 'x' | 'y'>): boolean {
  const bCells = new Set(cellsOf(b).map((cell) => `${cell.x},${cell.y}`))
  return cellsOf(a).some((cell) =>
    bCells.has(`${cell.x + 1},${cell.y}`) || bCells.has(`${cell.x - 1},${cell.y}`) ||
    bCells.has(`${cell.x},${cell.y + 1}`) || bCells.has(`${cell.x},${cell.y - 1}`))
}

export type V3LineAdjacency = { tank: boolean; workshop: boolean }

/** Per-target bonuses: each kind counts once, however many sources touch it. */
export function getV3LineAdjacency(state: V3GameState, buildingId: string): V3LineAdjacency {
  const line = getV3Building(state, buildingId)
  if (!line || !isV3ProcessBuilding(line.type)) return { tank: false, workshop: false }
  const tankType = V3_LINE_TANK[line.type]
  const others = listV3Buildings(state).filter((building) => building.id !== line.id)
  return {
    tank: others.some((building) => building.type === tankType && areV3Adjacent(line, building)),
    workshop: others.some((building) => building.type === 'maintenanceWorkshop' && areV3Adjacent(line, building)),
  }
}

export function getV3AdjacencyRate(state: V3GameState, buildingId: string): number {
  return getV3LineAdjacency(state, buildingId).tank ? 1 + V3_ADJACENCY_TANK_RATE : 1
}

/**
 * Placement preview: which lines would gain (or keep) a bonus if `type` were at
 * (x, y). Used before placing/moving so the benefit is visible up front.
 */
export function getV3AdjacencyPreview(
  state: V3GameState,
  type: BuildingType,
  level: number,
  x: number,
  y: number,
  ignoreId: string | null = null,
): Array<{ buildingId: string; kind: V3AdjacencyKind }> {
  const candidate = { type, level: Math.min(3, Math.max(1, level)) as 1 | 2 | 3, x, y }
  const effects: Array<{ buildingId: string; kind: V3AdjacencyKind }> = []
  for (const building of listV3Buildings(state)) {
    if (building.id === ignoreId) continue
    if (isV3ProcessBuilding(type) && isV3ProcessBuilding(building.type)) continue
    if (isV3ProcessBuilding(building.type) && areV3Adjacent(candidate, building)) {
      if (V3_LINE_TANK[building.type] === type) effects.push({ buildingId: building.id, kind: 'tank' })
      if (type === 'maintenanceWorkshop') effects.push({ buildingId: building.id, kind: 'workshop' })
    }
    if (isV3ProcessBuilding(type) && areV3Adjacent(candidate, building)) {
      if (V3_LINE_TANK[type] === building.type) effects.push({ buildingId: '(new)', kind: 'tank' })
      if (building.type === 'maintenanceWorkshop') effects.push({ buildingId: '(new)', kind: 'workshop' })
    }
  }
  // One effect per target per kind.
  return effects.filter((effect, index) => effects.findIndex((other) => other.buildingId === effect.buildingId && other.kind === effect.kind) === index)
}

/** Discovery history: kinds the player has formed at least once (no reward, so moves cannot farm). */
export function recordV3AdjacencyDiscoveries(state: V3GameState): V3GameState {
  const found = new Set(state.discoveredAdjacencies)
  const before = found.size
  for (const building of listV3Buildings(state)) {
    if (!isV3ProcessBuilding(building.type)) continue
    const adjacency = getV3LineAdjacency(state, building.id)
    if (adjacency.tank) found.add(`tank:${building.type}`)
    if (adjacency.workshop) found.add('workshop')
  }
  return found.size === before ? state : { ...state, discoveredAdjacencies: [...found].sort() }
}
