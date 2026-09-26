import { StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { V3_AWARD_PERIOD_TICKS, scoreV3AwardPeriod } from '../../game/v3/awards'
import { evaluateV3ClearConditions } from '../../game/v3/campaign'
import type { V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

type Translate = (value: BilingualTextValue) => string

const mark = (ok: boolean) => (ok ? '✅' : '⬜')
const money = (cents: number) => `${cents < 0 ? '-' : ''}$${(Math.abs(cents) / 100).toFixed(0)}`

/** Read-only view: every figure comes from the same evaluators the reducer uses. */
export function V3CampaignPanel({ state, t }: { state: V3GameState; t: Translate }) {
  const chapter = state.campaignProgress.chapter
  const clear = evaluateV3ClearConditions(state)
  const report = state.campaignReport
  const period = state.awards.current
  const live = scoreV3AwardPeriod(state, period)
  const secondsLeft = Math.max(0, Math.ceil((period.startTick + V3_AWARD_PERIOD_TICKS - state.world.tickCount) / 5))
  const showcaseFamilies = new Set(state.jobReceipts.receipts
    .filter((receipt) => receipt.status === 'completed' && receipt.templateId.startsWith('showcase:'))
    .map((receipt) => receipt.templateId.split(':')[1]))
  const profitablePeriods = state.awards.history.filter((entry) => entry.profitCents > 0).length

  return (
    <>
      {chapter >= 4 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{report ? t({ en: 'Campaign cleared', th: 'จบแคมเปญแล้ว' }) : t({ en: 'Clear conditions', th: 'เงื่อนไขจบแคมเปญ' })}</Text>
          {!report && (
            <>
              <Text style={styles.row}>{mark(clear.partners.length >= 3)} {t({ en: `Partners ${clear.partners.length}/3`, th: `ลูกค้าระดับ Partner ${clear.partners.length}/3` })}{clear.partners.length ? ` (${clear.partners.join(', ')})` : ''}</Text>
              <Text style={styles.row}>{mark(clear.families.length >= 2)} {t({ en: `Product families ${clear.families.length}/2`, th: `ชนิดสินค้า ${clear.families.length}/2` })}</Text>
              <Text style={styles.row}>{mark(clear.advancedClient)} {t({ en: 'Airline or Materials among Partners', th: 'มี Airline หรือ Materials เป็น Partner' })}</Text>
              <Text style={styles.row}>{mark(clear.showcase)} {t({ en: 'Showcase with a developed Q65+ recipe', th: 'ส่ง Showcase ด้วยสูตรที่พัฒนาเอง Q65+' })}</Text>
              <Text style={styles.row}>{mark(clear.profitWindowComplete && clear.rollingProfitCents > 0)} {t({ en: `Operating profit last 180s: ${money(clear.rollingProfitCents)}`, th: `กำไรดำเนินงาน 180 วินาทีล่าสุด: ${money(clear.rollingProfitCents)}` })}</Text>
              <Text style={styles.muted}>{t({ en: 'Bonuses, grants and estimated-cost sales do not count. No need for every building or research.', th: 'โบนัส เงินช่วยเหลือ และการขายที่ต้นทุนเป็นค่าประมาณไม่นับ ไม่ต้องมีทุกตึกหรือทุกงานวิจัย' })}</Text>
            </>
          )}
          {report && (
            <>
              <Text style={styles.row}>{t({ en: `Cleared at ${Math.round(report.clearedAtTick / 300)} min · ${report.lotsUsed} lots used`, th: `จบที่นาทีที่ ${Math.round(report.clearedAtTick / 300)} · ใช้พื้นที่ ${report.lotsUsed} ช่อง` })}</Text>
              <Text style={styles.row}>{t({ en: 'Partners', th: 'ลูกค้า Partner' })}: {report.partners.join(', ')} · {report.families.join(', ')}</Text>
              {report.starProduct && <Text style={styles.row}>⭐ {report.starProduct.name} Q{report.starProduct.quality} · {report.starProduct.delivered.toFixed(0)} {t({ en: 'delivered', th: 'หน่วยที่ส่ง' })}</Text>}
              {report.team.slice(0, 3).map((member) => (
                <Text key={member.employeeId} style={styles.row}>👷 {member.name} Lv{member.level} · {member.recipes} {t({ en: 'recipes', th: 'สูตร' })} · {member.milestones} milestones</Text>
              ))}
              <Text style={styles.row}>{t({ en: 'Profit last 180s at clear', th: 'กำไร 180 วินาทีตอนจบ' })}: {money(report.rollingProfitCents)}</Text>
              <Text style={styles.cardTitle}>{t({ en: 'Freeplay challenges (optional)', th: 'ภารกิจเสริม (ไม่บังคับ)' })}</Text>
              <Text style={styles.row}>{mark(report.lotsUsed <= 16)} {t({ en: 'Clear within 16 lots', th: 'จบโดยใช้ไม่เกิน 16 ช่อง' })}</Text>
              <Text style={styles.row}>{mark(showcaseFamilies.size >= 2)} {t({ en: `Showcase two families (${showcaseFamilies.size}/2)`, th: `Showcase สองชนิดสินค้า (${showcaseFamilies.size}/2)` })}</Text>
              <Text style={styles.row}>{mark(profitablePeriods >= 3)} {t({ en: `Positive margin in three periods (${profitablePeriods}/3)`, th: `กำไรเป็นบวกสามรอบ (${profitablePeriods}/3)` })}</Text>
            </>
          )}
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Period report', th: 'รายงานประจำรอบ' })} · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</Text>
        <Text style={styles.row}>{t({ en: `Qualified deliveries ${period.qualifiedUnits.toFixed(0)}/${period.deliveryTarget} · families ${period.qualifiedFamilies.length}/${period.varietyTarget} · profit ${money(live.profitCents)}`, th: `ส่งงานผ่านเกณฑ์ ${period.qualifiedUnits.toFixed(0)}/${period.deliveryTarget} · ชนิด ${period.qualifiedFamilies.length}/${period.varietyTarget} · กำไร ${money(live.profitCents)}` })}</Text>
        <Text style={styles.row}>{t({ en: `Score now ${live.score.toFixed(0)} (${live.grade}) · targets frozen at period start`, th: `คะแนนตอนนี้ ${live.score.toFixed(0)} (${live.grade}) · เป้าถูกล็อกตอนเริ่มรอบ` })}</Text>
        <Text style={styles.muted}>{t({ en: `Grade RP pays once per run above your best (B5/A10/S15, paid ${state.awards.paidGradeRp}/15). Low grades cost nothing.`, th: `RP จากเกรดจ่ายเฉพาะส่วนที่สูงกว่าที่เคยได้ (B5/A10/S15 จ่ายแล้ว ${state.awards.paidGradeRp}/15) เกรดต่ำไม่มีบทลงโทษ` })}</Text>
        {state.awards.history.slice(-3).reverse().map((entry) => (
          <Text key={entry.startTick} style={styles.muted}>{t({ en: `Period @${Math.round(entry.startTick / 300)}m: ${entry.grade} (${entry.score.toFixed(0)}) · profit ${money(entry.profitCents)} · +${entry.rpAwarded} RP`, th: `รอบนาทีที่ ${Math.round(entry.startTick / 300)}: ${entry.grade} (${entry.score.toFixed(0)}) · กำไร ${money(entry.profitCents)} · +${entry.rpAwarded} RP` })}</Text>
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 6 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
})
