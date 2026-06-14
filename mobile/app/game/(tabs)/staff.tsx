import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { STAFF_LEVEL_BALANCE, PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { getAssignmentCapacity, getTrainingCost } from '../../../src/game/utils/gameCalculations'
import type { WorkerType } from '../../../src/game/types'

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
  const { game, loaded, derived, hireWorker, trainEmployee, toggleAssignment } = useGame()

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const buildingCounts = derived.buildingCounts

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Text style={styles.subtitle}>{game.employees.length} employees hired</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Hire">
          {WORKERS.map((worker) => {
            const count = game.workerCounts[worker.key] ?? 0
            const locked = worker.unlockLevel ? game.refineryLevel < worker.unlockLevel : false
            const affordable = game.money >= worker.cost
            return (
              <ListRow
                key={worker.key}
                title={`${worker.name.en} · x${count}`}
                subtitle={
                  locked
                    ? `Requires refinery Lv${worker.unlockLevel}`
                    : `${worker.description.en} · $${worker.cost.toLocaleString()}`
                }
                actionLabel="Hire"
                disabled={locked || !affordable}
                onPress={() => hireWorker(worker)}
              />
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
