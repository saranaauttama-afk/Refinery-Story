import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'
import { colors, radii, spacing, OVERLAY_BANNER_TOP } from '../theme'

// Brief "Synergy!" toast that pops when a placement forms a positive adjacency
// pair (the green grid aura's companion feedback). Driven by an incrementing
// triggerKey from useGameLoop — remounts/replays on each new synergy, then
// fades itself out. Sits below the HUD like the other transient banners.
const VISIBLE_MS = 2200

export default function SynergyToast({ triggerKey }: { triggerKey: number }) {
  const { t } = useLang()
  const [shown, setShown] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (triggerKey <= 0) return
    setShown(true)
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start()
    const timeout = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setShown(false))
    }, VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [triggerKey, opacity])

  if (!shown) return null

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.title}>{t(text.synergyToast.title)}</Text>
      <Text style={styles.body}>{t(text.synergyToast.body)}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: OVERLAY_BANNER_TOP,
    alignSelf: 'center',
    backgroundColor: colors.green,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    zIndex: 50,
  },
  title: { fontWeight: '900', color: colors.ink, fontSize: 15 },
  body: { color: colors.ink, fontSize: 11, marginTop: 1, opacity: 0.85 },
})
