import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_EXPO_MONTH, V3_EXPO_PRIZES, getV3ExpoScore, getV3RivalExpoScore } from '../../game/v3/expo'
import { V3_RIVALS } from '../../game/v3/rivals'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { getV3Calendar } from '../../game/v3/yardView'
import { fonts } from '../../theme'

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: (value: BilingualTextValue) => string
  describe: (event: V3ActionEvent | null) => string
}
const TROPHY = ['🥇', '🥈', '🥉']

/** Annual Refinery Expo: when it is, who you face, and one entry per year. */
export function V3ExpoPanel({ state, apply, t, describe }: Props) {
  const calendar = getV3Calendar(state.world.tickCount)
  const thisYear = state.expoResults.find((entry) => entry.year === calendar.year)
  const monthsLeft = (V3_EXPO_MONTH - calendar.month + 12) % 12
  const rivals = V3_RIVALS.map((rival, index) => ({ name: rival.name, color: rival.color, score: getV3RivalExpoScore(index, calendar.year) }))
  const recipes = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.provenance === 'developed' && !blueprint.archived)
    .sort((a, b) => b.quality - a.quality)
  const best = recipes[0] ?? null
  const bestScore = best ? getV3ExpoScore(state, best.quality) : 0
  const entrants = [{ name: t({ en: 'Your entry', th: 'ของคุณ' }), color: '#FFD447', score: bestScore, isPlayer: true }, ...rivals.map((rival) => ({ ...rival, name: t(rival.name), isPlayer: false }))]
  const maxScore = Math.max(1, ...entrants.map((entrant) => entrant.score))

  return (
    <>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🏆 {t({ en: 'REFINERY EXPO', th: 'งานแสดงโรงกลั่น' })}</Text>
        <View style={styles.bannerPill}>
          <Text style={styles.bannerPillText}>
            {calendar.month === V3_EXPO_MONTH
              ? t({ en: `OPEN NOW · YEAR ${calendar.year}`, th: `เปิดรับแล้ว · ปีที่ ${calendar.year}` })
              : t({ en: `NEXT: MONTH ${V3_EXPO_MONTH} · IN ${monthsLeft} MONTHS`, th: `ครั้งถัดไป: เดือน ${V3_EXPO_MONTH} · อีก ${monthsLeft} เดือน` })}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t({ en: 'COMPETITION PREVIEW', th: 'พรีวิวคู่แข่ง' })}</Text>
          <Text style={styles.muted}>{t({ en: 'Score = quality + fame + portfolio', th: 'คะแนน = คุณภาพ + ชื่อเสียง + จำนวนสูตร' })}</Text>
        </View>
        <View style={styles.entrantRow}>
          {entrants.map((entrant) => (
            <View key={entrant.name} style={[styles.entrant, entrant.isPlayer && styles.entrantPlayer]}>
              <Text style={styles.entrantName} numberOfLines={1}>{entrant.name}</Text>
              <Text style={styles.entrantScore}>{entrant.score}</Text>
              <View style={styles.entrantBarTrack}><View style={[styles.entrantBarFill, { width: `${Math.round((entrant.score / maxScore) * 100)}%`, backgroundColor: entrant.color }]} /></View>
              <View style={[styles.entrantPortrait, { borderColor: entrant.color }]}><Text style={styles.portraitGlyph}>{entrant.isPlayer ? '🧑‍🏭' : '🧑‍💼'}</Text></View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t({ en: 'PRIZES', th: 'รางวัล' })}</Text>
        <View style={styles.prizeRow}>
          {V3_EXPO_PRIZES.map((prize, index) => (
            <View key={prize.rank} style={styles.prizeBox}>
              <Text style={styles.prizeTrophy}>{TROPHY[index]}</Text>
              <Text style={styles.prizeRank}>{prize.rank === 1 ? t({ en: '1st', th: 'ที่ 1' }) : prize.rank === 2 ? t({ en: '2nd', th: 'ที่ 2' }) : t({ en: '3rd', th: 'ที่ 3' })}</Text>
              <Text style={styles.prizeCash}>${(prize.cashCents / 100).toLocaleString()}</Text>
              <Text style={styles.prizeFame}>+{prize.reputation} {t({ en: 'Fame', th: 'ชื่อเสียง' })}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.muted}>{t({ en: 'Prize money is a grant (not operating profit).', th: 'เงินรางวัลไม่นับเป็นกำไรดำเนินงาน' })}</Text>
      </View>

      <View style={styles.card}>
        {thisYear ? (
          <Text style={styles.result}>{t({
            en: `Year ${thisYear.year}: your score ${thisYear.score} → #${thisYear.rank}${thisYear.cashCents ? ` · $${thisYear.cashCents / 100}` : ''} · +${thisYear.reputation} fame`,
            th: `ปีที่ ${thisYear.year}: คะแนนคุณ ${thisYear.score} → อันดับ ${thisYear.rank}${thisYear.cashCents ? ` · $${thisYear.cashCents / 100}` : ''} · ชื่อเสียง +${thisYear.reputation}`,
          })}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t({ en: 'YOUR FEATURED ENTRY', th: 'ผลงานที่จะส่งเข้าประกวด' })}</Text>
            {recipes.length === 0 ? (
              <Text style={styles.muted}>{t({ en: 'Develop a recipe in the Lab to take part.', th: 'พัฒนาสูตรที่ Lab ก่อนจึงจะร่วมงานได้' })}</Text>
            ) : recipes.slice(0, 6).map((blueprint) => {
              const action = { type: 'enter_expo', blueprintId: blueprint.id, sequence: state.nextActionSequence } as V3Action
              const result = reduceV3Action(state, action)
              const blocked = result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
              const score = getV3ExpoScore(state, blueprint.quality)
              return (
                <View key={blueprint.id} style={styles.entryRow}>
                  <View style={styles.entryPortrait}><Text style={styles.portraitGlyph}>🛢️</Text></View>
                  <View style={styles.entryBody}>
                    <Text style={styles.entryName}>{blueprint.name} · Q{blueprint.quality}</Text>
                    <Text style={styles.muted}>{t({ en: 'Score', th: 'คะแนน' })} <Text style={styles.entryScore}>{score}</Text></Text>
                  </View>
                  <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} onPress={() => apply(action)} style={[styles.enterButton, blocked && styles.disabled]}>
                    <Text style={styles.enterButtonText}>{blocked ? '🔒' : t({ en: 'ENTER EXPO', th: 'ส่งประกวด' })}</Text>
                  </Pressable>
                  {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
                </View>
              )
            })}
          </>
        )}
      </View>

      {state.expoResults.filter((entry) => entry.year !== calendar.year).slice(-3).reverse().map((entry) => (
        <Text key={entry.year} style={styles.muted}>{t({ en: `Year ${entry.year}: #${entry.rank} (Q${entry.quality})`, th: `ปีที่ ${entry.year}: อันดับ ${entry.rank} (Q${entry.quality})` })}</Text>
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#12324A', borderWidth: 1, borderColor: '#3F6680', borderRadius: 10, padding: 12, alignItems: 'center', gap: 8, marginBottom: 10 },
  bannerTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 18 },
  bannerPill: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  bannerPillText: { color: '#8FD3FF', fontFamily: fonts.heading, fontSize: 11 },
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8, marginBottom: 10 },
  sectionHead: { gap: 2 },
  sectionTitle: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
  entrantRow: { flexDirection: 'row', gap: 8 },
  entrant: { flex: 1, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, padding: 6, alignItems: 'center', gap: 4 },
  entrantPlayer: { borderColor: '#FFD447' },
  entrantName: { color: '#D5E2E9', fontSize: 10, fontFamily: fonts.heading, textAlign: 'center' },
  entrantScore: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 16 },
  entrantBarTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: '#0A2943', overflow: 'hidden' },
  entrantBarFill: { height: 5 },
  entrantPortrait: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A2943', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  portraitGlyph: { fontSize: 20 },
  prizeRow: { flexDirection: 'row', gap: 8 },
  prizeBox: { flex: 1, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, padding: 8, alignItems: 'center', gap: 2 },
  prizeTrophy: { fontSize: 22 },
  prizeRank: { color: '#8FA9BA', fontSize: 10, fontFamily: fonts.heading },
  prizeCash: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 14 },
  prizeFame: { color: '#8FA9BA', fontSize: 10 },
  result: { color: '#6ACDB4', fontFamily: fonts.heading, fontSize: 13 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8 },
  entryPortrait: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', alignItems: 'center', justifyContent: 'center' },
  entryBody: { flex: 1, gap: 1 },
  entryName: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  entryScore: { color: '#FFD447', fontFamily: fonts.heading },
  enterButton: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  enterButtonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 11, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
})
