import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated'
import { colors, radii, spacing } from '../theme'

export type HeadlineData = {
  icon: string
  title: string
  body: string
}

type Props = {
  headline: HeadlineData | null
  onDismiss: () => void
}

const MILESTONE_HEADLINES: Partial<Record<string, HeadlineData>> = {
  firstFuel:             { icon: '⛽', title: 'First Barrels Out!',       body: 'Your refinery produces its first gasoline. History starts here.' },
  refineryLevel5:        { icon: '📈', title: 'Regional Supplier',         body: 'Recognition grows — your refinery is now a regional presence.' },
  industrialProducer:    { icon: '🏭', title: 'Industrial Scale',          body: 'Output reaches industrial levels. The competition notices.' },
  tierThreeContractor:   { icon: '🤝', title: 'Major Contract Signed',     body: 'Your first Tier 3 deal puts you on the national map.' },
  jetFuelPioneer:        { icon: '✈️', title: 'Aviation Fuel Online',      body: 'New market unlocked. Airlines are watching.' },
  petrochemicalPioneer:  { icon: '🧪', title: 'Petrochem Expansion',       body: 'Downstream chemicals open a new revenue stream.' },
  productMogul:          { icon: '👑', title: 'Product Mogul',             body: 'Your refinery spans the full product portfolio.' },
}

export { MILESTONE_HEADLINES }

export default function MilestoneHeadline({ headline, onDismiss }: Props) {
  const translateY = useSharedValue(-120)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (!headline) return
    translateY.value = withSpring(0, { damping: 16, stiffness: 180 })
    opacity.value = withTiming(1, { duration: 200 })
    const timer = setTimeout(() => {
      opacity.value = withDelay(400, withTiming(0, { duration: 300 }))
      translateY.value = withDelay(400, withTiming(-120, { duration: 300 }))
      setTimeout(onDismiss, 750)
    }, 4000)
    return () => clearTimeout(timer)
  }, [headline])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!headline) return null

  return (
    <Animated.View style={[styles.wrap, animStyle]} pointerEvents="box-none">
      <Pressable style={styles.card} onPress={onDismiss}>
        <Text style={styles.icon}>{headline.icon}</Text>
        <View style={styles.text}>
          <Text style={styles.title}>{headline.title}</Text>
          <Text style={styles.body}>{headline.body}</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 90,
  },
  card: {
    backgroundColor: '#1C2634',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  icon: { fontSize: 28 },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '900', color: colors.gold, letterSpacing: 0.2 },
  body: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 16 },
})
