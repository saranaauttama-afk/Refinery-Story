import { type ReactNode } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { colors, radii, spacing } from '../theme'

type BottomDrawerProps = {
  children: ReactNode
  // Height of the visible "peek" sliver when collapsed -- just enough to
  // show the handle + title, hinting there's more below without covering
  // the grid. Drag up past a threshold (or flick up) to snap to expanded.
  peekHeight?: number
  // Height when fully expanded -- as a fraction of screen height, since
  // this needs to leave room above for the floating top HUD and below for
  // the floating tab bar.
  expandedHeightRatio?: number
  title: string
  // Distance from the screen bottom to the drawer's bottom edge -- needs
  // to clear the floating tab bar (FLOATING_TAB_BAR_CLEARANCE from
  // theme.ts) so the collapsed "peek" sliver doesn't sit underneath it.
  bottomOffset?: number
}

const SCREEN_HEIGHT = Dimensions.get('window').height

// A persistent (not modal) bottom sheet for the Refinery tab's secondary
// information -- Production Overview, Current Contract, sell chips, Boost
// -- that doesn't need to permanently cover the grid the way it did when
// everything lived in one long ScrollView. Peeks a small sliver by
// default (grid stays mostly visible), drag the handle up to see
// everything, drag back down (or it springs back if released without
// crossing the snap threshold) to collapse again.
//
// Hand-rolled rather than a bottom-sheet library (none installed) --
// same Gesture.Pan() + Reanimated shared-value pattern as
// ZoomableGridCanvas, just animating a single translateY instead of a
// full pan+pinch transform.
function BottomDrawer({
  children,
  peekHeight = 64,
  expandedHeightRatio = 0.55,
  title,
  bottomOffset = 0,
}: BottomDrawerProps) {
  const expandedHeight = SCREEN_HEIGHT * expandedHeightRatio
  // translateY is relative to the EXPANDED position: 0 = fully expanded,
  // (expandedHeight - peekHeight) = collapsed (peeking).
  const collapsedTranslateY = expandedHeight - peekHeight
  const translateY = useSharedValue(collapsedTranslateY)
  const startY = useSharedValue(collapsedTranslateY)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value
    })
    .onUpdate((event) => {
      const next = startY.value + event.translationY
      translateY.value = Math.min(collapsedTranslateY, Math.max(0, next))
    })
    .onEnd((event) => {
      // Snap to whichever state (expanded/collapsed) is closer, with a
      // velocity nudge so a fast flick in either direction snaps that way
      // even from near the midpoint.
      const midpoint = collapsedTranslateY / 2
      const projected = translateY.value + event.velocityY * 0.1
      const shouldCollapse = projected > midpoint
      translateY.value = withSpring(shouldCollapse ? collapsedTranslateY : 0, {
        damping: 18,
        stiffness: 180,
      })
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.drawer, { height: expandedHeight, bottom: bottomOffset }, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
        </View>
      </GestureDetector>
      <View style={styles.body}>{children}</View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 2,
    borderColor: colors.creamBorder,
    elevation: 10,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.creamBorder,
  },
  title: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
  },
})

export default BottomDrawer
