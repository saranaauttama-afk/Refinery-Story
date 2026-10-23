import { sceneArt } from '../src/v4/ui/art'
import { useGame } from '../src/v4/store/useGame'
import { Link } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronRight, Play } from 'lucide-react-native'
import Constants from 'expo-constants'
import { copy, text } from '../src/v4/i18n'
import { ui } from '../src/v4/ui/theme'
import { Enamel, Bolts } from '../src/v4/ui/GameChrome'
import { GameIcon } from '../src/v4/ui/GameIcon'

const versionLabel = `v${Constants.expoConfig?.version ?? '4'}`
function Outlined({ children, size, fill }: { children: string; size: number; fill: string }) {
  const o = Math.max(2, Math.round(size / 14))
  const base = {
    fontFamily: 'PixelifySans_700Bold',
    fontSize: size,
    lineHeight: size + 2,
    textAlign: 'center' as const,
  }
  return (
    <View>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {[
          [-o, 0],
          [o, 0],
          [0, -o],
          [0, o],
          [-o, -o],
          [o, -o],
          [-o, o],
          [o, o],
          [0, o * 2],
        ].map(([x, y], i) => (
          <Text
            key={i}
            style={[base, { color: '#102B3A', position: 'absolute', left: x, right: -x, top: y }]}
          >
            {children}
          </Text>
        ))}
      </View>
      <Text style={[base, { color: fill }]}>{children}</Text>
    </View>
  )
}
function GameButton({
  label,
  primary = false,
  onPress,
  disabled = false,
}: {
  label: string
  primary?: boolean
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: primary ? '#F79016' : ui.paper, opacity: disabled ? 0.45 : 1 },
        pressed && { transform: [{ translateY: 3 }], boxShadow: '0px 1px 0px #172B38' },
      ]}
    >
      <Enamel />
      <View style={s.buttonIcon}>
        {primary ? (
          <Play size={24} color={ui.paper} fill={ui.paper} />
        ) : (
          <GameIcon name="build" size={30} />
        )}
      </View>
      <Text
        style={[
          s.buttonText,
          primary && {
            color: ui.paper,
            textShadowColor: '#B8570D',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 0,
          },
        ]}
      >
        {label}
      </Text>
      <ChevronRight size={25} color={primary ? ui.paper : ui.navy} strokeWidth={3} />
    </Pressable>
  )
}
export default function TitleScreen() {
  const { ready, hasSave, newGame, saveError } = useGame()
  const { height } = useWindowDimensions()
  const compact = height < 760
  const words = text(copy.title).toUpperCase().split(' ')
  return (
    <View style={{ flex: 1, backgroundColor: '#0693F7' }}>
      <Image
        source={sceneArt.title}
        resizeMode="contain"
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <SafeAreaView style={s.screen}>
        <View style={[s.logoArea, { marginTop: compact ? 8 : 16 }]}>
          <View style={s.logoPlate}>
            <Enamel dark />
            <Bolts />
            <Outlined size={compact ? 27 : 30} fill="#FFF6E3">
              {words[0]}
            </Outlined>
            <Outlined size={compact ? 35 : 40} fill="#FFC635">
              {words.slice(1).join(' ')}
            </Outlined>
          </View>
          <View style={s.taglinePlate}>
            <Text style={s.tagline}>
              {text({
                en: 'BUILD YOUR COASTAL REFINERY',
                th: 'โรงกลั่นจิ๋ว · สร้างเมืองอุตสาหกรรมของคุณ',
              })}
            </Text>
          </View>
        </View>
        <View style={[s.menu, { marginBottom: compact ? 16 : 24 }]}>
          <Enamel />
          <View style={s.menuStripe} />
          <Text style={s.menuCaption}>
            {text(
              hasSave
                ? { en: 'YOUR LITTLE WORLD IS WAITING', th: 'กลับมาเติบโตไปกับโรงกลั่นของคุณ' }
                : {
                    en: 'EVERY GREAT REFINERY STARTS SMALL',
                    th: 'โรงกลั่นที่ยิ่งใหญ่ เริ่มจากก้าวเล็ก ๆ',
                  },
            )}
          </Text>
          {saveError && (
            <View style={s.error}>
              <Text style={s.errorText}>{text(saveError)}</Text>
            </View>
          )}
          {ready && hasSave && (
            <Link href="/game" asChild>
              <GameButton label={text({ en: 'Continue', th: 'เล่นต่อ' })} primary />
            </Link>
          )}
          <Link href="/game" asChild>
            <GameButton
              label={text(copy.newGame)}
              primary={!hasSave}
              onPress={newGame}
              disabled={!ready}
            />
          </Link>
        </View>
        <Text style={s.version}>{versionLabel}</Text>
      </SafeAreaView>
    </View>
  )
}
const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between' },
  logoArea: { alignItems: 'center', paddingHorizontal: 24, gap: 7 },
  logoPlate: {
    width: '82%',
    maxWidth: 300,
    paddingHorizontal: 14,
    paddingTop: 7,
    paddingBottom: 9,
    borderWidth: 4,
    borderColor: ui.ink,
    borderRadius: 12,
    backgroundColor: '#23465D',
    boxShadow: '0px 6px 0px #102B3A',
  },
  taglinePlate: {
    backgroundColor: ui.paper,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
  },
  tagline: { fontFamily: 'Kanit_600SemiBold', fontSize: 13, color: ui.navy, textAlign: 'center' },
  menu: {
    alignSelf: 'center',
    width: '86%',
    maxWidth: 380,
    padding: 10,
    paddingTop: 12,
    gap: 9,
    backgroundColor: '#FFF6E3F5',
    borderWidth: 3,
    borderColor: ui.ink,
    borderRadius: 12,
    boxShadow: '0px 6px 0px #172B38',
  },
  menuStripe: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: ui.gold,
  },
  menuCaption: {
    fontFamily: 'Kanit_400Regular',
    fontSize: 12,
    color: ui.navy,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 3,
    borderColor: ui.ink,
    borderRadius: 9,
    boxShadow: '0px 4px 0px #172B38',
    overflow: 'hidden',
  },
  buttonIcon: { width: 34, alignItems: 'center' },
  buttonText: {
    fontFamily: 'Kanit_600SemiBold',
    fontSize: 20,
    color: ui.navy,
    flex: 1,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#FFF0E7',
    borderWidth: 2,
    borderColor: '#B42318',
    padding: 8,
    borderRadius: 5,
  },
  errorText: { fontFamily: 'Kanit_400Regular', fontSize: 14, color: '#B42318' },
  version: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 14,
    color: ui.paper,
    textShadowColor: ui.ink,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
})
