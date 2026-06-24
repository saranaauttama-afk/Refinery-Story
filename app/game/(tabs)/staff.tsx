import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { STAFF_LEVEL_BALANCE, PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { getCellAssignedToEmployee, getTrainingCost, getMaxHireCount, isNearRetirement, TICK_MS } from '../../../src/game/utils/gameCalculations'
import type { BuildingType, RecruitmentTier, WorkerType } from '../../../src/game/types'

const TIER_COLORS: Record<RecruitmentTier, { border: string; accent: string; badge: string; label: string }> = {
  rookie:  { border: colors.creamBorder, accent: colors.creamBorder, badge: '#E8E0D0', label: 'Rookie' },
  skilled: { border: colors.blue,        accent: colors.blue,        badge: colors.blue,  label: 'Skilled' },
  expert:  { border: colors.orange,      accent: colors.orange,      badge: colors.orange, label: 'Expert' },
  star:    { border: colors.gold,        accent: colors.gold,        badge: colors.gold,   label: '⭐ Star' },
}

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

// XP progress bar component
function XpBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = max > 0 ? Math.min(1, current / max) : 1
  const maxed = level >= STAFF_LEVEL_BALANCE.maxLevel
  return (
    <View style={xpStyles.wrap}>
      <View style={xpStyles.track}>
        <View style={[xpStyles.fill, { width: `${Math.round(pct * 100)}%` as any }, maxed && xpStyles.fillMax]} />
      </View>
      <Text style={xpStyles.label}>
        {maxed ? 'MAX' : `${current}/${max} XP`}
      </Text>
    </View>
  )
}

const xpStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  track: { flex: 1, height: 5, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blue, borderRadius: radii.pill },
  fillMax: { backgroundColor: colors.gold },
  label: { fontSize: 9, fontWeight: '700', color: colors.inkMuted, minWidth: 48 },
})

export default function StaffScreen() {
  const {
    game, loaded, derived,
    hireCandidate, refreshRecruitmentPool,
    trainEmployee, assignEmployeeToCell, unassignCell, claimHiddenEvent,
  } = useGame()
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

  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canManualRefresh = game.money >= refreshCost
  const refreshSecondsLeft = Math.max(
    0,
    Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000),
  )
  const cap = getMaxHireCount(game.refineryLevel)

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Staff</Text>
          <Text style={styles.subtitle}>Year {game.businessYear} · {game.employees.length} hired · {cap} max per role</Text>
        </View>
        {/* Quick stats row */}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{game.employees.length}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{cap}</Text>
            <Text style={styles.headerStatLabel}>Cap</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>
              {game.employees.filter((e) => isNearRetirement(e, game.businessYear)).length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: colors.orange }]}>Retiring</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>

        {/* ── Recruitment ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recruitment Pool</Text>
          <AnimatedPressable
            disabled={!canManualRefresh}
            onPress={() => {
              if (canManualRefresh) { spawnFloat(`-$${refreshCost.toLocaleString()}`, 'expense'); haptics.tap() }
              refreshRecruitmentPool()
            }}
            style={[styles.refreshBtn, canManualRefresh ? styles.refreshBtnActive : styles.refreshBtnDisabled]}
          >
            <Text style={styles.refreshBtnLabel}>
              🔄 ${refreshCost.toLocaleString()}
            </Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.poolTimer}>
          {refreshSecondsLeft > 0 ? `Auto-refresh in ${refreshSecondsLeft}s` : 'Refreshing...'}
        </Text>

        {HIDDEN_EVENTS.filter(
          (e) => e.reward.kind === 'staff' && game.hiddenEventStatus[e.key] === 'unlocked',
        ).map((event) => (
          <ListRow
            key={event.key}
            title="??? Mystery Applicant"
            subtitle="Something unusual happened. Tap to find out what."
            badge="???"
            actionLabel="Reveal"
            onPress={() => claimHiddenEvent(event.key)}
          />
        ))}

        <View style={styles.candidateRow}>
          {game.recruitmentPool.map((candidate, slotIndex) => {
            const worker = WORKERS.find((w) => w.key === candidate.type)
            const tc = TIER_COLORS[candidate.tier]
            const affordable = game.money >= candidate.cost
            const atCap = game.workerCounts[candidate.type] >= cap
            const canHire = affordable && !atCap
            const mentorBonus = game.mentorXpBonus?.[candidate.type] ?? 0
            return (
              <View key={candidate.id} style={[styles.candidateCard, { borderColor: tc.border }]}>
                {/* Tier badge strip */}
                <View style={[styles.tierStrip, { backgroundColor: tc.badge }]}>
                  <Text style={[styles.tierLabel, candidate.tier === 'rookie' && styles.tierLabelDark]}>
                    {tc.label}
                  </Text>
                  {candidate.isVeteran && <Text style={styles.veteranBadge}>🎖 Veteran</Text>}
                </View>
                <View style={styles.candidateBody}>
                  <Text style={styles.candidateName} numberOfLines={1}>{candidate.name}</Text>
                  <Text style={styles.candidateRole} numberOfLines={1}>{worker?.name.en ?? candidate.type}</Text>
                  <Text style={styles.candidateStats}>
                    Starts Lv{candidate.startingLevel} · {game.workerCounts[candidate.type]}/{cap} hired
                  </Text>
                  {mentorBonus > 0 && (
                    <Text style={styles.mentorNote}>🎓 +{mentorBonus} XP bonus</Text>
                  )}
                  <AnimatedPressable
                    disabled={!canHire}
                    onPress={() => {
                      if (canHire) { spawnFloat(`-$${candidate.cost.toLocaleString()}`, 'expense'); haptics.confirm() }
                      hireCandidate(slotIndex)
                    }}
                    style={[styles.hireBtn, canHire ? styles.hireBtnActive : styles.hireBtnDisabled]}
                  >
                    <Text style={styles.hireBtnLabel}>
                      {atCap ? `Full (${cap} max)` : `Hire $${candidate.cost.toLocaleString()}`}
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Team ── */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <Text style={styles.sectionTitle}>Your Team</Text>
        </View>
        {game.employees.length === 0 && (
          <Text style={styles.empty}>No employees yet — hire someone above.</Text>
        )}
        {game.employees.map((employee) => {
          const worker = WORKERS.find((w) => w.key === employee.type)
          const maxed = employee.level >= STAFF_LEVEL_BALANCE.maxLevel
          const xpNeeded = STAFF_LEVEL_BALANCE.xpToNextLevel[employee.level] ?? 0
          const cost = getTrainingCost(employee.level)
          const canTrain = !maxed && game.money >= cost.money && game.researchPoints >= cost.rp
          const isSpecialist = SPECIALIST_TYPES.includes(employee.type)
          const assignedCellIndex = getCellAssignedToEmployee(game, employee.id)
          const buildingKey = SPECIALIST_BUILDING[employee.type]
          const eligibleCells = buildingKey
            ? game.grid.reduce<{ cellIndex: number; label: string }[]>((acc, cell, cellIndex) => {
                if (cell === buildingKey) acc.push({ cellIndex, label: `${BUILDINGS[buildingKey].name.en} #${acc.length + 1}` })
                return acc
              }, [])
            : []
          const assignedLabel = eligibleCells.find((c) => c.cellIndex === assignedCellIndex)?.label
          const nearRetire = isNearRetirement(employee, game.businessYear)
          const yearsLeft = employee.hiredOnYear !== undefined
            ? Math.max(0, (employee.hiredOnYear + 5) - game.businessYear)
            : null

          return (
            <View key={employee.id} style={[styles.employeeCard, nearRetire && styles.employeeCardRetiring]}>
              {/* Top row: name + level badge */}
              <View style={styles.employeeTopRow}>
                <View style={styles.employeeNameBlock}>
                  <Text style={styles.employeeName}>
                    {employee.name}
                    {employee.trait === 'veteran' ? ' ⭐' : ''}
                    {nearRetire ? ' 🕰' : ''}
                  </Text>
                  <Text style={styles.employeeRole}>{worker?.name.en ?? employee.type}</Text>
                </View>
                <View style={[styles.lvBadge, maxed && styles.lvBadgeMax]}>
                  <Text style={styles.lvBadgeText}>Lv{employee.level}</Text>
                </View>
              </View>

              {/* XP bar */}
              <XpBar current={employee.xp} max={xpNeeded} level={employee.level} />

              {/* Retire warning */}
              {nearRetire && yearsLeft !== null && (
                <Text style={styles.retireWarning}>Retires in {yearsLeft} year{yearsLeft !== 1 ? 's' : ''}</Text>
              )}

              {/* Actions */}
              <View style={styles.employeeActions}>
                <AnimatedPressable
                  disabled={!canTrain}
                  onPress={() => {
                    if (canTrain) { spawnFloat(`-$${cost.money.toLocaleString()}`, 'expense'); haptics.confirm() }
                    trainEmployee(employee.id)
                  }}
                  style={[styles.actionBtn, canTrain ? styles.actionBtnTrain : styles.actionBtnDisabled]}
                >
                  <Text style={styles.actionBtnLabel}>
                    {maxed ? 'Max Level' : `Train  $${cost.money.toLocaleString()} · ${cost.rp}RP`}
                  </Text>
                </AnimatedPressable>

                {isSpecialist && (
                  <Pressable
                    disabled={eligibleCells.length === 0}
                    onPress={() => {
                      if (assignedCellIndex !== null) {
                        unassignCell(assignedCellIndex)
                        setPickerEmployeeId(null)
                      } else {
                        setPickerEmployeeId(pickerEmployeeId === employee.id ? null : employee.id)
                      }
                    }}
                    style={[
                      styles.actionBtn,
                      assignedCellIndex !== null ? styles.actionBtnAssigned : styles.actionBtnDisabled,
                    ]}
                  >
                    <Text style={styles.actionBtnLabel}>
                      {assignedCellIndex !== null
                        ? `📌 ${assignedLabel ?? 'Assigned'}`
                        : eligibleCells.length === 0
                          ? 'No plant built'
                          : 'Assign →'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Cell picker */}
              {pickerEmployeeId === employee.id && assignedCellIndex === null && (
                <View style={styles.cellPicker}>
                  <Text style={styles.cellPickerTitle}>Select plant to assign:</Text>
                  {eligibleCells.map(({ cellIndex, label }) => {
                    const occupant = game.employees.find(
                      (e) => getCellAssignedToEmployee(game, e.id) === cellIndex,
                    )
                    return (
                      <Pressable
                        key={cellIndex}
                        onPress={() => { assignEmployeeToCell(employee.id, cellIndex); setPickerEmployeeId(null); haptics.confirm() }}
                        style={styles.cellPickerOption}
                      >
                        <Text style={styles.cellPickerLabel}>
                          {label}{occupant ? ` · currently ${occupant.name}` : ''}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  // ── Header ──
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: '#1C2634',
    gap: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  subtitle: { fontSize: 11, color: '#6B8099', marginTop: 1 },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  headerStatLabel: { fontSize: 9, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },

  // ── List ──
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: FLOATING_TAB_BAR_CLEARANCE },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.8 },
  poolTimer: { fontSize: 11, color: colors.inkMuted, marginBottom: spacing.sm },

  // ── Recruitment ──
  refreshBtn: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  refreshBtnActive: { backgroundColor: colors.cream },
  refreshBtnDisabled: { backgroundColor: colors.creamBorder, borderColor: colors.creamBorder },
  refreshBtnLabel: { fontSize: 11, fontWeight: '700', color: colors.ink },

  candidateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },

  candidateCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tierStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tierLabel: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  tierLabelDark: { color: colors.inkMuted },
  veteranBadge: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

  candidateBody: { padding: spacing.sm, gap: 2 },
  candidateName: { fontSize: 13, fontWeight: '800', color: colors.ink },
  candidateRole: { fontSize: 10, color: colors.inkMuted },
  candidateStats: { fontSize: 10, color: colors.inkMuted, marginTop: 2 },
  mentorNote: { fontSize: 10, color: colors.greenDark, fontWeight: '700' },

  hireBtn: {
    marginTop: spacing.sm,
    borderRadius: radii.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  hireBtnActive: { backgroundColor: colors.green },
  hireBtnDisabled: { backgroundColor: colors.creamBorder },
  hireBtnLabel: { fontSize: 11, fontWeight: '800', color: colors.ink },

  // ── Employee cards ──
  employeeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  employeeCardRetiring: {
    borderColor: colors.orange,
    backgroundColor: '#FFF8F0',
  },

  employeeTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  employeeNameBlock: { flex: 1, marginRight: spacing.sm },
  employeeName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  employeeRole: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },

  lvBadge: {
    backgroundColor: colors.blue,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  lvBadgeMax: { backgroundColor: colors.gold },
  lvBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },

  retireWarning: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '700',
    marginTop: 4,
  },

  employeeActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  actionBtn: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  actionBtnTrain: { backgroundColor: colors.blue, borderColor: colors.blueDark },
  actionBtnAssigned: { backgroundColor: colors.green, borderColor: colors.greenDark },
  actionBtnDisabled: { backgroundColor: colors.creamBorder, borderColor: colors.creamBorder },
  actionBtnLabel: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  cellPicker: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.creamBorder,
    paddingTop: spacing.sm,
    gap: 4,
  },
  cellPickerTitle: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', marginBottom: 4 },
  cellPickerOption: {
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  cellPickerLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },

  empty: { color: colors.inkMuted, fontSize: 13, fontStyle: 'italic', paddingVertical: spacing.sm },
})
