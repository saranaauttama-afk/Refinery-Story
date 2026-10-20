import { TitleScene } from '../src/v4/render/TitleScene'
import { useGame } from '../src/v4/store/useGame'
import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { copy, text } from '../src/v4/i18n'

// Pixelify Sans draws a broken glyph for the "fi" ligature; a zero-width non-joiner splits it.
const noLigature = (value: string) => value.replace(/fi/g, 'f\u200Ci')
const versionLabel = `v${Constants.expoConfig?.version ?? '4'}`

export default function TitleScreen() {
  const { ready, hasSave, newGame, saveError } = useGame()
  return (
    <SafeAreaView style={styles.screen}>
      <TitleScene />
      <View style={styles.panel}>
        <Text style={styles.title}>{noLigature(text(copy.title))}</Text>
        {saveError && <Text style={styles.buttonText}>{text(saveError)}</Text>}
        <Text style={styles.tagline}>
          {text({ en: 'YOUR LITTLE INDUSTRIAL WORLD', th: 'โรงกลั่นจิ๋ว โลกอุตสาหกรรมของคุณ' })}
        </Text>
        <Text style={styles.version}>{versionLabel}</Text>
        <Link href="/game" asChild>
          <Pressable
            disabled={!ready}
            onPress={newGame}
            accessibilityRole="button"
            style={styles.button}
          >
            <Text style={styles.buttonText}>{text(copy.newGame)}</Text>
          </Pressable>
        </Link>
        {ready && hasSave && (
          <Link href="/game" style={[styles.buttonText, { minHeight: 44, padding: 6 }]}>
            {text({ en: 'Continue', th: 'เล่นต่อ' })}
          </Link>
        )}
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#CEE0CE',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 48,
  },
  panel: {
    backgroundColor: '#FFF6E3',
    borderColor: '#14110F',
    borderWidth: 2,
    borderRadius: 6,
    padding: 24,
    boxShadow: '0px 5px 0px #14110F',
    borderTopWidth: 8,
    borderTopColor: '#263D49',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 36,
    color: '#14110F',
    textAlign: 'center',
  },
  tagline: { fontFamily: 'Kanit_400Regular', color: '#52616B', fontSize: 14, textAlign: 'center' },
  version: { fontFamily: 'PixelifySans_700Bold', color: '#73818F', fontSize: 18 },
  button: {
    backgroundColor: '#F08A24',
    borderWidth: 2,
    borderColor: '#14110F',
    borderRadius: 6,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: { fontFamily: 'Kanit_600SemiBold', fontSize: 22, color: '#14110F' },
})
