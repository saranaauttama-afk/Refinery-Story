import { useEffect, useRef, useState } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang } from '../src/hooks/SettingsContext'
import { colors, fonts, spacing } from '../src/theme'

// Full-bleed scene art. Title and controls stay code-rendered so localization,
// accessibility, and future title changes never require regenerating artwork.
const MENU_BG = require('../assets/bg/menu_bg.png')
const SPLASH_DURATION_MS = 1200

function Splash() {
  const fade = useRef(new Animated.Value(0)).current
  const { width, height } = useWindowDimensions()

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [fade])

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      <Image source={MENU_BG} resizeMode="cover" style={[styles.bg, { width, height }]} />
      <View style={styles.splashBrand}>
        <Text style={styles.brandKicker}>BUILD · REFINE · DELIVER</Text>
        <Text style={styles.brandTitle}>REFINERY</Text>
        <Text style={styles.brandTitleAccent}>STORY</Text>
      </View>
    </Animated.View>
  )
}

export default function MenuScreen() {
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  const { game, loaded, hasSave, resetGame } = useGame()
  const { t } = useLang()
  const { width, height } = useWindowDimensions()

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
    <View style={styles.fill}>
      <Image source={MENU_BG} resizeMode="cover" style={[styles.bg, { width, height }]} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <Text style={styles.brandKicker}>BUILD · REFINE · DELIVER</Text>
          <Text style={styles.brandTitle}>REFINERY</Text>
          <Text style={styles.brandTitleAccent}>STORY</Text>
        </View>
        <View style={styles.bottomShade} />
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

          <Pressable style={[styles.button, styles.secondaryButton, styles.disabledButton]} disabled>
            <Text style={styles.secondaryButtonLabel}>Store</Text>
            <Text style={styles.laterText}>LATER</Text>
          </Pressable>

          <Text style={styles.version}>v{Constants.expoConfig?.version ?? '1.0.0'} · {t({ en: 'English', th: 'ภาษาไทย' })}</Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#4FA8E8', // sky-blue fallback while the image loads
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  splashBrand: { position: 'absolute', top: '12%', left: 0, right: 0, alignItems: 'center' },
  brand: { alignItems: 'center', paddingTop: 34, zIndex: 2 },
  brandKicker: { fontSize: 9, fontFamily: fonts.brandHeading, letterSpacing: 2.4, color: '#EAF4FC', textShadowColor: '#061522', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  brandTitle: { marginTop: 2, fontSize: 42, lineHeight: 43, fontFamily: fonts.brandDisplay, color: '#FFF', letterSpacing: 1.2, textShadowColor: '#061522', textShadowOffset: { width: 3, height: 4 }, textShadowRadius: 0 },
  brandTitleAccent: { marginTop: -7, fontSize: 44, lineHeight: 46, fontFamily: fonts.brandDisplay, color: '#FFD447', letterSpacing: 4, textShadowColor: '#7A4C08', textShadowOffset: { width: 3, height: 4 }, textShadowRadius: 0 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '49%', backgroundColor: 'rgba(3,15,27,0.56)' },
  bottomContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    zIndex: 2,
  },
  saveCard: {
    backgroundColor: 'rgba(7,28,45,0.92)',
    borderWidth: 1,
    borderColor: '#4B7190',
    borderRadius: 9,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  saveCardTitle: {
    fontFamily: fonts.heading,
    color: '#F2F6F8',
    fontSize: 15,
  },
  saveCardSubtitle: {
    color: '#9CB4C8',
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    minHeight: 50,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#456987',
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
    backgroundColor: '#FFD447',
    borderColor: '#FFE47B',
    borderBottomWidth: 5,
    borderBottomColor: '#A87412',
  },
  primaryButtonLabel: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: '#0A2943',
  },
  secondaryButton: {
    backgroundColor: 'rgba(8,37,61,0.94)',
  },
  secondaryButtonLabel: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#F2F6F8',
  },
  disabledButton: { opacity: 0.62, flexDirection: 'row', justifyContent: 'center', gap: 9 },
  laterText: { fontSize: 8, fontFamily: fonts.heading, color: '#FFD447', borderWidth: 1, borderColor: '#8F7628', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  version: {
    marginTop: spacing.md,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
})
