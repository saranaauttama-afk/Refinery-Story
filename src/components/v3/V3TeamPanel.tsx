import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { BUILDINGS } from '../../game/data/buildings'
import type { BilingualTextValue, WorkerType } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_ROLES, V3_STAFF_LEVELS, isV3ProcessBuilding } from '../../game/v3/data'
import { getV3Modifiers, type V3CappedChannel } from '../../game/v3/modifiers'
import type { V3Action, V3ActionEvent, V3EmployeeDuty, V3GameState } from '../../game/v3/types'
import { listV3Buildings } from '../../game/v3/yard'
import { v3BuildingNumber } from './v3Labels'
import { getV3LocalCrewRate, getV3StaffCap, getV3TrainingCost, getV3WageCents } from '../../game/v3/workforce'
import { fonts } from '../../theme'
import { V3_CAREER, getV3CareerRank, getV3RareCandidate } from '../../game/v3/careers'
import { V3Segments } from './V3Segments'
import StaffPortrait from '../StaffPortrait'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
type ActionInput = WithoutSequence<V3Action>
type Translate = (value: BilingualTextValue) => string
type Props = { state: V3GameState; apply: (action: V3Action) => void; t: Translate; describe: (event: V3ActionEvent | null) => string }
type Employee = V3GameState['world']['employees'][number]

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
const ROLE_PERK: Record<WorkerType, BilingualTextValue> = {
  operator: { en: 'Any line · R&D lead Q+5 at Lv3', th: 'ไลน์ไหนก็ได้ · นำ R&D Q+5 เมื่อ Lv3' },
  fuelSpecialist: { en: 'Matched line +15% · R&D Gas/Lube Q+5', th: 'ไลน์ตรงสาย +15% · R&D Gas/Lube Q+5' },
  aviationSpecialist: { en: 'Matched line +15% · R&D Jet Q+5', th: 'ไลน์ตรงสาย +15% · R&D Jet Q+5' },
  chemicalEngineer: { en: 'Petro line/R&D specialist', th: 'ผู้เชี่ยวชาญไลน์/R&D Petro' },
  polymerEngineer: { en: 'Polymer line/R&D specialist', th: 'ผู้เชี่ยวชาญไลน์/R&D Polymer' },
  chemist: { en: 'Job RP +10% · R&D lead any family Q+5', th: 'RP จากงาน +10% · นำ R&D ได้ทุกสาย Q+5' },
  mechanic: { en: 'Storage +25 each product (max 3 staff)', th: 'ความจุ +25 ทุกชนิด (นับสูงสุด 3 คน)' },
  salesAgent: { en: 'Sale prices +4% (cap 15%)', th: 'ราคาขาย +4% (สูงสุด 15%)' },
  safetyOfficer: { en: 'Maintenance −5% (cap 25%)', th: 'ค่าบำรุง −5% (สูงสุด 25%)' },
  logisticsCoordinator: { en: 'Storage +10% (cap 50%)', th: 'ความจุ +10% (สูงสุด 50%)' },
}

function dutyStatus(duty: V3EmployeeDuty | undefined, unpaid: boolean, t: Translate): { text: string; tone: 'line' | 'rnd' | 'support' | 'reserve' | 'unpaid' } {
  if (unpaid) return { text: t({ en: 'UNPAID', th: 'ค้างค่าจ้าง' }), tone: 'unpaid' }
  if (!duty || duty.kind === 'reserve') return { text: t({ en: 'RESERVE', th: 'สำรอง' }), tone: 'reserve' }
  if (duty.kind === 'development') return { text: t({ en: 'R&D', th: 'R&D' }), tone: 'rnd' }
  if (duty.kind === 'support') return { text: t({ en: 'SUPPORT', th: 'SUPPORT' }), tone: 'support' }
  return { text: t({ en: 'ON LINE', th: 'ประจำไลน์' }), tone: 'line' }
}

function channelText(channel: V3CappedChannel): string {
  const fmt = (value: number) => `${(value * 100).toFixed(1)}%`
  return channel.raw > channel.effective + 1e-9 ? `${fmt(channel.effective)} (cap ${fmt(channel.cap)})` : `${fmt(channel.effective)} / cap ${fmt(channel.cap)}`
}

function Portrait({ type, size = 56, tone }: { type: WorkerType; size?: number; tone?: string }) {
  return <View style={[styles.portrait, { width: size, height: size }, tone ? { borderColor: tone } : null]}><StaffPortrait type={type} size={size - 4} /></View>
}

export function V3TeamPanel({ state, apply, t, describe }: Props) {
  void describe
  const [tab, setTab] = useState<'team' | 'recruit'>('team')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMods, setShowMods] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const check = (action: ActionInput): V3ActionEvent | null => {
    const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
    return result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
  }
  const run = (action: ActionInput) => apply({ ...action, sequence: state.nextActionSequence } as V3Action)

  const modifiers = getV3Modifiers(state)
  const cap = getV3StaffCap(state)
  const lineCells = listV3Buildings(state)
    .filter((building) => isV3ProcessBuilding(building.type) && state.plantPrograms[building.id])
    .map((building) => ({ cell: building.type, id: building.id, label: v3BuildingNumber(state, building.id) }))
  const totalWageCentsPerMin = state.world.employees.reduce((sum, employee) => sum + getV3WageCents(employee, state.employeeDuties[employee.id] ?? { kind: 'reserve' }, 300), 0)
  const selected = state.world.employees.find((employee) => employee.id === selectedId) ?? null

  const TeamRow = ({ employee }: { employee: Employee }) => {
    const duty = state.employeeDuties[employee.id]
    const unpaid = state.unpaidEmployeeIds.includes(employee.id)
    const status = dutyStatus(duty, unpaid, t)
    const rank = getV3CareerRank(state, employee.id)
    const active = employee.id === selectedId
    return (
      <Pressable style={[styles.row, active && styles.rowActive]} onPress={() => { setSelectedId(active ? null : employee.id); setAssigning(false) }}>
        <Portrait type={employee.type} />
        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>{employee.isAce ? '★ ' : ''}{employee.name}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{rank > 0 ? `${t(V3_CAREER.titles[rank])} ` : ''}{t(ROLE_LABEL[employee.type])} · Lv{employee.level}</Text>
        </View>
        <View style={[styles.pill, styles[`pill_${status.tone}`]]}><Text style={styles.pillText}>{status.text}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    )
  }

  const detail = selected ? (() => {
    const employee = selected
    const duty = state.employeeDuties[employee.id]
    const unpaid = state.unpaidEmployeeIds.includes(employee.id)
    const status = dutyStatus(duty, unpaid, t)
    const threshold = V3_STAFF_LEVELS.xpToNextLevel[employee.level]
    const maxed = employee.level >= V3_STAFF_LEVELS.maxLevel
    const progress = threshold ? Math.min(1, employee.xp / threshold) : 1
    const training = getV3TrainingCost(employee)
    const rank = getV3CareerRank(state, employee.id)
    const assignedBuilding = duty && duty.kind === 'line' ? lineCells.find((entry) => entry.id === duty.buildingId)?.cell : null
    const assignedLabel = !duty || duty.kind === 'reserve'
      ? t({ en: 'Reserve', th: 'สำรอง' })
      : duty.kind === 'support' ? t({ en: 'Support', th: 'Support' })
      : duty.kind === 'development' ? t({ en: 'Leading R&D', th: 'นำ R&D' })
      : assignedBuilding ? t(BUILDINGS[assignedBuilding].name) : t({ en: 'Line', th: 'ไลน์' })
    const bonusText = duty?.kind === 'line'
      ? t({ en: `Line crew +${(getV3LocalCrewRate(state, duty.buildingId) * 100).toFixed(0)}%`, th: `ทีมไลน์ +${(getV3LocalCrewRate(state, duty.buildingId) * 100).toFixed(0)}%` })
      : modifiers.supportContributions[employee.id]
        ? `${modifiers.supportContributions[employee.id].channel} +${modifiers.supportContributions[employee.id].value < 1 ? `${(modifiers.supportContributions[employee.id].value * 100).toFixed(1)}%` : modifiers.supportContributions[employee.id].value.toFixed(0)}`
        : t({ en: 'No active effect', th: 'ยังไม่มีผล' })

    const assignTargets: Array<{ label: string; action: ActionInput }> = [
      ...lineCells.filter(({ cell }) => V3_ROLES[employee.type].lineBuildings.includes(cell as never)).map(({ cell, id, label }) => ({
        label: `${t(BUILDINGS[cell].name)} ${label}`, action: { type: 'assign_duty', employeeId: employee.id, duty: { kind: 'line', buildingId: id } } as ActionInput,
      })),
      ...(V3_ROLES[employee.type].support ? [{ label: t({ en: 'Support', th: 'Support' }), action: { type: 'assign_duty', employeeId: employee.id, duty: { kind: 'support' } } as ActionInput }] : []),
      { label: t({ en: 'Reserve', th: 'สำรอง' }), action: { type: 'assign_duty', employeeId: employee.id, duty: { kind: 'reserve' } } as ActionInput },
    ]

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailHead}>
          <Portrait type={employee.type} size={84} />
          <View style={styles.detailHeadBody}>
            <Text style={styles.detailName}>{employee.isAce ? '★ ' : ''}{employee.name}</Text>
            <Text style={styles.detailRole}>{rank > 0 ? `${t(V3_CAREER.titles[rank])} ` : ''}{t(ROLE_LABEL[employee.type])} · Lv{employee.level}</Text>
            <View style={[styles.pill, styles[`pill_${status.tone}`], styles.pillInline]}><Text style={styles.pillText}>{status.text}</Text></View>
          </View>
        </View>

        <View>
          <Text style={styles.xpLabel}>XP {employee.xp.toFixed(0)}{threshold && !maxed ? ` / ${threshold}` : ' · MAX'}</Text>
          <View style={styles.bar}><View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} /></View>
        </View>

        <View style={styles.statRows}>
          <Text style={styles.statRow}>📊 {t({ en: 'Assigned', th: 'ประจำการ' })}: <Text style={styles.statStrong}>{assignedLabel}</Text></Text>
          <Text style={styles.statRow}>◎ {t({ en: 'Wage', th: 'ค่าจ้าง' })}: ${(getV3WageCents(employee, duty ?? { kind: 'reserve' }, 300) / 100).toFixed(2)}/min</Text>
          <Text style={styles.statRow}>🔧 {t({ en: 'Bonus', th: 'โบนัส' })}: {bonusText}</Text>
          {unpaid && <Text style={styles.warning}>{t({ en: 'Wages unpaid — no effect until resumed.', th: 'ค้างค่าจ้าง — ยังไม่มีผลจนกว่าจะกลับมาทำงาน' })}</Text>}
        </View>

        <View style={styles.row2}>
          <Pressable style={[styles.button, styles.buttonAssign]} onPress={() => setAssigning((value) => !value)}>
            <Text style={styles.buttonText}>👤 {t({ en: 'Assign', th: 'มอบหมาย' })} {assigning ? '▲' : '▼'}</Text>
          </Pressable>
          {maxed ? (
            <View style={[styles.button, styles.disabled]}><Text style={styles.buttonText}>{t({ en: 'Max level', th: 'เลเวลเต็ม' })}</Text></View>
          ) : (() => {
            const blocked = check({ type: 'train_employee', employeeId: employee.id })
            return (
              <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} style={[styles.button, styles.buttonTrain, blocked && styles.disabled]} onPress={() => run({ type: 'train_employee', employeeId: employee.id })}>
                <Text style={styles.buttonText}>▲ {t({ en: 'Train', th: 'ฝึกอบรม' })}</Text>
                <Text style={styles.buttonSub}>${training.cents / 100} + {training.rp} RP</Text>
              </Pressable>
            )
          })()}
        </View>
        {unpaid && (() => {
          const blocked = check({ type: 'resume_employee', employeeId: employee.id })
          return (
            <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} style={[styles.button, blocked && styles.disabled]} onPress={() => run({ type: 'resume_employee', employeeId: employee.id })}>
              <Text style={styles.buttonText}>{t({ en: 'Resume after funding wages', th: 'กลับเข้าทำงานหลังเตรียมค่าจ้าง' })}</Text>
            </Pressable>
          )
        })()}

        {assigning && (
          <View style={styles.row2}>
            {assignTargets.map((target) => (
              <Pressable key={target.label} style={styles.secondary} onPress={() => { run(target.action); setAssigning(false) }}>
                <Text style={styles.secondaryText}>→ {target.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {rank < V3_CAREER.maxRank && maxed && (() => {
          const blocked = check({ type: 'promote_employee', employeeId: employee.id })
          return (
            <View style={styles.promote}>
              <Text style={styles.textLine}>{t({
                en: `Promote to ${V3_CAREER.titles[rank + 1].en}: level resets to 1, permanent line +${Math.round(V3_CAREER.crewRatePerRank * 100)}% / support ×${1 + V3_CAREER.supportPerRank}`,
                th: `เลื่อนเป็น${V3_CAREER.titles[rank + 1].th}: เลเวลกลับเป็น 1 แต่โบนัสถาวร ไลน์ +${Math.round(V3_CAREER.crewRatePerRank * 100)}% / Support ×${1 + V3_CAREER.supportPerRank}`,
              })}</Text>
              <Text style={styles.muted}>{t({ en: `Needs $${V3_CAREER.promotionDollars[rank]} + ${V3_CAREER.promotionRp[rank]} RP`, th: `ต้อง $${V3_CAREER.promotionDollars[rank]} + ${V3_CAREER.promotionRp[rank]} RP` })}</Text>
              <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} style={[styles.secondary, blocked && styles.disabled]} onPress={() => run({ type: 'promote_employee', employeeId: employee.id })}>
                <Text style={styles.secondaryText}>{t({ en: 'Promote', th: 'เลื่อนตำแหน่ง' })}</Text>
              </Pressable>
            </View>
          )
        })()}
      </View>
    )
  })() : null

  const rare = getV3RareCandidate(state)

  return (
    <>
      <V3Segments
        value={tab}
        onChange={(next) => { setTab(next); setSelectedId(null); setAssigning(false) }}
        items={[
          { key: 'team', icon: '👤', label: t({ en: 'Current Team', th: 'ทีมปัจจุบัน' }) },
          { key: 'recruit', icon: '👥', label: t({ en: 'Recruit', th: 'รับสมัคร' }) },
        ]}
      />

      {tab === 'team' && (
        <>
          <ScrollView style={styles.list}>
            {state.world.employees.map((employee) => <TeamRow key={employee.id} employee={employee} />)}
          </ScrollView>
          {detail}
          <View style={styles.footer}><Text style={styles.footerText}>{t({ en: 'Team', th: 'ทีม' })} {state.world.employees.length}/{cap} · {t({ en: 'Wages', th: 'ค่าจ้าง' })} ${(totalWageCentsPerMin / 100).toFixed(0)}/min</Text></View>

          <Pressable style={styles.moreLink} onPress={() => setShowMods((value) => !value)}>
            <Text style={styles.moreLinkText}>{t({ en: 'Company bonuses', th: 'โบนัสบริษัท' })} {showMods ? '▲' : '▼'}</Text>
          </Pressable>
          {showMods && (
            <View style={styles.detailCard}>
              <Text style={styles.textLine}>{t({ en: 'Global line rate', th: 'อัตราผลิตทุกไลน์' })}: {channelText(modifiers.globalRate)}</Text>
              <Text style={styles.textLine}>{t({ en: 'Storage bonus', th: 'ความจุเพิ่ม' })}: {channelText(modifiers.storagePercent)} · +{modifiers.mechanicStorageFlat.toFixed(0)} {t({ en: 'flat', th: 'หน่วย' })} · +{modifiers.coreStorageFlat} {t({ en: 'core tanks', th: 'ถังหลัก' })}</Text>
              <Text style={styles.textLine}>{t({ en: 'Trade / quotes', th: 'ราคาขาย' })}: {channelText(modifiers.trade)}</Text>
              <Text style={styles.textLine}>{t({ en: 'Job RP', th: 'RP จากงาน' })}: {channelText(modifiers.rp)}</Text>
              <Text style={styles.textLine}>{t({ en: 'Maintenance cut', th: 'ลดค่าบำรุง' })}: {channelText(modifiers.upkeep)}</Text>
            </View>
          )}
        </>
      )}

      {tab === 'recruit' && (
        <>
          <View style={styles.recruitHead}>
            <Text style={styles.sectionTitle}>{t({ en: 'AVAILABLE CANDIDATES', th: 'ผู้สมัครที่เปิดรับ' })}</Text>
          </View>
          {rare && (
            <View style={[styles.row2, styles.rowCard, styles.rareRow]}>
              <Portrait type={rare.employee.type} />
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>★ {rare.employee.name}</Text>
                <Text style={styles.rowSub}>{t(ROLE_LABEL[rare.employee.type])} · Lv{rare.employee.level}</Text>
                <Text style={styles.rowPerk} numberOfLines={1}>{(rare.employee.skills ?? []).map((skill) => `${skill.channel} +${Math.round(skill.value * 100)}%`).join(' · ')} · {t({ en: 'leaves end of quarter', th: 'หมดเขตสิ้นไตรมาส' })}</Text>
              </View>
              <View style={styles.hireCol}>
                <Text style={styles.price}>${(rare.costCents / 100).toLocaleString()}</Text>
                <Pressable style={styles.hireButton} onPress={() => run({ type: 'hire_candidate', candidateId: rare.id })}>
                  <Text style={styles.hireButtonText}>{t({ en: 'HIRE', th: 'จ้าง' })}</Text>
                </Pressable>
              </View>
            </View>
          )}
          {(Object.keys(V3_ROLES) as WorkerType[]).map((role) => {
            const blocked = check({ type: 'hire_employee', role })
            return (
              <View key={role} style={[styles.row2, styles.rowCard]}>
                <Portrait type={role} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowName}>{t(ROLE_LABEL[role])}</Text>
                  <Text style={styles.rowSub}>{t({ en: `C${V3_ROLES[role].hireChapter}`, th: `บท C${V3_ROLES[role].hireChapter}` })}</Text>
                  <Text style={styles.rowPerk} numberOfLines={1}>{t(ROLE_PERK[role])}</Text>
                </View>
                <View style={styles.hireCol}>
                  <Text style={styles.price}>${V3_ROLES[role].hireCostDollars}</Text>
                  <Pressable disabled={Boolean(blocked)} accessibilityState={{ disabled: Boolean(blocked) }} style={[styles.hireButton, blocked && styles.disabled]} onPress={() => run({ type: 'hire_employee', role })}>
                    <Text style={styles.hireButtonText}>{t({ en: 'HIRE', th: 'จ้าง' })}</Text>
                  </Pressable>
                </View>
              </View>
            )
          })}
          <View style={styles.footer}><Text style={styles.footerText}>{t({ en: 'Team capacity', th: 'ความจุทีม' })} {state.world.employees.length}/{cap} · {t({ en: 'Wages', th: 'ค่าจ้าง' })} ${(totalWageCentsPerMin / 100).toFixed(0)}/min</Text></View>
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  list: { maxHeight: 260 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 8, marginBottom: 6 },
  rowCard: { alignItems: 'center', backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 8, marginBottom: 6, flexWrap: 'nowrap' },
  rowActive: { borderColor: '#FFD447' },
  rowBody: { flex: 1, gap: 1 },
  rowName: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 14 },
  rowSub: { color: '#8FA9BA', fontSize: 12 },
  rowPerk: { color: '#8FA9BA', fontSize: 11 },
  chevron: { color: '#8FA9BA', fontSize: 20 },
  portrait: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  pillInline: { alignSelf: 'flex-start', marginTop: 4 },
  pillText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 10 },
  pill_line: { backgroundColor: '#6ACDB4' },
  pill_rnd: { backgroundColor: '#C79BFF' },
  pill_support: { backgroundColor: '#7FB4E8' },
  pill_reserve: { backgroundColor: '#8FA9BA' },
  pill_unpaid: { backgroundColor: '#FFAD8A' },
  rareRow: { borderColor: '#FFD447' },
  hireCol: { alignItems: 'flex-end', gap: 4 },
  price: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 14 },
  hireButton: { backgroundColor: '#FFD447', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  hireButtonText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 12 },
  sectionTitle: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  recruitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  detailCard: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 10 },
  detailHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  detailHeadBody: { flex: 1, gap: 2 },
  detailName: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 16 },
  detailRole: { color: '#8FA9BA', fontSize: 12 },
  xpLabel: { color: '#8FA9BA', fontSize: 11, marginBottom: 3 },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#163A52', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#6ACDB4' },
  statRows: { gap: 3 },
  statRow: { color: '#D5E2E9', fontSize: 12 },
  statStrong: { color: '#E8F0F4', fontFamily: fonts.heading },
  warning: { color: '#FFAD8A', fontSize: 11 },
  muted: { color: '#8FA9BA', fontSize: 11 },
  textLine: { color: '#D5E2E9', fontSize: 12, lineHeight: 17 },
  row2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { flex: 1, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  buttonAssign: { backgroundColor: '#1D4460', borderColor: '#3F6680' },
  buttonTrain: { backgroundColor: '#5B4A1E', borderColor: '#B4863A' },
  buttonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
  buttonSub: { color: '#FFD447', fontSize: 10 },
  disabled: { opacity: 0.4 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
  promote: { gap: 4, borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8 },
  footer: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 10, alignItems: 'center' },
  footerText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
  moreLink: { alignItems: 'center', paddingVertical: 6 },
  moreLinkText: { color: '#8FD3FF', fontFamily: fonts.heading, fontSize: 12 },
})
