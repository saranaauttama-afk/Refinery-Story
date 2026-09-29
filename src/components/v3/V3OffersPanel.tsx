import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_AUTO_REPEAT_CHAPTER, V3_JOB_TEMPLATES } from '../../game/v3/jobs'
import { getV3OfferView, type V3OfferReason } from '../../game/v3/offers'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'
import { v3JobLabel } from './v3Labels'

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
  repeat: { en: 'Repeat Order', th: 'งานซ้ำ' },
  rush: { en: 'Rush', th: 'งานด่วน' },
  showcase: { en: 'Showcase', th: 'โชว์เคส' },
}
const KIND_COLOR: Record<string, string> = {
  tutorial: '#3F6680', milestone: '#7A5A1E', repeat: '#1E5B45', rush: '#8A3A2A', showcase: '#5B3A8A',
}
/** Never crash on a job kind without a label (showcase was missing: C3 offers crash). */
const kindLabel = (kind: string): BilingualTextValue => KIND[kind] ?? { en: kind, th: kind }

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
  const offers = visible.flatMap((template) => (template.branches ?? [null]).map((branch) => ({ template, branch: branch?.family ?? null })))

  return (
    <>
      <View style={styles.headRow}>
        <Text style={styles.headTitle}>{t({ en: 'CUSTOMER OFFERS', th: 'ข้อเสนอลูกค้า' })}</Text>
        <View style={styles.countPill}><Text style={styles.countPillText}>{t({ en: `${offers.length} available`, th: `มี ${offers.length}` })}</Text></View>
      </View>
      <Text style={styles.muted}>{t({ en: 'Quotes lock when accepted. ETA = qualifying stock + fully supplied qualifying lines.', th: 'ราคาถูกล็อกตอนรับงาน ETA = สต็อกที่ผ่านเกณฑ์ + ไลน์ที่ผลิตคุณภาพถึงเมื่อวัตถุดิบพอ' })}</Text>
      {offers.map(({ template, branch }) => {
        const view = getV3OfferView(state, template.id, branch)
        const accept: ActionInput = branch ? { type: 'accept_job', templateId: template.id, branch } : { type: 'accept_job', templateId: template.id }
        const blocked = check(accept)
        return (
          <View key={`${template.id}:${branch ?? ''}`} style={styles.ticket}>
            <View style={[styles.banner, { backgroundColor: KIND_COLOR[template.kind] ?? '#3F6680' }]}>
              <Text style={styles.bannerText}>{t(kindLabel(template.kind)).toUpperCase()}</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.itemRow}>
                <View style={styles.portrait}><Text style={styles.portraitGlyph}>🤝</Text></View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{t(v3JobLabel(template.id))}{branch ? ` · ${branch === 'petrochemicals' ? 'Petro' : 'Pellets'}` : ''}</Text>
                  <Text style={styles.itemSub}>Q{view.minimumQuality}+ · {view.quantity} {t({ en: 'units', th: 'หน่วย' })}</Text>
                </View>
              </View>
              {branch && <Text style={styles.muted}>{t({ en: 'Pick ONE product for this job; the other cannot be shipped to it.', th: 'เลือกสินค้าเพียงชนิดเดียวต่องาน ส่งอีกชนิดเข้างานนี้ไม่ได้' })}</Text>}

              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statGlyph}>💵</Text>
                  <View>
                    <Text style={styles.statValue}>${(view.unitPriceCents * view.quantity / 100).toLocaleString()}</Text>
                    {view.completionBonusCents > 0 && <Text style={styles.statSub}>+${(view.completionBonusCents / 100).toFixed(0)} {t({ en: 'bonus', th: 'โบนัส' })}</Text>}
                  </View>
                </View>
                {template.researchReward > 0 && (
                  <View style={styles.stat}>
                    <Text style={styles.statGlyph}>⭐</Text>
                    <Text style={styles.statValue}>{template.researchReward} RP</Text>
                  </View>
                )}
                <View style={styles.stat}>
                  <Text style={styles.statGlyph}>⏱️</Text>
                  <Text style={styles.statValue}>{view.feasibility === 'ready' ? (view.etaSeconds === null ? '—' : formatSeconds(view.etaSeconds)) : '—'}</Text>
                </View>
              </View>

              {view.feasibility !== 'ready' && (
                <Text style={styles.warning}>
                  {`${view.feasibility === 'planned' ? t({ en: 'Planned', th: 'ต้องเตรียม' }) : t({ en: 'Unavailable', th: 'ยังทำไม่ได้' })}: ${view.reasons.map((reason) => t(REASON[reason] ?? { en: reason, th: reason })).join(', ')}`}
                </Text>
              )}
              {view.rush && (
                <Text style={styles.muted}>{t({ en: `Deadline ${formatSeconds(view.rush.deadlineTicks / 5)} simulated (paused when the game is paused)`, th: `กำหนดส่ง ${formatSeconds(view.rush.deadlineTicks / 5)} ในเกม (หยุดเดินเมื่อหยุดเกม)` })}</Text>
              )}

              <Pressable
                accessibilityState={{ disabled: Boolean(blocked) }}
                disabled={Boolean(blocked)}
                onPress={() => run(accept)}
                style={[styles.accept, blocked && styles.acceptLocked]}
              >
                <Text style={styles.acceptText}>{blocked ? '🔒 ' : ''}{t({ en: 'Accept', th: 'รับงาน' })}</Text>
                {blocked && <Text style={styles.acceptReason}>{describe(blocked)}</Text>}
              </Pressable>
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
          </View>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headTitle: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 14 },
  countPill: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  countPillText: { color: '#8FD3FF', fontFamily: fonts.heading, fontSize: 11 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16, marginBottom: 6 },
  ticket: { backgroundColor: '#12324A', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  banner: { paddingVertical: 6, paddingHorizontal: 12 },
  bannerText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.5 },
  body: { padding: 12, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  portrait: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', alignItems: 'center', justifyContent: 'center' },
  portraitGlyph: { fontSize: 24 },
  itemBody: { flex: 1, gap: 1 },
  itemTitle: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 14 },
  itemSub: { color: '#8FA9BA', fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statGlyph: { fontSize: 16 },
  statValue: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  statSub: { color: '#8FA9BA', fontSize: 10 },
  warning: { color: '#FFAD8A', fontSize: 12 },
  accept: { backgroundColor: '#FFD447', borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  acceptLocked: { backgroundColor: '#5B4A2A' },
  acceptText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 13 },
  acceptReason: { color: '#0A2943', fontSize: 10, marginTop: 2, opacity: 0.8, textAlign: 'center' },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  active: { borderColor: '#6ACDB4', backgroundColor: '#2E6C63' },
  disabled: { opacity: 0.45 },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
})
