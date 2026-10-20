import { View, Text } from 'react-native'
import { styles } from './controls'
import { ui } from './theme'
import { text, type LocalizedText } from '../i18n'
export function PanelIntro({
  label,
  detail,
  color,
}: {
  label: LocalizedText
  detail: LocalizedText
  color: string
}) {
  return (
    <View
      style={{
        padding: 10,
        borderWidth: 2,
        borderColor: ui.ink,
        borderRadius: 6,
        backgroundColor: ui.navy,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 8, height: 8, backgroundColor: color }} />
        <Text style={[styles.heading, { color: ui.paper, fontSize: 16 }]}>{text(label)}</Text>
      </View>
      <Text style={[styles.text, { fontSize: 13, color: '#D9E2E0' }]}>{text(detail)}</Text>
    </View>
  )
}
