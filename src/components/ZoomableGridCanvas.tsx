import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
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
          // Inlined rather than calling a separately-declared
          // clampTranslation() function -- a worklet calling into a
          // function declared OUTSIDE the gesture callback (even one
          // marked 'worklet') isn't guaranteed to be bundled into the
          // same UI-thread closure at compile time, and ended up adding
          // a noticeable cross-thread-call delay in testing (zoom/pan
          // felt like it was "catching up" a beat after the finger
          // moved, instead of tracking it live). Inlining the same
          // clamp math directly here and in the pinch gesture below
          // keeps everything in one worklet, no ambiguity.
          if (contentWidth && contentHeight) {
            const scaledWidth = contentWidth * scale.value
            const scaledHeight = contentHeight * scale.value
            const maxX = Math.max(0, (scaledWidth - viewportWidth.value) / 2 + scaledWidth * 0.3)
            const maxY = Math.max(0, (scaledHeight - viewportHeight.value) / 2 + scaledHeight * 0.3)
            translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value))
            translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value))
          }
          savedTranslateX.value = translateX.value
          savedTranslateY.value = translateY.value
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentWidth, contentHeight],
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
          if (contentWidth && contentHeight) {
            const scaledWidth = contentWidth * scale.value
            const scaledHeight = contentHeight * scale.value
            const maxX = Math.max(0, (scaledWidth - viewportWidth.value) / 2 + scaledWidth * 0.3)
            const maxY = Math.max(0, (scaledHeight - viewportHeight.value) / 2 + scaledHeight * 0.3)
            translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value))
            translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value))
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minScale, maxScale, contentWidth, contentHeight],
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
      {/* Static sky -> water gradient backdrop. Deliberately NOT inside
          the Animated.View that pans/zooms -- a real isometric scene
          would have its own ground/sky/sea baked into the artwork and
          panning would reveal more of it, but until that exists, this
          gradient acts as a fixed "horizon" behind the grid rather than
          panning/zooming WITH it (which would look like the sky itself
          was a draggable object, not a backdrop). */}
      <Svg style={styles.backdrop} width="100%" height="100%">
        <Defs>
          <LinearGradient id="skyToWater" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#9FD8F0" />
            <Stop offset="0.6" stopColor="#C9E8D8" />
            <Stop offset="0.67" stopColor="#5B8DBF" />
            <Stop offset="1" stopColor="#2C5C82" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#skyToWater)" />
      </Svg>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    // Pushes the grid up into roughly the top 2/3 of the canvas (the
    // "ground" portion of the sky->water gradient backdrop) instead of
    // sitting dead-center -- justifyContent 'center' would put it right
    // at the screen's vertical midpoint, straddling the gradient's
    // water transition. This is a coarse approximation until there's a
    // real isometric scene with actual ground/water art -- the grid
    // itself doesn't "know" about the gradient, this is just where the
    // empty space around it is biased toward.
    justifyContent: 'flex-start',
    paddingTop: '15%',
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
