import type { BuildingType } from '../types'
import { V3_BUILDINGS, V3_LAND_PARCELS, type V3LandParcel } from './data'
import type { V3GameState } from './types'
import {
  getV3Building,
  getV3Footprint,
  getV3FootprintCells,
  listV3Buildings,
  validateV3ParcelUnlock,
  validateV3Placement,
  type V3PlacementBlocker,
} from './yard'

/** Pixel size of one world tile at scale 1 (renderers may zoom). */
export const V3_TILE_PX = 24

export type V3Rect = { x: number; y: number; w: number; h: number }

export type V3ParcelView = V3LandParcel & {
  state: 'owned' | 'available' | 'locked'
  blocker: string | null
}

export type V3PlacementPreview = {
  cells: Array<{ x: number; y: number }>
  status: 'valid' | V3PlacementBlocker
}

/**
 * Parcels to draw: all owned plus the next purchasable/locked ring pieces that
 * touch owned land. Distant parcels are never drawn, so the 100×100 world is
 * not rendered tile by tile.
 */
export function getV3ParcelViews(state: V3GameState): V3ParcelView[] {
  const owned = new Set(state.world.unlockedParcelIds)
  return V3_LAND_PARCELS
    .filter((parcel) => owned.has(parcel.id) || (parcel.requires !== null && owned.has(parcel.requires)))
    .map((parcel) => {
      if (owned.has(parcel.id)) return { ...parcel, state: 'owned' as const, blocker: null }
      const invalid = validateV3ParcelUnlock(state, parcel.id)
      return {
        ...parcel,
        state: invalid && invalid.blocker !== 'insufficient_cash' ? 'locked' as const : 'available' as const,
        blocker: invalid?.blocker ?? null,
      }
    })
}

/** Bounding box of drawn land in world tiles (camera limits use this, not 100×100). */
export function getV3YardBounds(state: V3GameState): V3Rect {
  const parcels = getV3ParcelViews(state)
  const minX = Math.min(...parcels.map((parcel) => parcel.x))
  const minY = Math.min(...parcels.map((parcel) => parcel.y))
  const maxX = Math.max(...parcels.map((parcel) => parcel.x + parcel.w))
  const maxY = Math.max(...parcels.map((parcel) => parcel.y + parcel.h))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** Integer tile range visible through a viewport (culling for grid lines/labels). */
export function getV3VisibleTileRange(
  viewport: { width: number; height: number },
  camera: { tx: number; ty: number; scale: number },
): V3Rect {
  const tile = V3_TILE_PX * camera.scale
  const x = Math.floor(-camera.tx / tile)
  const y = Math.floor(-camera.ty / tile)
  return { x, y, w: Math.ceil(viewport.width / tile) + 1, h: Math.ceil(viewport.height / tile) + 1 }
}

export function getV3PlacementPreview(
  state: V3GameState,
  type: BuildingType,
  level: number,
  x: number,
  y: number,
  ignoreId: string | null = null,
): V3PlacementPreview {
  return {
    cells: getV3FootprintCells(type, level, x, y),
    status: validateV3Placement(state, type, level, x, y, ignoreId) ?? 'valid',
  }
}

/** Upgrade preview: current footprint, the extra cells the next level needs, and the blocker. */
export function getV3UpgradePreview(state: V3GameState, buildingId: string) {
  const building = getV3Building(state, buildingId)
  if (!building) return null
  const current = getV3FootprintCells(building.type, building.level, building.x, building.y)
  const upgradable = building.level < 3 && V3_BUILDINGS[building.type].upgradeCostDollars !== null
  if (!upgradable) return { current, growth: [], status: 'max' as const }
  const next = getV3PlacementPreview(state, building.type, building.level + 1, building.x, building.y, building.id)
  const occupied = new Set(current.map((cell) => `${cell.x},${cell.y}`))
  return { current, growth: next.cells.filter((cell) => !occupied.has(`${cell.x},${cell.y}`)), status: next.status }
}

export type V3BuildingView = V3Rect & { id: string; type: BuildingType; level: number }

export function getV3BuildingViews(state: V3GameState): V3BuildingView[] {
  return listV3Buildings(state).map((building) => {
    const footprint = getV3Footprint(building.type, building.level) ?? { w: 1, h: 1 }
    return { id: building.id, type: building.type, level: building.level, x: building.x, y: building.y, w: footprint.w, h: footprint.h }
  })
}

// ---- Service-road layer (visual data only; not a production requirement) ----
export type V3RoadNodeKind = 'end' | 'straight' | 'corner' | 'tee' | 'cross'
export type V3RoadNode = { x: number; y: number; kind: V3RoadNodeKind; links: { n: boolean; e: boolean; s: boolean; w: boolean } }

/**
 * Roads run along the tile-grid lines of the owned land outline and the seams
 * between owned parcels. Returned as grid-line nodes classified for future
 * straight/corner/junction/edge tiles; nothing here blocks placement.
 */
export function deriveV3RoadNetwork(state: V3GameState): V3RoadNode[] {
  const segments = new Set<string>()
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const [a, b] = [`${x1},${y1}`, `${x2},${y2}`].sort()
    segments.add(`${a}|${b}`)
  }
  for (const id of state.world.unlockedParcelIds) {
    const parcel = V3_LAND_PARCELS.find((entry) => entry.id === id)
    if (!parcel) continue
    for (let x = parcel.x; x < parcel.x + parcel.w; x++) {
      add(x, parcel.y, x + 1, parcel.y)
      add(x, parcel.y + parcel.h, x + 1, parcel.y + parcel.h)
    }
    for (let y = parcel.y; y < parcel.y + parcel.h; y++) {
      add(parcel.x, y, parcel.x, y + 1)
      add(parcel.x + parcel.w, y, parcel.x + parcel.w, y + 1)
    }
  }
  const nodes = new Map<string, V3RoadNode>()
  const node = (x: number, y: number) => {
    const key = `${x},${y}`
    if (!nodes.has(key)) nodes.set(key, { x, y, kind: 'end', links: { n: false, e: false, s: false, w: false } })
    return nodes.get(key)!
  }
  for (const segment of segments) {
    const [a, b] = segment.split('|').map((point) => point.split(',').map(Number))
    const start = node(a[0], a[1])
    const end = node(b[0], b[1])
    if (a[0] === b[0]) { start.links.s = true; end.links.n = true } else { start.links.e = true; end.links.w = true }
  }
  for (const entry of nodes.values()) {
    const { n, e, s, w } = entry.links
    const count = [n, e, s, w].filter(Boolean).length
    entry.kind = count >= 4 ? 'cross' : count === 3 ? 'tee' : count === 2 ? ((n && s) || (e && w) ? 'straight' : 'corner') : 'end'
  }
  return [...nodes.values()].sort((a, b) => a.y - b.y || a.x - b.x)
}

// ---- Isometric projection (Kairosoft-style diamond tiles, art-independent) ----
export const V3_ISO = { tw: 64, th: 32 } as const

export function v3IsoPoint(x: number, y: number): { sx: number; sy: number } {
  return { sx: (x - y) * V3_ISO.tw / 2, sy: (x + y) * V3_ISO.th / 2 }
}

/** Inverse projection: screen/world pixel → tile containing it. */
export function v3IsoToTile(sx: number, sy: number): { x: number; y: number } {
  const a = sx / (V3_ISO.tw / 2)
  const b = sy / (V3_ISO.th / 2)
  return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) }
}

/** Diamond corners of a tile rectangle (top, right, bottom, left). */
export function v3IsoRect(rect: V3Rect): Array<{ sx: number; sy: number }> {
  return [
    v3IsoPoint(rect.x, rect.y),
    v3IsoPoint(rect.x + rect.w, rect.y),
    v3IsoPoint(rect.x + rect.w, rect.y + rect.h),
    v3IsoPoint(rect.x, rect.y + rect.h),
  ]
}

/** Pixel bounds of drawn land after projection (camera limits). */
export function getV3IsoBounds(state: V3GameState): { minX: number; minY: number; maxX: number; maxY: number } {
  const corners = getV3ParcelViews(state).flatMap((parcel) => v3IsoRect(parcel))
  return {
    minX: Math.min(...corners.map((corner) => corner.sx)),
    minY: Math.min(...corners.map((corner) => corner.sy)),
    maxX: Math.max(...corners.map((corner) => corner.sx)),
    maxY: Math.max(...corners.map((corner) => corner.sy)),
  }
}

/**
 * Sprite placement for a building: square art whose base diamond sits on the
 * footprint. Returned in draw order (back to front) so overlaps look right.
 */
export function getV3SpritePlacements(state: V3GameState): Array<V3BuildingView & { px: number; py: number; size: number; depth: number }> {
  return getV3BuildingViews(state).map((building) => {
    const [top, right, bottom, left] = v3IsoRect(building)
    const width = right.sx - left.sx
    const size = width * 1.3
    const centerX = (left.sx + right.sx) / 2
    void top
    return { ...building, px: centerX - size / 2, py: bottom.sy - size * 0.92, size, depth: building.x + building.w + building.y + building.h }
  }).sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id))
}

// ---- In-game calendar: 1 month = 60 s simulated; 1 year = 12 months = one award period ----
export const V3_TICKS_PER_MONTH = 300
export function getV3Calendar(tickCount: number): { year: number; month: number; week: number } {
  const months = Math.floor(tickCount / V3_TICKS_PER_MONTH)
  return {
    year: Math.floor(months / 12) + 1,
    month: (months % 12) + 1,
    week: Math.floor((tickCount % V3_TICKS_PER_MONTH) / (V3_TICKS_PER_MONTH / 4)) + 1,
  }
}
