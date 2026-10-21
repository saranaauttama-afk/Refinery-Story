import { Award } from 'lucide-react-native'
import { ui } from './theme'
import { Modal, View, Text, ScrollView } from 'react-native'
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
        <View
          style={{
            maxHeight: '85%',
            padding: 16,
            boxShadow: '0px 4px 0px #14110F',
            backgroundColor: '#FFF6E3',
            borderRadius: 6,
            borderWidth: 2,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              backgroundColor: ui.navy,
              padding: 16,
              borderRadius: 5,
              marginBottom: 12,
            }}
          >
            <Award size={32} color={ui.gold} />
          </View>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            {n?.kind === 'rank' && n.chips ? (
              <>
                <Text style={styles.heading}>
                  {text({ en: `Rank ${n.uid.slice(4)}!`, th: `แรงก์ ${n.uid.slice(4)}!` })}
                </Text>
                {n.chips.length > 0 && (
                  <>
                    <Text style={[styles.text, { fontSize: 13, color: '#5E6470' }]}>
                      {text({ en: 'Unlocked', th: 'ปลดล็อก' })}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {n.chips.map(c => (
                        <View
                          key={c.en}
                          style={{
                            borderWidth: 2,
                            borderRadius: 16,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <Text style={[styles.text, { fontSize: 14 }]}>{text(c)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                {!!n.lines?.length && (
                  <View
                    style={{
                      borderWidth: 2,
                      borderRadius: 8,
                      padding: 10,
                      gap: 6,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Text style={[styles.text, { fontFamily: 'Kanit_600SemiBold', fontSize: 14 }]}>
                      {text({ en: 'New systems', th: 'ระบบใหม่' })}
                    </Text>
                    {n.lines.map(l => (
                      <Text key={l.en} style={[styles.text, { fontSize: 14 }]}>
                        • {text(l)}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.heading}>{n && text(n).split('\n')[0]}</Text>
                {n &&
                  text(n)
                    .split('\n')
                    .slice(1)
                    .map(line => (
                      <Text key={line} style={styles.text}>
                        {line}
                      </Text>
                    ))}
              </>
            )}
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
                    {text({ en: 'Eco', th: 'สิ่งแวดล้อม' })}
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
          </ScrollView>
          <Button
            label={{ en: 'Continue', th: 'ดำเนินต่อ' }}
            onPress={() => n && dispatch(s => dismissNotice(s, n.uid))}
          />
        </View>
      </View>
    </Modal>
  )
}
