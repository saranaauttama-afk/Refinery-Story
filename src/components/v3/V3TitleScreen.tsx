import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { fonts, pixelUi } from '../../theme'

type Props = {
  hasSave: boolean
  t: (value: BilingualTextValue) => string
  onContinue: () => void
  onNew: () => void
  onSettings: () => void
}

/** Entry screen for the V3 yard. The harbor art is part of the game, not a screenshot. */
export function V3TitleScreen({ hasSave, t, onContinue, onNew, onSettings }: Props) {
  return (
    <ImageBackground source={require('../../../assets/bg/menu_bg.png')} resizeMode="cover" style={styles.background}>
      <View style={styles.topShade} />
      <View style={styles.logoPanel}>
        <Text style={styles.eyebrow}>SUNRISE REFINERY</Text>
        <Text style={styles.title}>REFINERY{'\n'}STORY</Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>{t({ en: 'Build your refinery. Shape its future.', th: 'สร้างโรงกลั่นในแบบของคุณ' })}</Text>
      </View>
      <View style={styles.menu}>
        <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
          <Text style={[styles.buttonLabel, styles.primaryLabel]}>{t(hasSave ? { en: 'CONTINUE', th: 'เล่นต่อ' } : { en: 'START GAME', th: 'เริ่มเกม' })}</Text>
        </Pressable>
        {hasSave && (
          <Pressable accessibilityRole="button" onPress={onNew} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.buttonLabel}>{t({ en: 'NEW GAME', th: 'เริ่มเกมใหม่' })}</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={onSettings} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>{t({ en: 'SETTINGS', th: 'ตั้งค่า' })}</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>REFINERY STORY  •  V3</Text>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 },
  topShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3, 17, 32, 0.22)' },
  logoPanel: { alignItems: 'center', alignSelf: 'center', width: '100%', paddingVertical: 22, paddingHorizontal: 12, backgroundColor: 'rgba(3, 25, 45, 0.88)', borderWidth: 3, borderColor: pixelUi.border },
  eyebrow: { color: pixelUi.rp, fontFamily: fonts.brandHeading, fontSize: 13, letterSpacing: 3 },
  title: { color: pixelUi.text, fontFamily: fonts.brandDisplay, fontSize: 49, lineHeight: 49, textAlign: 'center', letterSpacing: 2, textShadowColor: pixelUi.shadow, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
  rule: { width: 80, height: 4, backgroundColor: pixelUi.accent, marginVertical: 12 },
  subtitle: { color: pixelUi.text, fontFamily: fonts.body, fontSize: 15, textAlign: 'center' },
  menu: { gap: 12, backgroundColor: 'rgba(3, 20, 37, 0.92)', borderWidth: 3, borderColor: pixelUi.border, padding: 14, marginTop: 'auto', marginBottom: 22 },
  button: { minHeight: 54, borderWidth: 2, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  primary: { backgroundColor: pixelUi.accent, borderColor: '#FFF0A3', borderBottomColor: pixelUi.accentDark, borderBottomWidth: 5 },
  secondary: { backgroundColor: pixelUi.surface, borderColor: pixelUi.border, borderBottomColor: pixelUi.shadow, borderBottomWidth: 4 },
  pressed: { opacity: 0.75 },
  buttonLabel: { color: pixelUi.text, fontFamily: fonts.brandDisplay, fontSize: 21, letterSpacing: 1 },
  primaryLabel: { color: pixelUi.canvas },
  footer: { color: '#E6F3F8', fontFamily: fonts.brandHeading, fontSize: 11, textAlign: 'center', textShadowColor: pixelUi.shadow, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
})
