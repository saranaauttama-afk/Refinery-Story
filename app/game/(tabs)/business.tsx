import { useState, useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { PERKS } from '../../../src/game/data/perks'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function BusinessScreen() {
  const {
    game,
    loaded,
    derived,
    unlockResearch,
    installPerk,
    completeContract,
    buyShipment,
    fulfillStandingOrder,
    claimHiddenEvent,
  } = useGame()
  const [showCompletedContracts, setShowCompletedContracts] = useState(false)
  const [contractFilter, setContractFilter] = useState<'all' | 'ready' | 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'>('all')

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const unlockedContracts = derived.activeContracts.filter((c) => c.isUnlocked)
  // Newest-unlocked tier first, so contracts you just gained access to float
  // to the top instead of getting buried in a long static list.
  const allIncomplete = unlockedContracts
    .filter((c) => !c.isCompleted)
    .sort((a, b) => b.unlockLevel - a.unlockLevel || b.id - a.id)

  const completedContracts = unlockedContracts.filter((c) => c.isCompleted)

  // Count ready contracts for the badge
  const readyCount = allIncomplete.filter((c) => {
    const { have, need } = getContractProgress(c, game)
    return have >= need
  }).length

  const incompleteContracts = useMemo(() => {
    const filtered = contractFilter === 'all' ? allIncomplete
      : contractFilter === 'ready' ? allIncomplete.filter((c) => {
          const { have, need } = getContractProgress(c, game)
          return have >= need
        })
      : contractFilter === 'gasoline' ? allIncomplete.filter((c) => (c.gasolineRequired ?? 0) > 0)
      : contractFilter === 'asphalt' ? allIncomplete.filter((c) => (c.asphaltRequired ?? 0) > 0)
      : contractFilter === 'jetFuel' ? allIncomplete.filter((c) => (c.jetFuelRequired ?? 0) > 0)
      : contractFilter === 'lubricants' ? allIncomplete.filter((c) => (c.lubricantsRequired ?? 0) > 0)
      : contractFilter === 'petrochemicals' ? allIncomplete.filter((c) => (c.petrochemicalsRequired ?? 0) > 0)
      : contractFilter === 'recycledMaterial' ? allIncomplete.filter((c) => (c.recycledMaterialRequired ?? 0) > 0)
      : allIncomplete.filter((c) => (c.plasticPelletsRequired ?? 0) > 0)
    // Ready contracts always float to the top within the filtered set
    return [...filtered].sort((a, b) => {
      const aReady = getContractProgress(a, game).have >= getContractProgress(a, game).need ? 0 : 1
      const bReady = getContractProgress(b, game).have >= getContractProgress(b, game).need ? 0 : 1
      return aReady - bReady || b.unlockLevel - a.unlockLevel || b.id - a.id
    })
  }, [allIncomplete, contractFilter, game])

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Business</Text>
        <Text style={styles.subtitle}>
          RP {game.researchPoints} · Upgrade pts {game.upgradePoints} · Rep {game.reputation}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title={readyCount > 0 ? `Contracts · ${readyCount} ready` : 'Contracts'}>
          {/* Filter bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {([
              { key: 'all', label: 'All' },
              { key: 'ready', label: `✓ Ready${readyCount > 0 ? ` (${readyCount})` : ''}` },
              { key: 'gasoline', label: '⛽ Gas' },
              { key: 'asphalt', label: '🛣 Asphalt' },
              { key: 'jetFuel', label: '✈️ Jet' },
              { key: 'lubricants', label: '🔧 Lube' },
              { key: 'petrochemicals', label: '🧪 Petrochem' },
              { key: 'recycledMaterial', label: '♻️ Recycled' },
              { key: 'plasticPellets', label: '🔩 Pellets' },
            ] as const).map((f) => (
              <Pressable
                key={f.key}
                style={[styles.filterChip, contractFilter === f.key && styles.filterChipActive]}
                onPress={() => setContractFilter(f.key)}
              >
                <Text style={[styles.filterChipLabel, contractFilter === f.key && styles.filterChipLabelActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {HIDDEN_EVENTS.filter(
            (e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked',
          ).map((event) => (
            <ListRow
              key={event.key}
              title="??? Mystery Contract"
              subtitle="Something unusual happened. Tap to find out what."
              badge="???"
              actionLabel="Reveal"
              onPress={() => claimHiddenEvent(event.key)}
            />
          ))}

          {incompleteContracts.map((contract) => {
            const { have, need, unit } = getContractProgress(contract, game)
            const ready = have >= need
            const isNew = contract.unlockLevel === game.refineryLevel
            return (
              <ListRow
                key={contract.id}
                title={contract.name.en}
                subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward} RP, +${contract.currentReputationReward} rep`}
                actionLabel="Complete"
                disabled={!ready}
                badge={isNew ? 'NEW' : ready ? '✓' : undefined}
                onPress={() => completeContract(contract)}
              />
            )
          })}
          {incompleteContracts.length === 0 && (
            <Text style={styles.tagline}>
              {contractFilter === 'all' ? 'No open contracts -- keep producing!' : 'No contracts match this filter.'}
            </Text>
          )}

          {completedContracts.length > 0 && (
            <Pressable
              style={styles.completedToggle}
              onPress={() => setShowCompletedContracts((v) => !v)}
            >
              <Text style={styles.completedToggleLabel}>
                {showCompletedContracts ? '▾' : '▸'} Completed ({completedContracts.length})
              </Text>
            </Pressable>
          )}
          {showCompletedContracts &&
            completedContracts.map((contract) => {
              const { have, need, unit } = getContractProgress(contract, game)
              return (
                <ListRow
                  key={contract.id}
                  title={contract.name.en}
                  subtitle={`${have}/${need} ${unit}`}
                  actionLabel="Complete"
                  done
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

        <Section title="Crude shipments">
          {game.pendingShipments.map((shipment) => {
            const secondsLeft = Math.max(0, Math.ceil((shipment.arrivesAt - Date.now()) / 1000))
            return (
              <Text key={shipment.id} style={styles.pending}>
                📦 {shipment.amount} crude arriving in {secondsLeft}s
              </Text>
            )
          })}
          {SHIPMENT_BALANCE.map((option) => (
            <ListRow
              key={option.key}
              title={`${text.shipments.names[option.key].en} · +${option.amount} crude`}
              subtitle={`$${option.cost.toLocaleString()} · arrives in ${option.delayMs / 1000}s`}
              actionLabel="Order"
              disabled={game.money < option.cost}
              onPress={() => buyShipment(option)}
            />
          ))}
        </Section>

        <Section title="Standing orders">
          {STANDING_ORDER_BALANCE.filter((order) => game.refineryLevel >= order.unlockLevel).map((order) => {
            const cooldownAt = game.standingOrderCooldowns[order.key]
            const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
            const ticksLeft = onCooldown ? cooldownAt! - game.tickCount : 0
            const have = game.productInventory[order.productKey]
            const ready = have >= order.required && !onCooldown
            const orderText = text.standingOrders.orders[order.key]
            return (
              <ListRow
                key={order.key}
                title={orderText.name.en}
                subtitle={
                  onCooldown
                    ? `On cooldown · ${Math.ceil((ticksLeft * 200) / 1000)}s left`
                    : `${have}/${order.required} ${order.productKey} · +$${order.reward.toLocaleString()}, +${order.rpReward} RP, +${order.reputationReward} rep`
                }
                actionLabel="Fulfill"
                disabled={!ready}
                onPress={() => fulfillStandingOrder(order.key)}
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
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
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
  pending: {
    fontSize: 12,
    color: colors.blue,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tagline: {
    color: colors.inkMuted,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
  completedToggle: {
    paddingVertical: spacing.sm,
  },
  completedToggleLabel: {
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  filterBar: {
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
})
