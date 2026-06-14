import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EraConfig } from '../game/types'
import { colors, radii, spacing } from '../theme'

type EraBannerProps = {
  era: EraConfig | null
  onDismiss: () => void
}

function EraBanner({ era, onDismiss }: EraBannerProps) {
  useEffect(() => {
    if (!era) return
    const timeout = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timeout)
  }, [era, onDismiss])

  if (!era) return null

  return (
    <Pressable style={styles.banner} onPress={onDismiss}>
      <Text style={styles.title}>New Era: {era.name.en}</Text>
      <Text style={styles.tagline}>{era.tagline.en}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.md,
    zIndex: 50,
  },
  title: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  tagline: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
})

export default EraBanner
