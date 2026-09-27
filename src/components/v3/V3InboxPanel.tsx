import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import type { V3Action, V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'
import { v3InboxText } from './v3Labels'

type Translate = (value: BilingualTextValue) => string

/** Optional notes/decisions. Not a modal: never covers critical actions or pauses the game. */
export function V3InboxPanel({ state, apply, t }: { state: V3GameState; apply: (action: V3Action) => void; t: Translate }) {
  const pending = state.inbox.items.filter((item) => item.status === 'pending')
  if (!pending.length) return null
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Inbox (optional)', th: 'กล่องข้อความ (ไม่บังคับ)' })} · {pending.length}</Text>
      {pending.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.row}>{t(v3InboxText(item))}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={() => apply({ type: 'resolve_inbox', sequence: state.nextActionSequence, itemId: item.id, choice: 'claim' })}>
              <Text style={styles.buttonText}>{item.rewardRp > 0 ? t({ en: `${item.decision ? 'Accept' : 'Thanks'} · +${item.rewardRp} RP`, th: `${item.decision ? 'รับ' : 'ขอบคุณ'} · +${item.rewardRp} RP` }) : t({ en: 'OK', th: 'ตกลง' })}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => apply({ type: 'resolve_inbox', sequence: state.nextActionSequence, itemId: item.id, choice: 'dismiss' })}>
              <Text style={styles.buttonText}>{item.decision ? t({ en: 'Decline', th: 'ปฏิเสธ' }) : t({ en: 'Dismiss', th: 'ปิด' })}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  item: { borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8, gap: 6 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 6 },
  button: { flex: 1, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  buttonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
})
