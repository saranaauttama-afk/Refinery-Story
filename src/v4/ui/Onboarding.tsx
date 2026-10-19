import { View, Text, Pressable } from 'react-native'
import { useGame } from '../store/useGame'
import { hints } from '../data/onboarding'
import { text } from '../i18n'
import { styles } from './controls'
export function Onboarding() {
  const { state: s, dispatch } = useGame()
  const hint = hints[s.hintIndex]
  if (!hint) return null
  return (
    <View
      style={{
        backgroundColor: '#FFF6E3',
        padding: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text style={[styles.text, { flex: 1 }]}>
        {s.hintIndex + 1}/6 · {text(hint)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => dispatch(s => ({ ...s, hintIndex: s.hintIndex + 1 }))}
      >
        <Text style={styles.text}>{text({ en: 'Next', th: 'ถัดไป' })} ›</Text>
      </Pressable>
    </View>
  )
}
