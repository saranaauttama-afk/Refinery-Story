import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import { colors, spacing } from '../theme'
import type { FloatingNumberEntry } from '../hooks/useFloatingNumbers'

function FloatingNumberItem({ text, kind, lifetimeMs }: FloatingNumberEntry & { lifetimeMs: number }) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -36, duration: lifetimeMs, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: lifetimeMs, useNativeDriver: true }),
    ]).start()
  }, [translateY, opacity, lifetimeMs])

  return (
    <Animated.Text
      style={[
        styles.text,
        { color: kind === 'income' ? colors.greenDark : colors.red, opacity, transform: [{ translateY }] },
      ]}
    >
      {text}
    </Animated.Text>
  )
}

// Absolutely-positioned overlay, top-right of whatever screen renders it.
// Render once near the top of a screen's JSX; spawn() entries via
// useFloatingNumbers() from button handlers.
export default function FloatingNumbers({
  items,
  lifetimeMs,
}: {
  items: FloatingNumberEntry[]
  lifetimeMs: number
}) {
  if (items.length === 0) return null
  return (
    <View style={styles.container} pointerEvents="none">
      {items.map((item) => (
        <FloatingNumberItem key={item.id} {...item} lifetimeMs={lifetimeMs} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 4,
    right: spacing.lg,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
})
