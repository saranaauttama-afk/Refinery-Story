import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { colors, radii, spacing } from '../theme'

type ZoomableGridCanvasProps = {
  children: React.ReactNode
  // Natural (unscaled) size of the content being panned/zoomed, so pan
  // bounds can be computed relative to the viewport. If omitted, pan is
  // unbounded (content can be dragged arbitrarily far).
  contentWidth?: number
  contentHeight?: number
  minScale?: number
  maxScale?: number
}

// Full-screen pannable + pinch-zoomable wrapper for the building grid (the
// "background layer" the floating HUD sits on top of -- see the Refinery
// tab redesign discussion). Uses the still-supported (if newer-API-
// deprecated) Gesture.Pan()/Gesture.Pinch() builder API rather than
// react-native-gesture-handler's brand-new v3 hook-based gestures
// (usePanGesture/usePinchGesture) -- those are too new/under-documented
// to risk on a feature this central to the whole app; the builder API is
// years-proven and still fully functional, just flagged for eventual
// replacement in a future major version.
//
// Gestures run entirely on the UI thread via Reanimated shared values (no
// JS-thread round-trip per frame), so panning/zooming stays smooth even
// while the game's 200ms tick loop is doing work on the JS thread.
function ZoomableGridCanvas({
  children,
  contentWidth,
  contentHeight,
  minScale = 0.6,
  maxScale = 2.5,
}: ZoomableGridCanvasProps) {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)
  const viewportWidth = useSharedValue(0)
  const viewportHeight = useSharedValue(0)

  // Clamps translateX/Y so the content can't be dragged so far that the
  // grid disappears off-screen entirely -- allows roughly half the
  // content's (scaled) size to go off either edge, not unlimited panning.
  const clampTranslation = () => {
    'worklet'
    if (!contentWidth || !contentHeight) return
    const scaledWidth = contentWidth * scale.value
    const scaledHeight = contentHeight * scale.value
    const maxX = Math.max(0, (scaledWidth - viewportWidth.value) / 2 + scaledWidth * 0.3)
    const maxY = Math.max(0, (scaledHeight - viewportHeight.value) / 2 + scaledHeight * 0.3)
    translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value))
    translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value))
  }

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        // Requires the finger to move at least this far before the pan
        // gesture activates -- without it, RNGH's pan gesture can win the
        // touch over a plain RN Pressable underneath (e.g. a building
        // tile), swallowing taps meant to open the build/info sheet.
        // 10px is enough to distinguish "tap" from "drag" without making
        // panning feel sluggish to start.
        .minDistance(10)
        .onUpdate((event) => {
          translateX.value = savedTranslateX.value + event.translationX
          translateY.value = savedTranslateY.value + event.translationY
        })
        .onEnd(() => {
          clampTranslation()
          savedTranslateX.value = translateX.value
          savedTranslateY.value = translateY.value
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          const next = savedScale.value * event.scale
          scale.value = Math.min(maxScale, Math.max(minScale, next))
        })
        .onEnd(() => {
          savedScale.value = scale.value
          clampTranslation()
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minScale, maxScale],
  )

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const handleLayout = (event: LayoutChangeEvent) => {
    viewportWidth.value = event.nativeEvent.layout.width
    viewportHeight.value = event.nativeEvent.layout.height
  }

  // Resets pan/zoom to the default framing. Exposed as a dedicated
  // function (wired to a small floating button in the Refinery tab)
  // rather than a double-tap gesture -- a double-tap gesture sitting in
  // the same touch-resolution chain as building tiles' plain Pressable
  // taps risks adding a confirmation delay (RNGH has to wait to see if a
  // second tap follows before releasing the touch to the tile below) to
  // the single most important interaction in the game. Not worth the
  // risk for a "nice to have" reset shortcut.
  function reset() {
    scale.value = withSpring(1)
    translateX.value = withSpring(0)
    translateY.value = withSpring(0)
    savedScale.value = 1
    savedTranslateX.value = 0
    savedTranslateY.value = 0
  }

  return (
    <View style={styles.viewport} onLayout={handleLayout}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
      <Pressable style={styles.resetButton} onPress={reset}>
        <Text style={styles.resetButtonLabel}>⤢</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    position: 'absolute',
    top: '50%',
    right: spacing.lg,
    width: 40,
    height: 40,
    marginTop: -20,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resetButtonLabel: {
    fontSize: 18,
    color: colors.ink,
  },
})

export default ZoomableGridCanvas
