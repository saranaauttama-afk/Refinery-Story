import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import {
  BUILDING_CATEGORY_ACCENT,
  BUILDING_CATEGORY_BY_TYPE,
  BUILDING_CATEGORY_SURFACE,
  BUILDING_TILE_ICONS,
  type TileStatusBadge,
} from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { BuildingType } from '../game/types'
import { colors, radii } from '../theme'
import BuildingSilhouette from './BuildingSilhouette'

type BuildingTileProps = {
  type: BuildingType | null
  level: number
  size: number
  onPress?: () => void
  active?: boolean
  staffBadge?: string | null
  statusBadge?: TileStatusBadge | null
}

function BuildingTile({ type, level, size, onPress, active, staffBadge, statusBadge }: BuildingTileProps) {
  const glow = useRef(new Animated.Value(0.25)).current

  useEffect(() => {
    if (!active) {
      glow.setValue(0.25)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.25, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, glow])

  if (!type) {
    return (
      <Pressable onPress={onPress} style={[styles.tile, styles.empty, { width: size, height: size }]}>
        <Text style={styles.plus}>+</Text>
      </Pressable>
    )
  }

  const config = BUILDINGS[type]
  const category = BUILDING_CATEGORY_BY_TYPE[type]
  const accentColor = BUILDING_CATEGORY_ACCENT[category]
  const surfaceColor = BUILDING_CATEGORY_SURFACE[category]
  const Icon = BUILDING_TILE_ICONS[type]

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderColor: accentColor,
          backgroundColor: surfaceColor,
        },
      ]}
    >
      {active && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />}
      <View style={styles.innerShade} />
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <BuildingSilhouette
          type={type}
          size={size}
          accentColor={accentColor}
          surfaceColor={surfaceColor}
          Icon={Icon}
        />
      </View>
      {statusBadge ? (
        <View
          style={[
            styles.statusBadge,
            statusBadge.tone === 'blocked'
              ? styles.statusBadgeBlocked
              : statusBadge.tone === 'idle'
                ? styles.statusBadgeIdle
                : styles.statusBadgeWarning,
          ]}
        >
          <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
        </View>
      ) : null}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>L{level}</Text>
      </View>
      {staffBadge ? (
        <View style={styles.staffBadge}>
          <Text style={styles.staffBadgeText}>{staffBadge}</Text>
        </View>
      ) : null}
      <Text style={styles.shortName}>{config.shortName}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    margin: 3,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  innerShade: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 8,
    bottom: 4,
    borderRadius: radii.sm,
    backgroundColor: '#FFFFFF55',
  },
  empty: {
    backgroundColor: colors.cream,
    borderColor: colors.creamBorder,
    borderStyle: 'dashed',
    elevation: 0,
    shadowOpacity: 0,
  },
  plus: {
    color: colors.creamBorder,
    fontSize: 18,
    fontWeight: '600',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  content: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  shortName: {
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 7,
    letterSpacing: 0.3,
    opacity: 0.65,
  },
  levelBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  levelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  staffBadge: {
    position: 'absolute',
    left: 2,
    bottom: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  staffBadgeText: {
    fontSize: 10,
  },
  statusBadge: {
    position: 'absolute',
    left: 2,
    top: 2,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusBadgeWarning: {
    backgroundColor: colors.orangeDark,
  },
  statusBadgeBlocked: {
    backgroundColor: colors.red,
  },
  statusBadgeIdle: {
    backgroundColor: colors.steelMid,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
})

export default BuildingTile
