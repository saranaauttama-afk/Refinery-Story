import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import type { BuildingType } from '../game/types'
import { BUILDINGS } from '../game/data/buildings'
import { BUILDING_COLORS } from '../buildingColors'
import { colors, radii } from '../theme'

type BuildingTileProps = {
  type: BuildingType | null
  level: number
  size: number
  onPress?: () => void
  // True if this building is part of the active production chain right
  // now (refinery has crude to process) -- shows a gentle pulsing glow.
  active?: boolean
  // True if staff are hired and this tile is active -- shows a small
  // bobbing "👷" worker badge. Minimal stand-in for a future walking-sprite
  // layer; purely decorative, no game-state changes.
  showWorker?: boolean
}

function BuildingTile({ type, level, size, onPress, active, showWorker }: BuildingTileProps) {
  const glow = useRef(new Animated.Value(0.25)).current
  const bob = useRef(new Animated.Value(0)).current

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

  useEffect(() => {
    if (!showWorker) {
      bob.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: 450, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [showWorker, bob])

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
      {active && <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />}
      <Text style={styles.shortName}>{config.shortName}</Text>
      {showWorker && (
        <Animated.Text
          pointerEvents="none"
          style={[styles.worker, { transform: [{ translateY: bob }] }]}
        >
          👷
        </Animated.Text>
      )}
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
  worker: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 12,
  },
})

export default BuildingTile
