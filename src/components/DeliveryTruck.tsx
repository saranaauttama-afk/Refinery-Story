import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '../theme'

// A little tanker truck that drives across the yard when the player trades:
// crude coming IN drives left->right (steel tank), gasoline going OUT drives
// right->left (amber tank). Asset-free -- drawn from plain Views. Mounted in
// the factory scene and keyed on a trigger counter so each trade replays a
// fresh drive-by. pointerEvents none; purely cosmetic "the yard is busy"
// motion.

type DeliveryTruckProps = {
  // Increment to launch a fresh drive-by. 0 = nothing shown yet.
  triggerKey: number
  direction: 'in' | 'out'
  // Scene width, so the truck can start/end fully offscreen.
  sceneWidth: number
  // Vertical position (px from top of the layer) for the truck.
  y: number
}

const TRUCK_WIDTH = 56
const TRAVEL_MS = 2000

export default function DeliveryTruck({ triggerKey, direction, sceneWidth, y }: DeliveryTruckProps) {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!triggerKey) return
    progress.value = 0
    progress.value = withTiming(1, { duration: TRAVEL_MS, easing: Easing.inOut(Easing.quad) })
  }, [triggerKey, progress])

  const startX = direction === 'in' ? -TRUCK_WIDTH : sceneWidth
  const endX = direction === 'in' ? sceneWidth : -TRUCK_WIDTH

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: startX + (endX - startX) * progress.value }],
    opacity: triggerKey ? 1 : 0,
  }))

  if (!triggerKey) return null

  const tankColor = direction === 'in' ? colors.steelMid : colors.gold
  const tankBorder = direction === 'in' ? colors.steelDark : colors.goldDark
  // Cab leads in the direction of travel.
  const flip = direction === 'out'

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { top: y }, style]}>
      <View style={[styles.truck, flip && styles.flipped]}>
        <View style={[styles.tank, { backgroundColor: tankColor, borderColor: tankBorder }]} />
        <View style={[styles.cab, { borderColor: tankBorder }]} />
        <View style={[styles.wheel, styles.wheelRear]} />
        <View style={[styles.wheel, styles.wheelFront]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    zIndex: 15,
  },
  truck: {
    width: TRUCK_WIDTH,
    height: 26,
    justifyContent: 'center',
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  tank: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 38,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  cab: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 16,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: colors.orange,
  },
  wheel: {
    position: 'absolute',
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  wheelRear: {
    left: 8,
  },
  wheelFront: {
    right: 6,
  },
})
