import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_EXPO_MONTH, V3_EXPO_PRIZES, V3_EXPO_SAMPLE_QUANTITY, getV3ExpoScore, getV3RivalExpoScore } from '../../game/v3/expo'
import { V3_RIVALS } from '../../game/v3/rivals'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { getV3Calendar } from '../../game/v3/yardView'
import { fonts, pixelUi } from '../../theme'

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: (value: BilingualTextValue) => string
  describe: (event: V3ActionEvent | null) => string
}

/** Annual Refinery Expo: when it is, who you face, and one entry per year. */
export function V3ExpoPanel({ state, apply, t, describe }: Props) {
  const calendar = getV3Calendar(state.world.tickCount)
  const thisYear = state.expoResults.find((entry) => entry.year === calendar.year)
  const monthsLeft = (V3_EXPO_MONTH - calendar.month + 12) % 12
  const rivals = V3_RIVALS.map((rival, index) => ({ name: rival.name, score: getV3RivalExpoScore(index, calendar.year) }))
  const recipes = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.provenance === 'developed' && !blueprint.archived)
    .sort((a, b) => b.quality - a.quality)
  return (
    <View style={styles.card}>
      <Text style={styles.title}>★ {t({ en: 'Refinery Expo', th: 'งานแสดงโรงกลั่นประจำปี' })}</Text>
      <Text style={styles.row}>
        {calendar.month === V3_EXPO_MONTH
          ? t({ en: `Open now (year ${calendar.year}) — enter one recipe with ${V3_EXPO_SAMPLE_QUANTITY} units.`, th: `เปิดรับแล้ว (ปีที่ ${calendar.year}) ส่งสูตรได้ 1 สูตร ใช้ของ ${V3_EXPO_SAMPLE_QUANTITY} หน่วย` })
          : t({ en: `Held every month ${V3_EXPO_MONTH}. Next in ${monthsLeft} month(s).`, th: `จัดทุกเดือน ${V3_EXPO_MONTH} ครั้งถัดไปอีก ${monthsLeft} เดือน` })}
      </Text>
      <Text style={styles.muted}>{t({
        en: `Score = recipe Q + fame (+2/level) + portfolio (+1 per recipe, max 8) + experience (+1 per 5 expos attended, max 5). Prizes: 1st $${V3_EXPO_PRIZES[0].cashCents / 100} +${V3_EXPO_PRIZES[0].reputation} fame · 2nd $${V3_EXPO_PRIZES[1].cashCents / 100} +${V3_EXPO_PRIZES[1].reputation} · 3rd $${V3_EXPO_PRIZES[2].cashCents / 100} +${V3_EXPO_PRIZES[2].reputation}. Prize money is a grant (not operating profit).`,
        th: `คะแนน = Q ของสูตร + ชื่อเสียง (+2/ระดับ) + จำนวนสูตร (+1 ต่อสูตร สูงสุด 8) + ประสบการณ์ (+1 ทุก 5 ครั้งที่ร่วมงาน สูงสุด 5) รางวัล: ที่ 1 $${V3_EXPO_PRIZES[0].cashCents / 100} +${V3_EXPO_PRIZES[0].reputation} ชื่อเสียง · ที่ 2 $${V3_EXPO_PRIZES[1].cashCents / 100} +${V3_EXPO_PRIZES[1].reputation} · ที่ 3 $${V3_EXPO_PRIZES[2].cashCents / 100} +${V3_EXPO_PRIZES[2].reputation} เงินรางวัลไม่นับเป็นกำไรดำเนินงาน`,
      })}</Text>
      <Text style={styles.sub}>{t({ en: `Rival entries this year`, th: 'ผลงานคู่แข่งปีนี้' })}: {rivals.map((rival) => `${t(rival.name)} ${rival.score}`).join(' · ')}</Text>
      {thisYear ? (
        <Text style={styles.result}>{t({
          en: `Year ${thisYear.year}: your score ${thisYear.score} → #${thisYear.rank}${thisYear.cashCents ? ` · $${thisYear.cashCents / 100}` : ''} · +${thisYear.reputation} fame`,
          th: `ปีที่ ${thisYear.year}: คะแนนคุณ ${thisYear.score} → อันดับ ${thisYear.rank}${thisYear.cashCents ? ` · $${thisYear.cashCents / 100}` : ''} · ชื่อเสียง +${thisYear.reputation}`,
        })}</Text>
      ) : recipes.length === 0 ? (
        <Text style={styles.muted}>{t({ en: 'Develop a recipe in the Lab to take part.', th: 'พัฒนาสูตรที่ Lab ก่อนจึงจะร่วมงานได้' })}</Text>
      ) : recipes.slice(0, 6).map((blueprint) => {
        const action = { type: 'enter_expo', blueprintId: blueprint.id, sequence: state.nextActionSequence } as V3Action
        const result = reduceV3Action(state, action)
        const blocked = result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
        return (
          <View key={blueprint.id}>
            <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} onPress={() => apply(action)} style={[styles.button, blocked && styles.disabled]}>
              <Text style={styles.buttonText}>{t({ en: `Enter ${blueprint.name} (Q${blueprint.quality} → score ${getV3ExpoScore(state, blueprint.quality)})`, th: `ส่ง ${blueprint.name} (Q${blueprint.quality} → คะแนน ${getV3ExpoScore(state, blueprint.quality)})` })}</Text>
            </Pressable>
            {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
          </View>
        )
      })}
      {state.expoResults.filter((entry) => entry.year !== calendar.year).slice(-3).reverse().map((entry) => (
        <Text key={entry.year} style={styles.muted}>{t({ en: `Year ${entry.year}: #${entry.rank} (Q${entry.quality})`, th: `ปีที่ ${entry.year}: อันดับ ${entry.rank} (Q${entry.quality})` })}</Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: pixelUi.surface, borderWidth: 2, borderColor: pixelUi.border, padding: 14, gap: 9 },
  title: { color: pixelUi.accent, fontFamily: fonts.brandDisplay, fontSize: 18 },
  row: { color: pixelUi.text, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  sub: { color: pixelUi.rp, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  result: { color: pixelUi.success, fontFamily: fonts.heading, fontSize: 13 },
  muted: { color: pixelUi.textMuted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
  button: { backgroundColor: pixelUi.surfaceRaised, borderWidth: 2, borderColor: pixelUi.border, paddingVertical: 10, paddingHorizontal: 8, minHeight: 44, justifyContent: 'center' },
  buttonText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  reason: { color: pixelUi.warning, fontSize: 11, marginTop: 2 },
  disabled: { opacity: 0.45 },
})
