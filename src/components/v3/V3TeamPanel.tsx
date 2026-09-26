import { Pressable, StyleSheet, Text, View } from 'react-native'

import { BUILDINGS } from '../../game/data/buildings'
import type { BilingualTextValue, WorkerType } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_ROLES, V3_SPECIALIZATION, V3_STAFF_LEVELS, isV3ProcessBuilding } from '../../game/v3/data'
import { getV3Modifiers, type V3CappedChannel } from '../../game/v3/modifiers'
import type { V3Action, V3ActionEvent, V3EmployeeDuty, V3GameState } from '../../game/v3/types'
import { listV3Buildings } from '../../game/v3/yard'
import { getV3LocalCrewRate, getV3StaffCap, getV3TrainingCost, getV3WageCents } from '../../game/v3/workforce'
import { fonts } from '../../theme'
import { V3_CAREER, getV3CareerRank, getV3RareCandidate } from '../../game/v3/careers'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
type ActionInput = WithoutSequence<V3Action>
type Translate = (value: BilingualTextValue) => string

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
}

const ROLE_LABEL: Record<WorkerType, BilingualTextValue> = {
  operator: { en: 'Operator', th: 'Operator' },
  fuelSpecialist: { en: 'Fuel Specialist', th: 'ผู้เชี่ยวชาญเชื้อเพลิง' },
  aviationSpecialist: { en: 'Aviation Specialist', th: 'ผู้เชี่ยวชาญการบิน' },
  chemicalEngineer: { en: 'Chemical Engineer', th: 'วิศวกรเคมี' },
  polymerEngineer: { en: 'Polymer Engineer', th: 'วิศวกรพอลิเมอร์' },
  chemist: { en: 'Chemist', th: 'นักเคมี' },
  mechanic: { en: 'Mechanic', th: 'ช่างซ่อม' },
  salesAgent: { en: 'Sales Agent', th: 'ฝ่ายขาย' },
  safetyOfficer: { en: 'Safety Officer', th: 'เจ้าหน้าที่ความปลอดภัย' },
  logisticsCoordinator: { en: 'Logistics', th: 'โลจิสติกส์' },
}

const ROLE_DUTY: Record<WorkerType, BilingualTextValue> = {
  operator: { en: 'Line: Distillation/Lube/Jet · R&D lead Q+5 at Lv3', th: 'ไลน์: Distillation/Lube/Jet · นำ R&D Q+5 เมื่อ Lv3' },
  fuelSpecialist: { en: 'Line: Distillation/Lube (matched +15%) · R&D Gas/Lube Q+5', th: 'ไลน์: Distillation/Lube (ตรงสาย +15%) · R&D Gas/Lube Q+5' },
  aviationSpecialist: { en: 'Line: Jet (matched +15%) · R&D Jet Q+5', th: 'ไลน์: Jet (ตรงสาย +15%) · R&D Jet Q+5' },
  chemicalEngineer: { en: 'Petro line/R&D — arrives with Petro in C4', th: 'ไลน์/R&D Petro — มาพร้อม Petro ในบท C4' },
  polymerEngineer: { en: 'Polymer line/R&D — arrives with Polymer in C4', th: 'ไลน์/R&D Polymer — มาพร้อม Polymer ในบท C4' },
  chemist: { en: 'Support: job RP +10% · R&D lead Q+5 for any family', th: 'Support: RP จากงาน +10% · นำ R&D ได้ทุก family Q+5' },
  mechanic: { en: 'Support: +25 storage each family (max 3 staff)', th: 'Support: ความจุ +25 ทุกชนิด (นับสูงสุด 3 คน)' },
  salesAgent: { en: 'Support: prices +4% (shared cap 15%)', th: 'Support: ราคาขาย +4% (รวมสูงสุด 15%)' },
  safetyOfficer: { en: 'Support: maintenance −5% (all upkeep cuts cap 25%)', th: 'Support: ค่าบำรุง −5% (ส่วนลดค่าบำรุงรวมสูงสุด 25%)' },
  logisticsCoordinator: { en: 'Support: storage +10% (shared cap 50%)', th: 'Support: ความจุ +10% (รวมสูงสุด 50%)' },
}

function dutyText(duty: V3EmployeeDuty | undefined, t: Translate): string {
  if (!duty || duty.kind === 'reserve') return t({ en: 'Reserve (25% wage, no effect)', th: 'สำรอง (ค่าจ้าง 25% ไม่มีผล)' })
  if (duty.kind === 'support') return t({ en: 'Support', th: 'Support' })
  if (duty.kind === 'development') return t({ en: 'Leading R&D (line/support benefit paused)', th: 'นำ R&D (หยุดผลเดิมชั่วคราว)' })
  return t({ en: 'Line duty', th: 'ประจำไลน์' })
}

function channelText(channel: V3CappedChannel, percent = true): string {
  const fmt = (value: number) => (percent ? `${(value * 100).toFixed(1)}%` : value.toFixed(0))
  return channel.raw > channel.effective + 1e-9
    ? `${fmt(channel.effective)} (${fmt(channel.raw)} → cap ${fmt(channel.cap)})`
    : `${fmt(channel.effective)} / cap ${fmt(channel.cap)}`
}

export function V3TeamPanel({ state, apply, t, describe }: Props) {
  const check = (action: ActionInput): V3ActionEvent | null => {
    const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
    return result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
  }
  const run = (action: ActionInput) => apply({ ...action, sequence: state.nextActionSequence } as V3Action)
  const Gate = ({ label, action }: { label: string; action: ActionInput }) => {
    const blocked = check(action)
    return (
      <View style={styles.gate}>
        <Pressable
          accessibilityState={{ disabled: Boolean(blocked) }}
          disabled={Boolean(blocked)}
          onPress={() => run(action)}
          style={[styles.secondary, blocked && styles.disabled]}
        >
          <Text style={styles.secondaryText}>{label}</Text>
        </Pressable>
        {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
      </View>
    )
  }

  const modifiers = getV3Modifiers(state)
  const lineCells = listV3Buildings(state)
    .filter((building) => isV3ProcessBuilding(building.type) && state.plantPrograms[building.id])
    .map((building) => ({ cell: building.type, index: building.id, label: `@(${building.x},${building.y})` }))
  const cap = getV3StaffCap(state)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Team', th: 'ทีมงาน' })} · {state.world.employees.length}/{cap}</Text>
        {state.world.employees.map((employee) => {
          const duty = state.employeeDuties[employee.id]
          const unpaid = state.unpaidEmployeeIds.includes(employee.id)
          const record = state.employeeRecords[employee.id]
          const threshold = V3_STAFF_LEVELS.xpToNextLevel[employee.level]
          const training = getV3TrainingCost(employee)
          const contribution = duty?.kind === 'line'
            ? t({ en: `local crew +${(getV3LocalCrewRate(state, duty.buildingId) * 100).toFixed(0)}%`, th: `ทีมไลน์ +${(getV3LocalCrewRate(state, duty.buildingId) * 100).toFixed(0)}%` })
            : modifiers.supportContributions[employee.id]
              ? `${modifiers.supportContributions[employee.id].channel} +${modifiers.supportContributions[employee.id].value < 1 ? `${(modifiers.supportContributions[employee.id].value * 100).toFixed(1)}%` : modifiers.supportContributions[employee.id].value.toFixed(0)}`
              : t({ en: 'no active effect', th: 'ยังไม่มีผล' })
          return (
            <View key={employee.id} style={styles.person}>
              <Text style={styles.personTitle}>{employee.isAce ? '★ ' : ''}{employee.name} · {getV3CareerRank(state, employee.id) > 0 ? `${t(V3_CAREER.titles[getV3CareerRank(state, employee.id)])} ` : ''}{t(ROLE_LABEL[employee.type])} Lv{employee.level}</Text>
              <Text style={styles.row}>XP {employee.xp.toFixed(0)}{threshold && employee.level < V3_STAFF_LEVELS.maxLevel ? `/${threshold}` : ' · MAX'} · ${(getV3WageCents(employee, duty ?? { kind: 'reserve' }, 300) / 100).toFixed(2)}/min</Text>
              <Text style={[styles.row, unpaid && styles.warning]}>{dutyText(duty, t)} · {unpaid ? t({ en: 'UNPAID — no effect', th: 'ค้างค่าจ้าง — ไม่มีผล' }) : contribution}</Text>
              <Text style={styles.muted}>{t(ROLE_DUTY[employee.type])}</Text>
              {record && (record.blueprintIds.length > 0 || record.milestoneIds.length > 0 || record.workTicks > 0) && (
                <Text style={styles.muted}>{t({
                  en: `Record: ${(record.workTicks / 300).toFixed(1)} min on lines · ${record.blueprintIds.length} recipe(s) · ${record.milestoneIds.join(', ') || 'no milestones yet'}`,
                  th: `ผลงาน: ทำไลน์ ${(record.workTicks / 300).toFixed(1)} นาที · ${record.blueprintIds.length} สูตร · ${record.milestoneIds.join(', ') || 'ยังไม่มี milestone'}`,
                })}</Text>
              )}
              <View style={styles.chips}>
                {lineCells.filter(({ cell }) => V3_ROLES[employee.type].lineBuildings.includes(cell as never)).map(({ cell, index, label }) => (
                  <Gate key={`line-${index}`} label={t({ en: `→ ${BUILDINGS[cell].name.en} ${label}`, th: `→ ${BUILDINGS[cell].name.th} ${label}` })} action={{ type: 'assign_duty', employeeId: employee.id, duty: { kind: 'line', buildingId: index } }} />
                ))}
                {V3_ROLES[employee.type].support && (
                  <Gate label={t({ en: '→ Support', th: '→ Support' })} action={{ type: 'assign_duty', employeeId: employee.id, duty: { kind: 'support' } }} />
                )}
                {unpaid && (
                  <Gate label={t({ en: 'Resume after funding wages', th: 'กลับเข้าทำงานหลังเตรียมค่าจ้าง' })} action={{ type: 'resume_employee', employeeId: employee.id }} />
                )}
                <Gate label={t({ en: '→ Reserve', th: '→ สำรอง' })} action={{ type: 'assign_duty', employeeId: employee.id, duty: { kind: 'reserve' } }} />
                <Gate label={t({ en: `Train · $${training.cents / 100} + ${training.rp} RP`, th: `ฝึก · $${training.cents / 100} + ${training.rp} RP` })} action={{ type: 'train_employee', employeeId: employee.id }} />
                {getV3CareerRank(state, employee.id) < V3_CAREER.maxRank && (
                  <Gate
                    label={t({
                      en: `Promote to ${V3_CAREER.titles[getV3CareerRank(state, employee.id) + 1].en} · $${V3_CAREER.promotionDollars[getV3CareerRank(state, employee.id)]} + ${V3_CAREER.promotionRp[getV3CareerRank(state, employee.id)]} RP (Lv→1, +5% crew / ×1.25 support)`,
                      th: `เลื่อนเป็น${V3_CAREER.titles[getV3CareerRank(state, employee.id) + 1].th} · $${V3_CAREER.promotionDollars[getV3CareerRank(state, employee.id)]} + ${V3_CAREER.promotionRp[getV3CareerRank(state, employee.id)]} RP (เลเวลกลับเป็น 1, ไลน์ +5% / support ×1.25)`,
                    })}
                    action={{ type: 'promote_employee', employeeId: employee.id }}
                  />
                )}
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.card}>
        {(() => {
          const candidate = getV3RareCandidate(state)
          if (!candidate) return <Text style={styles.muted}>{t({ en: 'Rare ★ candidates visit each quarter once your fame reaches Lv3.', th: 'ผู้สมัครหายาก ★ จะมาทุกไตรมาสเมื่อชื่อเสียงถึง Lv3' })}</Text>
          return (
            <View style={styles.person}>
              <Text style={styles.personTitle}>★ {candidate.employee.name} · {t(ROLE_LABEL[candidate.employee.type])} Lv{candidate.employee.level}</Text>
              <Text style={styles.muted}>{(candidate.employee.skills ?? []).map((skill) => `${skill.channel} +${Math.round(skill.value * 100)}%`).join(' · ')} · {t({ en: 'leaves at the end of this quarter', th: 'จะไปเมื่อจบไตรมาสนี้' })}</Text>
              <Gate label={t({ en: `Hire ★ · $${(candidate.costCents / 100).toLocaleString()}`, th: `จ้าง ★ · $${(candidate.costCents / 100).toLocaleString()}` })} action={{ type: 'hire_candidate', candidateId: candidate.id }} />
            </View>
          )
        })()}
        <Text style={styles.cardTitle}>{t({ en: 'Hire (guaranteed ordinary candidate)', th: 'จ้างงาน (มีผู้สมัครพื้นฐานเสมอ)' })}</Text>
        <Text style={styles.muted}>{t({ en: 'Specialists speed matched lines; without them, modules + research still reach the required quality.', th: 'ผู้เชี่ยวชาญช่วยไลน์ที่ตรงสาย แต่ถ้าไม่มี ใช้โมดูล + งานวิจัยก็ยังได้คุณภาพที่ต้องการ' })}</Text>
        {(Object.keys(V3_ROLES) as WorkerType[]).map((role) => (
          <Gate key={role} label={`${t(ROLE_LABEL[role])} · $${V3_ROLES[role].hireCostDollars} · C${V3_ROLES[role].hireChapter}`} action={{ type: 'hire_employee', role }} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Company modifiers (capped)', th: 'โบนัสบริษัท (มีเพดาน)' })}</Text>
        <Text style={styles.row}>{t({ en: 'Global line rate', th: 'อัตราผลิตทุกไลน์' })}: {channelText(modifiers.globalRate)}</Text>
        <Text style={styles.row}>{t({ en: 'Storage bonus', th: 'ความจุเพิ่ม' })}: {channelText(modifiers.storagePercent)} · +{modifiers.mechanicStorageFlat.toFixed(0)} {t({ en: 'flat (mechanics)', th: 'หน่วย (ช่าง)' })} · +{modifiers.coreStorageFlat} {t({ en: 'core tanks', th: 'ถังหลัก' })}</Text>
        <Text style={styles.row}>{t({ en: 'Trade / quotes', th: 'ราคาขาย/ใบเสนอราคา' })}: {channelText(modifiers.trade)}</Text>
        <Text style={styles.row}>{t({ en: 'Job RP', th: 'RP จากงาน' })}: {channelText(modifiers.rp)}</Text>
        <Text style={styles.row}>{t({ en: 'Maintenance cut (staff + research)', th: 'ลดค่าบำรุง (ทีม + งานวิจัย)' })}: {channelText(modifiers.upkeep)}</Text>
        <Text style={styles.muted}>{t({ en: 'Safety skills are inactive in V3 (no incident system).', th: 'ทักษะด้านความปลอดภัยยังไม่มีผลใน V3 (ไม่มีระบบอุบัติเหตุ)' })}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Specialization (optional, C3)', th: 'แนวทางโรงงาน (ไม่บังคับ, C3)' })}</Text>
        {state.world.specialization ? (
          <Text style={styles.row}>✓ {state.world.specialization}</Text>
        ) : (
          (Object.keys(V3_SPECIALIZATION) as Array<keyof typeof V3_SPECIALIZATION>).map((path) => (
            <Gate
              key={path}
              label={`${path} · rate ×${V3_SPECIALIZATION[path].rate} · energy ×${V3_SPECIALIZATION[path].energy} · waste ×${V3_SPECIALIZATION[path].waste}`}
              action={{ type: 'choose_specialization', path }}
            />
          ))
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  person: { borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8, gap: 4 },
  personTitle: { color: '#A9F3D9', fontFamily: fonts.heading, fontSize: 13 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
  warning: { color: '#FFAD8A' },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gate: { minWidth: '45%', flexGrow: 1 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  disabled: { opacity: 0.45 },
})
