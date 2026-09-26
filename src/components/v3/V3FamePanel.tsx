import { StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { V3_AWARD_REPUTATION, V3_FAME_LEVELS } from '../../game/v3/data'
import { getV3Fame } from '../../game/v3/fame'
import type { V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

/** Company fame: current title, progress and exactly what each level changes. */
export function V3FamePanel({ state, t }: { state: V3GameState; t: (value: BilingualTextValue) => string }) {
  const fame = getV3Fame(state)
  return (
    <View style={styles.card}>
      <Text style={styles.title}>⭐ {t({ en: 'Company fame', th: 'ชื่อเสียงบริษัท' })} · Lv{fame.level} {t(fame.name)}</Text>
      <View style={styles.bar}><View style={[styles.fill, { width: `${Math.round(fame.progress * 100)}%` }]} /></View>
      <Text style={styles.row}>
        {fame.next
          ? t({ en: `Reputation ${fame.reputation} / ${fame.next.threshold} for Lv${fame.next.level}`, th: `ชื่อเสียง ${fame.reputation} / ${fame.next.threshold} เพื่อขึ้น Lv${fame.next.level}` })
          : t({ en: `Reputation ${fame.reputation} · highest level`, th: `ชื่อเสียง ${fame.reputation} · ระดับสูงสุดแล้ว` })}
      </Text>
      <Text style={styles.muted}>{t({
        en: `Gain it from client milestones (Trial 5 · Regular 10 · Partner 20) and yearly awards (S ${V3_AWARD_REPUTATION.S} · A ${V3_AWARD_REPUTATION.A} · B ${V3_AWARD_REPUTATION.B}).`,
        th: `ได้จาก milestone ลูกค้า (ทดลอง 5 · ประจำ 10 · พาร์ทเนอร์ 20) และรางวัลประจำปี (S ${V3_AWARD_REPUTATION.S} · A ${V3_AWARD_REPUTATION.A} · B ${V3_AWARD_REPUTATION.B})`,
      })}</Text>
      {V3_FAME_LEVELS.map((entry) => (
        <Text key={entry.level} style={[styles.row, entry.level === fame.level && styles.current, entry.level > fame.level && styles.locked]}>
          {entry.level <= fame.level ? '✓' : '·'} Lv{entry.level} {t(entry.name)} ({entry.threshold})
          {entry.crudeDiscount > 0 ? ` · ${t({ en: 'crude', th: 'น้ำมันดิบ' })} −${Math.round(entry.crudeDiscount * 100)}%` : ''}
          {entry.staffBonus > 0 ? ` · ${t({ en: 'staff', th: 'พนักงาน' })} +${entry.staffBonus}` : ''}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#FFD447', borderRadius: 10, padding: 12, gap: 6 },
  title: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#163A52', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#FFD447' },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  current: { color: '#FFD447', fontFamily: fonts.heading },
  locked: { color: '#6F8797' },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
})
