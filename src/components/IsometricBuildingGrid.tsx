import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import type { BuildingType, GridCell } from '../game/types'
import BuildingTile from './BuildingTile'

// Buildings that are part of the core crude -> gasoline / feedstock ->
// product chain -- these get the "actively producing" pulse glow when the
// refinery has crude to process. Storage/support buildings (product tank,
// laboratory, maintenance workshop, sales office) don't pulse.
const PRODUCTION_BUILDING_TYPES = new Set<BuildingType>([
  'crudeTank',
  'distillationUnit',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
])

type IsometricBuildingGridProps = {
  grid: GridCell[]
  gridLevels: number[]
  tileSize: number
  onCellPress?: (index: number) => void
  isActive?: boolean
  employeeCount?: number
}

// Converts a (row, col) grid index into an isometric screen position.
// Standard 2:1 isometric projection -- each cell is offset half a tile
// width left/right based on (col - row), and half a tile height down
// based on (col + row), producing the classic diamond-shaped board
// layout (NOT a rotated/skewed tile shape -- the tiles themselves stay
// upright squares; existing isometric-ART tiles like the 9 building
// icons already depict their 3D angle WITHIN the square art, so the
// square doesn't need to be rotated to read as isometric).
function getIsoPosition(index: number, cols: number, tileWidth: number, tileHeight: number) {
  const row = Math.floor(index / cols)
  const col = index % cols
  const x = (col - row) * (tileWidth / 2)
  const y = (col + row) * (tileHeight / 2)
  // Depth (row + col) determines stacking order -- cells "closer to the
  // camera" (higher row+col, i.e. further down-right in grid terms) need
  // to draw on top of cells further away, so buildings never look like
  // they're poking through a neighbor that should be in front of them.
  const depth = row + col
  return { row, col, x, y, depth }
}

// Bounding box of the whole isometric diamond, used by the caller to size
// ZoomableGridCanvas's contentWidth/contentHeight so pan-clamping bounds
// match the actual rendered shape (which is wider than a plain square
// grid of the same tile count, since the diamond fans out sideways).
export function getIsometricBounds(gridLength: number, tileWidth: number, tileHeight: number) {
  const cols = Math.round(Math.sqrt(gridLength))
  const rows = cols
  const minX = (0 - (rows - 1)) * (tileWidth / 2)
  const maxX = (cols - 1) * (tileWidth / 2)
  const maxY = (cols - 1 + (rows - 1)) * (tileHeight / 2)
  return {
    width: maxX - minX + tileWidth,
    height: maxY + tileHeight,
    // Offset to add to every tile's x position so the leftmost tile's
    // left edge sits at x=0 within the bounding box (tiles are
    // positioned with negative x for the upper-left half of the
    // diamond otherwise).
    xOffset: -minX,
  }
}

function IsometricBuildingGrid({
  grid,
  gridLevels,
  tileSize,
  onCellPress,
  isActive,
  employeeCount,
}: IsometricBuildingGridProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const bounds = getIsometricBounds(grid.length, tileSize, tileSize)

  return (
    <View style={[styles.wrap, { width: bounds.width, height: bounds.height }]}>
      {grid.map((cell, i) => {
        const { x, y, depth } = getIsoPosition(i, cols, tileSize, tileSize)
        const isProducing = Boolean(isActive && cell && PRODUCTION_BUILDING_TYPES.has(cell))
        return (
          <View
            key={i}
            style={[
              styles.tileWrap,
              {
                left: x + bounds.xOffset,
                top: y,
                width: tileSize,
                height: tileSize,
                zIndex: depth,
              },
            ]}
          >
            <BuildingTile
              type={cell}
              level={gridLevels[i] ?? 1}
              size={tileSize}
              onPress={() => onCellPress?.(i)}
              active={isProducing}
              showWorker={isProducing && Boolean(employeeCount && employeeCount > 0)}
            />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  tileWrap: {
    position: 'absolute',
  },
})

// Memoized for the same reason as the old BuildingGrid -- game.grid/
// gridLevels keep the same array reference across ticks unless a
// building is actually placed/moved/upgraded, so this skips
// re-rendering every tile on ticks where nothing on the grid changed.
export default memo(IsometricBuildingGrid)
