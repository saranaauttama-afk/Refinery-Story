import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors, radii } from '../theme'

export default function ProgressBar({
  current,
  target,
  color,
}: {
  current: number
  target: number
  // Defaults to the original green fill. Used by ProductionOverview to
  // give each product its own color, matching the product chip colors
  // used elsewhere on the Refinery tab.
  color?: string
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const widthPct = useRef(new Animated.Value(pct)).current

  useEffect(() => {
    Animated.timing(widthPct, { toValue: pct, duration: 400, useNativeDriver: false }).start()
  }, [pct, widthPct])

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          color ? { backgroundColor: color } : null,
          { width: widthPct.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.ground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
  },
})
