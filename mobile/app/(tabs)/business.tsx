import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../src/components/ListRow'
import { useGame } from '../../src/hooks/GameContext'
import { colors, spacing } from '../../src/theme'
import { PERKS } from '../../src/game/data/perks'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../src/game/data/balance'
import { text } from '../../src/game/translations'
import type { ActiveContract, GameState } from '../../src/game/types'

function contractProgress(contract: ActiveContract, game: GameState) {
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
  const { game, loaded, derived, unlockResearch, installPerk, completeContract, buyShipment, fulfillStandingOrder } =
    useGame()

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
  pending: {
    fontSize: 12,
    color: colors.blue,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
})
