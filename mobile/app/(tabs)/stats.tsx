import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../src/components/ListRow'
import { useGame } from '../../src/hooks/GameContext'
import { colors, radii, spacing } from '../../src/theme'
import { ASPHALT_BALANCE, EXPANSION_BALANCE, type PaidExpansionEntry } from '../../src/game/data/balance'
import { getEsgTier, getSeasonLabel } from '../../src/game/utils/gameCalculations'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export default function StatsScreen() {
  const { game, loaded, derived, expandGrid, renameRefinery, resetGame, produceAsphalt, manualSave } = useGame()
  const [name, setName] = useState('')

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const esgTier = getEsgTier(game.esgScore)
  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const nextExpansion = EXPANSION_BALANCE[game.gridExpansionLevel + 1] as PaidExpansionEntry | undefined

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Era</Text>
          <Stat label="Current era" value={derived.currentEra.name.en} />
          <Text style={styles.tagline}>{derived.currentEra.tagline.en}</Text>
          {derived.nextEra ? (
            <Stat
              label="Next era"
              value={`${derived.nextEra.name.en} (Lv${derived.nextEra.requiredLevel}, ${derived.nextEra.requiredResearch} research)`}
            />
          ) : (
            <Stat label="Next era" value="Final era reached" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESG & Season</Text>
          <Stat label="ESG score" value={`${Math.round(game.esgScore)} / 100 · ${esgTier.en}`} />
          <Stat label="Gasoline season" value={`${seasonLabel.en} (${Math.round(derived.seasonalGasolineMultiplier * 100)}%)`} />
          <Stat label="Gasoline demand" value={`${Math.round(game.gasolineDemandMultiplier * 100)}%`} />
          <Stat label="Petrochem demand" value={`${Math.round(game.petrochemicalsDemandMultiplier * 100)}%`} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Stat label="Refinery level" value={`${game.refineryLevel}`} />
          <Stat label="Reputation" value={`${game.reputation}`} />
          <Stat label="Milestones" value={`${game.completedMilestoneKeys.length} completed`} />
          <Stat label="Grid size" value={`${EXPANSION_BALANCE[game.gridExpansionLevel].size}x${EXPANSION_BALANCE[game.gridExpansionLevel].size}`} />
          {nextExpansion && (
            <ListRow
              title={`Expand grid to ${nextExpansion.size}x${nextExpansion.size}`}
              subtitle={`Requires Lv${nextExpansion.requiresRefineryLevel} · $${nextExpansion.cost.toLocaleString()}`}
              actionLabel="Expand"
              disabled={game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost}
              onPress={() => expandGrid()}
            />
          )}
        </View>

        {game.refineryLevel >= ASPHALT_BALANCE.unlockLevel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asphalt</Text>
            <Stat label="Inventory" value={`${game.productInventory.asphalt}/${ASPHALT_BALANCE.maxStorage}`} />
            <View style={styles.renameRow}>
              <Pressable
                style={[styles.renameButton, { flex: 1 }]}
                onPress={() => produceAsphalt(ASPHALT_BALANCE.batchSize)}
              >
                <Text style={styles.renameButtonLabel}>Produce {ASPHALT_BALANCE.batchSize}</Text>
              </Pressable>
              <Pressable
                style={[styles.renameButton, { flex: 1 }]}
                onPress={() => produceAsphalt(ASPHALT_BALANCE.largeBatchSize)}
              >
                <Text style={styles.renameButtonLabel}>Produce {ASPHALT_BALANCE.largeBatchSize}</Text>
              </Pressable>
            </View>
            <Text style={styles.tagline}>Uses 1 crude per 1 asphalt. Sold via contracts / standing orders.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity log</Text>
          {game.activityLog.length === 0 && <Text style={styles.tagline}>Nothing yet.</Text>}
          {game.activityLog.slice(0, 8).map((entry, i) => (
            <Text key={i} style={styles.logEntry}>
              {entry}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refinery name</Text>
          <View style={styles.renameRow}>
            <TextInput
              style={styles.input}
              placeholder={game.refineryName}
              value={name}
              onChangeText={setName}
            />
            <Pressable
              style={styles.renameButton}
              onPress={() => {
                if (name.trim()) {
                  renameRefinery(name.trim())
                  setName('')
                }
              }}
            >
              <Text style={styles.renameButtonLabel}>Save</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save data</Text>
          <Text style={styles.tagline}>Autosaves every 5 seconds.</Text>
          <Pressable style={[styles.renameButton, styles.standaloneButton]} onPress={() => manualSave()}>
            <Text style={styles.renameButtonLabel}>Save now</Text>
          </Pressable>
          <Pressable
            style={styles.resetButton}
            onPress={() =>
              Alert.alert('Reset save?', 'This deletes all progress and starts a new refinery.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => resetGame() },
              ])
            }
          >
            <Text style={styles.resetButtonLabel}>Reset save</Text>
          </Pressable>
        </View>
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  statValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  tagline: {
    color: colors.inkMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  renameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.ink,
  },
  renameButton: {
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  renameButtonLabel: {
    fontWeight: '700',
    color: colors.ink,
  },
  standaloneButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  logEntry: {
    fontSize: 11,
    color: colors.inkMuted,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  resetButton: {
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  resetButtonLabel: {
    color: colors.white,
    fontWeight: '800',
  },
})
