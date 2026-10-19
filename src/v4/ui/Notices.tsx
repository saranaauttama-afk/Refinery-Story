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
          {n?.kind === 'awards' && (
            <View style={{ marginVertical: 8, gap: 2 }}>
              <View style={{ flexDirection: 'row', borderBottomWidth: 2, paddingBottom: 2 }}>
                <Text style={[styles.text, { flex: 2, fontSize: 13 }]}>
                  {text({ en: 'Rival', th: 'คู่แข่ง' })}
                </Text>
                <Text style={[styles.text, { flex: 1, fontSize: 13, textAlign: 'right' }]}>
                  {text({ en: 'Product', th: 'คะแนนสินค้า' })}
                </Text>
                <Text style={[styles.text, { flex: 1, fontSize: 13, textAlign: 'right' }]}>
                  Eco
                </Text>
                <Text style={[styles.text, { flex: 1.4, fontSize: 13, textAlign: 'right' }]}>
                  {text({ en: 'Profit', th: 'กำไร' })}
                </Text>
              </View>
              {[
                ...(s.history.awards.at(-1)?.you
                  ? [{ name: text({ en: 'You', th: 'เรา' }), ...s.history.awards.at(-1)!.you! }]
                  : []),
                ...(s.history.awards.at(-1)?.rivals ?? []),
              ].map(r => (
                <View key={r.name} style={{ flexDirection: 'row' }}>
                  <Text style={[styles.text, { flex: 2, fontSize: 14 }]}>{r.name}</Text>
                  <Text style={[styles.text, { flex: 1, fontSize: 14, textAlign: 'right' }]}>
                    {Math.round(r.product)}
                  </Text>
                  <Text style={[styles.text, { flex: 1, fontSize: 14, textAlign: 'right' }]}>
                    {r.eco}
                  </Text>
                  <Text style={[styles.text, { flex: 1.4, fontSize: 14, textAlign: 'right' }]}>
                    ${Math.round(r.profit / 1000).toLocaleString()}K
                  </Text>
                </View>
              ))}
              <Text style={[styles.text, { fontSize: 13, color: '#5E6470', marginTop: 4 }]}>
                {text({
                  en: 'Beat every rival in a column to win that award.',
                  th: 'ชนะคู่แข่งทุกเจ้าในคอลัมน์ไหน ได้รางวัลนั้น',
                })}
              </Text>
            </View>
          )}
          <Button
            label={{ en: 'Continue', th: 'ดำเนินต่อ' }}
            onPress={() => n && dispatch(s => dismissNotice(s, n.uid))}
          />
        </View>
      </View>
    </Modal>
  )
}
