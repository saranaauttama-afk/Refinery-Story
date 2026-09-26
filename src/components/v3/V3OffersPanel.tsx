import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_AUTO_REPEAT_CHAPTER, V3_JOB_TEMPLATES } from '../../game/v3/jobs'
import { getV3OfferView, type V3OfferReason } from '../../game/v3/offers'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
type ActionInput = WithoutSequence<V3Action>
type Translate = (value: BilingualTextValue) => string

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
}

const REASON: Record<V3OfferReason, BilingualTextValue> = {
  route_locked: { en: 'product route not open yet', th: 'ยังไม่เปิดสายผลิตภัณฑ์นี้' },
  no_plant: { en: 'build the production plant', th: 'ต้องสร้างโรงผลิต' },
  quality_unreachable: { en: 'quality not attainable in this chapter', th: 'คุณภาพนี้ยังทำไม่ได้ในบทนี้' },
  needs_blueprint: { en: 'develop a recipe with enough quality', th: 'ต้องพัฒนาสูตรที่คุณภาพถึง' },
  no_qualified_line: { en: 'no running line makes this quality', th: 'ยังไม่มีไลน์ที่ผลิตคุณภาพนี้' },
}
const KIND: Record<string, BilingualTextValue> = {
  tutorial: { en: 'Tutorial', th: 'แนะนำ' },
  milestone: { en: 'Milestone', th: 'Milestone' },
  repeat: { en: 'Repeat (income only)', th: 'งานซ้ำ (รายได้อย่างเดียว)' },
  rush: { en: 'Rush (optional, deadline)', th: 'งานด่วน (ไม่บังคับ, มีกำหนดเวลา)' },
}

function formatSeconds(seconds: number): string {
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`
}

export function V3OffersPanel({ state, apply, t, describe }: Props) {
  const check = (action: ActionInput): V3ActionEvent | null => {
    const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
    return result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
  }
  const run = (action: ActionInput) => apply({ ...action, sequence: state.nextActionSequence } as V3Action)
  const chapter = state.campaignProgress.chapter
  const visible = Object.values(V3_JOB_TEMPLATES).filter((template) =>
    template.minimumChapter <= chapter + 1 &&
    !(template.milestone && state.jobReceipts.receipts.some((receipt) => receipt.templateId === template.id && receipt.status === 'completed')))
  const autoId = state.jobReceipts.autoRepeatTemplateId

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Customer offers', th: 'ข้อเสนอลูกค้า' })}</Text>
      <Text style={styles.muted}>{t({ en: 'Quotes lock when accepted. ETA = qualifying stock + fully supplied qualifying lines.', th: 'ราคาถูกล็อกตอนรับงาน ETA = สต็อกที่ผ่านเกณฑ์ + ไลน์ที่ผลิตคุณภาพถึงเมื่อวัตถุดิบพอ' })}</Text>
      {visible.flatMap((template) => (template.branches ?? [null]).map((branch) => ({ template, branch: branch?.family ?? null }))).map(({ template, branch }) => {
        const view = getV3OfferView(state, template.id, branch)
        const accept: ActionInput = branch ? { type: 'accept_job', templateId: template.id, branch } : { type: 'accept_job', templateId: template.id }
        const blocked = check(accept)
        return (
          <View key={`${template.id}:${branch ?? ''}`} style={styles.offer}>
            <Text style={styles.offerTitle}>{template.id}{branch ? ` · ${branch === 'petrochemicals' ? 'Petro' : 'Pellets'}` : ''} · {t(KIND[template.kind])}</Text>
            {branch && <Text style={styles.muted}>{t({ en: 'Materials: pick ONE product for this job; the other cannot be shipped to it.', th: 'Materials: เลือกสินค้าเพียงชนิดเดียวต่องาน ส่งอีกชนิดเข้างานนี้ไม่ได้' })}</Text>}
            <Text style={styles.row}>
              Q{view.minimumQuality}+ · {view.quantity} {t({ en: 'units', th: 'หน่วย' })} · ${(view.unitPriceCents / 100).toFixed(2)}/{t({ en: 'unit', th: 'หน่วย' })}
              {view.completionBonusCents > 0 ? ` · +$${(view.completionBonusCents / 100).toFixed(0)} ${t({ en: 'on completion', th: 'เมื่อส่งครบ' })}` : ''}
              {template.researchReward > 0 ? ` · ${template.researchReward} RP` : ''}
            </Text>
            <Text style={[styles.row, view.feasibility !== 'ready' && styles.warning]}>
              {view.feasibility === 'ready'
                ? t({ en: `Ready · ETA ${view.etaSeconds === null ? '—' : formatSeconds(view.etaSeconds)}`, th: `พร้อม · ETA ${view.etaSeconds === null ? '—' : formatSeconds(view.etaSeconds)}` })
                : `${view.feasibility === 'planned' ? t({ en: 'Planned', th: 'ต้องเตรียม' }) : t({ en: 'Unavailable', th: 'ยังทำไม่ได้' })}: ${view.reasons.map((reason) => t(REASON[reason])).join(', ')}`}
            </Text>
            {view.rush && (
              <Text style={styles.muted}>{t({ en: `Deadline ${formatSeconds(view.rush.deadlineTicks / 5)} simulated (paused when the game is paused)`, th: `กำหนดส่ง ${formatSeconds(view.rush.deadlineTicks / 5)} ในเกม (หยุดเดินเมื่อหยุดเกม)` })}</Text>
            )}
            <Pressable
              accessibilityState={{ disabled: Boolean(blocked) }}
              disabled={Boolean(blocked)}
              onPress={() => run(accept)}
              style={[styles.secondary, blocked && styles.disabled]}
            >
              <Text style={styles.secondaryText}>{t({ en: 'Accept', th: 'รับงาน' })}</Text>
            </Pressable>
            {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
            {template.kind === 'repeat' && !template.branches && chapter >= V3_AUTO_REPEAT_CHAPTER - 1 && (() => {
              const toggle: ActionInput = { type: 'set_auto_repeat', templateId: autoId === template.id ? null : template.id }
              const toggleBlocked = check(toggle)
              return (
                <>
                  <Pressable
                    accessibilityState={{ disabled: Boolean(toggleBlocked) }}
                    disabled={Boolean(toggleBlocked)}
                    onPress={() => run(toggle)}
                    style={[styles.secondary, toggleBlocked && styles.disabled, autoId === template.id && styles.active]}
                  >
                    <Text style={styles.secondaryText}>{autoId === template.id ? t({ en: 'Auto-repeat ON · stop after current', th: 'ทำซ้ำอัตโนมัติ: เปิด · หยุดหลังงานนี้' }) : t({ en: 'Auto-repeat', th: 'ทำซ้ำอัตโนมัติ' })}</Text>
                  </Pressable>
                  {toggleBlocked && <Text style={styles.reason}>{describe(toggleBlocked)}</Text>}
                </>
              )
            })()}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  offer: { borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8, gap: 4 },
  offerTitle: { color: '#A9F3D9', fontFamily: fonts.heading, fontSize: 13 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
  warning: { color: '#FFAD8A' },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  active: { borderColor: '#6ACDB4', backgroundColor: '#2E6C63' },
  disabled: { opacity: 0.45 },
})
