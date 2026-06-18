import { type ReactNode, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
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
  expandedHeightRatio = 0.48,
  title,
  bottomOffset = 0,
}: BottomDrawerProps) {
  const expandedHeight = SCREEN_HEIGHT * expandedHeightRatio
  // translateY is relative to the EXPANDED position: 0 = fully expanded,
  // (expandedHeight - peekHeight) = collapsed (peeking).
  const collapsedTranslateY = expandedHeight - peekHeight
  const translateY = useSharedValue(collapsedTranslateY)
  const startY = useSharedValue(collapsedTranslateY)
  // Plain (non-worklet) React state mirroring whether the drawer is
  // expanded, used only to decide whether to show the "▾ Close" button --
  // per explicit feedback, dragging down was the ONLY way to collapse the
  // drawer, and with no visible close affordance the expanded state
  // (roughly half the screen, solid background) read as "opened a whole
  // new page with no way back" rather than a panel on the same screen.
  const [isExpanded, setIsExpanded] = useState(false)

  const snapTo = (target: 'expanded' | 'collapsed') => {
    translateY.value = withSpring(target === 'collapsed' ? collapsedTranslateY : 0, {
      damping: 18,
      stiffness: 180,
    })
    setIsExpanded(target === 'expanded')
  }

  const panGesture = Gesture.Pan()
    // Same reasoning as ZoomableGridCanvas's pan gesture: without a
    // minimum-drag-distance threshold, RNGH's pan gesture can claim a
    // plain tap before it reaches the Pressable underneath (the handle
    // area's tap-to-expand/collapse), since both are on the same element.
    .minDistance(10)
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
      setIsExpanded(!shouldCollapse)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.drawer, { height: expandedHeight, bottom: bottomOffset }, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <Pressable
          style={styles.handleArea}
          onPress={() => snapTo(isExpanded ? 'collapsed' : 'expanded')}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {isExpanded && <Text style={styles.closeHint}>▾ Tap or drag down to close</Text>}
          </View>
        </Pressable>
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
  titleRow: {
    alignItems: 'center',
  },
  closeHint: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.blue,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
})

export default BottomDrawer
