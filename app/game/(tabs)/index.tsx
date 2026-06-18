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
import BottomDrawer from '../../../src/components/BottomDrawer'
import IsometricBuildingGrid, { getIsometricBounds } from '../../../src/components/IsometricBuildingGrid'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import CollapsibleCard from '../../../src/components/CollapsibleCard'
import ProductionOverview, { type ProductionOverviewRow } from '../../../src/components/ProductionOverview'
import ProgressBar from '../../../src/components/ProgressBar'
import IconStatBar from '../../../src/components/IconStatBar'
import { Coins, Droplet, Fuel, Leaf } from 'lucide-react-native'
import Sheet from '../../../src/components/Sheet'
import ZoomableGridCanvas from '../../../src/components/ZoomableGridCanvas'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDING_UPGRADE_BALANCE, BOOST_BALANCE, PLANT_PRODUCTION, GRID_EDIT_BALANCE } from '../../../src/game/data/balance'
import type { BuildingType, DerivedStats } from '../../../src/game/types'
import {
  CRUDE_COST,
  getBuildingEffectLines,
  getCellAssignedToEmployee,
  getContractProgress,
  getEmployeeAssignedToCell,
  getProductSellPrice,
  formatGameClockTime,
  getSeasonLabel,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import { canActivateBoost, isBoostActive, isBoostOnCooldown } from '../../../src/hooks/useGameLoop'

const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingType[]
// Keep in sync with the isUpgradeable check in useGameLoop.ts
// upgradeBuilding() -- every building with a ...ByLevel table in
// BUILDING_UPGRADE_BALANCE.
const UPGRADEABLE: BuildingType[] = [
  'crudeTank',
  'distillationUnit',
  'productTank',
  'laboratory',
  'maintenanceWorkshop',
  'salesOffice',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
  'polymerPlant',
]

// Maps each secondary product to the building that produces it, used by
// the Production Overview panel to decide whether to show a row for a
// product the player hasn't built a plant for yet (hidden until either
// some stock exists or the plant is built -- matches the "no plants"
// gating pattern used elsewhere, e.g. business.tsx's Sell Products
// section).
const PRODUCT_PLANT_BUILDING: Record<
  'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
  BuildingType
> = {
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
  petrochemicals: 'petrochemicalPlant',
  recycledMaterial: 'wasteTreatmentPlant',
  plasticPellets: 'polymerPlant',
}

function PRODUCT_MAX_STORAGE(
  derived: DerivedStats,
  key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
): number {
  switch (key) {
    case 'lubricants':
      return derived.maxLubricantsStorage
    case 'jetFuel':
      return derived.maxJetFuelStorage
    case 'petrochemicals':
      return derived.maxPetrochemicalsStorage
    case 'recycledMaterial':
      return derived.maxRecycledMaterialStorage
    case 'plasticPellets':
      return derived.maxPlasticPelletsStorage
  }
}

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
    demolishBuilding,
    moveBuilding,
    swapBuildings,
    claimHiddenEvent,
    upgradeBuilding,
    upgradeRefinery,
    autoTrade,
    updateAutoTrade,
    activateBoost,
    adjustFeedstockPriority,
    assignEmployeeToCell,
    unassignCell,
  } = useGame()
  const { width, height } = useWindowDimensions()
  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [infoCell, setInfoCell] = useState<number | null>(null)
  // Move/Swap buildings: when set, the NEXT grid tap is interpreted as
  // the target cell instead of opening the normal build-picker/info
  // sheet. Started from the Building Info sheet's Move/Swap button (which
  // closes the sheet and sets this), cleared after the target tap
  // resolves (whether it succeeds or is rejected by moveBuilding/
  // swapBuildings -- e.g. tapping an occupied cell while in 'move' mode
  // just silently no-ops, matching how the underlying action already
  // guards against invalid targets).
  const [gridEditMode, setGridEditMode] = useState<{ type: 'move' | 'swap'; fromIndex: number } | null>(null)
  // Refinery-tab dashboard redesign: Auto-trade + Feedstock Priority moved
  // out of the main scroll into a dedicated modal (opened via the ⚙️
  // button next to the header), so the main view stays a shorter,
  // dashboard-like glance instead of a long settings list.
  const [automationModalOpen, setAutomationModalOpen] = useState(false)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)

  // Kept short and icon-led on purpose -- per feedback, the old header
  // (3 large StatBox cards + a 7-item ResourceBar wrapping into 2 rows)
  // added up to badges that spilled down nearly half the screen. Only
  // the handful of numbers worth checking at-a-glance while looking at
  // the grid live here; Feedstock/Season/Time/Reputation/Era moved into
  // the BottomDrawer (Production Overview / Stats tab) where checking
  // them isn't as time-pressured.
  const iconStats = [
    { key: 'money', icon: <Coins size={14} color={colors.goldDark} />, value: `$${Math.floor(game.money).toLocaleString()}`, color: colors.goldDark },
    { key: 'crude', icon: <Droplet size={14} color={colors.steelDark} />, value: `${game.crudeOil}/${derived.maxCrudeStorage}`, color: colors.steelDark },
    { key: 'gasoline', icon: <Fuel size={14} color={colors.green} />, value: `${game.gasoline}/${derived.maxGasolineStorage}`, color: colors.green },
    { key: 'esg', icon: <Leaf size={14} color={colors.teal} />, value: `${Math.round(game.esgScore)}`, color: colors.teal },
  ]

  const handleCellPress = (index: number) => {
    if (gridEditMode) {
      if (gridEditMode.type === 'move') {
        moveBuilding(gridEditMode.fromIndex, index)
      } else {
        swapBuildings(gridEditMode.fromIndex, index)
      }
      setGridEditMode(null)
      return
    }
    const cell = game.grid[index]
    if (cell === null) {
      setPickerCell(index)
    } else {
      setInfoCell(index)
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

  const products: {
    key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'
    label: string
    color: string
  }[] = [
    { key: 'lubricants', label: 'Lubricants', color: colors.goldDark },
    { key: 'jetFuel', label: 'Jet Fuel', color: colors.blue },
    { key: 'petrochemicals', label: 'Petrochem', color: colors.purple },
    { key: 'recycledMaterial', label: 'Recycled', color: colors.greenDark },
    { key: 'plasticPellets', label: 'Pellets', color: colors.teal },
  ]

  const productionRows: ProductionOverviewRow[] = [
    { key: 'gasoline', label: 'Gasoline', current: game.gasoline, max: derived.maxGasolineStorage, color: colors.green },
    ...products
      .filter((p) => game.productInventory[p.key] > 0 || derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
      .map((p) => ({
        key: p.key,
        label: p.label,
        current: game.productInventory[p.key],
        max: PRODUCT_MAX_STORAGE(derived, p.key),
        color: p.color,
      })),
  ]

  // Current Contract dashboard card: the first unlocked, not-yet-completed
  // contract, same selection a player would see first in the Business
  // tab's Contracts section -- gives a persistent glance at "what am I
  // working toward" without leaving the Refinery tab.
  const currentContract = derived.activeContracts.find((c) => c.isUnlocked && !c.isCompleted)

  // Natural (unscaled) pixel size of the grid, used as the "content size"
  // ZoomableGridCanvas clamps panning against. Based on a fixed base tile
  // size rather than the screen width (which is now irrelevant to grid
  // sizing -- the canvas can be panned/zoomed independently of the
  // viewport) so the grid renders at a consistent, comfortable tap-target
  // size regardless of device. getIsometricBounds computes the actual
  // diamond-shaped bounding box (wider than a plain square grid of the
  // same tile count, since the isometric layout fans out sideways) so
  // ZoomableGridCanvas's pan-clamping bounds match what's really rendered.
  const baseTileSize = 84
  const isoBounds = getIsometricBounds(game.grid.length, baseTileSize, baseTileSize)

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />
      {!derived.gameClock.isDaytime && <View style={styles.nightOverlay} pointerEvents="none" />}

      {/* Background layer: the building grid, full-screen, pannable +
          pinch-zoomable, laid out as an isometric diamond (not a plain
          square grid). A small ⤢ button (mid-right edge, rendered by
          ZoomableGridCanvas itself) resets framing. */}
      <ZoomableGridCanvas contentWidth={isoBounds.width} contentHeight={isoBounds.height}>
        <View style={styles.gridWrap}>
          <IsometricBuildingGrid
            grid={game.grid}
            gridLevels={game.gridLevels}
            tileSize={baseTileSize}
            onCellPress={handleCellPress}
            isActive={game.crudeOil > 0}
            employeeCount={game.employees.length}
          />
        </View>
      </ZoomableGridCanvas>

      {/* Floating top overlay: header + grouped stat boxes. Sits ABOVE
          the grid layer (position: absolute), doesn't scroll with it. */}
      <View style={styles.topOverlay} pointerEvents="box-none">
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
          <View style={styles.headerRight}>
            <Text style={styles.season}>{seasonLabel.en}</Text>
            <Pressable style={styles.automationButton} onPress={() => setAutomationModalOpen(true)}>
              <Text style={styles.automationButtonLabel}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        <IconStatBar stats={iconStats} />

        {/* The old "Tap an empty tile to build · tap a built tile for
            info" hint (always visible) was intentionally dropped here --
            it doesn't fit the floating-HUD design's goal of minimal
            persistent chrome over the grid, and the interaction is
            fairly self-evident once a player taps anything. Still shown
            for the one case that's NOT self-evident: an active grid-edit
            (move/swap) in progress, where the player needs to know what
            their next tap will do. */}
        {gridEditMode && (
          <Pressable onPress={() => setGridEditMode(null)} style={styles.gridEditHint}>
            <Text style={styles.hintActive}>
              {gridEditMode.type === 'move' ? 'Tap an empty tile to move there' : 'Tap a building to swap with'}
              {' · tap here to cancel'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Floating bottom drawer: everything else (next goal, buy/sell
          actions, Production Overview, Current Contract, sell chips,
          Boost) -- peeks a small sliver by default so the grid stays
          mostly visible, drag the handle up to see it all. */}
      <BottomDrawer title="📊 Dashboard" bottomOffset={FLOATING_TAB_BAR_CLEARANCE}>
        <ScrollView contentContainerStyle={styles.drawerScrollContent}>
          <IconStatBar
            stats={[
              { key: 'era', icon: <Text style={styles.iconStatEmoji}>🏛️</Text>, value: `Era ${derived.currentEra.index + 1} · Lv${game.refineryLevel}`, color: colors.ink },
              { key: 'reputation', icon: <Text style={styles.iconStatEmoji}>⭐</Text>, value: `${Math.floor(game.reputation).toLocaleString()}`, color: colors.purple },
              { key: 'feedstock', icon: <Text style={styles.iconStatEmoji}>🧪</Text>, value: `${game.feedstock}/${derived.maxFeedstockStorage}`, color: colors.steelMid },
              { key: 'season', icon: <Text style={styles.iconStatEmoji}>🍂</Text>, value: `${Math.round(derived.seasonalGasolineMultiplier * 100)}%`, color: colors.orange },
              {
                key: 'time',
                icon: <Text style={styles.iconStatEmoji}>{derived.gameClock.isDaytime ? '☀️' : '🌙'}</Text>,
                value: formatGameClockTime(derived.gameClock),
                color: derived.gameClock.isDaytime ? colors.goldDark : colors.blueDark,
              },
            ]}
          />

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

          <CollapsibleCard
            title="📊 Production Overview"
            summary={`${productionRows.length} product${productionRows.length === 1 ? '' : 's'}`}
          >
            <ProductionOverview rows={productionRows} />
          </CollapsibleCard>

          {currentContract &&
            (() => {
              const { have, need, unit } = getContractProgress(currentContract, game)
              return (
                <Pressable style={styles.contractCard} onPress={() => router.push('/game/business')}>
                  <Text style={styles.contractTitle}>📋 Current Contract</Text>
                  <Text style={styles.contractName}>{currentContract.name.en}</Text>
                  <View style={styles.contractProgressRow}>
                    <ProgressBar current={have} target={need} color={colors.blue} />
                    <Text style={styles.contractProgressLabel}>
                      {have.toLocaleString()}/{need.toLocaleString()} {unit}
                    </Text>
                  </View>
                  <Text style={styles.contractReward}>
                    Reward: ${currentContract.currentReward.toLocaleString()} · +{currentContract.currentRpReward} RP
                  </Text>
                </Pressable>
              )
            })()}

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
        </ScrollView>
      </BottomDrawer>

      {/* Automation: Auto-trade + Feedstock Priority, moved out of the
          main scroll (dashboard redesign) so the Refinery tab stays a
          short glance-able view; opened via the ⚙️ header button. */}
      <Sheet visible={automationModalOpen} title="⚙️ Automation" onClose={() => setAutomationModalOpen(false)}>
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

        {(derived.buildingCounts.lubricantPlant > 0 ||
          derived.buildingCounts.jetFuelPlant > 0 ||
          derived.buildingCounts.petrochemicalPlant > 0) && (
          <View style={styles.autoTradeCard}>
            <View style={styles.autoTradeHeader}>
              <Text style={styles.autoTradeTitle}>⚖️ Feedstock Priority</Text>
            </View>
            <Text style={styles.feedstockPriorityHint}>
              0% = off (never produces) · 100% = normal · 200% = highest priority when feedstock is
              short. Only matters when plants are competing for limited feedstock.
            </Text>
            {(
              [
                { buildingKey: 'lubricantPlant', label: 'Lubricants' },
                { buildingKey: 'jetFuelPlant', label: 'Jet Fuel' },
                { buildingKey: 'petrochemicalPlant', label: 'Petrochemicals' },
              ] as const
            ).map(
              ({ buildingKey, label }) =>
                derived.buildingCounts[buildingKey] > 0 && (
                  <View key={buildingKey} style={styles.thresholdRow}>
                    <Text style={styles.thresholdLabel}>{label}</Text>
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => adjustFeedstockPriority(buildingKey, -1)}
                      >
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>
                        {Math.round(game.feedstockPriority[buildingKey] * 100)}%
                      </Text>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => adjustFeedstockPriority(buildingKey, 1)}
                      >
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ),
            )}
          </View>
        )}
      </Sheet>

      {/* Build picker */}
      <Sheet visible={pickerCell !== null} title="Build" onClose={() => setPickerCell(null)}>
        {HIDDEN_EVENTS.filter(
          (e) => e.reward.kind === 'building' && game.hiddenEventStatus[e.key] === 'unlocked',
        ).map((event) => (
          <ListRow
            key={event.key}
            title="??? Mystery Delivery"
            subtitle="Something unusual happened. Tap to find out what."
            badge="???"
            actionLabel="Reveal"
            onPress={() => claimHiddenEvent(event.key)}
          />
        ))}
        {BUILDING_KEYS.map((key) => {
          const b = BUILDINGS[key]
          const unlockLevel = b.unlockLevel ?? 1
          // A claimed Hidden Event 'building' reward grants free/discounted
          // placements that bypass the normal unlock level AND cost -- see
          // placeBuilding in useGameLoop.ts. Shown with a special badge and
          // subtitle while uses remain, taking priority over the normal
          // locked/cost display for this building.
          const hiddenUses = game.hiddenBuildingUsesRemaining[key] ?? 0
          const hasHiddenGrant = hiddenUses > 0
          const locked = !hasHiddenGrant && game.refineryLevel < unlockLevel
          const affordable = hasHiddenGrant || game.money >= b.cost
          return (
            <ListRow
              key={key}
              title={b.name.en}
              subtitle={
                hasHiddenGrant
                  ? `FREE (Hidden Event reward · ${hiddenUses} left)`
                  : locked
                    ? `Requires refinery Lv${unlockLevel}`
                    : `$${b.cost.toLocaleString()}`
              }
              badge={hasHiddenGrant ? '✨' : undefined}
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

      {/* Building info */}
      <Sheet
        visible={infoCell !== null}
        title={infoCell !== null && game.grid[infoCell] ? BUILDINGS[game.grid[infoCell]!].name.en : 'Info'}
        onClose={() => setInfoCell(null)}
      >
        {(() => {
          if (infoCell === null) return null
          const cell = game.grid[infoCell]
          if (!cell) return null
          const level = game.gridLevels[infoCell] ?? 1
          const config = BUILDINGS[cell]
          const effectLines = getBuildingEffectLines(cell, level, game, derived, infoCell)
          const isUpgradeable = UPGRADEABLE.includes(cell)
          const maxed = level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
          const upgradeCost =
            level === 1
              ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
              : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
          const plant = PLANT_PRODUCTION.find((p) => p.buildingKey === cell)
          // polymerPlant isn't in PLANT_PRODUCTION (standalone production
          // block, see useGameLoop.ts) but still has a specialist worker.
          const specialistType = cell === 'polymerPlant' ? 'polymerEngineer' : plant?.specialistWorker
          const specialistName = specialistType
            ? WORKERS.find((w) => w.key === specialistType)?.name.en ?? specialistType
            : null
          // Per-Plant Staff Assignment (design doc Part A): this section
          // is about ONE specific cell (infoCell), not a shared pool.
          // assignedEmployee is whoever's on THIS tile, if anyone;
          // eligibleEmployees is every hired employee of the matching
          // type who ISN'T currently assigned anywhere else (so this list
          // doubles as "available to assign" -- someone already on
          // another plant has to be unassigned there first).
          const assignedEmployee = specialistType ? getEmployeeAssignedToCell(game, infoCell) : null
          const eligibleEmployees = specialistType
            ? game.employees.filter(
                (e) => e.type === specialistType && getCellAssignedToEmployee(game, e.id) === null,
              )
            : []

          return (
            <>
              {isUpgradeable && <Text style={styles.infoLevel}>Level {level}</Text>}
              <Text style={styles.infoDescription}>{config.description.en}</Text>
              {effectLines.map((line, i) => (
                <View key={i}>
                  <View style={styles.infoEffectRow}>
                    <Text style={styles.infoEffectLabel}>{line.label}</Text>
                    <Text style={styles.infoEffectValue}>
                      {line.value}
                      {line.bonus && <Text style={styles.infoEffectBonus}> {line.bonus}</Text>}
                    </Text>
                  </View>
                  {line.warning && <Text style={styles.infoWarning}>⚠️ {line.warning}</Text>}
                </View>
              ))}
              {isUpgradeable && (
                <ListRow
                  title={`Upgrade to Lv${level + 1}`}
                  subtitle={maxed ? 'Max level' : `$${upgradeCost.toLocaleString()}`}
                  actionLabel="Upgrade"
                  disabled={maxed || game.money < upgradeCost}
                  done={maxed}
                  onPress={() => upgradeBuilding(infoCell)}
                />
              )}
              {specialistType && (
                <>
                  <Text style={styles.infoSectionTitle}>
                    {specialistName} assigned to this plant
                  </Text>
                  {assignedEmployee ? (
                    <ListRow
                      title={assignedEmployee.name}
                      subtitle={`Lv${assignedEmployee.level}${assignedEmployee.trait === 'veteran' ? ' · Veteran' : ''}`}
                      badge="ASSIGNED"
                      actionLabel="Unassign"
                      onPress={() => unassignCell(infoCell)}
                    />
                  ) : (
                    <Text style={styles.infoHint}>
                      No one assigned -- pick a {specialistName} below to boost THIS plant's
                      output (not other {config.name.en}s).
                    </Text>
                  )}
                  {!assignedEmployee && eligibleEmployees.length === 0 && (
                    <Text style={styles.infoHint}>
                      Hire a {specialistName} from the Staff tab to assign here, or unassign one
                      from another plant first.
                    </Text>
                  )}
                  {!assignedEmployee &&
                    eligibleEmployees.map((employee) => (
                      <ListRow
                        key={employee.id}
                        title={employee.name}
                        subtitle={`Lv${employee.level}${employee.trait === 'veteran' ? ' · Veteran' : ''}`}
                        actionLabel="Assign"
                        onPress={() => assignEmployeeToCell(employee.id, infoCell)}
                      />
                    ))}
                </>
              )}
              <Text style={styles.infoSectionTitle}>Rearrange</Text>
              <ListRow
                title="Move"
                subtitle={`Relocate to an empty cell · $${GRID_EDIT_BALANCE.moveCost.toLocaleString()} · level & staff travel with it`}
                actionLabel="Move"
                disabled={game.money < GRID_EDIT_BALANCE.moveCost}
                onPress={() => {
                  setGridEditMode({ type: 'move', fromIndex: infoCell })
                  setInfoCell(null)
                }}
              />
              <ListRow
                title="Swap"
                subtitle={`Trade places with another building · $${GRID_EDIT_BALANCE.swapCost.toLocaleString()} · both levels & staff travel`}
                actionLabel="Swap"
                disabled={game.money < GRID_EDIT_BALANCE.swapCost}
                onPress={() => {
                  setGridEditMode({ type: 'swap', fromIndex: infoCell })
                  setInfoCell(null)
                }}
              />
              <ListRow
                title="Demolish"
                subtitle={`Remove this building · +$${Math.round(config.cost * GRID_EDIT_BALANCE.demolishRefundRate).toLocaleString()} refund (level/upgrades not refunded)`}
                actionLabel="Demolish"
                onPress={() => {
                  demolishBuilding(infoCell)
                  setInfoCell(null)
                }}
              />
            </>
          )
        })()}
      </Sheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  nightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A1A33',
    opacity: 0.12,
    zIndex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  gridEditHint: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  infoLevel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  infoDescription: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  infoEffectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.creamBorder,
  },
  infoEffectLabel: {
    color: colors.ink,
    fontSize: 13,
    flex: 1,
    marginRight: spacing.sm,
  },
  infoEffectValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'right',
  },
  infoEffectBonus: {
    color: colors.greenDark,
    fontWeight: '800',
  },
  infoWarning: {
    color: colors.orangeDark,
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  feedstockPriorityHint: {
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  infoSectionTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  infoHint: {
    color: colors.inkMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  drawerScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  iconStatEmoji: {
    fontSize: 13,
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
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  automationButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  automationButtonLabel: {
    fontSize: 16,
  },
  gridWrap: {},
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  hintActive: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.orangeDark,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  productChip: {
    flexBasis: '30%',
    flexGrow: 1,
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
  contractCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: 14,
    padding: spacing.md,
  },
  contractTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  contractName: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  contractProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contractProgressLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '700',
  },
  contractReward: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
    marginTop: spacing.sm,
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
