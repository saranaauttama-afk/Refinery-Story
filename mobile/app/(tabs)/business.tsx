import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../src/components/ListRow'
import { useGameLoop } from '../../src/hooks/useGameLoop'
import { colors, spacing } from '../../src/theme'
import { PERKS } from '../../src/game/data/perks'
import type { ActiveContract } from '../../src/game/types'

function contractProgress(contract: ActiveContract, game: NonNullable<ReturnType<typeof useGameLoop>['game']>) {
  if ((contract.petrochemicalsRequired ?? 0) > 0) {
    return { have: game.productInventory.petrochemicals, need: contract.petrochemicalsRequired ?? 0, unit: 'petrochem' }
  }
  if ((contract.lubricantsRequired ?? 0) > 0) {
    return { have: game.productInventory.lubricants, need: contract.lubricantsRequired ?? 0, unit: 'lubricants' }
  }
  if ((contract.jetFuelRequired ?? 0) > 0) {
    return { have: game.productInventory.jetFuel, need: contract.jetFuelRequired ?? 0, unit: 'jet fuel' }
  }
  if ((contract.asphaltRequired ?? 0) > 0) {
    return { have: game.productInventory.asphalt, need: contract.asphaltRequired ?? 0, unit: 'asphalt' }
  }
  return { have: game.gasoline, need: contract.gasolineRequired, unit: 'gasoline' }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function BusinessScreen() {
  const { game, loaded, derived, unlockResearch, installPerk, completeContract } = useGameLoop()

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Business</Text>
        <Text style={styles.subtitle}>
          RP {game.researchPoints} · Upgrade pts {game.upgradePoints} · Rep {game.reputation}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Contracts">
          {derived.activeContracts
            .filter((c) => c.isUnlocked)
            .map((contract) => {
              const { have, need, unit } = contractProgress(contract, game)
              const ready = have >= need && !contract.isCompleted
              return (
                <ListRow
                  key={contract.id}
                  title={contract.name.en}
                  subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward} RP, +${contract.currentReputationReward} rep`}
                  actionLabel="Complete"
                  disabled={!ready}
                  done={contract.isCompleted}
                  onPress={() => completeContract(contract)}
                />
              )
            })}
        </Section>

        <Section title="Research">
          {derived.activeResearchItems.map((item) => (
            <ListRow
              key={item.key}
              title={item.name.en}
              subtitle={
                item.isUnlocked
                  ? item.description.en
                  : item.prerequisiteName
                    ? `Requires ${item.prerequisiteName.en} · ${item.cost} RP`
                    : `${item.description.en} · ${item.cost} RP`
              }
              actionLabel="Unlock"
              disabled={!item.isVisible || game.researchPoints < item.cost}
              done={item.isUnlocked}
              onPress={() => unlockResearch(item)}
            />
          ))}
        </Section>

        <Section title="Perks">
          {PERKS.map((perk) => {
            const unlocked = game.unlockedPerks.includes(perk.key)
            const prereqMet = !perk.prerequisite || game.unlockedPerks.includes(perk.prerequisite)
            return (
              <ListRow
                key={perk.key}
                title={`${perk.name.en} (${perk.branch} ${perk.tier})`}
                subtitle={
                  unlocked
                    ? perk.description.en
                    : !prereqMet
                      ? 'Requires previous tier'
                      : `${perk.description.en} · ${perk.cost} upgrade pt${perk.cost > 1 ? 's' : ''}`
                }
                actionLabel="Unlock"
                disabled={!prereqMet || game.upgradePoints < perk.cost}
                done={unlocked}
                onPress={() => installPerk(perk)}
              />
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
})
