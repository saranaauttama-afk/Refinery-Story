import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { HiddenComboConfig } from '../game/data/hiddenCombos'
import { colors, radii, spacing, OVERLAY_BANNER_TOP } from '../theme'

type ComboDiscoveryBannerProps = {
  combo: HiddenComboConfig | null
  onDismiss: () => void
}

function ComboDiscoveryBanner({ combo, onDismiss }: ComboDiscoveryBannerProps) {
  useEffect(() => {
    if (!combo) return
    const timeout = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timeout)
  }, [combo, onDismiss])

  if (!combo) return null

  const rewardParts = [`+$${combo.cashReward.toLocaleString()}`, `+${combo.rpReward} RP`]
  if (combo.reputationReward) rewardParts.push(`+${combo.reputationReward} Rep`)

  return (
    <Pressable style={styles.banner} onPress={onDismiss}>
      <Text style={styles.title}>🧩 Combo Found: {combo.name.en}</Text>
      <Text style={styles.message}>{combo.message.en}</Text>
      <Text style={styles.reward}>{rewardParts.join(' · ')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: OVERLAY_BANNER_TOP,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.teal,
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
  reward: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
})

export default ComboDiscoveryBanner
