import { useState } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Bell, Clock3 } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import BuildingGrid from '../../../src/components/BuildingGrid'
import CollapsibleCard from '../../../src/components/CollapsibleCard'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import ProductionOverview, { type ProductionOverviewRow } from '../../../src/components/ProductionOverview'
import ProgressBar from '../../../src/components/ProgressBar'
import Sheet from '../../../src/components/Sheet'
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
import FactoryDiamondGroundView from '../../../src/components/FactoryDiamondGroundView'
import FactoryMapView from '../../../src/components/FactoryMapView'
import FactoryIsometricView from '../../../src/components/FactoryIsometricView'

type FactoryViewMode = 'grid' | 'diamond_ground' | 'map2_5d' | 'isometric'

// The cleaned diamond-ground renderer is now the live review surface for
// Factory on this branch. The original grid and the other experimental
// renderers still remain available in code for fallback and comparison,
// but this review pass uses diamond ground as the default experience.
const DEFAULT_FACTORY_VIEW_MODE: FactoryViewMode = 'diamond_ground'
const FACTORY_VIEW_MODE: FactoryViewMode = DEFAULT_FACTORY_VIEW_MODE

const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingType[]
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
    case 'lubricants':      return derived.maxLubricantsStorage
    case 'jetFuel':         return derived.maxJetFuelStorage
    case 'petrochemicals':  return derived.maxPetrochemicalsStorage
    case 'recycledMaterial':return derived.maxRecycledMaterialStorage
    case 'plasticPellets':  return derived.maxPlasticPelletsStorage
  }
}

// ── Scene geometry constants ──────────────────────────────────────────────────
// Sky is atmosphere only — 12 % keeps it visible without eating play space.
// Horizon strip is a thin separator.  Goal is a compact 28 px chip.
const SKY_RATIO    = 0.12
const HORIZON_H    = 14   // px — thin treeline separator
const RESOURCE_H   = 38   // px — resource HUD strip height (unchanged)
const GOAL_H       = 28   // px — compact goal chip height

export default function RefineryScreen() {
  const router = useRouter()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const {
    game, loaded, derived,
    buyCrude, sellGasoline, sellProduct,
    placeBuilding, demolishBuilding, moveBuilding, swapBuildings,
    claimHiddenEvent, upgradeBuilding, upgradeRefinery,
    autoTrade, updateAutoTrade, activateBoost,
    adjustFeedstockPriority, assignEmployeeToCell, unassignCell,
  } = useGame()

  // All hooks before any early returns
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [infoCell,   setInfoCell]   = useState<number | null>(null)
  const [gridEditMode, setGridEditMode] = useState<{ type: 'move' | 'swap'; fromIndex: number } | null>(null)
  // Drives the unified Trade panel's expand/collapse (Buy/Sell + Auto-
  // trade combined into one floating panel above the tab bar -- replaces
  // the old separate "Automation" sheet, which was dead code ({false &&
  // ...}) on this branch, and the old always-expanded Buy/Sell button
  // pair). Starts collapsed.
  const [tradePanelOpen, setTradePanelOpen] = useState(false)
  const toggleTradePanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setTradePanelOpen((v) => !v)
  }

  // updateAutoTrade does a shallow merge ({ ...current, ...partial }), so
  // passing a fresh productSellThresholds object would WIPE OUT every
  // other product's customized threshold, not just set this one -- this
  // helper merges into the existing per-product map first.
  const adjustProductSellThreshold = (
    key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
    delta: number,
  ) => {
    const current = autoTrade.productSellThresholds[key] ?? 80
    const next = Math.min(100, Math.max(0, current + delta))
    updateAutoTrade({ productSellThresholds: { ...autoTrade.productSellThresholds, [key]: next } })
  }
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  // ── Scene geometry (computed once per render) ─────────────────────────────
  // The SafeAreaView with edges={['top']} adds paddingTop = insets.top, so
  // the scene View fills exactly (screenHeight - insets.top).
  const sceneHeight = height - insets.top
  const skyH        = Math.round(sceneHeight * SKY_RATIO)
  // Where the yard background starts (absolute y within scene)
  const yardTop     = skyH + HORIZON_H
  // Resource strip straddles the sky / yard boundary
  const resourceTop = yardTop - Math.floor(RESOURCE_H / 2)
  // Goal panel sits just below the resource strip, inside the yard
  const goalTop     = resourceTop + RESOURCE_H + 8
  // Grid scroll content needs enough top padding to clear both overlays
  const gridPaddingTop = goalTop - yardTop + GOAL_H + 12

  // ── Derived game values ───────────────────────────────────────────────────
  const seasonLabel        = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct          = Math.round(derived.seasonalGasolineMultiplier * 100)
  const claimableHiddenEvents = HIDDEN_EVENTS.filter((e) => game.hiddenEventStatus[e.key] === 'unlocked')
  const firstEmptyCellIndex   = game.grid.findIndex((cell) => cell === null)
  const timeLabel          = `${formatGameClockTime(derived.gameClock)} · Day ${derived.gameClock.dayOfMonth + 1}`
  const isDaytime          = derived.gameClock.isDaytime
  const usesDiamondGroundLive = FACTORY_VIEW_MODE === 'diamond_ground'

  const secondaryStats = [
    { label: 'Feedstock',   value: `${game.feedstock}/${derived.maxFeedstockStorage}` },
    { label: 'ESG',         value: `${Math.round(game.esgScore)}` },
    { label: 'Reputation',  value: `${Math.floor(game.reputation).toLocaleString()}` },
    { label: 'Season',      value: `${seasonLabel.en} · ${seasonPct}%` },
    { label: 'Era',         value: derived.currentEra.name.en },
  ]

  const handleCellPress = (index: number) => {
    if (gridEditMode) {
      if (gridEditMode.type === 'move') moveBuilding(gridEditMode.fromIndex, index)
      else                               swapBuildings(gridEditMode.fromIndex, index)
      setGridEditMode(null)
      return
    }
    if (game.grid[index] === null) setPickerCell(index)
    else                           setInfoCell(index)
  }

  const upgradeCost                = getUpgradeCost(game.refineryLevel)
  const upgradeProductionRequired  = getUpgradeProductionRequirement(game.refineryLevel)
  const hasEnoughMoney             = game.money >= upgradeCost
  const hasEnoughProduction        = game.totalGasolineProduced >= upgradeProductionRequired
  const canUpgrade                 = hasEnoughMoney && hasEnoughProduction
  const nextGoal                   = derived.activeMilestones.find((m) => !m.isCompleted)

  const boostActive            = isBoostActive(game)
  const boostOnCooldown        = isBoostOnCooldown(game)
  const boostReady             = canActivateBoost(game)
  const boostActiveSecondsLeft = Math.max(0, Math.ceil(((game.boostActiveUntilTick - game.tickCount) * TICK_MS) / 1000))
  const boostCooldownSecondsLeft = Math.max(0, Math.ceil(((game.boostAvailableAtTick - game.tickCount) * TICK_MS) / 1000))
  const boostElapsed = boostActive
    ? BOOST_BALANCE.durationTicks - (game.boostActiveUntilTick - game.tickCount)
    : BOOST_BALANCE.cooldownTicks - (game.boostAvailableAtTick - game.tickCount)

  const products: {
    key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'
    label: string; color: string
  }[] = [
    { key: 'lubricants',       label: 'Lubricants',  color: colors.goldDark },
    { key: 'jetFuel',          label: 'Jet Fuel',    color: colors.blue },
    { key: 'petrochemicals',   label: 'Petrochem',   color: colors.purple },
    { key: 'recycledMaterial', label: 'Recycled',    color: colors.greenDark },
    { key: 'plasticPellets',   label: 'Pellets',     color: colors.teal },
  ]

  const productionRows: ProductionOverviewRow[] = [
    { key: 'gasoline', label: 'Gasoline', current: game.gasoline, max: derived.maxGasolineStorage, color: colors.green },
    ...products
      .filter((p) => game.productInventory[p.key] > 0 || derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
      .map((p) => ({
        key: p.key, label: p.label,
        current: game.productInventory[p.key],
        max: PRODUCT_MAX_STORAGE(derived, p.key),
        color: p.color,
      })),
  ]

  const safeGame    = game
  const safeDerived = derived
  const currentContract = derived.activeContracts.find((c) => c.isUnlocked && !c.isCompleted)!

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Layered scene composition
  //
  // Layer 0 (z:0)  — Background: absoluteFill, sky + yard split, pointerEvents none
  // Layer 1 (z:10) — Grid: absolute, top=yardTop, ScrollView inside
  // Layer 2 (z:20) — HUD: name/level top-left; time/events top-right
  // Layer 3 (z:20) — Resource strip + goal panel, straddle sky/yard boundary
  // Layer 4 (z:20) — Buy/Sell floating above bottom nav
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      <View style={styles.scene}>

        {/* ── Layer 0: Background (absoluteFill, no pointer events) ─────── */}
        <View style={[StyleSheet.absoluteFill, styles.sceneBg]} pointerEvents="none">
          {/* Sky */}
          <View style={[styles.bgSky, { height: skyH }, !isDaytime && styles.bgSkyNight]}>
            <View style={styles.bgSkySheen} />
            <View style={styles.bgSeaBand} />
            <View style={styles.bgSkyHaze} />
          </View>
          {/* Treeline / horizon strip */}
          <View style={[styles.bgHorizon, { height: HORIZON_H }]} />
          {/* Yard / factory ground */}
          <View style={styles.bgYard}>
            <View style={styles.bgDockEdge} />
            {!usesDiamondGroundLive ? (
              <>
                <View style={styles.bgYardZoneStorage} />
                <View style={styles.bgYardZoneProcess} />
                <View style={styles.bgYardZoneLogistics} />
                <View style={styles.bgYardRoad} />
                <View style={styles.bgYardRoad2} />
                <View style={styles.bgYardRoad3} />
                <View style={styles.bgPipeRun} />
                <View style={styles.bgPipeBranch} />
                <View style={styles.bgLoadingStrip} />
                <View style={styles.bgTankCluster}>
                  <View style={styles.bgTankLarge} />
                  <View style={styles.bgTankMedium} />
                  <View style={styles.bgTankSmall} />
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Night veil */}
        {!isDaytime && (
          <View style={[StyleSheet.absoluteFill, styles.nightOverlay]} pointerEvents="none" />
        )}

        {/* ── Layer 1: Grid (absolute, starts at yardTop) ───────────────── */}
        <View style={[styles.gridLayer, { top: yardTop }]}>
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={[styles.gridScrollContent, { paddingTop: gridPaddingTop }]}
            showsVerticalScrollIndicator={false}
          >
            {FACTORY_VIEW_MODE === 'diamond_ground' ? (
              <FactoryDiamondGroundView
                game={game}
                derived={derived}
                grid={game.grid}
                gridLevels={game.gridLevels}
                containerWidth={width - spacing.md * 2}
                displayGridSize={11}
                onCellPress={handleCellPress}
                isActive={game.crudeOil > 0}
              />
            ) : FACTORY_VIEW_MODE === 'map2_5d' ? (
              <FactoryMapView
                game={game}
                derived={derived}
                grid={game.grid}
                gridLevels={game.gridLevels}
                containerWidth={width - spacing.md * 2}
                onCellPress={handleCellPress}
                isActive={game.crudeOil > 0}
              />
            ) : FACTORY_VIEW_MODE === 'isometric' ? (
              <FactoryIsometricView
                game={game}
                derived={derived}
                grid={game.grid}
                gridLevels={game.gridLevels}
                containerWidth={width}
                onCellPress={handleCellPress}
                isActive={game.crudeOil > 0}
              />
            ) : (
              <BuildingGrid
                game={game}
                derived={derived}
                grid={game.grid}
                gridLevels={game.gridLevels}
                containerWidth={width - spacing.md * 2}
                onCellPress={handleCellPress}
                isActive={game.crudeOil > 0}
              />
            )}
            {gridEditMode ? (
              <Pressable onPress={() => setGridEditMode(null)}>
                <Text style={styles.hintActive}>
                  {gridEditMode.type === 'move'
                    ? 'Tap empty tile to move there'
                    : 'Tap a building to swap with'}
                  {' · tap here to cancel'}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Tap empty to build · tap built for info</Text>
            )}
          </ScrollView>
        </View>

        {/* ── Layer 2: HUD ──────────────────────────────────────────────── */}

        {/* Name + level — top left */}
        <AnimatedPressable
          style={styles.nameHud}
          onPress={() => {
            if (canUpgrade) {
              spawnFloat(`-$${upgradeCost.toLocaleString()}`, 'expense')
              haptics.confirm()
            }
            upgradeRefinery()
          }}
        >
          <Text style={styles.nameText}>{game.refineryName}</Text>
          <View style={[styles.lvPill, canUpgrade && styles.lvPillReady]}>
            <Text style={styles.lvText}>Lv{game.refineryLevel}{canUpgrade ? ' ↑' : ''}</Text>
          </View>
        </AnimatedPressable>

        {/* Time + events — top right */}
        <View style={styles.topRightHud}>
          <View style={styles.timePill}>
            <Clock3
              size={11}
              color={isDaytime ? colors.orangeDark : colors.blueDark}
            />
            <Text style={styles.timePillText}>{timeLabel}</Text>
          </View>
          <Pressable style={styles.eventsBtn} onPress={() => setEventModalOpen(true)}>
            <Bell size={13} color={colors.white} />
            <Text style={styles.eventsBtnLabel}>Events</Text>
            {claimableHiddenEvents.length > 0 && (
              <View style={styles.eventsBadge}>
                <Text style={styles.eventsBadgeLabel}>{claimableHiddenEvents.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Layer 3: Resource strip + goal ────────────────────────────── */}

        {/* Resource strip — straddles sky / yard boundary */}
        <View style={[styles.resourceStrip, { top: resourceTop }]}>
          <View style={styles.resStats}>
            <View style={styles.resChip}>
              <Text style={styles.resLabel}>$</Text>
              <Text style={styles.resVal}>{Math.floor(game.money).toLocaleString()}</Text>
            </View>
            <View style={styles.resSep} />
            <View style={styles.resChip}>
              <Text style={styles.resLabel}>Crude</Text>
              <Text style={[styles.resVal, game.crudeOil === 0 && styles.resValWarn]}>
                {game.crudeOil}/{derived.maxCrudeStorage}
              </Text>
            </View>
            <View style={styles.resSep} />
            <View style={styles.resChip}>
              <Text style={styles.resLabel}>Gas</Text>
              <Text style={[styles.resVal, styles.resValGas]}>
                {game.gasoline}/{derived.maxGasolineStorage}
              </Text>
            </View>
          </View>
          <Pressable style={styles.moreChip} onPress={() => setSecondaryOpen((v) => !v)}>
            <Text style={styles.moreChipLabel}>···</Text>
          </Pressable>
        </View>

        {/* Goal chip — compact single line, floats just below resource strip */}
        {nextGoal && (
          <Pressable
            style={[styles.goalChip, { top: goalTop }]}
            onPress={() => router.push('/achievements')}
          >
            <Text style={styles.goalChipIcon}>🎯</Text>
            <Text style={styles.goalChipName} numberOfLines={1}>{nextGoal.name.en}</Text>
            {nextGoal.progress ? (
              <>
                <View style={styles.goalChipTrack}>
                  <View style={[styles.goalChipFill, {
                    width: Math.min(56, Math.round(
                      nextGoal.progress.current / nextGoal.progress.target * 56
                    )),
                  }]} />
                </View>
                <Text style={styles.goalChipNum}>
                  {nextGoal.progress.current.toLocaleString()}/{nextGoal.progress.target.toLocaleString()}
                </Text>
              </>
            ) : (
              <Text style={styles.goalChipReq} numberOfLines={1}>{nextGoal.requirement.en}</Text>
            )}
          </Pressable>
        )}

        {/* ── Layer 4: Unified Trade panel (Buy/Sell + Auto-trade) ──────────
            Replaces the old always-full-size Buy/Sell button pair. Per
            feedback: those buttons are only really needed in the first
            few minutes before Auto-trade gets turned on, after which
            they're just large dead space sitting above the tab bar. Now
            collapses to a small pill (shows the Auto-trade on/off status
            even collapsed, so that's still glanceable) and expands
            upward into the full panel -- smaller Buy/Sell buttons plus
            the Auto-trade toggle/thresholds in the same place, instead
            of a separate Automation sheet.

            The expanded panel renders inside a Modal (not just another
            absolutely-positioned View) -- per feedback that expanding it
            covered up other floating buttons/menus behind it. React
            Navigation's tab bar (and possibly other screen-level
            absolutely-positioned HUD) doesn't reliably respect zIndex
            against a plain View, a known cross-platform RN/React
            Navigation quirk; Modal always renders in its own top-level
            layer above the navigator, which is why Sheet.tsx already
            uses one for the build/info sheets. Made transparent with no
            backdrop dimming (unlike Sheet's full-screen takeover) and
            its content positioned to visually sit right above the pill,
            so it still reads as "this panel belongs to that pill" rather
            than a disconnected modal. */}
        <View style={styles.tradePanelWrap} pointerEvents="box-none">
          <Pressable style={styles.tradePill} onPress={toggleTradePanel}>
            <Text style={styles.tradePillIcon}>{autoTrade.enabled ? '🔄' : '💱'}</Text>
            <Text style={styles.tradePillLabel}>
              {autoTrade.enabled ? 'Auto: ON' : 'Trade'}
            </Text>
            <Text style={styles.tradePillChevron}>{tradePanelOpen ? '▾' : '▴'}</Text>
          </Pressable>
        </View>

        <Modal visible={tradePanelOpen} transparent animationType="fade" onRequestClose={toggleTradePanel}>
          <Pressable style={styles.tradeModalBackdrop} onPress={toggleTradePanel}>
            <View style={styles.tradeModalAnchor}>
              <Pressable style={styles.tradePanel} onPress={(e) => e.stopPropagation()}>
                <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tradeActionsRow}>
                <AnimatedPressable
                  style={[styles.tradeActionBtn, styles.buyBtn]}
                  onPress={() => {
                    const actualBuy = Math.min(
                      10,
                      Math.floor(game.money / CRUDE_COST),
                      derived.maxCrudeStorage - game.crudeOil,
                    )
                    if (actualBuy > 0) {
                      spawnFloat(`-$${(actualBuy * CRUDE_COST).toLocaleString()}`, 'expense')
                      haptics.tap()
                    }
                    buyCrude(10)
                  }}
                >
                  <Text style={styles.tradeActionLabel}>Buy 10 Crude</Text>
                  <Text style={styles.tradeActionSub}>${CRUDE_COST}/unit</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[styles.tradeActionBtn, styles.sellBtn]}
                  onPress={() => {
                    const actualSell = Math.min(10, game.gasoline)
                    if (actualSell > 0) {
                      spawnFloat(`+$${(actualSell * derived.sellPrice).toLocaleString()}`, 'income')
                      haptics.tap()
                    }
                    sellGasoline(10)
                  }}
                >
                  <Text style={styles.tradeActionLabel}>Sell 10 Gas</Text>
                  <Text style={styles.tradeActionSub}>${derived.sellPrice}/unit</Text>
                </AnimatedPressable>
              </View>

              <View style={styles.tradeDivider} />

              <View style={styles.autoTradeHeaderRow}>
                <Text style={styles.autoTradeRowTitle}>🔄 Auto-trade</Text>
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
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}>
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{autoTrade.buyThreshold}%</Text>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.min(100, autoTrade.buyThreshold + 5) })}>
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.thresholdRow}>
                    <Text style={styles.thresholdLabel}>Sell gasoline above {autoTrade.sellThreshold}%</Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}>
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{autoTrade.sellThreshold}%</Text>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}>
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* One row per secondary product the player has a plant
                      for -- e.g. building a Lubricant Plant adds a
                      "Sell lubricants above X%" row here, so Auto-trade
                      covers it without a separate manual sell-chip tap
                      every few minutes. Hidden entirely for products with
                      no plant built yet (nothing to gate a threshold on). */}
                  {products
                    .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
                    .map((p) => {
                      const threshold = autoTrade.productSellThresholds[p.key] ?? 80
                      return (
                        <View key={p.key} style={styles.thresholdRow}>
                          <Text style={styles.thresholdLabel}>
                            Sell {p.label.toLowerCase()} above {threshold}%
                          </Text>
                          <View style={styles.stepper}>
                            <Pressable style={styles.stepperButton} onPress={() => adjustProductSellThreshold(p.key, -5)}>
                              <Text style={styles.stepperLabel}>−</Text>
                            </Pressable>
                            <Text style={styles.stepperValue}>{threshold}%</Text>
                            <Pressable style={styles.stepperButton} onPress={() => adjustProductSellThreshold(p.key, 5)}>
                              <Text style={styles.stepperLabel}>+</Text>
                            </Pressable>
                          </View>
                        </View>
                      )
                    })}
                </>
              )}
                </ScrollView>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

      </View>{/* end scene */}

      {/* ── More Info sheet ──────────────────────────────────────────────── */}
      <Sheet visible={secondaryOpen} title="More Info" onClose={() => setSecondaryOpen(false)}>
        {secondaryStats.map((stat) => (
          <View key={stat.label} style={styles.infoStatRow}>
            <Text style={styles.infoStatLabel}>{stat.label}</Text>
            <Text style={styles.infoStatValue}>{stat.value}</Text>
          </View>
        ))}
      </Sheet>

      {/* ── Events sheet ─────────────────────────────────────────────────── */}
      <Sheet visible={eventModalOpen} title="Events" onClose={() => setEventModalOpen(false)}>
        {claimableHiddenEvents.length === 0 ? (
          <Text style={styles.eventEmpty}>
            No claimable surprises right now. Keep building and checking the clock.
          </Text>
        ) : (
          claimableHiddenEvents.map((event) => {
            const isBuildingReward = event.reward.kind === 'building'
            const actionLabel =
              event.reward.kind === 'staff'    ? 'Open Staff'     :
              event.reward.kind === 'contract' ? 'Open Business'  : 'Open Build'
            const subtitle =
              event.reward.kind === 'staff'
                ? 'Claimable staff event. Opens the Staff tab.'
                : event.reward.kind === 'contract'
                  ? 'Claimable contract event. Opens the Business tab.'
                  : firstEmptyCellIndex >= 0
                    ? 'Claimable building event. Opens Build on the first empty tile.'
                    : 'Needs an empty tile before the build reward can be claimed.'
            return (
              <ListRow
                key={event.key}
                title={
                  event.reward.kind === 'staff'    ? 'Mystery Applicant' :
                  event.reward.kind === 'contract' ? 'Mystery Contract'  : 'Mystery Delivery'
                }
                subtitle={subtitle}
                badge="???"
                actionLabel={actionLabel}
                disabled={isBuildingReward && firstEmptyCellIndex < 0}
                onPress={() => {
                  setEventModalOpen(false)
                  if (event.reward.kind === 'staff')    { router.push('/game/staff');    return }
                  if (event.reward.kind === 'contract') { router.push('/game/business'); return }
                  if (firstEmptyCellIndex >= 0)         setPickerCell(firstEmptyCellIndex)
                }}
              />
            )
          })
        )}
      </Sheet>

      {/* The old "Automation" sheet (Auto-trade toggle/thresholds +
          Feedstock Priority) lived here as dead code ({false && ...} --
          never rendered). Auto-trade now lives in the unified Trade
          panel above (Layer 4); Feedstock Priority already has a home in
          the Production tab (app/game/(tabs)/production.tsx), so nothing
          was lost by removing this duplicate. */}

      {/* ── Build picker ─────────────────────────────────────────────────── */}
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
          const unlockLevel  = b.unlockLevel ?? 1
          const hiddenUses   = game.hiddenBuildingUsesRemaining[key] ?? 0
          const hasHiddenGrant = hiddenUses > 0
          const locked       = !hasHiddenGrant && game.refineryLevel < unlockLevel
          const affordable   = hasHiddenGrant || game.money >= b.cost
          return (
            <ListRow
              key={key}
              title={b.name.en}
              subtitle={
                hasHiddenGrant
                  ? `FREE (Hidden Event reward · ${hiddenUses} left)`
                  : locked ? `Requires refinery Lv${unlockLevel}` : `$${b.cost.toLocaleString()}`
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

      {/* ── Building info ─────────────────────────────────────────────────── */}
      <Sheet
        visible={infoCell !== null}
        title={infoCell !== null && game.grid[infoCell] ? BUILDINGS[game.grid[infoCell]!].name.en : 'Info'}
        onClose={() => setInfoCell(null)}
      >
        {(() => {
          if (infoCell === null) return null
          const cell = game.grid[infoCell]
          if (!cell) return null
          const level      = game.gridLevels[infoCell] ?? 1
          const config     = BUILDINGS[cell]
          const effectLines = getBuildingEffectLines(cell, level, game, derived, infoCell)
          const isUpgradeable = UPGRADEABLE.includes(cell)
          const maxed      = level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
          const upgradeCost =
            level === 1 ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
                        : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
          const plant          = PLANT_PRODUCTION.find((p) => p.buildingKey === cell)
          const specialistType = cell === 'polymerPlant' ? 'polymerEngineer' : plant?.specialistWorker
          const specialistName = specialistType
            ? WORKERS.find((w) => w.key === specialistType)?.name.en ?? specialistType : null
          const assignedEmployee  = specialistType ? getEmployeeAssignedToCell(game, infoCell) : null
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
                  <Text style={styles.infoSectionTitle}>{specialistName} assigned to this plant</Text>
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
                      No one assigned — pick a {specialistName} below to boost THIS plant's output.
                    </Text>
                  )}
                  {!assignedEmployee && eligibleEmployees.length === 0 && (
                    <Text style={styles.infoHint}>
                      Hire a {specialistName} from the Staff tab to assign here, or unassign one from another plant first.
                    </Text>
                  )}
                  {!assignedEmployee && eligibleEmployees.map((employee) => (
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
                onPress={() => { setGridEditMode({ type: 'move', fromIndex: infoCell }); setInfoCell(null) }}
              />
              <ListRow
                title="Swap"
                subtitle={`Trade places with another building · $${GRID_EDIT_BALANCE.swapCost.toLocaleString()} · both levels & staff travel`}
                actionLabel="Swap"
                disabled={game.money < GRID_EDIT_BALANCE.swapCost}
                onPress={() => { setGridEditMode({ type: 'swap', fromIndex: infoCell }); setInfoCell(null) }}
              />
              <ListRow
                title="Demolish"
                subtitle={`Remove this building · +$${Math.round(config.cost * GRID_EDIT_BALANCE.demolishRefundRate).toLocaleString()} refund`}
                actionLabel="Demolish"
                onPress={() => { demolishBuilding(infoCell); setInfoCell(null) }}
              />
            </>
          )
        })()}
      </Sheet>
    </SafeAreaView>
  )
}

// ── Palette ───────────────────────────────────────────────────────────────────
const SKY_DAY      = '#6FA8C8'
const SKY_NIGHT    = '#0D1B2E'
const HORIZON_COL  = '#6A7A5A'
const YARD_GROUND  = '#B8A882'
const ROAD_COLOR   = 'rgba(100,88,68,0.18)'

const styles = StyleSheet.create({
  // ── Root ─────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: SKY_NIGHT, // fallback visible during load
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scene (single flex container, all children are absolutely positioned) ─
  scene: {
    flex: 1,
  },

  // Night veil (absoluteFill, applied conditionally)
  nightOverlay: {
    backgroundColor: '#050D1A',
    opacity: 0.22,
    zIndex: 5,
  },

  // ── Layer 0: Background ───────────────────────────────────────────────────
  sceneBg: {
    zIndex: 0,
  },
  // Sky — height set dynamically from skyH
  bgSky: {
    backgroundColor: SKY_DAY,
  },
  bgSkyNight: {
    backgroundColor: SKY_NIGHT,
  },
  // Subtle highlight wash in the upper sky
  bgSkySheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: '#FFFFFF',
    opacity: 0.07,
  },
  bgSeaBand: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(87,129,154,0.78)',
  },
  // Warm industrial haze near the horizon (proportionally smaller with shorter sky)
  bgSkyHaze: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 10,
    backgroundColor: '#C4B888',
    opacity: 0.40,
  },
  // Treeline / horizon strip — height set dynamically
  bgHorizon: {
    backgroundColor: HORIZON_COL,
  },
  // Yard / factory ground — takes remaining flex space
  bgYard: {
    flex: 1,
    backgroundColor: YARD_GROUND,
  },
  bgDockEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#7A868E',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(207,189,151,0.92)',
  },
  bgYardZoneStorage: {
    position: 'absolute',
    top: 30,
    left: 12,
    width: '35%',
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(224,214,191,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(112,95,71,0.14)',
  },
  bgYardZoneProcess: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: '42%',
    height: 108,
    borderRadius: 28,
    backgroundColor: 'rgba(156,138,104,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(94,79,58,0.14)',
  },
  bgYardZoneLogistics: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    left: '18%',
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(135,118,88,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96,82,60,0.16)',
  },
  // Decorative road/path strips inside yard
  bgYardRoad: {
    position: 'absolute',
    top: 54, left: 0, right: 0,
    height: 8,
    backgroundColor: ROAD_COLOR,
  },
  bgYardRoad2: {
    position: 'absolute',
    top: 82, left: 0, right: 0,
    height: 4,
    backgroundColor: ROAD_COLOR,
  },
  bgYardRoad3: {
    position: 'absolute',
    bottom: 118,
    left: 18,
    right: 18,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(96,84,64,0.16)',
  },
  bgPipeRun: {
    position: 'absolute',
    top: 110,
    left: '32%',
    width: 6,
    height: 138,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(96,110,118,0.34)',
  },
  bgPipeBranch: {
    position: 'absolute',
    top: 142,
    left: '32%',
    right: '20%',
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(96,110,118,0.26)',
  },
  bgLoadingStrip: {
    position: 'absolute',
    right: 28,
    bottom: 128,
    width: '28%',
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(118,104,82,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(96,84,64,0.18)',
  },
  bgTankCluster: {
    position: 'absolute',
    top: 44,
    left: 24,
    width: 104,
    height: 72,
  },
  bgTankLarge: {
    position: 'absolute',
    left: 0,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(232,224,205,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(126,108,80,0.18)',
  },
  bgTankMedium: {
    position: 'absolute',
    left: 28,
    top: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(232,224,205,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(126,108,80,0.16)',
  },
  bgTankSmall: {
    position: 'absolute',
    left: 56,
    bottom: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(232,224,205,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(126,108,80,0.15)',
  },

  // ── Layer 1: Grid ─────────────────────────────────────────────────────────
  // top is set dynamically (= yardTop)
  gridLayer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    zIndex: 10,
  },
  gridScroll: {
    flex: 1,
  },
  // paddingTop injected inline (= gridPaddingTop)
  gridScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 72,
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(43,58,74,0.50)',
    marginTop: spacing.xs,
  },
  hintActive: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.orangeDark,
    marginTop: spacing.xs,
  },

  // ── Layer 2: HUD ──────────────────────────────────────────────────────────
  nameHud: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 20,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lvPill: {
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lvPillReady: {
    backgroundColor: colors.gold,
  },
  lvText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  topRightHud: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 20,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventsBtn: {
    minWidth: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.40)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  eventsBtnLabel: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
  eventsBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: radii.pill,
    paddingHorizontal: 4,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsBadgeLabel: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Layer 3: Resource strip + goal ────────────────────────────────────────
  // top is set dynamically (= resourceTop)
  resourceStrip: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: RESOURCE_H,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(28,38,52,0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    zIndex: 20,
    // subtle lift shadow
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  resStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.58)',
    fontWeight: '700',
  },
  resVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resValWarn: {
    color: colors.orange,
  },
  resValGas: {
    color: '#9EE09E',
  },
  resSep: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: 3,
  },
  moreChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  moreChipLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 14,
  },

  // Goal chip — compact single-line pill, top set dynamically (= goalTop)
  goalChip: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: GOAL_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: radii.pill,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  goalChipIcon: {
    fontSize: 12,
  },
  goalChipName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  goalChipTrack: {
    width: 56,
    height: 4,
    backgroundColor: colors.creamBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalChipFill: {
    height: 4,
    backgroundColor: colors.goldDark,
    borderRadius: 2,
  },
  goalChipNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkMuted,
    minWidth: 36,
    textAlign: 'right',
  },
  goalChipReq: {
    fontSize: 10,
    color: colors.inkMuted,
    flex: 1,
    textAlign: 'right',
  },

  // ── Layer 4: Floating action buttons ──────────────────────────────────────
  // ── Unified Trade panel (Buy/Sell + Auto-trade, collapsible) ───────────
  tradePanelWrap: {
    position: 'absolute',
    bottom: FLOATING_TAB_BAR_CLEARANCE,
    right: spacing.md,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  tradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tradePillIcon: {
    fontSize: 14,
  },
  tradePillLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },
  tradePillChevron: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  // Backdrop fills the Modal -- transparent (not dimmed like Sheet's
  // full-screen takeover, since this is meant to feel like a small
  // popover attached to the pill, not a separate screen) but still
  // tappable to dismiss, same as tapping outside any other popover.
  tradeModalBackdrop: {
    flex: 1,
  },
  // Positions the panel to visually sit right above where the pill is
  // on the real screen underneath the modal (same right/bottom offsets
  // as tradePanelWrap) -- the Modal itself doesn't know about the pill's
  // position, so this duplicates the offset rather than trying to share
  // it, which is simpler than measuring the pill's actual layout.
  tradeModalAnchor: {
    position: 'absolute',
    right: spacing.md,
    bottom: FLOATING_TAB_BAR_CLEARANCE + 56,
  },
  tradePanel: {
    width: 260,
    maxHeight: 420,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tradeActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tradeActionBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  buyBtn: {
    backgroundColor: colors.steelLight,
    borderWidth: 2,
    borderColor: colors.steelDark,
  },
  sellBtn: {
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.greenDark,
  },
  tradeActionLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },
  tradeActionSub: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tradeDivider: {
    height: 1,
    backgroundColor: colors.creamBorder,
    marginVertical: spacing.sm,
  },
  autoTradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoTradeRowTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },

  // ── More Info sheet rows ──────────────────────────────────────────────────
  infoStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  infoStatLabel: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  infoStatValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Events sheet ─────────────────────────────────────────────────────────
  eventEmpty: {
    color: colors.inkMuted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // ── Building info sheet ───────────────────────────────────────────────────
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

  // ── Automation sheet (kept for future use) ────────────────────────────────
  feedstockPriorityHint: {
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: spacing.sm,
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
