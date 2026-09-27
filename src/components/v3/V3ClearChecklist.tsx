import { StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { evaluateV3ClearConditions } from '../../game/v3/campaign'
import type { V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

/**
 * C4 goal as a short checklist instead of one long sentence, so the long
 * endgame has visible sub-goals (each tick-off is progress). UI only: the
 * conditions come from evaluateV3ClearConditions unchanged.
 */
export function getV3ClearChecklist(state: V3GameState, t: (value: BilingualTextValue) => string) {
  const clear = evaluateV3ClearConditions(state)
  return [
    { done: clear.partners.length >= 3, text: t({ en: `Partners ${Math.min(3, clear.partners.length)}/3 (2+ product types)`, th: `ลูกค้าพาร์ทเนอร์ ${Math.min(3, clear.partners.length)}/3 (สินค้า 2 ชนิดขึ้นไป)` }) },
    { done: clear.advancedClient, text: t({ en: 'Airline or Materials partner', th: 'พาร์ทเนอร์ Airline หรือ Materials' }) },
    { done: clear.showcase, text: t({ en: 'Showcase job', th: 'งาน Showcase' }) },
    { done: clear.profitWindowComplete && clear.rollingProfitCents > 0, text: t({ en: 'Profit over the last 180s', th: 'มีกำไรช่วง 180 วินาทีล่าสุด' }) },
    { done: clear.industryLeader, text: t({ en: '#1 at a year-end ranking', th: 'อันดับ 1 ตอนสรุปสิ้นปี' }) },
    { done: clear.expoWin, text: t({ en: 'Win the annual Expo', th: 'ชนะงานเอ็กซ์โปประจำปี' }) },
  ]
}

export function V3ClearChecklist({ state, t, compact }: { state: V3GameState; t: (value: BilingualTextValue) => string; compact?: boolean }) {
  const items = getV3ClearChecklist(state, t)
  const done = items.filter((item) => item.done).length
  const shown = compact ? items.filter((item) => !item.done).slice(0, 2) : items
  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>{t({ en: `Clear the game · ${done}/${items.length}`, th: `เงื่อนไขจบเกม · ${done}/${items.length}` })}</Text>
      {shown.map((item) => (
        <Text key={item.text} style={[styles.item, item.done && styles.done]}>{item.done ? '✓' : '○'} {item.text}</Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  head: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  item: { color: '#D5E2E9', fontSize: 12, lineHeight: 17 },
  done: { color: '#6ACDB4' },
})
