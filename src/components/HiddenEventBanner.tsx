import { useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import type { HiddenEventConfig } from '../game/types'
import { colors, radii, spacing, OVERLAY_BANNER_TOP } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'

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
  const { t } = useLang()
  const tb = text.hiddenEventBanner

  useEffect(() => {
    if (!event) return
    const timeout = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timeout)
  }, [event, onDismiss])

  if (!event) return null

  // Points at the *current* tabs — the build picker lives on the Factory,
  // contracts on the Contracts tab, staff on Recruit (the old "Business" /
  // "Staff" tabs this used to name no longer exist).
  const where =
    event.reward.kind === 'contract'
      ? tb.whereContract
      : event.reward.kind === 'building'
        ? tb.whereBuilding
        : tb.whereStaff

  return (
    <Pressable style={styles.banner} onPress={onDismiss}>
      <Text style={styles.title}>{t(tb.title)}</Text>
      <Text style={styles.message}>{t(tb.message(where))}</Text>
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
