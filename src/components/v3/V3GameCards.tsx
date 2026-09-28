import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { explainV3ProgramFit } from '../../game/v3/actions'
import { V3_SPECIALIZATION, V3_SPECIALIZATION_CHAPTER } from '../../game/v3/data'
import { getV3BlueprintQuality } from '../../game/v3/development'
import { getV3GradeName } from '../../game/v3/gradeNames'
import { getV3StockAllocations } from '../../game/v3/productInventory'
import { evaluateV3GasolineProduction } from '../../game/v3/production'
import { getV3RecoveryOffer } from '../../game/v3/recovery'
import { V3_DEFAULT_BLUEPRINT_ID } from '../../game/v3/state'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { getV3LeadContribution } from '../../game/v3/workforce'
import { listV3Buildings } from '../../game/v3/yard'
import { fonts, pixelUi } from '../../theme'
import { v3JobLabel } from './v3Labels'

type Translate = (value: BilingualTextValue) => string
type CardProps = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
}

const findBuilding = (state: V3GameState, type: string) => listV3Buildings(state).find((building) => building.type === type)?.id ?? null

/** Gasoline line status: potential vs actual output, byproducts, pause toggle. */
export function V3GasolineLineCard({ state, apply, t }: CardProps) {
  const distillationBuildingId = findBuilding(state, 'distillationUnit')
  const program = distillationBuildingId ? state.plantPrograms[distillationBuildingId] : undefined
  const blueprint = program ? state.productBlueprints[program.blueprintId] : null
  const preview = evaluateV3GasolineProduction(state, 25)
  const potential = preview.reduce((sum, line) => sum + line.potentialOutputPerMinute, 0)
  const actual = preview.reduce((sum, line) => sum + line.actualOutputPerMinute, 0)
  const paused = distillationBuildingId ? Boolean(state.plantPrograms[distillationBuildingId]?.paused) : false
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{blueprint
        ? `${t({ en: 'Gasoline line', th: 'ไลน์ Gasoline' })} · ${blueprint.name} Q${blueprint.quality}`
        : t({ en: 'Gasoline line · missing', th: 'ไลน์ Gasoline · ไม่มีอาคาร' })}</Text>
      <View style={styles.metricRow}>
        <View style={styles.metric}><Text style={styles.metricLabel}>{t({ en: 'ACTUAL / MIN', th: 'ผลิตจริง / นาที' })}</Text><Text style={styles.metricValue}>{actual.toFixed(1)}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>{t({ en: 'POTENTIAL / MIN', th: 'กำลังผลิต / นาที' })}</Text><Text style={styles.metricValue}>{potential.toFixed(1)}</Text></View>
      </View>
      <View style={styles.bar}><View style={[styles.fill, { width: `${potential > 0 ? Math.round(Math.min(1, actual / potential) * 100) : 0}%` }]} /></View>
      <Text style={styles.row}>{t({ en: 'Feedstock', th: 'Feedstock (วัตถุดิบต่อ)' })}: {state.world.feedstock.toFixed(1)} · {t({ en: 'Waste', th: 'ของเสีย' })}: {state.world.waste.toFixed(1)}</Text>
      {distillationBuildingId && (
        <Pressable style={styles.secondary} onPress={() => apply({
          type: 'set_pause', sequence: state.nextActionSequence, buildingId: distillationBuildingId, paused: !paused,
        })}>
          <Text style={styles.secondaryText}>{paused ? t({ en: 'Resume Distillation', th: 'เดิน Distillation ต่อ' }) : t({ en: 'Pause Distillation', th: 'พัก Distillation' })}</Text>
        </Pressable>
      )}
    </View>
  )
}

/** Starter gasoline recipes: grade names, fit reasons, and the two C1 prototypes. */
export function V3GasolineDevelopmentCard({ state, apply, t, describe }: CardProps) {
  const distillationBuildingId = findBuilding(state, 'distillationUnit')
  const labBuildingId = findBuilding(state, 'laboratory')
  const recipes = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.family === 'gasoline')
    .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
  // Lead: the best free employee who adds quality; else any free operator (no bonus yet).
  const free = state.world.employees.filter((employee) => state.employeeDuties[employee.id]?.kind !== 'development')
  const lead = free.find((employee) => getV3LeadContribution(employee, 'gasoline') > 0)
    ?? free.find((employee) => employee.type === 'operator') ?? null
  const leadBonus = lead ? getV3LeadContribution(lead, 'gasoline') : 0
  const volumeQ = getV3BlueprintQuality('volume', 'none', 0, 0)
  const standardQ = getV3BlueprintQuality('standard', 'none', 0, 0)
  const precisionQ = getV3BlueprintQuality('precision', 'none', 0, leadBonus)
  const grade = (quality: number) => `${getV3GradeName('gasoline', quality)} Q${quality}`
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Gasoline recipes', th: 'สูตร Gasoline' })}</Text>
      {distillationBuildingId && recipes.map((blueprint) => {
        const fit = explainV3ProgramFit(state, distillationBuildingId, blueprint.id)
        const active = state.plantPrograms[distillationBuildingId]?.blueprintId === blueprint.id
        const needs = [
          blueprint.minPlantLevel > 1 ? t({ en: `plant Lv${blueprint.minPlantLevel}`, th: `โรงงาน Lv${blueprint.minPlantLevel}` }) : null,
          blueprint.module !== 'none' ? t({ en: `${blueprint.module} module`, th: `โมดูล ${blueprint.module}` }) : null,
        ].filter(Boolean).join(' + ')
        return (
          <View key={blueprint.id}>
            <Pressable
              disabled={Boolean(fit) && !active}
              accessibilityState={{ disabled: Boolean(fit) && !active, selected: active }}
              style={[styles.secondary, active && styles.selected, fit && !active && styles.disabled]}
              onPress={() => apply({ type: 'set_program', sequence: state.nextActionSequence, buildingId: distillationBuildingId, blueprintId: blueprint.id })}
            >
              <Text style={styles.secondaryText}>{active ? '✓ ' : ''}{blueprint.name} Q{blueprint.quality}{needs ? ` · ${needs}` : ''}</Text>
            </Pressable>
            {fit && !active && <Text style={styles.warning}>{describe({ tone: 'blocked', messageId: fit.messageId, params: fit.params } as V3ActionEvent)}</Text>}
          </View>
        )
      })}
      <Text style={styles.muted}>{t({ en: 'Lab approaches', th: 'แนวทางในแล็บ' })}: {grade(volumeQ)} · {grade(standardQ)} · {grade(getV3BlueprintQuality('precision', 'none', 0, 0))}{t({ en: ' (+5 with a qualified lead)', th: ' (+5 เมื่อมีหัวหน้าที่เก่งพอ)' })}</Text>
      {state.developmentProject ? (
        <>
          <Text style={styles.row}>{t({ en: 'Developing', th: 'กำลังพัฒนา' })}: {getV3GradeName(state.developmentProject.family, state.developmentProject.quality)} Q{state.developmentProject.quality} · {(state.developmentProject.remainingTicks / 5).toFixed(0)}s</Text>
          <Pressable style={styles.secondary} onPress={() => apply({ type: 'cancel_development', sequence: state.nextActionSequence })}>
            <Text style={styles.secondaryText}>{t({ en: 'Cancel project (spent inputs stay spent)', th: 'ยกเลิกโครงการ (ไม่คืนของที่ใช้แล้ว)' })}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable style={styles.secondary} onPress={() => apply({
            type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: null, labBuildingId: labBuildingId ?? '',
          })}>
            <Text style={styles.secondaryText}>{t({ en: `Develop ${grade(volumeQ)} · 10 Gas + $50`, th: `พัฒนา ${grade(volumeQ)} · Gas 10 + $50` })}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => apply({
            type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0, leadEmployeeId: lead?.id ?? null, labBuildingId: labBuildingId ?? '',
          })}>
            <Text style={styles.secondaryText}>{lead
              ? t({ en: `Develop ${grade(precisionQ)} · lead ${lead.name}`, th: `พัฒนา ${grade(precisionQ)} · หัวหน้า ${lead.name}` })
              : t({ en: `Develop ${grade(precisionQ)}`, th: `พัฒนา ${grade(precisionQ)}` })}</Text>
          </Pressable>
        </>
      )}
    </View>
  )
}

/** The accepted client job: progress, shipping, auto-dispatch and cancel. */
export function V3ActiveJobCard({ state, apply, t, onOpenOffers }: CardProps & { onOpenOffers?: () => void }) {
  const job = state.acceptedJob
  if (!job) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Current job', th: 'งานปัจจุบัน' })}</Text>
        <Text style={styles.row}>{t({ en: 'No job yet. Pick one under Offers.', th: 'ยังไม่มีงาน เลือกได้ที่แท็บ "ข้อเสนอ"' })}</Text>
        <Text style={styles.muted}>{t({ en: 'Completed receipts', th: 'งานที่สำเร็จแล้ว' })}: {state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').length}</Text>
        {onOpenOffers && <Pressable style={styles.primary} onPress={onOpenOffers} accessibilityRole="button">
          <Text style={styles.primaryText}>{t({ en: 'View customer offers', th: 'ดูข้อเสนอลูกค้า' })}</Text>
        </Pressable>}
      </View>
    )
  }
  const allocations = getV3StockAllocations(state, job.family)
  const reserved = allocations.reduce((sum, allocation) => sum + allocation.jobReserved, 0)
  const eligible = allocations.filter((allocation) => allocation.quality >= job.minimumQuality && allocation.quantity - allocation.kept > 0)
  const defaultId = V3_DEFAULT_BLUEPRINT_ID[job.family]
  const policy = state.stockPolicies[defaultId] ?? { keepQuantity: 0, autoSell: false, autoDispatch: false }
  const remaining = job.quantity - job.deliveredQuantity
  const defaultName = state.productBlueprints[defaultId]?.name ?? ''
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t(v3JobLabel(job.templateId))}</Text>
      <View style={styles.jobSummary}>
        <Text style={styles.jobQuantity}>{job.deliveredQuantity}/{job.quantity}</Text>
        <Text style={styles.jobRequirement}>{t({ en: 'SHIPPED', th: 'ส่งแล้ว' })} · Q{job.minimumQuality}+</Text>
      </View>
      <View style={styles.bar}><View style={[styles.fill, { width: `${Math.round((job.deliveredQuantity / Math.max(1, job.quantity)) * 100)}%` }]} /></View>
      {job.deadlineTick !== null && (
        <Text style={styles.warning}>{t({
          en: `Rush: ${Math.max(0, Math.ceil((job.deadlineTick - state.world.tickCount) / 5))}s left · only the bonus is lost on expiry`,
          th: `งานด่วน: เหลือ ${Math.max(0, Math.ceil((job.deadlineTick - state.world.tickCount) / 5))} วินาที · หมดเวลาเสียแค่โบนัส`,
        })}</Text>
      )}
      <Text style={styles.row}>{t({ en: 'Reserved qualified stock', th: 'สต็อกผ่านสเปกที่จองไว้' })}: {reserved.toFixed(1)}</Text>
      <Pressable style={styles.primary} onPress={() => apply({
        type: 'dispatch_job', sequence: state.nextActionSequence,
        quantity: Math.max(1, Math.min(10, Math.floor(reserved), remaining)),
      })}>
        <Text style={styles.primaryText}>{t({ en: 'Ship up to 10 units', th: 'ส่งสินค้าไม่เกิน 10 หน่วย' })}</Text>
      </Pressable>
      {eligible.map((allocation) => (
        <Pressable key={`ship-${allocation.blueprintId}`} style={styles.secondary} onPress={() => apply({
          type: 'dispatch_job', sequence: state.nextActionSequence,
          quantity: Math.max(1, Math.min(10, Math.floor(allocation.quantity - allocation.kept), remaining)),
          blueprintId: allocation.blueprintId,
        })}>
          <Text style={styles.secondaryText}>{t({ en: 'Ship', th: 'ส่ง' })} {state.productBlueprints[allocation.blueprintId]?.name} Q{allocation.quality}</Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.secondary, policy.autoDispatch && styles.selected]}
        accessibilityState={{ checked: policy.autoDispatch }}
        onPress={() => apply({ type: 'set_stock_policy', sequence: state.nextActionSequence, blueprintId: defaultId, autoDispatch: !policy.autoDispatch })}
      >
        <Text style={styles.secondaryText}>{t({
          en: `Auto-ship ${defaultName}: ${policy.autoDispatch ? 'ON' : 'OFF'}`,
          th: `ส่งอัตโนมัติ ${defaultName}: ${policy.autoDispatch ? 'เปิด' : 'ปิด'}`,
        })}</Text>
      </Pressable>
      <Pressable style={styles.textButton} onPress={() => apply({ type: 'cancel_job', sequence: state.nextActionSequence })}>
        <Text style={styles.dangerText}>{t({ en: 'Cancel job', th: 'ยกเลิกงาน' })}</Text>
      </Pressable>
    </View>
  )
}

/** Safe recovery (tolling / loaners); renders nothing when not needed. */
export function V3RecoveryCard({ state, apply, t, onReviewRemoval }: CardProps & { onReviewRemoval: (buildingId: string) => void }) {
  const offer = getV3RecoveryOffer(state)
  if (!(offer.tollingAvailable || offer.missingBuildings.length > 0 || state.recoveryState?.status === 'running')) return null
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Safe recovery', th: 'กู้สถานการณ์' })}</Text>
      {state.recoveryState?.status === 'running' ? (
        <Text style={styles.row}>{t({ en: 'Customer tolling', th: 'งานกลั่นวัตถุดิบลูกค้า' })}: {(state.recoveryState.remainingTicks / 5).toFixed(0)}s · {t({ en: 'operating debits paused', th: 'พักรายจ่ายดำเนินงาน' })}</Text>
      ) : offer.tollingAvailable ? (
        <Pressable style={styles.primary} onPress={() => apply({ type: 'start_recovery', sequence: state.nextActionSequence })}>
          <Text style={styles.primaryText}>{t({ en: `Run 20s tolling · restore up to $${(offer.cashDeficitCents / 100).toFixed(0)}`, th: `รับงานช่วยกลั่น 20 วินาที · เติมส่วนขาดสูงสุด $${(offer.cashDeficitCents / 100).toFixed(0)}` })}</Text>
        </Pressable>
      ) : null}
      {offer.missingBuildings.length > 0 && (
        <>
          <Text style={styles.row}>{t({ en: 'Missing starter route', th: 'เส้นเริ่มต้นที่ขาด' })}: {offer.missingBuildings.join(', ')}</Text>
          {offer.emptySlotsNeeded > 0 ? (
            <>
              <Text style={styles.warning}>{t({ en: 'Not enough free land for the loaners. Nothing is removed automatically.', th: 'ที่ดินว่างไม่พอสำหรับอาคารยืม ระบบจะไม่รื้อให้อัตโนมัติ' })}</Text>
              {listV3Buildings(state).map((building) => building ? (
                <Pressable key={`clear-${building.id}`} style={styles.secondary} onPress={() => onReviewRemoval(building.id)}>
                  <Text style={styles.secondaryText}>{t({ en: `Review removal · ${building.type} @(${building.x},${building.y})`, th: `ตรวจสอบการรื้อ · ${building.type} @(${building.x},${building.y})` })}</Text>
                </Pressable>
              ) : null)}
            </>
          ) : (
            <Pressable style={styles.secondary} onPress={() => apply({ type: 'restore_starter_loaners', sequence: state.nextActionSequence })}>
              <Text style={styles.secondaryText}>{t({ en: 'Restore missing zero-refund loaners', th: 'วางตึกยืมที่ขาด (รื้อแล้วไม่ได้เงิน)' })}</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  )
}

/** Lifetime money summary. */
export function V3LedgerCard({ state, t }: { state: V3GameState; t: Translate }) {
  const money = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const net = state.operatingLedger.lifetimeReceiptsCents - state.operatingLedger.lifetimeCashOutflowsCents
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Finances (lifetime)', th: 'การเงิน (ตั้งแต่เริ่ม)' })}</Text>
      <Text style={styles.row}>{t({ en: 'Operating income', th: 'รายรับดำเนินงาน' })}: {money(state.operatingLedger.lifetimeReceiptsCents)}</Text>
      <Text style={styles.row}>{t({ en: 'Operating costs', th: 'รายจ่ายดำเนินงาน' })}: {money(state.operatingLedger.lifetimeCashOutflowsCents)}</Text>
      <Text style={[styles.row, styles.strong]}>{t({ en: 'Operating profit', th: 'กำไรดำเนินงาน' })}: {money(net)}</Text>
      <Text style={styles.row}>{t({ en: 'Invested in buildings', th: 'ลงทุนอาคาร' })}: {money(state.operatingLedger.capexCents)}</Text>
      <Text style={styles.muted}>{t({ en: 'Buildings', th: 'อาคาร' })}: {Object.keys(state.world.buildingsById).length}</Text>
    </View>
  )
}

const SPECIALIZATION_LABEL: Record<keyof typeof V3_SPECIALIZATION, BilingualTextValue> = {
  green: { en: 'Green refinery', th: 'โรงกลั่นสีเขียว' },
  industrial: { en: 'Heavy industry', th: 'อุตสาหกรรมหนัก' },
}
const pct = (factor: number) => `${factor >= 1 ? '+' : '−'}${Math.round(Math.abs(factor - 1) * 100)}%`

/** Company-wide direction (moved here from Staff: it affects the whole factory). */
export function V3SpecializationCard({ state, apply, t, describe }: CardProps) {
  const chosen = state.world.specialization as keyof typeof V3_SPECIALIZATION | null | undefined
  const paths = Object.keys(V3_SPECIALIZATION) as Array<keyof typeof V3_SPECIALIZATION>
  const locked = state.campaignProgress.chapter < V3_SPECIALIZATION_CHAPTER
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Company direction (optional)', th: 'แนวทางบริษัท (ไม่บังคับ)' })}</Text>
      <Text style={styles.muted}>{t({ en: `One-time choice from C${V3_SPECIALIZATION_CHAPTER}. Affects every line.`, th: `เลือกได้ครั้งเดียวตั้งแต่บท C${V3_SPECIALIZATION_CHAPTER} มีผลกับทุกไลน์` })}</Text>
      {paths.map((path) => {
        const rule = V3_SPECIALIZATION[path]
        const effect = t({
          en: `output ${pct(rule.rate)} · power ${pct(rule.energy)} · waste ${pct(rule.waste)}`,
          th: `กำลังผลิต ${pct(rule.rate)} · ใช้ไฟ ${pct(rule.energy)} · ของเสีย ${pct(rule.waste)}`,
        })
        if (chosen) {
          return chosen === path ? <Text key={path} style={styles.row}>✓ {t(SPECIALIZATION_LABEL[path])} · {effect}</Text> : null
        }
        return (
          <Pressable
            key={path}
            disabled={locked}
            accessibilityState={{ disabled: locked }}
            style={[styles.secondary, locked && styles.disabled]}
            onPress={() => apply({ type: 'choose_specialization', sequence: state.nextActionSequence, path })}
          >
            <Text style={styles.secondaryText}>{t(SPECIALIZATION_LABEL[path])}</Text>
            <Text style={styles.buttonSub}>{effect}</Text>
          </Pressable>
        )
      })}
      {locked && !chosen && <Text style={styles.warning}>{describe({ tone: 'blocked', messageId: 'v3.specialization.locked', params: { chapter: V3_SPECIALIZATION_CHAPTER } } as V3ActionEvent)}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: pixelUi.surface, borderWidth: 2, borderColor: pixelUi.border, padding: 14, gap: 9 },
  cardTitle: { color: pixelUi.accent, fontFamily: fonts.brandDisplay, fontSize: 18 },
  row: { color: pixelUi.text, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  strong: { fontFamily: fonts.heading },
  muted: { color: pixelUi.textMuted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
  warning: { color: pixelUi.warning, fontFamily: fonts.body, fontSize: 12 },
  metricRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, backgroundColor: pixelUi.canvas, borderWidth: 1, borderColor: pixelUi.borderSoft, padding: 8, gap: 2 },
  metricLabel: { color: pixelUi.textMuted, fontFamily: fonts.brandHeading, fontSize: 11 },
  metricValue: { color: pixelUi.text, fontFamily: fonts.brandDisplay, fontSize: 21 },
  jobSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  jobQuantity: { color: pixelUi.text, fontFamily: fonts.brandDisplay, fontSize: 25 },
  jobRequirement: { color: pixelUi.rp, fontFamily: fonts.brandHeading, fontSize: 12 },
  bar: { height: 9, backgroundColor: pixelUi.canvas, borderWidth: 1, borderColor: pixelUi.borderSoft, overflow: 'hidden' },
  fill: { height: 9, backgroundColor: pixelUi.success },
  primary: { backgroundColor: pixelUi.accent, borderWidth: 2, borderBottomWidth: 4, borderColor: pixelUi.accentDark, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  primaryText: { color: pixelUi.canvas, fontFamily: fonts.brandHeading, fontSize: 13 },
  secondary: { backgroundColor: pixelUi.surfaceRaised, borderWidth: 2, borderColor: pixelUi.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 13, textAlign: 'center' },
  buttonSub: { color: pixelUi.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  selected: { borderColor: pixelUi.success, backgroundColor: pixelUi.surfacePressed },
  disabled: { opacity: 0.5 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: '#E89494', fontFamily: fonts.heading, fontSize: 13 },
})
