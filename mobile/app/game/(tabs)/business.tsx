import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import SellProductRow from '../../../src/components/SellProductRow'
import FeedstockPriorityRow from '../../../src/components/FeedstockPriorityRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, spacing } from '../../../src/theme'
import { PERKS } from '../../../src/game/data/perks'
import { PLANT_PRODUCTION, SHIPMENT_BALANCE, STANDING_ORDER_BALANCE, FEEDSTOCK_PRIORITY_BALANCE } from '../../../src/game/data/balance'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { SELLABLE_PRODUCTS } from '../../../src/game/data/products'
import { getProductSellPrice } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'
import type { ActiveContract, BuildingType, GameState } from '../../../src/game/types'

// Maps each sellable product to the building that produces it, for the
// "no plants built yet" hint.
const PRODUCT_PLANT: Record<(typeof SELLABLE_PRODUCTS)[number]['key'], BuildingType> = {
  jetFuel: 'jetFuelPlant',
  lubricants: 'lubricantPlant',
  petrochemicals: 'petrochemicalPlant',
  recycledMaterial: 'wasteTreatmentPlant',
  plasticPellets: 'polymerPlant',
}

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
  const {
    game,
    loaded,
    derived,
    unlockResearch,
    installPerk,
    completeContract,
    buyShipment,
    fulfillStandingOrder,
    sellProduct,
    adjustFeedstockPriority,
  } = useGame()
  const [showCompletedContracts, setShowCompletedContracts] = useState(false)

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
  const incompleteContracts = unlockedContracts
    .filter((c) => !c.isCompleted)
    .sort((a, b) => b.unlockLevel - a.unlockLevel || b.id - a.id)
  const completedContracts = unlockedContracts.filter((c) => c.isCompleted)

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Business</Text>
        <Text style={styles.subtitle}>
          RP {game.researchPoints} · Upgrade pts {game.upgradePoints} · Rep {game.reputation}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Sell Products">
          {SELLABLE_PRODUCTS.filter((product) => game.refineryLevel >= product.unlockLevel).map((product) => {
            const demandMultiplier = product.key === 'petrochemicals' ? game.petrochemicalsDemandMultiplier : 1
            const price = getProductSellPrice(product.key, derived.productSellMultiplier, demandMultiplier)
            const inventory = game.productInventory[product.key]
            const plantBuilding = PRODUCT_PLANT[product.key]
            const plantCount = derived.buildingCounts[plantBuilding]
            const noPlantsMessage =
              plantCount === 0 && game.refineryLevel >= product.plantUnlockLevel
                ? product.copy.noPlants.en
                : undefined
            return (
              <SellProductRow
                key={product.key}
                title={product.copy.kicker.en}
                subtitle={`${inventory} in stock · $${price}/unit`}
                inventory={inventory}
                price={price}
                noPlantsMessage={noPlantsMessage}
                onSell={(amount) => sellProduct(product.key, amount)}
              />
            )
          })}
        </Section>

        {(derived.buildingCounts.lubricantPlant > 0 ||
          derived.buildingCounts.jetFuelPlant > 0 ||
          derived.buildingCounts.petrochemicalPlant > 0) && (
          <Section title="⚖️ Feedstock Priority">
            <Text style={styles.tagline}>
              When feedstock runs short, plants split it proportionally. Raise a plant's priority
              to claim more of the shortage first (up to its own normal output); set to 0% to turn
              it off entirely.
            </Text>
            {PLANT_PRODUCTION.filter((plant) => derived.buildingCounts[plant.buildingKey] > 0).map((plant) => (
              <FeedstockPriorityRow
                key={plant.buildingKey}
                title={BUILDINGS[plant.buildingKey].name.en}
                value={game.feedstockPriority[plant.buildingKey] ?? FEEDSTOCK_PRIORITY_BALANCE.default}
                min={FEEDSTOCK_PRIORITY_BALANCE.min}
                max={FEEDSTOCK_PRIORITY_BALANCE.max}
                onAdjust={(delta) => adjustFeedstockPriority(plant.buildingKey, delta)}
              />
            ))}
          </Section>
        )}

        <Section title="Contracts">
          {incompleteContracts.map((contract) => {
            const { have, need, unit } = contractProgress(contract, game)
            const ready = have >= need
            // "NEW" = this contract just became available at your current
            // refinery level. Disappears once you complete it, or once you
            // level up past its tier (it's no longer the "newest" one).
            const isNew = contract.unlockLevel === game.refineryLevel
            return (
              <ListRow
                key={contract.id}
                title={contract.name.en}
                subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward} RP, +${contract.currentReputationReward} rep`}
                actionLabel="Complete"
                disabled={!ready}
                badge={isNew ? 'NEW' : undefined}
                onPress={() => completeContract(contract)}
              />
            )
          })}
          {incompleteContracts.length === 0 && (
            <Text style={styles.tagline}>No open contracts right now -- keep producing!</Text>
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
              const { have, need, unit } = contractProgress(contract, game)
              return (
                <ListRow
                  key={contract.id}
                  title={contract.name.en}
                  subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward} RP, +${contract.currentReputationReward} rep`}
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
})
