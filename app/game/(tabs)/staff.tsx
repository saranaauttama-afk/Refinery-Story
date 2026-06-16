import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { STAFF_LEVEL_BALANCE, PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { getCellAssignedToEmployee, getTrainingCost, TICK_MS } from '../../../src/game/utils/gameCalculations'
import type { BuildingType, RecruitmentTier, WorkerType } from '../../../src/game/types'

const TIER_BADGES: Record<RecruitmentTier, string> = {
  rookie: '',
  skilled: '🔹 Skilled',
  expert: '🔸 Expert',
  star: '⭐ Star',
}

const TIER_BORDER_COLORS: Record<RecruitmentTier, string> = {
  rookie: colors.creamBorder,
  skilled: colors.blue,
  expert: colors.orange,
  star: colors.gold,
}

// Worker types that can be assigned to a specific plant for a specialist
// output bonus (see PLANT_PRODUCTION.specialistWorker). polymerEngineer
// is added manually since Polymer Plant is a standalone production block,
// not part of PLANT_PRODUCTION (see useGameLoop.ts).
const SPECIALIST_TYPES: WorkerType[] = [
  ...PLANT_PRODUCTION.map((p) => p.specialistWorker).filter(
    (t): t is 'aviationSpecialist' | 'chemicalEngineer' => !!t,
  ),
  'polymerEngineer',
]

// Worker type -> the building it can be assigned to. e.g.
// { aviationSpecialist: 'jetFuelPlant', chemicalEngineer: 'petrochemicalPlant',
//   polymerEngineer: 'polymerPlant' }
const SPECIALIST_BUILDING: Partial<Record<WorkerType, BuildingType>> = {
  ...Object.fromEntries(
    PLANT_PRODUCTION.filter((p) => p.specialistWorker).map((p) => [p.specialistWorker as WorkerType, p.buildingKey]),
  ),
  polymerEngineer: 'polymerPlant',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function StaffScreen() {
  const { game, loaded, derived, hireCandidate, refreshRecruitmentPool, trainEmployee, assignEmployeeToCell, unassignCell } =
    useGame()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  // Per-Plant Staff Assignment: which employee's cell-picker is currently
  // open (tapping "Assign" reveals a list of that worker type's plant
  // instances to choose from, since assignment is now per-cell, not a
  // pool toggle). null = no picker open.
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

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Text style={styles.subtitle}>{game.employees.length} employees hired</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Recruitment">
          <View style={styles.recruitmentHeader}>
            <Text style={styles.recruitmentHint}>
              {refreshSecondsLeft > 0
                ? `Pool refreshes in ${refreshSecondsLeft}s`
                : 'Pool refreshing...'}
            </Text>
            <AnimatedPressable
              disabled={!canManualRefresh}
              onPress={() => {
                if (canManualRefresh) {
                  spawnFloat(`-$${refreshCost.toLocaleString()}`, 'expense')
                  haptics.tap()
                }
                refreshRecruitmentPool()
              }}
              style={[styles.refreshButton, canManualRefresh ? styles.smallButtonActive : styles.smallButtonDisabled]}
            >
              <Text style={styles.smallButtonLabel}>🔄 Refresh (${refreshCost.toLocaleString()})</Text>
            </AnimatedPressable>
          </View>
          {game.recruitmentPool.map((candidate, slotIndex) => {
            const worker = WORKERS.find((w) => w.key === candidate.type)
            const affordable = game.money >= candidate.cost
            const badge = TIER_BADGES[candidate.tier]
            return (
              <View
                key={candidate.id}
                style={[styles.candidateCard, { borderColor: TIER_BORDER_COLORS[candidate.tier] }]}
              >
                <View style={styles.employeeHeader}>
                  <Text style={styles.employeeName}>
                    {candidate.name} {candidate.isVeteran ? '🎖' : ''}
                  </Text>
                  <Text style={styles.employeeType}>{worker?.name.en ?? candidate.type}</Text>
                </View>
                <Text style={styles.employeeStats}>
                  {badge ? `${badge} · ` : ''}Starts at Lv{candidate.startingLevel}
                  {candidate.isVeteran ? ' · Veteran (+20%)' : ''}
                </Text>
                {worker?.description && <Text style={styles.workerDescription}>{worker.description.en}</Text>}
                <AnimatedPressable
                  disabled={!affordable}
                  onPress={() => {
                    if (affordable) {
                      spawnFloat(`-$${candidate.cost.toLocaleString()}`, 'expense')
                      haptics.confirm()
                    }
                    hireCandidate(slotIndex)
                  }}
                  style={[
                    styles.hireButton,
                    affordable ? styles.smallButtonActive : styles.smallButtonDisabled,
                  ]}
                >
                  <Text style={styles.smallButtonLabel}>Hire · ${candidate.cost.toLocaleString()}</Text>
                </AnimatedPressable>
              </View>
            )
          })}
        </Section>

        <Section title="Your team">
          {game.employees.length === 0 && <Text style={styles.empty}>No employees yet -- hire some above.</Text>}
          {game.employees.map((employee) => {
            const worker = WORKERS.find((w) => w.key === employee.type)
            const maxed = employee.level >= STAFF_LEVEL_BALANCE.maxLevel
            const xpNeeded = STAFF_LEVEL_BALANCE.xpToNextLevel[employee.level] ?? 0
            const cost = getTrainingCost(employee.level)
            const canTrain = !maxed && game.money >= cost.money && game.researchPoints >= cost.rp
            const isSpecialist = SPECIALIST_TYPES.includes(employee.type)
            const assignedCellIndex = getCellAssignedToEmployee(game, employee.id)
            const buildingKey = SPECIALIST_BUILDING[employee.type]
            // All grid cells matching this worker's plant type, in grid
            // order, numbered #1/#2/... for display -- this is the list
            // the picker shows when "Assign" is tapped.
            const eligibleCells = buildingKey
              ? game.grid.reduce<{ cellIndex: number; label: string }[]>((acc, cell, cellIndex) => {
                  if (cell === buildingKey) acc.push({ cellIndex, label: `${BUILDINGS[buildingKey].name.en} #${acc.length + 1}` })
                  return acc
                }, [])
              : []
            const assignedLabel = eligibleCells.find((c) => c.cellIndex === assignedCellIndex)?.label

            return (
              <View key={employee.id} style={styles.employeeCard}>
                <View style={styles.employeeHeader}>
                  <Text style={styles.employeeName}>
                    {employee.name} {employee.trait === 'veteran' ? '⭐' : ''}
                  </Text>
                  <Text style={styles.employeeType}>{worker?.name.en ?? employee.type}</Text>
                </View>
                <Text style={styles.employeeStats}>
                  Lv{employee.level}
                  {maxed ? ' (max)' : ` · ${employee.xp}/${xpNeeded} XP`}
                </Text>
                {worker?.description && <Text style={styles.workerDescription}>{worker.description.en}</Text>}
                <View style={styles.employeeActions}>
                  <AnimatedPressable
                    disabled={!canTrain}
                    onPress={() => {
                      if (canTrain) {
                        spawnFloat(`-$${cost.money.toLocaleString()}`, 'expense')
                        haptics.confirm()
                      }
                      trainEmployee(employee.id)
                    }}
                    style={[styles.smallButton, canTrain ? styles.smallButtonActive : styles.smallButtonDisabled]}
                  >
                    <Text style={styles.smallButtonLabel}>
                      {maxed ? 'Max' : `Train $${cost.money.toLocaleString()}+${cost.rp}RP`}
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
                        styles.smallButton,
                        assignedCellIndex !== null ? styles.smallButtonActive : styles.smallButtonDisabled,
                      ]}
                    >
                      <Text style={styles.smallButtonLabel}>
                        {assignedCellIndex !== null
                          ? `Assigned · ${assignedLabel ?? ''} (tap to unassign)`
                          : eligibleCells.length === 0
                            ? `No ${BUILDINGS[buildingKey!]?.name.en ?? ''} built yet`
                            : 'Assign to a plant...'}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {pickerEmployeeId === employee.id && assignedCellIndex === null && (
                  <View style={styles.cellPicker}>
                    {eligibleCells.map(({ cellIndex, label }) => {
                      const occupant = game.employees.find(
                        (e) => getCellAssignedToEmployee(game, e.id) === cellIndex,
                      )
                      return (
                        <Pressable
                          key={cellIndex}
                          onPress={() => {
                            assignEmployeeToCell(employee.id, cellIndex)
                            setPickerEmployeeId(null)
                            haptics.confirm()
                          }}
                          style={styles.cellPickerOption}
                        >
                          <Text style={styles.cellPickerOptionLabel}>
                            {label}
                            {occupant ? ` (currently: ${occupant.name})` : ''}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  empty: {
    color: colors.inkMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  recruitmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recruitmentHint: {
    fontSize: 12,
    color: colors.inkMuted,
    flex: 1,
    paddingRight: spacing.sm,
  },
  candidateCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  refreshButton: {
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  hireButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  employeeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeName: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  employeeType: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  employeeStats: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  workerDescription: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  employeeActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cellPicker: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.creamBorder,
    paddingTop: spacing.xs,
    gap: 4,
  },
  cellPickerOption: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  cellPickerOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  smallButton: {
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  smallButtonActive: {
    backgroundColor: colors.green,
  },
  smallButtonDisabled: {
    backgroundColor: colors.cream,
    borderColor: colors.creamBorder,
  },
  smallButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
})
