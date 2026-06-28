import { useEffect, useRef, useState } from 'react'
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang, useSettingsContext } from '../src/hooks/SettingsContext'
import { colors, radii, spacing } from '../src/theme'

// Full-bleed title art (logo + refinery scene baked in), used for both the
// splash and the menu background — the menu just lays its buttons over the
// lower third.
const MENU_BG = require('../assets/bg/menu_bg.png')
const SPLASH_DURATION_MS = 1200

function Splash() {
  const fade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [fade])

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      <ImageBackground source={MENU_BG} resizeMode="cover" style={styles.fill} />
    </Animated.View>
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
    <ImageBackground source={MENU_BG} resizeMode="cover" style={styles.fill}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.bottomContent}>
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

          <Text style={styles.version}>v0.1.0 · {t({ en: 'English', th: 'ภาษาไทย' })}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#4FA8E8', // sky-blue fallback while the image loads
  },
  safe: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  saveCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: colors.ink,
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
    // lift the buttons off the art a touch
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  secondaryButtonLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.ink,
  },
  version: {
    marginTop: spacing.md,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
})
