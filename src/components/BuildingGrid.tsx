import { StyleSheet, View } from 'react-native'
import { getTileStaffBadge, getTileStatusBadge } from '../buildingIdentity'
import type { BuildingType, DerivedStats, GameState, GridCell } from '../game/types'
import BuildingTile from './BuildingTile'
import { colors, radii, spacing } from '../theme'

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

type BuildingGridProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
  // True when the refinery is actively running (crudeOil > 0) -- gates the
  // production-pulse glow on PRODUCTION_BUILDING_TYPES tiles.
  isActive?: boolean
}

function BuildingGrid({ game, derived, grid, gridLevels, containerWidth, onCellPress, isActive }: BuildingGridProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const padding = spacing.md * 2
  const tileMargin = 3 * 2 // BuildingTile's margin on each side
  const tileSize = (containerWidth - padding) / cols - tileMargin

  return (
    <View style={styles.wrap}>
      {grid.map((cell, i) => {
        const isProducing = Boolean(isActive && cell && PRODUCTION_BUILDING_TYPES.has(cell))
        const staffBadge = cell ? getTileStaffBadge(game, i) : null
        const statusBadge = cell ? getTileStatusBadge(cell, i, game, derived) : null
        return (
          <BuildingTile
            key={i}
            type={cell}
            level={gridLevels[i] ?? 1}
            size={tileSize}
            onPress={() => onCellPress?.(i)}
            active={isProducing}
            staffBadge={staffBadge}
            statusBadge={statusBadge}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.ground,
    borderRadius: radii.lg,
    padding: spacing.sm,
    justifyContent: 'center',
  },
})

export default BuildingGrid
