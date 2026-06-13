import { StyleSheet, View } from 'react-native'
import type { GridCell } from '../game/types'
import BuildingTile from './BuildingTile'
import { colors, radii, spacing } from '../theme'

type BuildingGridProps = {
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
}

function BuildingGrid({ grid, gridLevels, containerWidth, onCellPress }: BuildingGridProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const padding = spacing.md * 2
  const tileMargin = 3 * 2 // BuildingTile's margin on each side
  const tileSize = (containerWidth - padding) / cols - tileMargin

  return (
    <View style={styles.wrap}>
      {grid.map((cell, i) => (
        <BuildingTile
          key={i}
          type={cell}
          level={gridLevels[i] ?? 1}
          size={tileSize}
          onPress={() => onCellPress?.(i)}
        />
      ))}
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
