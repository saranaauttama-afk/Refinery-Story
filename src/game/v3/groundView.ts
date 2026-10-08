/**
 * Ground layer model for the yard (pure, RN-free): which atlas cell each land
 * tile and ground decoration uses, and the island-edge faces that give the
 * land some depth. The atlas itself is assets/ground/ground_atlas.png, built
 * by tools/artkit/build_ground.py — keep the cell indices in sync with it.
 */
import type { V3DecorKind } from './decorData'
import { getV3DecorCells } from './decorData'
import type { V3GameState } from './types'
import { getV3ParcelViews, type V3ParcelView } from './yardView'

export const V3_GROUND_CELL = { w: 64, h: 32 } as const
export const V3_GROUND_GRASS = [0, 1, 2, 3] as const
export const V3_GROUND_ROAD_BASE = 4 // + connection mask (1 N, 2 E, 4 S, 8 W)
export const V3_GROUND_PARKING = 20
export const V3_GROUND_SIDEWALK = 21

/** Decorations drawn as ground tiles instead of placeholder diamonds. */
export const V3_GROUND_DECOR: ReadonlySet<V3DecorKind> = new Set<V3DecorKind>(['road', 'parkingLot', 'sidewalk'])

export type V3GroundTile = { x: number; y: number; cell: number }

const key = (x: number, y: number) => `${x},${y}`

/** Two-tone checkerboard grass (Kairosoft-style), with a few stable flower tiles. */
export function getV3GrassCell(x: number, y: number): number {
  const base = ((x + y) & 1) === 0 ? V3_GROUND_GRASS[0] : V3_GROUND_GRASS[2]
  const h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0
  return h % 17 === 0 ? base + 1 : base
}

/** Land tiles to draw (owned and purchasable parcels; locked ones stay dark placeholders). */
export function getV3LandTiles(parcels: V3ParcelView[]): V3GroundTile[] {
  const tiles: V3GroundTile[] = []
  for (const parcel of parcels) {
    if (parcel.state === 'locked') continue
    for (let y = parcel.y; y < parcel.y + parcel.h; y++) {
      for (let x = parcel.x; x < parcel.x + parcel.w; x++) tiles.push({ x, y, cell: getV3GrassCell(x, y) })
    }
  }
  return tiles
}

/**
 * Ground decorations as atlas tiles. Roads pick their piece from which of the
 * four neighbours are road or parking (so junctions and bends draw themselves).
 */
export function getV3DecorGroundTiles(state: V3GameState): V3GroundTile[] {
  const drivable = new Set<string>()
  const placed: Array<{ x: number; y: number; kind: V3DecorKind }> = []
  for (const decoration of Object.values(state.world.decorations ?? {})) {
    if (!V3_GROUND_DECOR.has(decoration.kind)) continue
    for (const cell of getV3DecorCells(decoration.kind, decoration.rotated, decoration.x, decoration.y)) {
      placed.push({ ...cell, kind: decoration.kind })
      if (decoration.kind !== 'sidewalk') drivable.add(key(cell.x, cell.y))
    }
  }
  return placed.map(({ x, y, kind }) => {
    if (kind === 'sidewalk') return { x, y, cell: V3_GROUND_SIDEWALK }
    if (kind === 'parkingLot') return { x, y, cell: V3_GROUND_PARKING }
    const mask = (drivable.has(key(x, y - 1)) ? 1 : 0) | (drivable.has(key(x + 1, y)) ? 2 : 0)
      | (drivable.has(key(x, y + 1)) ? 4 : 0) | (drivable.has(key(x - 1, y)) ? 8 : 0)
    return { x, y, cell: V3_GROUND_ROAD_BASE + mask }
  })
}

/**
 * Front-facing land edges (screen bottom-left = south side, bottom-right =
 * east side) where the neighbouring tile is not drawn land. The renderer
 * extrudes them downward into soil faces.
 */
export function getV3LandEdges(tiles: V3GroundTile[]): { south: Array<{ x: number; y: number }>; east: Array<{ x: number; y: number }> } {
  const land = new Set(tiles.map((tile) => key(tile.x, tile.y)))
  const south: Array<{ x: number; y: number }> = []
  const east: Array<{ x: number; y: number }> = []
  for (const tile of tiles) {
    if (!land.has(key(tile.x, tile.y + 1))) south.push({ x: tile.x, y: tile.y })
    if (!land.has(key(tile.x + 1, tile.y))) east.push({ x: tile.x, y: tile.y })
  }
  return { south, east }
}

export function getV3GroundModel(state: V3GameState) {
  const parcels = getV3ParcelViews(state)
  const land = getV3LandTiles(parcels)
  return { land, edges: getV3LandEdges(land) }
}
