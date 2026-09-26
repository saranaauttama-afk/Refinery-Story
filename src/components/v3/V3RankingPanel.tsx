import { StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { V3_RANK_REWARDS, getV3IndustryScore, getV3Rankings } from '../../game/v3/rivals'
import type { V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

/** Industry ranking vs rival refineries, with how the player's score is built. */
export function V3RankingPanel({ state, t }: { state: V3GameState; t: (value: BilingualTextValue) => string }) {
  const rankings = getV3Rankings(state)
  const score = getV3IndustryScore(state)
  const top = rankings[0].score
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏆 {t({ en: 'Industry ranking', th: 'อันดับอุตสาหกรรม' })}</Text>
      {rankings.map((entry, index) => (
        <View key={entry.id} style={styles.row}>
          <Text style={[styles.rank, entry.player && styles.player]}>#{index + 1}</Text>
          <Text style={[styles.name, entry.player && styles.player]}>{t(entry.name)}</Text>
          <View style={styles.barTrack}><View style={[styles.bar, entry.player && styles.playerBar, { width: `${Math.max(4, Math.round(entry.score / Math.max(1, top) * 100))}%` }]} /></View>
          <Text style={[styles.score, entry.player && styles.player]}>{entry.score.toLocaleString()}</Text>
        </View>
      ))}
      <Text style={styles.muted}>{t({
        en: `Your score = fame ${score.fame} + business ${score.business} + recipes ${score.recipes}. Rivals grow every month.`,
        th: `คะแนนคุณ = ชื่อเสียง ${score.fame} + ธุรกิจ ${score.business} + สูตรที่พัฒนา ${score.recipes} คู่แข่งโตขึ้นทุกเดือน`,
      })}</Text>
      <Text style={styles.muted}>{t({
        en: `Year-end rank rewards (once): #3 +${V3_RANK_REWARDS[3]} · #2 +${V3_RANK_REWARDS[2]} · #1 +${V3_RANK_REWARDS[1]} reputation.`,
        th: `รางวัลอันดับสิ้นปี (ครั้งเดียว): #3 +${V3_RANK_REWARDS[3]} · #2 +${V3_RANK_REWARDS[2]} · #1 +${V3_RANK_REWARDS[1]} ชื่อเสียง`,
      })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 6 },
  title: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rank: { color: '#D5E2E9', width: 26, fontFamily: fonts.heading },
  name: { color: '#D5E2E9', fontSize: 13, width: 110 },
  barTrack: { flex: 1, height: 8, backgroundColor: '#163A52', borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, backgroundColor: '#6F8797' },
  playerBar: { backgroundColor: '#FFD447' },
  score: { color: '#D5E2E9', fontSize: 12, width: 52, textAlign: 'right' },
  player: { color: '#FFD447', fontFamily: fonts.heading },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
})
