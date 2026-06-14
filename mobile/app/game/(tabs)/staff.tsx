import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { STAFF_LEVEL_BALANCE, PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { getAssignmentCapacity, getTrainingCost, TICK_MS } from '../../../src/game/utils/gameCalculations'
import type { RecruitmentTier, WorkerType } from '../../../src/game/types'

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
// output bonus (see PLANT_PRODUCTION.specialistWorker).
const SPECIALIST_TYPES: WorkerType[] = PLANT_PRODUCTION.map((p) => p.specialistWorker).filter(
  (t): t is 'aviationSpecialist' | 'chemicalEngineer' => !!t,
)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function StaffScreen() {
  const { game, loaded, derived, hireCandidate, refreshRecruitmentPool, trainEmployee, toggleAssignment } = useGame()

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const buildingCounts = derived.buildingCounts
  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canManualRefresh = game.money >= refreshCost
  const refreshSecondsLeft = Math.max(
    0,
    Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000),
  )

  return (
    <SafeAreaView style={styles.screen}>
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
            <Pressable
              disabled={!canManualRefresh}
              onPress={() => refreshRecruitmentPool()}
              style={[styles.refreshButton, canManualRefresh ? styles.smallButtonActive : styles.smallButtonDisabled]}
            >
              <Text style={styles.smallButtonLabel}>🔄 Refresh (${refreshCost.toLocaleString()})</Text>
            </Pressable>
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
                <Pressable
                  disabled={!affordable}
                  onPress={() => hireCandidate(slotIndex)}
                  style={[
                    styles.hireButton,
                    affordable ? styles.smallButtonActive : styles.smallButtonDisabled,
                  ]}
                >
                  <Text style={styles.smallButtonLabel}>Hire · ${candidate.cost.toLocaleString()}</Text>
                </Pressable>
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
            const assigned = (game.assignments[employee.type] ?? []).includes(employee.id)
            const capacity = getAssignmentCapacity(buildingCounts, employee.type)

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
                <View style={styles.employeeActions}>
                  <Pressable
                    disabled={!canTrain}
                    onPress={() => trainEmployee(employee.id)}
                    style={[styles.smallButton, canTrain ? styles.smallButtonActive : styles.smallButtonDisabled]}
                  >
                    <Text style={styles.smallButtonLabel}>
                      {maxed ? 'Max' : `Train $${cost.money.toLocaleString()}+${cost.rp}RP`}
                    </Text>
                  </Pressable>
                  {isSpecialist && (
                    <Pressable
                      disabled={!assigned && (game.assignments[employee.type]?.length ?? 0) >= capacity}
                      onPress={() => toggleAssignment(employee.id, employee.type)}
                      style={[
                        styles.smallButton,
                        assigned ? styles.smallButtonActive : styles.smallButtonDisabled,
                      ]}
                    >
                      <Text style={styles.smallButtonLabel}>
                        {assigned ? 'Assigned' : `Assign (${(game.assignments[employee.type]?.length ?? 0)}/${capacity})`}
                      </Text>
                    </Pressable>
                  )}
                </View>
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
  employeeActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
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
