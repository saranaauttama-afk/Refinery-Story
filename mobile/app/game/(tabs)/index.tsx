import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import BuildingGrid from '../../../src/components/BuildingGrid'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import ProgressBar from '../../../src/components/ProgressBar'
import ResourceBar from '../../../src/components/ResourceBar'
import Sheet from '../../../src/components/Sheet'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing } from '../../../src/theme'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { BUILDING_UPGRADE_BALANCE, BOOST_BALANCE } from '../../../src/game/data/balance'
import type { BuildingType } from '../../../src/game/types'
import {
  CRUDE_COST,
  getProductSellPrice,
  getSeasonLabel,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import { canActivateBoost, isBoostActive, isBoostOnCooldown } from '../../../src/hooks/useGameLoop'

const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingType[]
const UPGRADEABLE: BuildingType[] = ['crudeTank', 'distillationUnit', 'productTank']

export default function RefineryScreen() {
  const router = useRouter()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const {
    game,
    loaded,
    derived,
    buyCrude,
    sellGasoline,
    sellProduct,
    placeBuilding,
    upgradeBuilding,
    upgradeRefinery,
    autoTrade,
    updateAutoTrade,
    activateBoost,
  } = useGame()
  const { width } = useWindowDimensions()
  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [upgradeCell, setUpgradeCell] = useState<number | null>(null)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct = Math.round(derived.seasonalGasolineMultiplier * 100)

  const stats = [
    { label: 'Money', value: `$${Math.floor(game.money).toLocaleString()}`, color: colors.gold },
    { label: 'Crude', value: `${game.crudeOil}/${derived.maxCrudeStorage}`, color: colors.steelDark },
    { label: 'Feedstock', value: `${game.feedstock}/${derived.maxFeedstockStorage}`, color: colors.steelMid },
    { label: 'Gasoline', value: `${game.gasoline}/${derived.maxGasolineStorage}`, color: colors.green },
    { label: 'ESG', value: `${Math.round(game.esgScore)}`, color: colors.teal },
    { label: 'Season', value: `${seasonPct}%`, color: colors.orange },
  ]

  const handleCellPress = (index: number) => {
    const cell = game.grid[index]
    if (cell === null) {
      setPickerCell(index)
    } else if (UPGRADEABLE.includes(cell)) {
      setUpgradeCell(index)
    }
  }

  const upgradeCost = getUpgradeCost(game.refineryLevel)
  const upgradeProductionRequired = getUpgradeProductionRequirement(game.refineryLevel)
  const hasEnoughMoney = game.money >= upgradeCost
  const hasEnoughProduction = game.totalGasolineProduced >= upgradeProductionRequired
  const canUpgrade = hasEnoughMoney && hasEnoughProduction

  let upgradeSubtitle: string
  if (canUpgrade) {
    upgradeSubtitle = `Tap to upgrade · $${upgradeCost.toLocaleString()}`
  } else if (!hasEnoughProduction) {
    upgradeSubtitle = `Produce ${game.totalGasolineProduced}/${upgradeProductionRequired} gasoline to unlock (then $${upgradeCost.toLocaleString()})`
  } else {
    upgradeSubtitle = `Need $${upgradeCost.toLocaleString()} (have $${Math.floor(game.money).toLocaleString()})`
  }

  const nextGoal = derived.activeMilestones.find((m) => !m.isCompleted)

  const boostActive = isBoostActive(game)
  const boostOnCooldown = isBoostOnCooldown(game)
  const boostReady = canActivateBoost(game)
  const boostActiveSecondsLeft = Math.max(0, Math.ceil(((game.boostActiveUntilTick - game.tickCount) * TICK_MS) / 1000))
  const boostCooldownSecondsLeft = Math.max(
    0,
    Math.ceil(((game.boostAvailableAtTick - game.tickCount) * TICK_MS) / 1000),
  )
  const boostElapsed = boostActive
    ? BOOST_BALANCE.durationTicks - (game.boostActiveUntilTick - game.tickCount)
    : BOOST_BALANCE.cooldownTicks - (game.boostAvailableAtTick - game.tickCount)

  const products: { key: 'lubricants' | 'jetFuel' | 'petrochemicals'; label: string; color: string }[] = [
    { key: 'lubricants', label: 'Lubricants', color: colors.goldDark },
    { key: 'jetFuel', label: 'Jet Fuel', color: colors.blue },
    { key: 'petrochemicals', label: 'Petrochem', color: colors.purple },
  ]

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => {
            if (canUpgrade) {
              spawnFloat(`-$${upgradeCost.toLocaleString()}`, 'expense')
              haptics.confirm()
            }
            upgradeRefinery()
          }}
        >
          <Text style={styles.title}>
            {game.refineryName} · Lv{game.refineryLevel}
          </Text>
          <Text style={[styles.subtitle, !canUpgrade && styles.subtitleMuted]}>{upgradeSubtitle}</Text>
        </AnimatedPressable>
        <Text style={styles.season}>{seasonLabel.en}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
      {nextGoal && (
        <Pressable style={styles.nextGoalCard} onPress={() => router.push('/achievements')}>
          <Text style={styles.nextGoalLabel}>🎯 Next: {nextGoal.name.en}</Text>
          {nextGoal.progress ? (
            <View style={styles.nextGoalProgressRow}>
              <ProgressBar current={nextGoal.progress.current} target={nextGoal.progress.target} />
              <Text style={styles.nextGoalProgressLabel}>
                {nextGoal.progress.current.toLocaleString()}/{nextGoal.progress.target.toLocaleString()}
              </Text>
            </View>
          ) : (
            <Text style={styles.nextGoalRequirement}>{nextGoal.requirement.en}</Text>
          )}
        </Pressable>
      )}

      <ResourceBar stats={stats} />

      <View style={styles.gridWrap}>
        <BuildingGrid
          grid={game.grid}
          gridLevels={game.gridLevels}
          containerWidth={width - spacing.lg * 2}
          onCellPress={handleCellPress}
          isActive={game.crudeOil > 0}
          employeeCount={game.employees.length}
        />
        <Text style={styles.hint}>Tap an empty tile to build · tap a tank/unit to upgrade</Text>
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => {
            const actualBuy = Math.min(10, Math.floor(game.money / CRUDE_COST), derived.maxCrudeStorage - game.crudeOil)
            if (actualBuy > 0) {
              spawnFloat(`-$${(actualBuy * CRUDE_COST).toLocaleString()}`, 'expense')
              haptics.tap()
            }
            buyCrude(10)
          }}
        >
          <Text style={styles.actionLabel}>Buy 10 Crude</Text>
          <Text style={styles.actionSub}>${CRUDE_COST}/unit</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => {
            const actualSell = Math.min(10, game.gasoline)
            if (actualSell > 0) {
              spawnFloat(`+$${(actualSell * derived.sellPrice).toLocaleString()}`, 'income')
              haptics.tap()
            }
            sellGasoline(10)
          }}
        >
          <Text style={styles.actionLabel}>Sell 10 Gas</Text>
          <Text style={styles.actionSub}>${derived.sellPrice}/unit</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.productsWrap}>
        {products.map((p) => {
          const have = game.productInventory[p.key]
          const price = getProductSellPrice(
            p.key,
            derived.productSellMultiplier,
            p.key === 'petrochemicals' ? game.petrochemicalsDemandMultiplier : 1,
          )
          return (
            <AnimatedPressable
              key={p.key}
              style={[styles.productChip, { borderColor: p.color, opacity: have > 0 ? 1 : 0.5 }]}
              disabled={have <= 0}
              onPress={() => {
                if (have > 0) {
                  spawnFloat(`+$${(have * price).toLocaleString()}`, 'income')
                  haptics.tap()
                }
                sellProduct(p.key, have)
              }}
            >
              <Text style={[styles.productLabel, { color: p.color }]}>{p.label}</Text>
              <Text style={styles.productValue}>
                {have} · sell @${price}
              </Text>
            </AnimatedPressable>
          )
        })}
      </View>

      <View style={[styles.boostCard, boostActive && styles.boostCardActive]}>
        {boostActive ? (
          <>
            <Text style={styles.boostTitle}>🔥 Boost active! x{BOOST_BALANCE.productionMultiplier} gasoline</Text>
            <View style={styles.boostProgressRow}>
              <ProgressBar current={boostElapsed} target={BOOST_BALANCE.durationTicks} />
              <Text style={styles.boostTimeLabel}>{boostActiveSecondsLeft}s left</Text>
            </View>
          </>
        ) : boostOnCooldown ? (
          <>
            <Text style={styles.boostTitleMuted}>🔥 Boost recharging...</Text>
            <View style={styles.boostProgressRow}>
              <ProgressBar current={boostElapsed} target={BOOST_BALANCE.cooldownTicks} />
              <Text style={styles.boostTimeLabel}>{boostCooldownSecondsLeft}s</Text>
            </View>
          </>
        ) : (
          <AnimatedPressable
            style={styles.boostButton}
            onPress={() => {
              if (boostReady) {
                haptics.confirm()
                activateBoost()
              }
            }}
          >
            <Text style={styles.boostButtonLabel}>
              🔥 Activate Boost · x{BOOST_BALANCE.productionMultiplier} gasoline for{' '}
              {Math.round((BOOST_BALANCE.durationTicks * TICK_MS) / 1000)}s
            </Text>
          </AnimatedPressable>
        )}
      </View>

      <View style={styles.autoTradeCard}>
        <View style={styles.autoTradeHeader}>
          <Text style={styles.autoTradeTitle}>🔄 Auto-trade</Text>
          <Switch
            value={autoTrade.enabled}
            onValueChange={(v) => updateAutoTrade({ enabled: v })}
            trackColor={{ false: colors.creamBorder, true: colors.green }}
          />
        </View>
        {autoTrade.enabled && (
          <>
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Buy crude below {autoTrade.buyThreshold}%</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}
                >
                  <Text style={styles.stepperLabel}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{autoTrade.buyThreshold}%</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => updateAutoTrade({ buyThreshold: Math.min(100, autoTrade.buyThreshold + 5) })}
                >
                  <Text style={styles.stepperLabel}>+</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Sell gasoline above {autoTrade.sellThreshold}%</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}
                >
                  <Text style={styles.stepperLabel}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{autoTrade.sellThreshold}%</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}
                >
                  <Text style={styles.stepperLabel}>+</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
      </ScrollView>

      {/* Build picker */}
      <Sheet visible={pickerCell !== null} title="Build" onClose={() => setPickerCell(null)}>
        {BUILDING_KEYS.map((key) => {
          const b = BUILDINGS[key]
          const unlockLevel = b.unlockLevel ?? 1
          const locked = game.refineryLevel < unlockLevel
          const affordable = game.money >= b.cost
          return (
            <ListRow
              key={key}
              title={b.name.en}
              subtitle={locked ? `Requires refinery Lv${unlockLevel}` : `$${b.cost.toLocaleString()}`}
              actionLabel="Build"
              disabled={locked || !affordable}
              onPress={() => {
                if (pickerCell !== null) placeBuilding(pickerCell, key)
                setPickerCell(null)
              }}
            />
          )
        })}
      </Sheet>

      {/* Upgrade modal */}
      <Sheet visible={upgradeCell !== null} title="Upgrade building" onClose={() => setUpgradeCell(null)}>
        {(() => {
          if (upgradeCell === null) return null
          const cell = game.grid[upgradeCell]
          if (!cell) return null
          const level = game.gridLevels[upgradeCell] ?? 1
          const maxed = level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
          const cost =
            level === 1
              ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
              : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
          return (
            <ListRow
              title={`${BUILDINGS[cell].name.en} (Lv${level})`}
              subtitle={maxed ? 'Max level' : `Upgrade to Lv${level + 1} · $${cost.toLocaleString()}`}
              actionLabel="Upgrade"
              disabled={maxed || game.money < cost}
              done={maxed}
              onPress={() => {
                upgradeBuilding(upgradeCell)
                setUpgradeCell(null)
              }}
            />
          )
        })()}
      </Sheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  subtitleMuted: {
    opacity: 0.6,
  },
  season: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: '700',
    marginTop: 4,
  },
  gridWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  buyButton: {
    backgroundColor: colors.steelLight,
  },
  sellButton: {
    backgroundColor: colors.green,
  },
  actionLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  actionSub: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  productsWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  productChip: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  productLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  productValue: {
    fontSize: 11,
    color: colors.ink,
    marginTop: 2,
  },
  boostCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  boostCardActive: {
    borderColor: colors.orange,
    backgroundColor: '#FFF3E8',
  },
  boostTitle: {
    fontWeight: '800',
    color: colors.orangeDark,
    fontSize: 13,
  },
  boostTitleMuted: {
    fontWeight: '800',
    color: colors.inkMuted,
    fontSize: 13,
  },
  boostProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  boostTimeLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '700',
  },
  boostButton: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  boostButtonLabel: {
    fontWeight: '800',
    color: colors.orangeDark,
    fontSize: 13,
  },
  autoTradeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  nextGoalCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  nextGoalLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 12,
  },
  nextGoalRequirement: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 2,
  },
  nextGoalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  nextGoalProgressLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '700',
  },
  autoTradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoTradeTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  thresholdLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.inkMuted,
    paddingRight: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  stepperValue: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
  },
})
