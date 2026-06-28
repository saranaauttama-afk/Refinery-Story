import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import ArtSlot from '../src/components/ArtSlot'
import { useGame } from '../src/hooks/GameContext'
import { useLang, useSettingsContext } from '../src/hooks/SettingsContext'
import { colors, radii, spacing } from '../src/theme'

const SPLASH_DURATION_MS = 1200

function Splash() {
  const fade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [fade])

  return (
    <View style={styles.splashScreen}>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛢️</Text>
        </View>
        <Text style={styles.logoTitle}>Refinery Story</Text>
        <Text style={styles.logoSubtitle}>build · refine · grow</Text>
      </Animated.View>
    </View>
  )
}

export default function MenuScreen() {
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  const { game, loaded, hasSave, resetGame } = useGame()
  const { settings } = useSettingsContext()
  const { t } = useLang()

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [])

  if (showSplash || !loaded) {
    return <Splash />
  }

  const startNewGame = () => {
    resetGame()
    router.push('/game')
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <ArtSlot
          id="menu_hero"
          width="100%"
          height={190}
          spec="1080×600"
          caption="Refinery skyline at sunrise"
          imageStyle={styles.heroImage}
        />
        <Text style={[styles.title, { marginTop: spacing.md }]}>Refinery Story</Text>
        <Text style={styles.subtitle}>build · refine · grow</Text>

        <View style={styles.menu}>
          {hasSave && (
            <View style={styles.saveCard}>
              <Text style={styles.saveCardTitle}>{game?.refineryName}</Text>
              <Text style={styles.saveCardSubtitle}>
                Level {game?.refineryLevel} · ${Math.floor(game?.money ?? 0).toLocaleString()}
              </Text>
            </View>
          )}

          <Pressable style={[styles.button, styles.primaryButton]} onPress={() => router.push('/game')}>
            <Text style={styles.primaryButtonLabel}>{hasSave ? 'Continue' : 'New Game'}</Text>
          </Pressable>

          {hasSave && (
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={startNewGame}>
              <Text style={styles.secondaryButtonLabel}>New Game (overwrite)</Text>
            </Pressable>
          )}

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/settings')}>
            <Text style={styles.secondaryButtonLabel}>⚙️ Settings</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/store')}>
            <Text style={styles.secondaryButtonLabel}>
              {settings.adsRemoved ? '✓ Ads removed -- Store' : '🛍️ Remove Ads / Store'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.version}>v0.1.0 · {t({ en: 'English', th: 'ภาษาไทย' })}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  splashScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 48,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },
  logoSubtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroImage: {
    borderWidth: 2,
    borderColor: colors.creamBorder,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
    marginBottom: spacing.xl,
    letterSpacing: 1,
  },
  menu: {
    width: '100%',
    gap: spacing.sm,
  },
  saveCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  saveCardTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15,
  },
  saveCardSubtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.green,
  },
  primaryButtonLabel: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  secondaryButton: {
    backgroundColor: colors.white,
  },
  secondaryButtonLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.ink,
  },
  version: {
    marginTop: spacing.xl,
    fontSize: 11,
    color: colors.inkMuted,
  },
})
