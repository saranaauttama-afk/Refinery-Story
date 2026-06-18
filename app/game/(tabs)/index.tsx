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
import { Clock3 } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
  const { width } = useWindowDimensions()
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
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  // secondaryOpen: opens the "More Info" bottom sheet with secondary stats
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct = Math.round(derived.seasonalGasolineMultiplier * 100)
  const claimableHiddenEvents = HIDDEN_EVENTS.filter((event) => game.hiddenEventStatus[event.key] === 'unlocked')
  const firstEmptyCellIndex = game.grid.findIndex((cell) => cell === null)
  const timeLabel = `${formatGameClockTime(derived.gameClock)} · Day ${derived.gameClock.dayOfMonth + 1}`

  const secondaryStats = [
    { label: 'Feedstock', value: `${game.feedstock}/${derived.maxFeedstockStorage}` },
    { label: 'ESG', value: `${Math.round(game.esgScore)}` },
    { label: 'Reputation', value: `${Math.floor(game.reputation).toLocaleString()}` },
    { label: 'Season', value: `${seasonLabel.en} · ${seasonPct}%` },
    { label: 'Era', value: derived.currentEra.name.en },
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

  const safeGame = game
  const safeDerived = derived
  const currentContract = derived.activeContracts.find((c) => c.isUnlocked && !c.isCompleted)!

  const isDaytime = derived.gameClock.isDaytime

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* ─── SCENE CONTAINER ─────────────────────────────────────────── */}
      <View style={styles.scene}>

        {/* Night veil over entire scene */}
        {!isDaytime && <View style={styles.nightOverlay} pointerEvents="none" />}

        {/* ── SKY / ATMOSPHERE ──────────────────────────────────────── */}
        <View style={[styles.skyArea, !isDaytime && styles.skyAreaNight]}>
          {/* Atmospheric depth layers */}
          <View style={styles.skyHighlight} />
          <View style={styles.skyHaze} />
          <View style={styles.skyHorizon} />

          {/* HUD: refinery name + level — top left */}
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
              <Text style={styles.lvPillText}>Lv{game.refineryLevel}{canUpgrade ? ' ↑' : ''}</Text>
            </View>
          </AnimatedPressable>

          {/* HUD: time + events — top right */}
          <View style={styles.topRightHud}>
            <View style={styles.timePill}>
              <Clock3
                color={isDaytime ? colors.orangeDark : colors.blueDark}
                size={11}
              />
              <Text style={styles.timePillLabel}>{timeLabel}</Text>
            </View>
            <Pressable
              style={styles.eventsBtn}
              onPress={() => setEventModalOpen(true)}
            >
              <Text style={styles.eventsBtnLabel}>⚙️</Text>
            </Pressable>
          </View>

          {/* Goal panel — floating near sky / yard boundary */}
          {nextGoal && (
            <Pressable style={styles.goalPanel} onPress={() => router.push('/achievements')}>
              <Text style={styles.goalName}>🎯 {nextGoal.name.en}</Text>
              {nextGoal.progress ? (
                <View style={styles.goalProgressRow}>
                  <ProgressBar current={nextGoal.progress.current} target={nextGoal.progress.target} />
                  <Text style={styles.goalProgressNum}>
                    {nextGoal.progress.current.toLocaleString()}/{nextGoal.progress.target.toLocaleString()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.goalReq}>{nextGoal.requirement.en}</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* ── FACTORY YARD ──────────────────────────────────────────── */}
        <View style={styles.yardArea}>
          {/* Decorative road/path strips */}
          <View style={styles.yardRoad} />
          <View style={styles.yardRoad2} />

          {/* Resource HUD strip — floats at top of yard */}
          <View style={styles.resourceHud}>
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
            <Pressable style={styles.moreChip} onPress={() => setSecondaryOpen((v) => !v)}>
              <Text style={styles.moreChipLabel}>···</Text>
            </Pressable>
          </View>

          {/* Grid embedded in the yard */}
          <ScrollView
            style={styles.yardScroll}
            contentContainerStyle={styles.yardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <BuildingGrid
              game={game}
              derived={derived}
              grid={game.grid}
              gridLevels={game.gridLevels}
              containerWidth={width - spacing.md * 2}
              onCellPress={handleCellPress}
              isActive={game.crudeOil > 0}
            />
            {gridEditMode ? (
              <Pressable onPress={() => setGridEditMode(null)}>
                <Text style={styles.hintActive}>
                  {gridEditMode.type === 'move' ? 'Tap empty to move there' : 'Tap a building to swap with'}
                  {' · tap here to cancel'}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Tap empty to build · tap built for info</Text>
            )}
          </ScrollView>

          {/* Buy / Sell — floating above bottom nav */}
          <View style={styles.floatingActions}>
            <AnimatedPressable
              style={[styles.actionBtn, styles.buyBtn]}
              onPress={() => {
                const actualBuy = Math.min(10, Math.floor(game.money / CRUDE_COST), derived.maxCrudeStorage - game.crudeOil)
                if (actualBuy > 0) {
                  spawnFloat(`-$${(actualBuy * CRUDE_COST).toLocaleString()}`, 'expense')
                  haptics.tap()
                }
                buyCrude(10)
              }}
            >
              <Text style={styles.actionBtnLabel}>Buy 10 Crude</Text>
              <Text style={styles.actionBtnSub}>${CRUDE_COST}/unit</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.actionBtn, styles.sellBtn]}
              onPress={() => {
                const actualSell = Math.min(10, game.gasoline)
                if (actualSell > 0) {
                  spawnFloat(`+$${(actualSell * derived.sellPrice).toLocaleString()}`, 'income')
                  haptics.tap()
                }
                sellGasoline(10)
              }}
            >
              <Text style={styles.actionBtnLabel}>Sell 10 Gas</Text>
              <Text style={styles.actionBtnSub}>${derived.sellPrice}/unit</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>

      {/* More Info bottom sheet */}
      <Sheet visible={secondaryOpen} title="More Info" onClose={() => setSecondaryOpen(false)}>
        {secondaryStats.map((stat) => (
          <View key={stat.label} style={styles.infoStatRow}>
            <Text style={styles.infoStatLabel}>{stat.label}</Text>
            <Text style={styles.infoStatValue}>{stat.value}</Text>
          </View>
        ))}
      </Sheet>

      {/* Events sheet */}
      <Sheet visible={eventModalOpen} title="Events" onClose={() => setEventModalOpen(false)}>
        {claimableHiddenEvents.length === 0 ? (
          <Text style={styles.eventEmpty}>No claimable surprises right now. Keep building and checking the clock.</Text>
        ) : (
          claimableHiddenEvents.map((event) => {
            const isBuildingReward = event.reward.kind === 'building'
            const actionLabel =
              event.reward.kind === 'staff' ? 'Open Staff' : event.reward.kind === 'contract' ? 'Open Business' : 'Open Build'
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
                  event.reward.kind === 'staff'
                    ? 'Mystery Applicant'
                    : event.reward.kind === 'contract'
                      ? 'Mystery Contract'
                      : 'Mystery Delivery'
                }
                subtitle={subtitle}
                badge="???"
                actionLabel={actionLabel}
                disabled={isBuildingReward && firstEmptyCellIndex < 0}
                onPress={() => {
                  setEventModalOpen(false)
                  if (event.reward.kind === 'staff') {
                    router.push('/game/staff')
                    return
                  }
                  if (event.reward.kind === 'contract') {
                    router.push('/game/business')
                    return
                  }
                  if (firstEmptyCellIndex >= 0) {
                    setPickerCell(firstEmptyCellIndex)
                  }
                }}
              />
            )
          })
        )}
      </Sheet>

      {/* Automation sheet (hidden pending design) */}
      {false && <Sheet visible={automationModalOpen} title="⚙️ Automation" onClose={() => setAutomationModalOpen(false)}>
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

        {(safeDerived.buildingCounts.lubricantPlant > 0 ||
          safeDerived.buildingCounts.jetFuelPlant > 0 ||
          safeDerived.buildingCounts.petrochemicalPlant > 0) && (
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
                safeDerived.buildingCounts[buildingKey] > 0 && (
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
                        {Math.round(safeGame.feedstockPriority[buildingKey] * 100)}%
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
      </Sheet>}

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
          const specialistType = cell === 'polymerPlant' ? 'polymerEngineer' : plant?.specialistWorker
          const specialistName = specialistType
            ? WORKERS.find((w) => w.key === specialistType)?.name.en ?? specialistType
            : null
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

// ─── Sky palette ─────────────────────────────────────────────────────────────
const SKY_DAY = '#6FA8C8'
const SKY_NIGHT = '#0D1B2E'
const YARD_GROUND = '#B8A882'
const YARD_ROAD_COLOR = 'rgba(100,90,70,0.18)'

const styles = StyleSheet.create({
  // ── Loading ──────────────────────────────────────────────────────────────
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Root ─────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: SKY_NIGHT,
  },

  // ── Scene container ───────────────────────────────────────────────────────
  scene: {
    flex: 1,
  },

  nightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050D1A',
    opacity: 0.22,
    zIndex: 50,
  },

  // ── Sky area (top 1/3) ────────────────────────────────────────────────────
  skyArea: {
    flex: 1,
    backgroundColor: SKY_DAY,
    overflow: 'hidden',
  },
  skyAreaNight: {
    backgroundColor: SKY_NIGHT,
  },
  // Lighter wash near the top of the sky
  skyHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  // Warm industrial haze near the horizon
  skyHaze: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#C8B888',
    opacity: 0.35,
  },
  // Land / treeline silhouette strip
  skyHorizon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: '#6A7A5A',
  },

  // HUD: refinery name — top left
  nameHud: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 10,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lvPill: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lvPillReady: {
    backgroundColor: colors.gold,
  },
  lvPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // HUD: time + events — top right
  topRightHud: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 10,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  timePillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventsBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsBtnLabel: {
    fontSize: 14,
  },

  // Goal panel — floating near sky / yard boundary
  goalPanel: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  goalName: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 12,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  goalProgressNum: {
    fontSize: 10,
    color: colors.inkMuted,
    fontWeight: '700',
  },
  goalReq: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: 2,
  },

  // ── Factory yard (bottom 2/3) ─────────────────────────────────────────────
  yardArea: {
    flex: 2,
    backgroundColor: YARD_GROUND,
    overflow: 'hidden',
  },

  // Decorative path / road strips
  yardRoad: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: YARD_ROAD_COLOR,
    zIndex: 0,
  },
  yardRoad2: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: YARD_ROAD_COLOR,
    zIndex: 0,
  },

  // Resource HUD strip — absolute at top of yard
  resourceHud: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,42,56,0.88)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    zIndex: 10,
    gap: spacing.xs,
  },
  resChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.60)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 3,
  },
  moreChip: {
    marginLeft: 'auto' as any,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  moreChipLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    lineHeight: 14,
  },

  // Grid scroll area inside yard
  yardScroll: {
    flex: 1,
  },
  yardScrollContent: {
    paddingTop: 44,
    paddingHorizontal: spacing.md,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 64,
    alignItems: 'center',
  },

  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(43,58,74,0.45)',
    marginTop: spacing.xs,
  },
  hintActive: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.orangeDark,
    marginTop: spacing.xs,
  },

  // Buy / Sell floating above tab bar
  floatingActions: {
    position: 'absolute',
    bottom: FLOATING_TAB_BAR_CLEARANCE,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    zIndex: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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
  actionBtnLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  actionBtnSub: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 2,
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
