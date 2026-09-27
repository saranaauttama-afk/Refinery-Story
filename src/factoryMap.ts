/**
 * Canonical factory-world geometry.
 *
 * The playable yard is authored as a small isometric tile map instead of a
 * collection of screen-space diamonds. One plant lot occupies a 2x2 block of
 * micro tiles and every pair of lots is separated by a one-tile service road:
 *
 *   road | lot lot | road | lot lot | ... | road
 *
 * Five lots plus their six road bands produce the planned 16x16 yard. The
 * late-game 6x6 expansion adds one outer band, but the original 25 slot IDs
 * and their contact points never move.
 */

export const FACTORY_MAP_VERSION = 2

export const FACTORY_WORLD_WIDTH = 1216
export const FACTORY_WORLD_HEIGHT = 2160

export const FACTORY_MICRO_TILE_WIDTH = 64
export const FACTORY_MICRO_TILE_HEIGHT = 32
export const FACTORY_PLANNED_GRID_SIZE = 5
export const FACTORY_MAX_GRID_SIZE = 6
export const FACTORY_LOT_TILE_SIZE = 2
export const FACTORY_ROAD_TILE_SIZE = 1
export const FACTORY_SLOT_STRIDE = FACTORY_LOT_TILE_SIZE + FACTORY_ROAD_TILE_SIZE
export const FACTORY_YARD_TILE_SIZE =
  FACTORY_MAX_GRID_SIZE * FACTORY_LOT_TILE_SIZE +
  (FACTORY_MAX_GRID_SIZE + 1) * FACTORY_ROAD_TILE_SIZE

export const FACTORY_YARD_TOP = 1100
export const FACTORY_YARD_LEFT = 0

export type FactoryTerrainKind = 'road' | 'lot'

export type FactoryTerrainTile = {
  row: number
  col: number
  x: number
  y: number
  kind: FactoryTerrainKind
  roadAlongRow: boolean
  roadAlongCol: boolean
  diagonal: number
}

export type FactoryMapSlot = {
  id: string
  row: number
  col: number
  unlockTier: 1 | 2 | 3
  topX: number
  topY: number
  centerX: number
  centerY: number
  footX: number
  footY: number
  width: number
  height: number
}

export function factoryTileX(row: number, col: number) {
  return FACTORY_YARD_LEFT +
    (col - row + FACTORY_YARD_TILE_SIZE - 1) * (FACTORY_MICRO_TILE_WIDTH / 2)
}

export function factoryTileY(row: number, col: number) {
  return FACTORY_YARD_TOP + (row + col) * (FACTORY_MICRO_TILE_HEIGHT / 2)
}

function isRoadBand(index: number) {
  return index % FACTORY_SLOT_STRIDE === 0
}

export function getFactoryTerrainTiles(displayGridSize: number): FactoryTerrainTile[] {
  const safeSize = Math.max(
    FACTORY_PLANNED_GRID_SIZE,
    Math.min(FACTORY_MAX_GRID_SIZE, displayGridSize),
  )
  const visibleTileSize =
    safeSize * FACTORY_LOT_TILE_SIZE +
    (safeSize + 1) * FACTORY_ROAD_TILE_SIZE
  return Array.from(
  { length: visibleTileSize * visibleTileSize },
  (_, index) => {
    const row = Math.floor(index / visibleTileSize)
    const col = index % visibleTileSize
    return {
      row,
      col,
      x: factoryTileX(row, col),
      y: factoryTileY(row, col),
      kind: (isRoadBand(row) || isRoadBand(col) ? 'road' : 'lot') as FactoryTerrainKind,
      // A row band travels along increasing columns; a column band travels
      // along increasing rows. Keeping both flags makes true four-way road
      // intersections distinguishable from ordinary straight road pieces.
      roadAlongRow: isRoadBand(row),
      roadAlongCol: isRoadBand(col),
      diagonal: row + col,
    }
  },
).sort((a, b) => a.diagonal - b.diagonal || a.row - b.row)
}

function slotUnlockTier(row: number, col: number): 1 | 2 | 3 {
  const size = Math.max(row, col) + 1
  if (size <= 3) return 1
  if (size === 4) return 2
  return 3
}

export const FACTORY_MAP_SLOTS: FactoryMapSlot[] = Array.from(
  { length: FACTORY_MAX_GRID_SIZE * FACTORY_MAX_GRID_SIZE },
  (_, index) => {
    const row = Math.floor(index / FACTORY_MAX_GRID_SIZE)
    const col = index % FACTORY_MAX_GRID_SIZE
    const tileRow = FACTORY_ROAD_TILE_SIZE + row * FACTORY_SLOT_STRIDE
    const tileCol = FACTORY_ROAD_TILE_SIZE + col * FACTORY_SLOT_STRIDE
    const topX = factoryTileX(tileRow, tileCol) + FACTORY_MICRO_TILE_WIDTH / 2
    const topY = factoryTileY(tileRow, tileCol)
    const width = FACTORY_MICRO_TILE_WIDTH * FACTORY_LOT_TILE_SIZE
    const height = FACTORY_MICRO_TILE_HEIGHT * FACTORY_LOT_TILE_SIZE
    return {
      id: `${String.fromCharCode(65 + row)}${col + 1}`,
      row,
      col,
      unlockTier: slotUnlockTier(row, col),
      topX,
      topY,
      centerX: topX,
      centerY: topY + height / 2,
      footX: topX,
      footY: topY + height / 2 + 4,
      width,
      height,
    }
  },
).sort((a, b) => a.row + a.col - (b.row + b.col) || a.row - b.row)

/** Maps one permanent 5x5 world slot to the current square gameplay array. */
export function getActiveGridIndex(slot: FactoryMapSlot, activeGridSize: number) {
  if (slot.row >= activeGridSize || slot.col >= activeGridSize) return null
  return slot.row * activeGridSize + slot.col
}

export function pointIsInsideFactorySlot(x: number, y: number, slot: FactoryMapSlot) {
  const halfWidth = slot.width / 2
  const halfHeight = slot.height / 2
  return (
    Math.abs(x - slot.centerX) / halfWidth +
    Math.abs(y - slot.centerY) / halfHeight
  ) <= 1
}
