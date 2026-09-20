import { useEffect, useMemo } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '../theme'

// Procedural, asset-free confetti burst for celebration moments (milestone,
// win, combo, top-grade year). Mounted globally in GlobalOverlays; pass a
// `burstKey` that increments each time you want a fresh burst -- the piece
// container is keyed on it, so it remounts and replays cleanly even on
// back-to-back celebrations. pointerEvents none, so it never blocks taps.

const PIECE_COLORS = [
  colors.gold,
  colors.orange,
  colors.green,
  colors.blue,
  colors.purple,
  colors.teal,
  colors.red,
]
const PIECE_COUNT = 28
const FALL_MS = 2200

type PieceSpec = {
  startX: number
  dx: number
  dy: number
  rotateTo: number
  delay: number
  color: string
  size: number
}

function ConfettiPiece({ piece }: { piece: PieceSpec }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: FALL_MS, easing: Easing.out(Easing.quad) }),
    )
  }, [piece, progress])

  const style = useAnimatedStyle(() => {
    const t = progress.value
    const opacity = t < 0.1 ? t / 0.1 : t > 0.75 ? Math.max(0, (1 - t) / 0.25) : 1
    return {
      opacity,
      transform: [
        { translateX: piece.dx * t },
        { translateY: piece.dy * t },
        { rotate: `${piece.rotateTo * t}deg` },
      ],
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        { left: piece.startX, width: piece.size, height: piece.size * 0.6, backgroundColor: piece.color },
        style,
      ]}
    />
  )
}

export default function Confetti({ burstKey }: { burstKey: number }) {
  const { width, height } = useWindowDimensions()

  const pieces = useMemo<PieceSpec[]>(() => {
    if (!burstKey) return []
    return Array.from({ length: PIECE_COUNT }, () => ({
      startX: Math.random() * width,
      dx: (Math.random() - 0.5) * 120,
      dy: height * (0.55 + Math.random() * 0.45),
      rotateTo: (Math.random() - 0.5) * 720,
      delay: Math.random() * 300,
      color: PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
      size: 7 + Math.random() * 6,
    }))
    // width/height intentionally excluded: we only want a fresh roll on a new
    // burst, not a re-roll on every rotation/resize mid-celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey])

  if (pieces.length === 0) return null

  return (
    <View key={burstKey} style={styles.layer} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  piece: {
    position: 'absolute',
    top: -16,
    borderRadius: 2,
  },
})
