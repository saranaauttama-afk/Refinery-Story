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
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { EXPANSION_BALANCE, type PaidExpansionEntry } from '../../../src/game/data/balance'
import { getEsgTier, getSeasonLabel } from '../../../src/game/utils/gameCalculations'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export default function HQScreen() {
  const router = useRouter()
  const {
    game,
    loaded,
    derived,
    expandGrid,
    renameRefinery,
    manualSave,
    resetGame,
  } = useGame()
  const [name, setName] = useState('')

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const nextExpansion = EXPANSION_BALANCE[game.gridExpansionLevel + 1] as PaidExpansionEntry | undefined
  const completedMilestones = game.completedMilestoneKeys.length
  const totalMilestones = derived.activeMilestones.length
  const unlockedResearch = derived.activeResearchItems.filter((item) => item.isUnlocked).length
  const totalResearch = derived.activeResearchItems.length
  const esgTier = getEsgTier(game.esgScore)
  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const lastAward = game.awardHistory[0]
  const latestRanking =
    lastAward && lastAward.rivals.length > 0
      ? `Last ranking #${lastAward.playerRank} of ${lastAward.rivals.length + 1}`
      : 'Full ranking still appears during the year-end award ceremony.'

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>HQ</Text>
        <Text style={styles.subtitle}>Growth, milestones, company tools, and long-term progress.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Progression Hub">
          <ListRow
            title="Achievements"
            subtitle={`${completedMilestones} / ${totalMilestones} milestones completed`}
            actionLabel="Open"
            onPress={() => router.push('/achievements')}
          />
          <ListRow
            title="Research & business"
            subtitle={`${unlockedResearch} / ${totalResearch} research unlocked · ${game.researchPoints} RP ready`}
            actionLabel="Open"
            onPress={() => router.push('/game/business')}
          />
        </Section>

        <Section title="Awards & Era">
          <Stat label="Current era" value={derived.currentEra.name.en} />
          <Stat label="ESG score" value={`${Math.round(game.esgScore)} / 100 · ${esgTier.en}`} />
          <Stat label="Season" value={`${seasonLabel.en} (${Math.round(derived.seasonalGasolineMultiplier * 100)}%)`} />
          <Stat
            label="Next era"
            value={
              derived.nextEra
                ? `${derived.nextEra.name.en} · Lv${derived.nextEra.requiredLevel} + ${derived.nextEra.requiredResearch} research`
                : 'Final era reached'
            }
          />
          <Stat label="Business year" value={`Year ${game.businessYear}`} />
          <Text style={styles.note}>
            {lastAward
              ? `Last award: Grade ${lastAward.grade} · Score ${lastAward.score} · ${latestRanking}`
              : 'No award history yet. Annual results and ranking still appear in the year-end ceremony.'}
          </Text>
        </Section>

        <Section title="Refinery Growth">
          <Stat label="Refinery level" value={`Lv${game.refineryLevel}`} />
          <Stat
            label="Grid size"
            value={`${EXPANSION_BALANCE[game.gridExpansionLevel].size}x${EXPANSION_BALANCE[game.gridExpansionLevel].size}`}
          />
          {nextExpansion ? (
            <ListRow
              title={`Expand refinery to ${nextExpansion.size}x${nextExpansion.size}`}
              subtitle={`Requires Lv${nextExpansion.requiresRefineryLevel} · $${nextExpansion.cost.toLocaleString()}`}
              actionLabel="Expand"
              disabled={game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost}
              onPress={() => expandGrid()}
            />
          ) : (
            <Text style={styles.note}>Maximum refinery size already reached.</Text>
          )}
        </Section>

        <Section title="Company Name">
          <Text style={styles.note}>Current name: {game.refineryName}</Text>
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
                const nextName = name.trim()
                if (!nextName) return
                renameRefinery(nextName)
                setName('')
              }}
            >
              <Text style={styles.renameButtonLabel}>Save</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Save & Access">
          <ListRow
            title="Manual save"
            subtitle="Autosave still runs in the background."
            actionLabel="Save"
            onPress={() => manualSave()}
          />
          <ListRow
            title="Store"
            subtitle="Remove ads, boosts (demo)"
            actionLabel="Open"
            onPress={() => router.push('/store')}
          />
          <ListRow
            title="Settings"
            subtitle="Language, audio, and app-level controls"
            actionLabel="Open"
            onPress={() => router.push('/settings')}
          />
          <ListRow
            title="Main Menu"
            subtitle="Return to the front menu without changing your save"
            actionLabel="Open"
            onPress={() => router.replace('/')}
          />
          <ListRow
            title="Reset save"
            subtitle="Deletes all progress after confirmation"
            actionLabel="Reset"
            onPress={() =>
              Alert.alert('Reset save?', 'This deletes all progress and starts a new refinery.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    resetGame()
                    router.replace('/')
                  },
                },
              ])
            }
          />
        </Section>

        <Section title="Activity Log">
          {game.activityLog.length === 0
            ? <Text style={styles.note}>Nothing yet.</Text>
            : game.activityLog.slice(0, 8).map((entry, i) => (
                <Text key={i} style={styles.logEntry}>{entry}</Text>
              ))
          }
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
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
    gap: spacing.md,
  },
  section: {
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
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: spacing.sm,
  },
  note: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  logEntry: {
    fontSize: 11,
    color: colors.inkMuted,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  renameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.ink,
  },
  renameButton: {
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.green,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameButtonLabel: {
    color: colors.ink,
    fontWeight: '800',
  },
})
