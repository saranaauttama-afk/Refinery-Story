import type { BuildingType } from '../types'
import {
  V3_BUILDINGS,
  V3_BUILDING_LIMITS,
  V3_FOOTPRINTS,
  V3_LAND_PARCELS,
  V3_WORLD_SIZE,
  type V3Footprint,
  type V3LandParcel,
} from './data'
import type { V3Building, V3GameState } from './types'
import { getV3DecorCells } from './decorData'

export type V3PlacementBlocker = 'out_of_bounds' | 'locked_land' | 'overlap' | 'no_footprint'

export function getV3Footprint(type: BuildingType, level: number): V3Footprint | null {
  return V3_FOOTPRINTS[type]?.[Math.min(3, Math.max(1, level)) - 1] ?? null
}

export function getV3Building(state: V3GameState, buildingId: string | null | undefined): V3Building | null {
  return buildingId ? state.world.buildingsById[buildingId] ?? null : null
}

export function getV3BuildingType(state: V3GameState, buildingId: string | null | undefined): BuildingType | null {
  return getV3Building(state, buildingId)?.type ?? null
}

export function getV3BuildingLevel(state: V3GameState, buildingId: string | null | undefined): number {
  return getV3Building(state, buildingId)?.level ?? 1
}

/** Deterministic order: building ID (IDs are sequence-based, so this is creation order). */
export function listV3Buildings(state: V3GameState): V3Building[] {
  return Object.values(state.world.buildingsById).sort((a, b) => a.id.localeCompare(b.id))
}

export function countV3Buildings(state: V3GameState, type: BuildingType): number {
  return Object.values(state.world.buildingsById).filter((building) => building.type === type).length
}

export function hasV3Building(state: V3GameState, type: BuildingType): boolean {
  return countV3Buildings(state, type) > 0
}

export function getV3BuildingLimit(state: V3GameState, type: BuildingType): number | null {
  const limits = V3_BUILDING_LIMITS[type]
  return limits ? limits[state.campaignProgress.chapter] ?? limits[limits.length - 1] : null
}

export function getV3Parcel(id: string): V3LandParcel | null {
  return V3_LAND_PARCELS.find((parcel) => parcel.id === id) ?? null
}

const key = (x: number, y: number) => `${x},${y}`

export function isV3LandUnlocked(state: V3GameState, x: number, y: number): boolean {
  return state.world.unlockedParcelIds.some((id) => {
    const parcel = getV3Parcel(id)
    return Boolean(parcel && x >= parcel.x && x < parcel.x + parcel.w && y >= parcel.y && y < parcel.y + parcel.h)
  })
}

/** Occupancy is always derived from buildingsById; it is never stored. */
export function getV3Occupancy(state: V3GameState, ignoreId: string | null = null): Map<string, string> {
  const occupancy = new Map<string, string>()
  for (const building of listV3Buildings(state)) {
    if (building.id === ignoreId) continue
    const footprint = getV3Footprint(building.type, building.level)
    if (!footprint) continue
    for (let dx = 0; dx < footprint.w; dx++) {
      for (let dy = 0; dy < footprint.h; dy++) occupancy.set(key(building.x + dx, building.y + dy), building.id)
    }
  }
  // Decorations share the grid: they block buildings and each other.
  for (const decoration of Object.values(state.world.decorations ?? {})) {
    if (decoration.id === ignoreId) continue
    for (const cell of getV3DecorCells(decoration.kind, decoration.rotated, decoration.x, decoration.y)) occupancy.set(key(cell.x, cell.y), decoration.id)
  }
  return occupancy
}

export function getV3BuildingAt(state: V3GameState, x: number, y: number): V3Building | null {
  return getV3Building(state, getV3Occupancy(state).get(key(x, y)) ?? null)
}

/** Footprint cells for a hypothetical placement (anchor = top-left, upgrades grow right/down). */
export function getV3FootprintCells(type: BuildingType, level: number, x: number, y: number): Array<{ x: number; y: number }> {
  const footprint = getV3Footprint(type, level)
  if (!footprint) return []
  const cells: Array<{ x: number; y: number }> = []
  for (let dy = 0; dy < footprint.h; dy++) for (let dx = 0; dx < footprint.w; dx++) cells.push({ x: x + dx, y: y + dy })
  return cells
}

export function validateV3Placement(
  state: V3GameState,
  type: BuildingType,
  level: number,
  x: number,
  y: number,
  ignoreId: string | null = null,
): V3PlacementBlocker | null {
  const cells = getV3FootprintCells(type, level, x, y)
  if (!cells.length) return 'no_footprint'
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'out_of_bounds'
  if (cells.some((cell) => cell.x < 0 || cell.y < 0 || cell.x >= V3_WORLD_SIZE || cell.y >= V3_WORLD_SIZE)) return 'out_of_bounds'
  if (cells.some((cell) => !isV3LandUnlocked(state, cell.x, cell.y))) return 'locked_land'
  const occupancy = getV3Occupancy(state, ignoreId)
  if (cells.some((cell) => occupancy.has(key(cell.x, cell.y)))) return 'overlap'
  return null
}

/** First valid anchor scanning unlocked parcels row by row (used by recovery restore). */
export function findV3PlacementSpot(state: V3GameState, type: BuildingType, level = 1, ignoreId: string | null = null): { x: number; y: number } | null {
  const parcels = state.world.unlockedParcelIds.map(getV3Parcel).filter((parcel): parcel is V3LandParcel => Boolean(parcel))
  const minX = Math.min(...parcels.map((parcel) => parcel.x))
  const minY = Math.min(...parcels.map((parcel) => parcel.y))
  const maxX = Math.max(...parcels.map((parcel) => parcel.x + parcel.w))
  const maxY = Math.max(...parcels.map((parcel) => parcel.y + parcel.h))
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (!validateV3Placement(state, type, level, x, y, ignoreId)) return { x, y }
    }
  }
  return null
}

export function getV3UnlockedArea(state: V3GameState): number {
  return state.world.unlockedParcelIds.reduce((sum, id) => {
    const parcel = getV3Parcel(id)
    return sum + (parcel ? parcel.w * parcel.h : 0)
  }, 0)
}

export type V3ParcelBlocker = 'unknown' | 'owned' | 'locked' | 'requires_parcel' | 'insufficient_cash'

export function validateV3ParcelUnlock(state: V3GameState, parcelId: string): { blocker: V3ParcelBlocker; params?: Record<string, number | string> } | null {
  const parcel = getV3Parcel(parcelId)
  if (!parcel) return { blocker: 'unknown' }
  if (state.world.unlockedParcelIds.includes(parcelId)) return { blocker: 'owned' }
  if (state.campaignProgress.chapter < parcel.chapter) return { blocker: 'locked', params: { chapter: parcel.chapter } }
  if (parcel.requires && !state.world.unlockedParcelIds.includes(parcel.requires)) return { blocker: 'requires_parcel', params: { parcel: parcel.requires } }
  if (state.world.moneyCents < parcel.costDollars * 100) return { blocker: 'insufficient_cash', params: { costCents: parcel.costDollars * 100 } }
  return null
}

export type V3YardMigration = {
  buildingsById: Record<string, V3Building>
  /** Buildings that could not keep their level and were placed smaller (never expected). */
  downgraded: string[]
  /** Buildings with no room at all: removed and refunded (never expected). */
  refunded: Array<{ id: string; cents: number }>
}

/**
 * Scale-1 → scale-2 yard migration. Each building keeps its id, type and level;
 * its anchor is stretched around the world centre, then snapped to the nearest
 * free spot on the player's own land. Largest footprints are placed first.
 * Fallbacks (smaller level, then refund) only exist so a save can never be lost.
 */
export function migrateV3YardScale(
  buildingsById: Record<string, V3Building>,
  unlockedParcelIds: string[],
  stretch: number,
): V3YardMigration {
  const placed: Record<string, V3Building> = {}
  const probe = { world: { buildingsById: placed, unlockedParcelIds } } as unknown as V3GameState
  const area = (building: V3Building) => {
    const footprint = getV3Footprint(building.type, building.level)
    return footprint ? footprint.w * footprint.h : 0
  }
  const order = Object.values(buildingsById).sort((a, b) => area(b) - area(a) || a.id.localeCompare(b.id))
  const result: V3YardMigration = { buildingsById: placed, downgraded: [], refunded: [] }
  const centre = V3_WORLD_SIZE / 2
  const nearest = (building: V3Building, level: number): { x: number; y: number } | null => {
    const tx = Math.round(centre + (building.x - centre) * stretch)
    const ty = Math.round(centre + (building.y - centre) * stretch)
    for (let radius = 0; radius < V3_WORLD_SIZE; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
          if (!validateV3Placement(probe, building.type, level, tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy }
        }
      }
    }
    return null
  }
  for (const building of order) {
    let spot = nearest(building, building.level)
    let level = building.level
    while (!spot && level > 1) {
      level -= 1
      spot = nearest(building, level)
    }
    if (spot) {
      if (level !== building.level) result.downgraded.push(building.id)
      placed[building.id] = { ...building, level, x: spot.x, y: spot.y }
    } else {
      const cost = V3_BUILDINGS[building.type]
      const upgrades = (cost.upgradeCostDollars ?? [0, 0]).slice(0, building.level - 1).reduce((sum, dollars) => sum + dollars, 0)
      result.refunded.push({ id: building.id, cents: (cost.buildCostDollars + upgrades) * 100 })
    }
  }
  return result
}
