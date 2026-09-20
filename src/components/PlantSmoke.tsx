import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

// Procedural "this plant is working" feedback: a few soft puffs that rise
// from the plant's chimney area and fade out, looping. Purely cosmetic and
// asset-free (just animated circles), driven by Reanimated. The caller only
// mounts this for plants that are actually producing this tick (see
// FactoryDiamondGroundView -> isSmoking), so a starved/idle/full plant goes
// visibly quiet -- the map reads its own state at a glance, Kairosoft-style.

type PlantSmokeProps = {
  // Cell width in px; smoke is centered horizontally on it.
  width: number
  // Cell-relative y (px) of the plant's top, where puffs originate. Usually
  // negative, since the plant art overflows above the tile box.
  topY: number
  // Soft smoke tint (sooty for power, pale steam for production/waste).
  color: string
}

const PUFFS = [
  { delay: 0, drift: -3 },
  { delay: 720, drift: 3 },
  { delay: 1440, drift: 0 },
]
const RISE = 30
const DRIFT_SCALE = 5
const DURATION = 2200
const PEAK_OPACITY = 0.4
const FADE_IN_FRACTION = 0.18
const PUFF_SIZE = 12

function SmokePuff({
  delay,
  drift,
  centerX,
  topY,
  color,
}: {
  delay: number
  drift: number
  centerX: number
  topY: number
  color: string
}) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    )
  }, [delay, progress])

  const style = useAnimatedStyle(() => {
    const p = progress.value
    const opacity =
      p < FADE_IN_FRACTION ? (p / FADE_IN_FRACTION) * PEAK_OPACITY : (1 - p) * PEAK_OPACITY
    return {
      opacity,
      transform: [
        { translateX: centerX - PUFF_SIZE / 2 + drift * DRIFT_SCALE * p },
        { translateY: topY - p * RISE },
        { scale: 0.5 + p * 0.9 },
      ],
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.puff, { backgroundColor: color }, style]}
    />
  )
}

export default function PlantSmoke({ width, topY, color }: PlantSmokeProps) {
  const centerX = width / 2
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PUFFS.map((puff, i) => (
        <SmokePuff
          key={i}
          delay={puff.delay}
          drift={puff.drift}
          centerX={centerX}
          topY={topY}
          color={color}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  puff: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PUFF_SIZE,
    height: PUFF_SIZE,
    borderRadius: PUFF_SIZE / 2,
  },
})
