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
        <View style={styles.emptySlotGuide} />
        <View style={styles.emptyPad} />
        <Text style={styles.plus}>+</Text>
        <Text style={styles.emptyLabel}>BUILD</Text>
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
        styles.occupiedTile,
        {
          width: size,
          height: size,
          borderColor: active ? colors.gold : '#8E7B5F',
        },
      ]}
    >
      {active && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />}
      <View style={styles.padShadow} />
      <View style={styles.padBase} />
      <View style={[styles.padTint, { backgroundColor: surfaceColor }]} />
      <View style={styles.serviceStripe} />
      <View style={styles.pipeStrip} />
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
      <View style={styles.namePlate}>
        <Text style={styles.shortName}>{config.shortName}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    margin: 3,
    overflow: 'hidden',
  },
  occupiedTile: {
    backgroundColor: 'rgba(126,109,78,0.18)',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
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
  empty: {
    backgroundColor: 'rgba(183,164,127,0.20)',
    borderColor: 'rgba(118,100,73,0.34)',
    borderStyle: 'dashed',
    elevation: 0,
    shadowOpacity: 0,
  },
  emptySlotGuide: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(122,104,77,0.30)',
    backgroundColor: 'rgba(232,224,205,0.28)',
  },
  emptyPad: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(122,104,77,0.24)',
    backgroundColor: 'rgba(209,197,170,0.44)',
  },
  plus: {
    color: '#7A694F',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyLabel: {
    position: 'absolute',
    bottom: 6,
    color: 'rgba(79,67,51,0.62)',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  content: {
    position: 'absolute',
    top: 14,
    right: 12,
    bottom: 18,
    left: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  padShadow: {
    position: 'absolute',
    top: 10,
    right: 8,
    bottom: 8,
    left: 8,
    borderRadius: radii.sm,
    backgroundColor: '#6D5C42',
    opacity: 0.16,
  },
  padBase: {
    position: 'absolute',
    top: 7,
    right: 7,
    bottom: 10,
    left: 7,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#968468',
    backgroundColor: '#D2C6AE',
  },
  padTint: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 11,
    left: 8,
    borderRadius: radii.sm,
    opacity: 0.32,
  },
  serviceStripe: {
    position: 'absolute',
    top: 14,
    left: 11,
    right: 11,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(84,72,55,0.14)',
  },
  pipeStrip: {
    position: 'absolute',
    top: '42%',
    bottom: 20,
    left: 12,
    width: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(96,108,116,0.40)',
  },
  namePlate: {
    position: 'absolute',
    right: 7,
    bottom: 6,
    left: 7,
    minHeight: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74,64,50,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  shortName: {
    color: '#544733',
    fontWeight: '800',
    fontSize: 7,
    letterSpacing: 0.35,
    opacity: 0.84,
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
