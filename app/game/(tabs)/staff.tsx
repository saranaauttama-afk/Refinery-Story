import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ArtSlot from '../../../src/components/ArtSlot'
import GameIcon from '../../../src/components/GameIcon'
import StaffSkillList from '../../../src/components/StaffSkillList'
import { SKILL_CHANNELS } from '../../../src/game/data/staffSkills'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { text } from '../../../src/game/translations'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { STAFF_LEVEL_BALANCE } from '../../../src/game/data/balance'
import { WORKERS } from '../../../src/game/data/workers'
import { getStaffTrait } from '../../../src/game/data/staffTraits'
import { BUILDINGS } from '../../../src/game/data/buildings'
import {
  getCellAssignedToEmployee,
  getTrainingCost,
  getMaxHireCount,
  isNearRetirement,
  getSpecialistPlantForWorker,
  getEmployeeSkills,
  getTeamSkillBonuses,
} from '../../../src/game/utils/gameCalculations'
import type { BuildingType, WorkerType } from '../../../src/game/types'
import { PLANT_PRODUCTION } from '../../../src/game/data/balance'

// Specialist config
const SPECIALIST_TYPES: WorkerType[] = [
  ...PLANT_PRODUCTION.map((p) => p.specialistWorker).filter(
    (t): t is 'aviationSpecialist' | 'chemicalEngineer' => !!t,
  ),
  'polymerEngineer',
]
const SPECIALIST_BUILDING: Partial<Record<WorkerType, BuildingType>> = {
  ...Object.fromEntries(
    PLANT_PRODUCTION.filter((p) => p.specialistWorker).map((p) => [p.specialistWorker as WorkerType, p.buildingKey]),
  ),
  polymerEngineer: 'polymerPlant',
}

// XP bar
function XpBar({ current, max, level }: { current: number; max: number; level: number }) {
  const maxed = level >= STAFF_LEVEL_BALANCE.maxLevel
  const pct = maxed ? 1 : max > 0 ? Math.min(1, current / max) : 0
  return (
    <View style={xpStyles.wrap}>
      <View style={xpStyles.track}>
        <View style={[xpStyles.fill, { width: `${Math.round(pct * 100)}%` as any }, maxed && xpStyles.fillMax]} />
      </View>
      <Text style={xpStyles.label}>{maxed ? 'MAX' : `${current}/${max} XP`}</Text>
    </View>
  )
}
const xpStyles = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  track:   { flex: 1, height: 5, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden' },
  fill:    { height: '100%', backgroundColor: colors.blue, borderRadius: radii.pill },
  fillMax: { backgroundColor: colors.gold },
  label:   { fontSize: 9, fontWeight: '700', color: colors.inkMuted, minWidth: 52 },
})


export default function StaffScreen() {
  const router = useRouter()
  const { game, loaded, derived, trainEmployee, assignEmployeeToCell, unassignCell } = useGame()
  const { t } = useLang()
  const cs = text.companyScreen
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const [pickerEmployeeId, setPickerEmployeeId] = useState<string | null>(null)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const cap = getMaxHireCount(game.refineryLevel)
  const assignedCount = game.employees.filter((e) => getCellAssignedToEmployee(game, e.id) !== null).length
  const retiringCount = game.employees.filter((e) => isNearRetirement(e, game.businessYear)).length

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName} numberOfLines={1}>{t(text.nav.staff)}</Text>
            <Text style={styles.companyTitle}>{t(cs.quick.staff)}</Text>
          </View>
          <Pressable style={styles.recruitBtn} onPress={() => router.push('/game/recruit')}>
            <Text style={styles.recruitBtnText}>👥 {t(text.nav.recruit)}</Text>
          </Pressable>
        </View>
        <View style={styles.quickStats}>
          <View style={styles.qStat}><Text style={styles.qVal}>{game.employees.length}/{cap*WORKERS.length}</Text><Text style={styles.qLbl}>{t(cs.quick.staff)}</Text></View>
          <View style={styles.qDiv} />
          <View style={styles.qStat}><Text style={styles.qVal}>{assignedCount}</Text><Text style={styles.qLbl}>{t(cs.assigned)}</Text></View>
          <View style={styles.qDiv} />
          <View style={styles.qStat}><Text style={[styles.qVal, retiringCount > 0 && { color: colors.orange }]}>{retiringCount}</Text><Text style={styles.qLbl}>🕰</Text></View>
        </View>
      </View>

      {/* Staff roster */}
      {(
        <ScrollView contentContainerStyle={styles.list}>
          {game.employees.length === 0 && (
            <View style={styles.emptyState}>
              <ArtSlot id="team_empty" width={140} height={140} spec="480×480" radius={70} caption="Empty desks / hiring sign" />
              <Text style={styles.emptyTitle}>{t(cs.noEmployees)}</Text>
              <Text style={styles.emptyHint}>{t(cs.hireHint)}</Text>
            </View>
          )}
          {/* Team skill totals — the aggregated bonus every hire adds up to. */}
          {game.employees.length > 0 && (() => {
            const totals = getTeamSkillBonuses(game)
            return (
              <View style={styles.teamSkillPanel}>
                <Text style={styles.teamSkillTitle}>{t(cs.teamSkillsTitle)}</Text>
                <View style={styles.teamSkillRow}>
                  {SKILL_CHANNELS.map((ch) => (
                    <View key={ch.key} style={styles.teamSkillStat}>
                      <Text style={styles.teamSkillIcon}>{ch.icon}</Text>
                      <Text style={styles.teamSkillVal}>+{(totals[ch.key] * 100).toFixed(totals[ch.key] * 100 % 1 === 0 ? 0 : 1)}%</Text>
                      <Text style={styles.teamSkillLbl}>{t(ch.short)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })()}
          {game.employees.map((employee) => {
            const w = WORKERS.find((wk) => wk.key === employee.type)
            const maxed = employee.level >= STAFF_LEVEL_BALANCE.maxLevel
            const xpNeeded = STAFF_LEVEL_BALANCE.xpToNextLevel[employee.level] ?? 0
            const cost = getTrainingCost(employee.level)
            const canTrain = !maxed && game.money >= cost.money && game.researchPoints >= cost.rp
            const isSpecialist = SPECIALIST_TYPES.includes(employee.type)
            const assignedCellIndex = getCellAssignedToEmployee(game, employee.id)
            const buildingKey = SPECIALIST_BUILDING[employee.type]
            const eligibleCells = buildingKey
              ? game.grid.reduce<{ cellIndex: number; label: string }[]>((acc, cell, ci) => {
                  if (cell === buildingKey) acc.push({ cellIndex: ci, label: t(cs.plantLabel(t(BUILDINGS[buildingKey].name), acc.length + 1)) })
                  return acc
                }, [])
              : []
            const assignedLabel = eligibleCells.find((c) => c.cellIndex === assignedCellIndex)?.label
            const nearRetire = isNearRetirement(employee, game.businessYear)
            const yearsLeft = employee.hiredOnYear !== undefined ? Math.max(0, (employee.hiredOnYear + 5) - game.businessYear) : null
            const trait = getStaffTrait(employee.trait)

            return (
              <View key={employee.id} style={[styles.empCard, nearRetire && styles.empCardRetiring]}>
                <View style={styles.empTop}>
                  <View style={styles.empRoleIcon}><GameIcon name={`worker-${employee.type}`} size={34} /></View>
                  <View style={styles.empNameBlock}>
                    <Text style={styles.empName}>{employee.name}{trait ? ` ${trait.badge}` : ''}{nearRetire ? ' 🕰' : ''}</Text>
                    <Text style={styles.empRole}>
                      {w ? t(w.name) : employee.type}{trait ? ` · ${t(trait.name)}` : ''}
                    </Text>
                    {trait ? <Text style={styles.empFlavor} numberOfLines={1}>{t(trait.flavor)}</Text> : null}
                    {(() => {
                      const specPlant = getSpecialistPlantForWorker(employee.type)
                      return (
                        <Text style={[styles.empRoleTag, specPlant ? styles.empRoleTagAssign : styles.empRoleTagGlobal]} numberOfLines={1}>
                          {specPlant ? t(text.staffRole.assignTo(BUILDINGS[specPlant].name)) : t(text.staffRole.global)}
                        </Text>
                      )
                    })()}
                  </View>
                  <View style={[styles.lvBadge, maxed && styles.lvBadgeMax]}>
                    <Text style={styles.lvBadgeText}>Lv{employee.level}</Text>
                  </View>
                </View>
                <XpBar current={employee.xp} max={xpNeeded} level={employee.level} />
                <View style={styles.empSkills}>
                  <StaffSkillList skills={getEmployeeSkills(employee)} isAce={employee.isAce} compact />
                </View>
                {nearRetire && yearsLeft !== null ? (
                  <Text style={styles.retireWarn}>{t(cs.retiresIn(yearsLeft))}</Text>
                ) : employee.hiredOnYear !== undefined ? (
                  <Text style={styles.empTenure}>🕰 {t(cs.tenure(Math.max(0, game.businessYear - employee.hiredOnYear)))}</Text>
                ) : null}
                <View style={styles.empActions}>
                  <AnimatedPressable
                    disabled={!canTrain}
                    onPress={() => {
                      if (canTrain) { spawnFloat(`-$${cost.money.toLocaleString()}`, 'expense'); haptics.confirm() }
                      trainEmployee(employee.id)
                    }}
                    style={[styles.actBtn, canTrain ? styles.actBtnTrain : styles.actBtnOff]}
                  >
                    <Text style={styles.actBtnLabel}>{maxed ? t(cs.maxLevel) : t(cs.train(cost.money.toLocaleString(), cost.rp))}</Text>
                  </AnimatedPressable>
                  {isSpecialist && (
                    <Pressable
                      disabled={eligibleCells.length === 0}
                      onPress={() => {
                        if (assignedCellIndex !== null) { unassignCell(assignedCellIndex); setPickerEmployeeId(null) }
                        else setPickerEmployeeId(pickerEmployeeId === employee.id ? null : employee.id)
                      }}
                      style={[styles.actBtn, assignedCellIndex !== null ? styles.actBtnAssigned : styles.actBtnOff]}
                    >
                      <Text style={styles.actBtnLabel}>
                        {assignedCellIndex !== null ? `📌 ${assignedLabel ?? t(cs.assigned)}` : eligibleCells.length === 0 ? t(cs.noPlantBuilt) : t(cs.assign)}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {pickerEmployeeId === employee.id && assignedCellIndex === null && (
                  <View style={styles.picker}>
                    <Text style={styles.pickerTitle}>{t(cs.selectPlant)}</Text>
                    {eligibleCells.map(({ cellIndex, label }) => {
                      const occ = game.employees.find((e) => getCellAssignedToEmployee(game, e.id) === cellIndex)
                      return (
                        <Pressable key={cellIndex} style={styles.pickerOption} onPress={() => { assignEmployeeToCell(employee.id, cellIndex); setPickerEmployeeId(null); haptics.confirm() }}>
                          <Text style={styles.pickerLabel}>{label}{occ ? ` · ${occ.name}` : ''}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  recruitBtn: { backgroundColor: colors.blue, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  recruitBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  header: { backgroundColor: '#1C2634', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  companyTitle: { fontSize: 10, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.xs },
  gradeBadge: { backgroundColor: colors.gold, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  gradeText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  gradeLabel: { fontSize: 8, color: colors.ink, fontWeight: '700' },
  quickStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, alignItems: 'center' },
  qStat: { flex: 1, alignItems: 'center' },
  qVal: { fontSize: 13, fontWeight: '900', color: '#fff' },
  qLbl: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.3 },
  qDiv: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.pill, padding: 3, gap: 2, marginBottom: spacing.xs },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: radii.pill, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#6B8099' },
  tabLabelActive: { color: '#1C2634' },
  tabBadge: { backgroundColor: colors.orange, borderRadius: radii.pill, minWidth: 16, height: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  empSkills: { marginTop: 8 },
  teamSkillPanel: { backgroundColor: '#1C2634', borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  teamSkillTitle: { fontSize: 11, fontWeight: '900', color: '#8FA3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  teamSkillRow: { flexDirection: 'row' },
  teamSkillStat: { flex: 1, alignItems: 'center', gap: 2 },
  teamSkillIcon: { fontSize: 18 },
  teamSkillVal: { fontSize: 15, fontWeight: '900', color: '#fff' },
  teamSkillLbl: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.3 },
  perkOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  perkSheet: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: colors.cream, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  perkTitle: { fontSize: 18, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  perkSub: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginBottom: spacing.xs },
  perkList: { flexGrow: 0 },
  perkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.creamBorder, padding: spacing.md, marginBottom: spacing.xs },
  perkIcon: { fontSize: 26 },
  perkName: { fontSize: 15, fontWeight: '900', color: colors.ink },
  perkFlavor: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  perkOwned: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.xs },
  perkCancel: { alignSelf: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  perkCancelText: { fontSize: 14, fontWeight: '700', color: colors.inkMuted },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.creamBorder, padding: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyHint: { fontSize: 13, color: colors.inkMuted, textAlign: 'center' },
  emptyNote: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: 4 },
  empCard: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 2, borderColor: colors.creamBorder, padding: spacing.sm },
  empCardRetiring: { borderColor: colors.orange, backgroundColor: '#FFF8F0' },
  empTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empRoleIcon: { marginRight: spacing.sm },
  empNameBlock: { flex: 1, marginRight: spacing.sm },
  empName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  empRole: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  empFlavor: { fontSize: 10.5, color: colors.inkMuted, fontStyle: 'italic', marginTop: 1 },
  empRoleTag: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  empRoleTagGlobal: { color: colors.green },
  empRoleTagAssign: { color: colors.blue },
  lvBadge: { backgroundColor: colors.blue, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  lvBadgeMax: { backgroundColor: colors.gold },
  lvBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  retireWarn: { fontSize: 11, color: colors.orange, fontWeight: '700', marginTop: 4 },
  empTenure: { fontSize: 10.5, color: colors.inkMuted, marginTop: 4 },
  empActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  actBtn: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  actBtnTrain: { backgroundColor: colors.blue },
  actBtnAssigned: { backgroundColor: colors.green },
  actBtnOff: { backgroundColor: colors.creamBorder },
  actBtnLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  picker: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.creamBorder, paddingTop: spacing.sm, gap: 4 },
  pickerTitle: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', marginBottom: 4 },
  pickerOption: { paddingVertical: 7, paddingHorizontal: spacing.sm, backgroundColor: colors.cream, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.creamBorder },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  expandBtn: { marginTop: spacing.md, backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  expandBtnOff: { backgroundColor: colors.creamBorder },
  expandBtnLabel: { fontSize: 13, fontWeight: '900', color: colors.ink },
  branchLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: 2 },
  logEntry: { fontSize: 11, color: colors.inkMuted, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.creamBorder },
  linkBtn: { paddingVertical: spacing.xs, alignItems: 'flex-end' },
  linkBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.blue },
  currentName: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  renameRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.creamBorder, borderRadius: radii.sm, backgroundColor: colors.cream, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.ink, fontSize: 13 },
  saveBtn: { backgroundColor: colors.green, borderRadius: radii.sm, paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center' },
  saveBtnOff: { backgroundColor: colors.creamBorder },
  saveBtnLabel: { fontWeight: '800', color: colors.ink, fontSize: 13 },
})
