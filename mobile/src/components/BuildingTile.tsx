import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BuildingType } from '../game/types'
import { BUILDINGS } from '../game/data/buildings'
import { BUILDING_COLORS } from '../buildingColors'
import { colors, radii } from '../theme'

type BuildingTileProps = {
  type: BuildingType | null
  level: number
  size: number
  onPress?: () => void
}

function BuildingTile({ type, level, size, onPress }: BuildingTileProps) {
  if (!type) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.tile, styles.empty, { width: size, height: size }]}
      >
        <Text style={styles.plus}>+</Text>
      </Pressable>
    )
  }

  const config = BUILDINGS[type]
  const bg = BUILDING_COLORS[type]

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width: size, height: size, backgroundColor: bg }]}
    >
      <Text style={styles.shortName}>{config.shortName}</Text>
      {level > 1 && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv{level}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    margin: 3,
  },
  empty: {
    backgroundColor: colors.cream,
    borderColor: colors.creamBorder,
    borderStyle: 'dashed',
  },
  plus: {
    color: colors.creamBorder,
    fontSize: 22,
    fontWeight: '700',
  },
  shortName: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  levelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
})

export default BuildingTile
