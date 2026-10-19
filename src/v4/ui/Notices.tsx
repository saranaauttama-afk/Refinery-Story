import { Modal, View, Text } from 'react-native'
import { useGame } from '../store/useGame'
import { dismissNotice } from '../sim/actions'
import { Button, styles } from './controls'
import { text } from '../i18n'
export function Notices() {
  const { state: s, dispatch } = useGame()
  const n = s.notices[0]
  return (
    <Modal
      visible={!!n}
      transparent
      animationType="fade"
      onRequestClose={() => n && dispatch(s => dismissNotice(s, n.uid))}
    >
      <View
        style={{ flex: 1, justifyContent: 'center', backgroundColor: '#14110F88', padding: 24 }}
      >
        <View style={{ padding: 24, backgroundColor: '#FFF6E3', borderRadius: 6, borderWidth: 2 }}>
          <Text style={styles.heading}>{n && text(n)}</Text>
          {n?.kind === 'awards' &&
            s.history.awards.at(-1)?.rivals.map(r => (
              <Text key={r.name} style={styles.text}>
                {r.name} · {r.product.toFixed(0)} / {r.eco} / ${r.profit.toLocaleString()}
              </Text>
            ))}
          <Button
            label={{ en: 'Continue', th: 'ดำเนินต่อ' }}
            onPress={() => n && dispatch(s => dismissNotice(s, n.uid))}
          />
        </View>
      </View>
    </Modal>
  )
}
