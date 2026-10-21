import { sceneArt } from '../src/v4/ui/art'
import { useGame } from '../src/v4/store/useGame'
import { Link } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { copy, text } from '../src/v4/i18n'

// Pixelify Sans draws a broken glyph for the "fi" ligature; a zero-width non-joiner splits it.
const noLigature = (value: string) => value.replace(/fi/g, 'f‌i')
const versionLabel = `v${Constants.expoConfig?.version ?? '4'}`
const INK = '#14110F'

/** Pixel-style outlined text: ink copies around, the fill on top. */
function Outlined({ children, size, fill }: { children: string; size: number; fill: string }) {
  const o = Math.max(2, Math.round(size / 14))
  const base = { fontFamily: 'PixelifySans_700Bold', fontSize: size, textAlign: 'center' as const }
  const offsets = [
    [-o, 0],
    [o, 0],
    [0, -o],
    [0, o],
    [-o, -o],
    [o, -o],
    [-o, o],
    [o, o],
    [o, o * 2.5],
    [0, o * 2.5],
  ]
  return (
    <View>
      {offsets.map(([x, y], i) => (
        <Text
          key={i}
          style={[base, { color: INK, position: 'absolute', left: x, right: -x, top: y }]}
        >
          {children}
        </Text>
      ))}
      <Text style={[base, { color: fill }]}>{children}</Text>
    </View>
  )
}

/** Chunky game button: ink frame, light top edge, drops when pressed. */
function GameButton({
  label,
  color,
  light,
  onPress,
  disabled,
}: {
  label: string
  color: string
  light: string
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, opacity: disabled ? 0.6 : 1 },
        pressed && { transform: [{ translateY: 4 }], boxShadow: `0px 1px 0px ${INK}` },
      ]}
    >
      <View style={[styles.buttonShine, { backgroundColor: light }]} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export default function TitleScreen() {
  const { ready, hasSave, newGame, saveError } = useGame()
  return (
    <View style={{ flex: 1, backgroundColor: '#3D8FE0' }}>
      <Image
        source={sceneArt.title}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <SafeAreaView style={styles.screen}>
        <View style={styles.logo}>
          <Outlined size={46} fill="#FFD84D">
            {noLigature(text(copy.title))}
          </Outlined>
          <View style={styles.ribbon}>
            <Text style={styles.tagline}>
              {text({ en: 'YOUR LITTLE INDUSTRIAL WORLD', th: 'โรงกลั่นจิ๋ว โลกอุตสาหกรรมของคุณ' })}
            </Text>
          </View>
        </View>
        <View style={styles.menu}>
          {saveError && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{text(saveError)}</Text>
            </View>
          )}
          {ready && hasSave && (
            <Link href="/game" asChild>
              <GameButton
                label={text({ en: 'Continue', th: 'เล่นต่อ' })}
                color="#F08A24"
                light="#FFB25C"
              />
            </Link>
          )}
          <Link href="/game" asChild>
            <GameButton
              label={text(copy.newGame)}
              color={hasSave ? '#FFF6E3' : '#F08A24'}
              light={hasSave ? '#FFFFFF' : '#FFB25C'}
              onPress={newGame}
              disabled={!ready}
            />
          </Link>
        </View>
        <Text style={styles.version}>{versionLabel}</Text>
      </SafeAreaView>
    </View>
  )
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between' },
  logo: { alignItems: 'center', marginTop: 56, gap: 14, paddingHorizontal: 16 },
  ribbon: {
    backgroundColor: '#263D49',
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 4,
    boxShadow: `0px 3px 0px ${INK}`,
  },
  tagline: { fontFamily: 'Kanit_600SemiBold', color: '#FFF6E3', fontSize: 15, textAlign: 'center' },
  menu: { alignItems: 'center', gap: 14, paddingBottom: 64 },
  button: {
    width: 260,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 4,
    boxShadow: `0px 5px 0px ${INK}`,
    overflow: 'hidden',
  },
  buttonShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  buttonText: { fontFamily: 'Kanit_600SemiBold', fontSize: 22, color: INK },
  error: { backgroundColor: '#FFF6E3', borderWidth: 2, borderColor: INK, padding: 8, width: 260 },
  errorText: { fontFamily: 'Kanit_400Regular', fontSize: 14, color: '#B42318' },
  version: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 14,
    color: '#FFF6E3',
    textShadowColor: INK,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
})
