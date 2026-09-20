import { StyleSheet, View } from 'react-native'
import { getTileStaffBadge, getTileStatusBadge } from '../buildingIdentity'
import type { BuildingType, DerivedStats, GameState, GridCell } from '../game/types'
import BuildingTile from './BuildingTile'
import { radii, spacing } from '../theme'

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
  const yardPadding = spacing.md
  const tileMargin = 4 * 2 // BuildingTile's margin on each side
  const tileSize = (containerWidth - yardPadding * 2) / cols - tileMargin
  const decorUnit = Math.max(10, Math.round(tileSize * 0.16))

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.decorLayer}>
        <View style={styles.yardZoneStorage} />
        <View style={styles.yardZoneProcess} />
        <View style={styles.yardZoneLogistics} />
        <View style={styles.serviceLaneHorizontal} />
        <View style={styles.serviceLaneVertical} />
        <View style={styles.pipeRun} />
        <View style={styles.pipeBranch} />
        <View style={[styles.tankClusterLarge, { width: decorUnit * 2.8, height: decorUnit * 2.8 }]} />
        <View style={[styles.tankClusterMedium, { width: decorUnit * 2.1, height: decorUnit * 2.1 }]} />
        <View style={[styles.tankClusterSmall, { width: decorUnit * 1.6, height: decorUnit * 1.6 }]} />
        <View style={styles.loadingStrip} />
      </View>
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
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#B7A47F',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#8E7B5F',
    padding: spacing.md,
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  decorLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  yardZoneStorage: {
    position: 'absolute',
    left: '4%',
    top: '6%',
    width: '27%',
    height: '24%',
    borderRadius: 28,
    backgroundColor: 'rgba(91, 141, 191, 0.10)',
    borderWidth: 2,
    borderColor: 'rgba(63, 110, 158, 0.22)',
  },
  yardZoneProcess: {
    position: 'absolute',
    right: '6%',
    top: '12%',
    width: '38%',
    height: '28%',
    borderRadius: 34,
    backgroundColor: 'rgba(232, 131, 58, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(201, 106, 31, 0.22)',
  },
  yardZoneLogistics: {
    position: 'absolute',
    left: '10%',
    right: '8%',
    bottom: '10%',
    height: '18%',
    borderRadius: 32,
    backgroundColor: 'rgba(50, 42, 32, 0.08)',
  },
  serviceLaneHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '32%',
    height: 10,
    backgroundColor: 'rgba(84, 71, 53, 0.18)',
  },
  serviceLaneVertical: {
    position: 'absolute',
    top: '20%',
    bottom: '8%',
    right: '21%',
    width: 8,
    backgroundColor: 'rgba(84, 71, 53, 0.12)',
  },
  pipeRun: {
    position: 'absolute',
    left: '28%',
    right: '16%',
    top: '18%',
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(137, 154, 168, 0.70)',
  },
  pipeBranch: {
    position: 'absolute',
    left: '52%',
    top: '18%',
    width: 6,
    height: '30%',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(137, 154, 168, 0.50)',
  },
  tankClusterLarge: {
    position: 'absolute',
    left: '8%',
    top: '12%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2,
    borderColor: 'rgba(91, 141, 191, 0.40)',
  },
  tankClusterMedium: {
    position: 'absolute',
    left: '16%',
    top: '17%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 2,
    borderColor: 'rgba(91, 141, 191, 0.28)',
  },
  tankClusterSmall: {
    position: 'absolute',
    left: '12%',
    top: '24%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(91, 141, 191, 0.24)',
  },
  loadingStrip: {
    position: 'absolute',
    right: '6%',
    bottom: '12%',
    width: '20%',
    height: 28,
    borderRadius: radii.md,
    backgroundColor: 'rgba(230, 224, 213, 0.62)',
    borderWidth: 2,
    borderColor: 'rgba(110, 126, 140, 0.38)',
  },
})

export default BuildingGrid
