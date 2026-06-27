import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { HiddenEventConfig } from '../game/types'
import { colors, radii, spacing, OVERLAY_BANNER_TOP } from '../theme'

type HiddenEventBannerProps = {
  event: HiddenEventConfig | null
  onDismiss: () => void
}

// Deliberately does NOT show event.name, event.revealMessage, or anything
// about the reward -- the whole point of a Hidden Event is that the
// player has to go find the "???" card on the relevant tab (Business for
// contracts, the build picker for buildings, Staff for staff) and tap it
// to reveal what happened. This banner is just a "go look" nudge.
function HiddenEventBanner({ event, onDismiss }: HiddenEventBannerProps) {
  useEffect(() => {
    if (!event) return
    const timeout = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timeout)
  }, [event, onDismiss])

  if (!event) return null

  const where =
    event.reward.kind === 'contract'
      ? 'Business tab'
      : event.reward.kind === 'building'
        ? 'Build menu'
        : 'Staff tab'

  return (
    <Pressable style={styles.banner} onPress={onDismiss}>
      <Text style={styles.title}>✨ Something happened...</Text>
      <Text style={styles.message}>Check the {where} for a mystery "???" entry.</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: OVERLAY_BANNER_TOP,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.purple,
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
  message: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
})

export default HiddenEventBanner
