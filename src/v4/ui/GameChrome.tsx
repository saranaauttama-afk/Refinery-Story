import { StyleSheet, View } from 'react-native'
import { ui } from './theme'

/** Inset enamel highlights; decorative only and never intercept touch input. */
export function Enamel({ dark = false }: { dark?: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[s.top, { backgroundColor: dark ? '#58788D' : '#FFFFFFB8' }]} />
      <View style={[s.left, { backgroundColor: dark ? '#3E6075' : '#FFFFFF75' }]} />
      <View style={[s.bottom, { backgroundColor: dark ? '#112737' : '#9D815540' }]} />
    </View>
  )
}

export function Bolts() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[s.tl, s.tr, s.bl, s.br].map((position, i) => (
        <View key={i} style={[s.bolt, position]} />
      ))}
    </View>
  )
}
const s = StyleSheet.create({
  top: { position: 'absolute', top: 2, left: 5, right: 5, height: 2 },
  left: { position: 'absolute', top: 5, bottom: 5, left: 2, width: 2 },
  bottom: { position: 'absolute', bottom: 2, left: 5, right: 5, height: 3 },
  bolt: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderWidth: 1,
    borderColor: ui.ink,
    backgroundColor: '#6C8996',
  },
  tl: { top: 7, left: 7 },
  tr: { top: 7, right: 7 },
  bl: { bottom: 7, left: 7 },
  br: { bottom: 7, right: 7 },
})
