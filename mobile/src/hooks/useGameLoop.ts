import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AwardRecord,
  BuildingType,
  ChoiceEvent,
  Contract,
  EraConfig,
  GameState,
  PerkConfig,
  RecruitmentCandidate,
  ResearchItem,
  StandingOrderKey,
  WorkerConfig,
  WorkerType,
} from '../game/types'
import {
  applyChoiceEventOption,
  applyMilestones,
  applyRandomEvent,
  applyShipmentArrivals,
  applyStaffXp,
  applyWinGoal,
  calculateDerivedStats,
  closeBusinessYear,
  CRUDE_COST,
  TICK_MS,
  RANDOM_EVENT_INTERVAL_TICKS,
  CHOICE_EVENT_FALLBACK_TICKS,
  AUTO_TRADE_BUFFER_PERCENT,
  addLog,
  createInitialGameState,
  createNewEmployee,
  getAssignmentCapacity,
  getDemandShiftDelta,
  getEsgDrift,
  getNewlyDiscoveredCombos,
  getProductSellPrice,
  getRandomEvent,
  getSpecialistMultiplier,
  getTrainingCost,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  orderShipment as orderShipmentFn,
} from '../game/utils/gameCalculations'
import {
  clearStoredGameState,
  loadStoredGameState,
  saveStoredGameState,
} from '../game/utils/gameStorage'
import {
  ASPHALT_BALANCE,
  AWARDS_BALANCE,
  BOOST_BALANCE,
  DEMAND_SHIFT_BALANCE,
  ESG_BALANCE,
  EXPANSION_BALANCE,
  FEEDSTOCK_BALANCE,
  BUILDING_UPGRADE_BALANCE,
  PLANT_PRODUCTION,
  STAFF_LEVEL_BALANCE,
  STANDING_ORDER_BALANCE,
  type PaidExpansionEntry,
  type ShipmentOption,
} from '../game/data/balance'
import { text } from '../game/translations'
import { BUILDINGS } from '../game/data/buildings'
import { getRandomChoiceEvent } from '../game/data/choiceEvents'
import type { HiddenComboConfig } from '../game/data/hiddenCombos'
import {
  generateRecruitmentPool,
  getManualRefreshCost,
  hireCandidateEmployee,
  RECRUITMENT_BALANCE,
} from '../game/data/recruitment'

const SAVE_INTERVAL_MS = 5000

// --- Auto-trade (QoL feature, mobile-only) ---
//
// Repeatedly tapping "Buy 10 Crude" / "Sell 10 Gas" was the #1 reported
// annoyance. This adds an optional toggle: when enabled, each tick the game
// tops up crude when it drops below `buyThreshold`% of capacity (capped by
// cash on hand) and sells off gasoline down to `sellThreshold`% when it
// exceeds that level -- so excess never overflows/wastes and crude never
// fully runs dry, without the player babysitting both meters.
//
// Persisted separately from the game save (own AsyncStorage key) so it
// survives "Reset save" / New Game, similar to Settings.
export type AutoTradeSettings = {
  enabled: boolean
  buyThreshold: number // 0-100, % of maxCrudeStorage below which to top up
  sellThreshold: number // 0-100, % of maxGasolineStorage above which to sell down to
}

const AUTO_TRADE_KEY = 'refinery-story-autotrade'
const DEFAULT_AUTO_TRADE: AutoTradeSettings = { enabled: false, buyThreshold: 20, sellThreshold: 80 }

function sanitizeAutoTrade(value: unknown): AutoTradeSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_AUTO_TRADE
  const v = value as Partial<AutoTradeSettings>
  const clamp = (n: unknown, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_AUTO_TRADE.enabled,
    buyThreshold: clamp(v.buyThreshold, DEFAULT_AUTO_TRADE.buyThreshold),
    sellThreshold: clamp(v.sellThreshold, DEFAULT_AUTO_TRADE.sellThreshold),
  }
}

// Pure, exported for testing. Runs after the main tick: top up crude toward
// buyThreshold% (limited by cash + storage), then sell gasoline down to
// sellThreshold% if it's currently above that.
export function applyAutoTrade(current: GameState, settings: AutoTradeSettings): GameState {
  if (!settings.enabled) return current
  const stats = calculateDerivedStats(current)
  let next = current

  if (stats.maxCrudeStorage > 0) {
    const crudePct = (next.crudeOil / stats.maxCrudeStorage) * 100
    if (crudePct < settings.buyThreshold) {
      // Overshoot to threshold + buffer (not exactly the threshold) so
      // crude visibly drains back down via production before the next
      // top-up, instead of being corrected to the same number every tick.
      const targetPct = Math.min(100, settings.buyThreshold + AUTO_TRADE_BUFFER_PERCENT)
      const targetCrude = Math.floor((targetPct / 100) * stats.maxCrudeStorage)
      const needed = Math.max(0, targetCrude - next.crudeOil)
      const affordable = Math.floor(next.money / CRUDE_COST)
      const space = stats.maxCrudeStorage - next.crudeOil
      const amount = Math.min(needed, affordable, space)
      if (amount > 0) {
        next = {
          ...next,
          money: next.money - amount * CRUDE_COST,
          crudeOil: next.crudeOil + amount,
          everBoughtCrude: true,
        }
      }
    }
  }

  if (stats.maxGasolineStorage > 0) {
    const gasolinePct = (next.gasoline / stats.maxGasolineStorage) * 100
    if (gasolinePct > settings.sellThreshold) {
      // Undershoot to threshold - buffer so gasoline visibly refills via
      // production before the next sell-off, instead of being corrected to
      // the same number every tick.
      const targetPct = Math.max(0, settings.sellThreshold - AUTO_TRADE_BUFFER_PERCENT)
      const targetGasoline = Math.floor((targetPct / 100) * stats.maxGasolineStorage)
      const excess = Math.max(0, next.gasoline - targetGasoline)
      if (excess > 0) {
        next = { ...next, gasoline: next.gasoline - excess, money: next.money + excess * stats.sellPrice }
      }
    }
  }

  return next
}

// Pure, exported for testing. Full auto-refresh of the recruitment pool
// every RECRUITMENT_BALANCE.refreshIntervalTicks, regardless of how many
// slots were already filled by individual hires in the meantime.
export function applyRecruitmentRefresh(current: GameState): GameState {
  if (current.tickCount < current.recruitmentRefreshAt) return current
  const { pool, nextNameIndex } = generateRecruitmentPool(current.refineryLevel, current.recruitmentNameCounter)
  return {
    ...current,
    recruitmentPool: pool,
    recruitmentNameCounter: nextNameIndex,
    recruitmentRefreshAt: current.tickCount + RECRUITMENT_BALANCE.refreshIntervalTicks,
  }
}

// --- Event triggers (mobile-only) ---
//
// Both random ("silent" economic) events and choice events used to fire on
// real-time setIntervals (every 30s / 60s), independent of the main game
// loop. That caused two problems: (1) desync on background/resume -- the
// timers and tickCount drift apart, and (2) choice-event popups felt like
// random interruptions disconnected from what the player was doing.
//
// Now both are checked from the main tick effect:
// - Random events: tick-count based (every RANDOM_EVENT_INTERVAL_TICKS,
//   ~30s of game time), but only when the refinery is "active"
//   (crudeOil > 0) -- an idle refinery doesn't generate equipment-wear/
//   market events.
// - Choice events: primarily MILESTONE-triggered (whenever
//   completedMilestoneKeys grows -- see hasNewMilestone), with a
//   tick-count fallback (CHOICE_EVENT_FALLBACK_TICKS, ~4 min) if no
//   milestone has fired in a while.

// Pure, exported for testing.
export function shouldFireRandomEvent(game: GameState): boolean {
  return game.tickCount > 0 && game.tickCount % RANDOM_EVENT_INTERVAL_TICKS === 0 && game.crudeOil > 0
}

// Pure, exported for testing. True if `next` has at least one more
// completed milestone than `current` (completedMilestoneKeys only grows).
export function hasNewMilestone(current: GameState, next: GameState): boolean {
  return next.completedMilestoneKeys.length > current.completedMilestoneKeys.length
}

// Pure, exported for testing.
export function shouldFireChoiceEventFallback(game: GameState): boolean {
  return game.tickCount - game.lastChoiceEventTick >= CHOICE_EVENT_FALLBACK_TICKS
}

// --- 🔥 Boost (mobile-only) ---
// Pure, exported for testing.
export function isBoostActive(game: GameState): boolean {
  return game.tickCount < game.boostActiveUntilTick
}

export function isBoostOnCooldown(game: GameState): boolean {
  return game.tickCount < game.boostAvailableAtTick
}

export function canActivateBoost(game: GameState): boolean {
  return game.tickCount >= game.boostAvailableAtTick
}

// Full production tick: feedstock (crude -> feedstock), downstream plants
// (feedstock -> lubricants/jetFuel/petrochemicals), gasoline (crude ->
// gasoline, incl. Efficiency-perk yield carry), ESG drift, Energy Transition
// demand shift.
export function tick(current: GameState): GameState {
  const stats = calculateDerivedStats(current)
  const nextTick = current.tickCount + 1

  let crudeOil = current.crudeOil
  let feedstock = current.feedstock
  let productInventory = current.productInventory

  // --- Distillation: crude -> feedstock ---
  if (
    stats.feedstockPerDistillationCycle > 0 &&
    nextTick % FEEDSTOCK_BALANCE.distillationIntervalTicks === 0
  ) {
    const distillationUnits = stats.buildingCounts.distillationUnit
    const crudeNeeded = distillationUnits * FEEDSTOCK_BALANCE.crudePerDistillationCycle
    const feedstockSpace = stats.maxFeedstockStorage - feedstock
    if (crudeOil >= crudeNeeded && feedstockSpace > 0) {
      const feedstockMade = Math.min(Math.floor(stats.feedstockPerDistillationCycle), feedstockSpace)
      if (feedstockMade > 0) {
        crudeOil -= crudeNeeded
        feedstock += feedstockMade
      }
    }
  }

  // --- Downstream plants: feedstock -> product ---
  // Feedstock is a single shared pool that lubricant/jet fuel/petrochem
  // all draw from every 25-tick (5s) cycle. Previously this was
  // first-come-first-served in a fixed order: whichever plant type was
  // checked first got its FULL feedstockNeeded (or nothing), so when total
  // demand exceeded supply, some plant types produced at 100% while others
  // produced 0% for as long as the front-of-queue plants kept winning
  // (observed: a newly-built petrochem plant could sit at 0 output for
  // ~3-4 minutes while lubricant/jet fuel ate all the feedstock first).
  //
  // Now: every plant eligible this cycle (built, on-interval, has storage
  // room) shares the pool PROPORTIONALLY to its feedstockPerCycle need. If
  // supply covers total demand, everyone gets their normal full output
  // (identical to the old behavior in the common case). If supply is
  // short, every plant still produces SOMETHING this cycle -- scaled down
  // by the same shortage ratio -- instead of some plants winning outright
  // and others getting nothing.
  const eligiblePlants = PLANT_PRODUCTION.filter((plant) => {
    const plantCount = stats.buildingCounts[plant.buildingKey]
    if (plantCount <= 0 || nextTick % plant.intervalTicks !== 0) return false
    return plant.maxStorage - productInventory[plant.productKey] > 0
  })
  const totalFeedstockDemand = eligiblePlants.reduce(
    (sum, plant) => sum + stats.buildingCounts[plant.buildingKey] * plant.feedstockPerCycle,
    0,
  )
  if (totalFeedstockDemand > 0 && feedstock > 0) {
    const shareRatio = Math.min(1, feedstock / totalFeedstockDemand)
    for (const plant of eligiblePlants) {
      const plantCount = stats.buildingCounts[plant.buildingKey]
      const productSpace = plant.maxStorage - productInventory[plant.productKey]
      const specialistMultiplier = getSpecialistMultiplier(current, plant, plantCount)
      const rawProduced = plantCount * plant.outputPerCycle * specialistMultiplier * shareRatio
      // Full share: round as before (preserves old behavior exactly when
      // supply is sufficient). Reduced share: floor, so a plant never
      // "rounds up" into output it didn't have the feedstock for.
      const produced = Math.min(shareRatio >= 1 ? Math.round(rawProduced) : Math.floor(rawProduced), productSpace)
      if (produced <= 0) continue

      productInventory = {
        ...productInventory,
        [plant.productKey]: productInventory[plant.productKey] + produced,
      }
    }
    feedstock = shareRatio >= 1 ? feedstock - totalFeedstockDemand : 0
  }

  // --- Gasoline production: crude -> gasoline (with Efficiency yield carry) ---
  // 🔥 Boost: while active, the production clock runs at
  // BOOST_BALANCE.productionMultiplier speed (effectively ~2x gasoline
  // output rate). Only affects this clock, not distillation/downstream
  // plants -- keeps the boost simple and immediately visible on the core
  // gasoline loop.
  const isBoosted = current.tickCount < current.boostActiveUntilTick
  const productionTickAmount = isBoosted ? TICK_MS * BOOST_BALANCE.productionMultiplier : TICK_MS
  const nextProgress = current.productionProgress + productionTickAmount
  const interval = stats.productionInterval
  let gasoline = current.gasoline
  let productionProgress = nextProgress
  let gasolineYieldCarry = current.gasolineYieldCarry
  let totalGasolineProduced = current.totalGasolineProduced

  if (nextProgress >= interval) {
    const storageRoom = stats.maxGasolineStorage - gasoline
    const batchesProduced = Math.min(Math.floor(nextProgress / interval), crudeOil, storageRoom)

    if (batchesProduced >= 1) {
      const perkYieldMultiplier = 1 + stats.perkProductionBonusRate
      const rawYield = batchesProduced * perkYieldMultiplier + gasolineYieldCarry
      const produced = Math.min(Math.floor(rawYield), storageRoom)
      gasolineYieldCarry = produced === Math.floor(rawYield) ? rawYield - produced : 0

      crudeOil -= batchesProduced
      gasoline += produced
      totalGasolineProduced += produced

      productionProgress =
        crudeOil > 0 && gasoline < stats.maxGasolineStorage
          ? nextProgress - batchesProduced * interval
          : 0
    } else {
      productionProgress = 0
    }
  }

  // --- ESG drift + Energy Transition demand shift ---
  const esgDelta = getEsgDrift(current, stats.buildingCounts)
  const esgScore = Math.max(
    ESG_BALANCE.minScore,
    Math.min(ESG_BALANCE.maxScore, current.esgScore + esgDelta),
  )

  const { gasolineDelta, petrochemicalsDelta } = getDemandShiftDelta(stats.currentEra)
  const gasolineDemandMultiplier = Math.max(
    DEMAND_SHIFT_BALANCE.gasolineDemandFloor,
    current.gasolineDemandMultiplier + gasolineDelta,
  )
  const petrochemicalsDemandMultiplier = Math.min(
    DEMAND_SHIFT_BALANCE.petrochemicalsDemandCeiling,
    current.petrochemicalsDemandMultiplier + petrochemicalsDelta,
  )

  return applyMilestones({
    ...current,
    tickCount: nextTick,
    crudeOil,
    feedstock,
    productInventory,
    gasoline,
    productionProgress,
    gasolineYieldCarry,
    totalGasolineProduced,
    esgScore,
    gasolineDemandMultiplier,
    petrochemicalsDemandMultiplier,
  })
}

export function useGameLoop() {
  const [game, setGame] = useState<GameState | null>(null)
  const gameRef = useRef<GameState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  const [autoTrade, setAutoTrade] = useState<AutoTradeSettings>(DEFAULT_AUTO_TRADE)
  const autoTradeRef = useRef<AutoTradeSettings>(DEFAULT_AUTO_TRADE)
  const [pendingChoiceEvent, setPendingChoiceEvent] = useState<ChoiceEvent | null>(null)
  const pendingChoiceEventRef = useRef<ChoiceEvent | null>(null)
  const [pendingAward, setPendingAward] = useState<AwardRecord | null>(null)
  const [pendingEraBanner, setPendingEraBanner] = useState<EraConfig | null>(null)
  const [pendingWinCelebration, setPendingWinCelebration] = useState(false)
  const [pendingComboDiscovery, setPendingComboDiscovery] = useState<HiddenComboConfig | null>(null)

  // Shows a choice event (if none is currently pending) and stamps
  // lastChoiceEventTick so the fallback timer restarts from "now".
  // Synchronously updates pendingChoiceEventRef so back-to-back
  // triggers within the same tick/action don't double-fire.
  const triggerChoiceEvent = useCallback((next: GameState): GameState => {
    if (pendingChoiceEventRef.current) return next
    const event = getRandomChoiceEvent()
    pendingChoiceEventRef.current = event
    setPendingChoiceEvent(event)
    return { ...next, lastChoiceEventTick: next.tickCount }
  }, [])

  useEffect(() => {
    loadStoredGameState().then(({ game: loadedGame, message }) => {
      gameRef.current = loadedGame
      setGame(loadedGame)
      setHasSave(message !== text.save.noSave)
      setLoaded(true)
    })
    AsyncStorage.getItem(AUTO_TRADE_KEY)
      .then((raw) => {
        if (!raw) return
        const parsed = sanitizeAutoTrade(JSON.parse(raw))
        autoTradeRef.current = parsed
        setAutoTrade(parsed)
      })
      .catch(() => {})
  }, [])

  // Main production tick (200ms): production + ESG/demand drift + staff XP +
  // era-advance detection + year-end award close.
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setGame((current) => {
        if (!current) return current
        let next = tick(current)

        const { employees, levelUpLog } = applyStaffXp(next)
        next = { ...next, employees }
        if (levelUpLog) {
          next = { ...next, activityLog: addLog(next.activityLog, levelUpLog) }
        }

        const era = calculateDerivedStats(next).currentEra
        if (era.index > next.highestEraIndex) {
          next = { ...next, highestEraIndex: era.index }
          setPendingEraBanner(era)
        }

        if (next.tickCount - next.yearStartTick >= AWARDS_BALANCE.yearLengthTicks) {
          const { game: afterAward, record } = closeBusinessYear(next)
          next = afterAward
          setPendingAward(record)
        }

        next = applyAutoTrade(next, autoTradeRef.current)
        next = applyRecruitmentRefresh(next)

        if (shouldFireRandomEvent(next)) {
          next = applyRandomEvent(next, getRandomEvent(next))
        }

        if (hasNewMilestone(current, next)) {
          next = triggerChoiceEvent(next)
        } else if (shouldFireChoiceEventFallback(next)) {
          next = triggerChoiceEvent(next)
        }

        gameRef.current = next
        return next
      })
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [loaded, triggerChoiceEvent])

  // Crude shipment arrivals (real-time delay, checked every second).
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setGame((current) => {
        if (!current || current.pendingShipments.length === 0) return current
        const next = applyShipmentArrivals(current, Date.now())
        gameRef.current = next
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      if (gameRef.current) saveStoredGameState(gameRef.current)
    }, SAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loaded])

  const update = useCallback((fn: (current: GameState) => GameState) => {
    setGame((current) => {
      if (!current) return current
      let next = fn(current)
      if (hasNewMilestone(current, next)) {
        next = triggerChoiceEvent(next)
      }
      if (!current.prototypeCompleted && next.prototypeCompleted) {
        setPendingWinCelebration(true)
      }
      gameRef.current = next
      return next
    })
    setHasSave(true)
  }, [triggerChoiceEvent])

  const buyCrude = useCallback(
    (amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const canAfford = Math.floor(current.money / CRUDE_COST)
        const space = stats.maxCrudeStorage - current.crudeOil
        const actual = Math.min(amount, canAfford, space)
        if (actual <= 0) return current
        return {
          ...current,
          money: current.money - actual * CRUDE_COST,
          crudeOil: current.crudeOil + actual,
          everBoughtCrude: true,
        }
      }),
    [update],
  )

  const sellGasoline = useCallback(
    (amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const actual = Math.min(amount, current.gasoline)
        if (actual <= 0) return current
        return {
          ...current,
          gasoline: current.gasoline - actual,
          money: current.money + actual * stats.sellPrice,
        }
      }),
    [update],
  )

  const sellProduct = useCallback(
    (key: 'lubricants' | 'jetFuel' | 'petrochemicals', amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const have = current.productInventory[key]
        const actual = Math.min(amount, have)
        if (actual <= 0) return current
        const demandMultiplier = key === 'petrochemicals' ? current.petrochemicalsDemandMultiplier : 1
        const price = getProductSellPrice(key, stats.productSellMultiplier, demandMultiplier)
        if (price <= 0) return current
        return {
          ...current,
          productInventory: { ...current.productInventory, [key]: have - actual },
          money: current.money + price * actual,
        }
      }),
    [update],
  )

  const placeBuilding = useCallback(
    (cellIndex: number, building: BuildingType) =>
      update((current) => {
        const cell = current.grid[cellIndex]
        const buildingData = BUILDINGS[building]
        const unlockLevel = buildingData.unlockLevel ?? 1
        if (cell !== null || current.money < buildingData.cost || current.refineryLevel < unlockLevel) {
          return current
        }
        const grid = [...current.grid]
        grid[cellIndex] = building
        const gridLevels = [...current.gridLevels]
        gridLevels[cellIndex] = 1

        let next: GameState = {
          ...current,
          money: current.money - buildingData.cost,
          grid,
          gridLevels,
          activityLog: addLog(current.activityLog, `Built ${buildingData.name.en} (-$${buildingData.cost})`),
        }

        // 🧩 Hidden combos: placing a building can newly complete a 3-in-a-
        // row/column of distinct building types. Apply all newly-found
        // combos' rewards, log them, and pop the discovery banner for the
        // first one.
        const newlyFound = getNewlyDiscoveredCombos(next.grid, next.discoveredCombos)
        for (const combo of newlyFound) {
          next = {
            ...next,
            money: next.money + combo.cashReward,
            researchPoints: next.researchPoints + combo.rpReward,
            reputation: next.reputation + (combo.reputationReward ?? 0),
            discoveredCombos: [...next.discoveredCombos, combo.key],
            activityLog: addLog(
              next.activityLog,
              `🧩 Combo found: ${combo.name.en}! +$${combo.cashReward}, +${combo.rpReward}RP` +
                (combo.reputationReward ? `, +${combo.reputationReward} Rep` : ''),
            ),
          }
        }
        if (newlyFound.length > 0) {
          setPendingComboDiscovery(newlyFound[0])
        }

        return next
      }),
    [update],
  )

  const upgradeBuilding = useCallback(
    (cellIndex: number) =>
      update((current) => {
        const cell = current.grid[cellIndex]
        if (!cell) return current
        const isUpgradeable = cell === 'crudeTank' || cell === 'productTank' || cell === 'distillationUnit'
        if (!isUpgradeable) return current
        const currentLevel = current.gridLevels[cellIndex] ?? 1
        if (currentLevel >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel) return current
        const cost =
          currentLevel === 1
            ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
            : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
        if (current.money < cost) return current
        const gridLevels = [...current.gridLevels]
        gridLevels[cellIndex] = currentLevel + 1
        return { ...current, money: current.money - cost, gridLevels }
      }),
    [update],
  )

  const upgradeRefinery = useCallback(
    () =>
      update((current) => {
        const cost = getUpgradeCost(current.refineryLevel)
        const requiredProduction = getUpgradeProductionRequirement(current.refineryLevel)
        if (current.money < cost) return current
        if (current.totalGasolineProduced < requiredProduction) return current
        return applyWinGoal({
          ...current,
          money: current.money - cost,
          refineryLevel: current.refineryLevel + 1,
          upgradePoints: current.upgradePoints + 1,
        })
      }),
    [update],
  )

  const expandGrid = useCallback(
    () =>
      update((current) => {
        const nextLevel = current.gridExpansionLevel + 1
        if (nextLevel >= EXPANSION_BALANCE.length) return current
        const nextEntry = EXPANSION_BALANCE[nextLevel] as PaidExpansionEntry
        if (current.money < nextEntry.cost || current.refineryLevel < nextEntry.requiresRefineryLevel) {
          return current
        }
        const newCells = nextEntry.cells - EXPANSION_BALANCE[current.gridExpansionLevel].cells
        return applyWinGoal({
          ...current,
          money: current.money - nextEntry.cost,
          gridExpansionLevel: nextLevel,
          grid: [...current.grid, ...Array(newCells).fill(null)],
          gridLevels: [...current.gridLevels, ...Array(newCells).fill(1)],
        })
      }),
    [update],
  )

  const unlockResearch = useCallback(
    (research: ResearchItem) =>
      update((current) => {
        if (current.unlockedResearchIds.includes(research.key)) return current
        if (current.researchPoints < research.cost) return current
        if (research.prerequisite && !current.unlockedResearchIds.includes(research.prerequisite)) {
          return current
        }
        return applyMilestones({
          ...current,
          researchPoints: current.researchPoints - research.cost,
          unlockedResearchCount: current.unlockedResearchCount + 1,
          unlockedResearchIds: [...current.unlockedResearchIds, research.key],
        })
      }),
    [update],
  )

  const installPerk = useCallback(
    (perk: PerkConfig) =>
      update((current) => {
        if (current.unlockedPerks.includes(perk.key)) return current
        if (current.upgradePoints < perk.cost) return current
        if (perk.prerequisite && !current.unlockedPerks.includes(perk.prerequisite)) return current
        return {
          ...current,
          upgradePoints: current.upgradePoints - perk.cost,
          unlockedPerks: [...current.unlockedPerks, perk.key],
        }
      }),
    [update],
  )

  const hireWorker = useCallback(
    (worker: WorkerConfig) =>
      update((current) => {
        if (current.money < worker.cost) return current
        if (worker.unlockLevel && current.refineryLevel < worker.unlockLevel) return current
        const newEmployee = createNewEmployee(current.employees, worker.key)
        return applyMilestones({
          ...current,
          money: current.money - worker.cost,
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [worker.key]: current.workerCounts[worker.key] + 1,
          },
          employees: [...current.employees, newEmployee],
        })
      }),
    [update],
  )

  // Recruitment pool: hire one of the 3 current candidates. The hired slot
  // is immediately refilled with a freshly-rolled candidate (the rest of
  // the pool is untouched until the next periodic refresh).
  const hireCandidate = useCallback(
    (slotIndex: number) =>
      update((current) => {
        const candidate = current.recruitmentPool[slotIndex]
        if (!candidate) return current
        if (current.money < candidate.cost) return current

        const newEmployee = hireCandidateEmployee(current.employees, candidate)
        const replacement = generateRecruitmentPool(current.refineryLevel, current.recruitmentNameCounter)
        const recruitmentPool = [...current.recruitmentPool]
        recruitmentPool[slotIndex] = replacement.pool[0]

        return applyMilestones({
          ...current,
          money: current.money - candidate.cost,
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [candidate.type]: current.workerCounts[candidate.type] + 1,
          },
          employees: [...current.employees, newEmployee],
          recruitmentPool,
          recruitmentNameCounter: current.recruitmentNameCounter + 1,
        })
      }),
    [update],
  )

  // Manual refresh: re-rolls all 3 slots for a small fee and restarts the
  // auto-refresh timer (so the player gets the full interval with their
  // freshly-rolled pool).
  const refreshRecruitmentPool = useCallback(
    () =>
      update((current) => {
        const cost = getManualRefreshCost(current.refineryLevel)
        if (current.money < cost) return current
        const { pool, nextNameIndex } = generateRecruitmentPool(
          current.refineryLevel,
          current.recruitmentNameCounter,
        )
        return {
          ...current,
          money: current.money - cost,
          recruitmentPool: pool,
          recruitmentNameCounter: nextNameIndex,
          recruitmentRefreshAt: current.tickCount + RECRUITMENT_BALANCE.refreshIntervalTicks,
        }
      }),
    [update],
  )

  // 🔥 Boost: temporarily speeds up gasoline production. No-op while
  // already active or on cooldown.
  const activateBoost = useCallback(
    () =>
      update((current) => {
        if (!canActivateBoost(current)) return current
        return {
          ...current,
          boostActiveUntilTick: current.tickCount + BOOST_BALANCE.durationTicks,
          boostAvailableAtTick: current.tickCount + BOOST_BALANCE.cooldownTicks,
        }
      }),
    [update],
  )

  const trainEmployee = useCallback(
    (employeeId: string) =>
      update((current) => {
        const target = current.employees.find((e) => e.id === employeeId)
        if (!target || target.level >= STAFF_LEVEL_BALANCE.maxLevel) return current
        const cost = getTrainingCost(target.level)
        if (current.money < cost.money || current.researchPoints < cost.rp) return current
        return {
          ...current,
          money: current.money - cost.money,
          researchPoints: current.researchPoints - cost.rp,
          employees: current.employees.map((e) =>
            e.id === target.id ? { ...e, level: target.level + 1, xp: 0 } : e,
          ),
        }
      }),
    [update],
  )

  const toggleAssignment = useCallback(
    (employeeId: string, type: WorkerType) =>
      update((current) => {
        const employee = current.employees.find((e) => e.id === employeeId && e.type === type)
        if (!employee) return current
        const capacity = getAssignmentCapacity(calculateDerivedStats(current).buildingCounts, type)
        const list = current.assignments[type] ?? []
        const isAssigned = list.includes(employeeId)
        let nextList: string[]
        if (isAssigned) {
          nextList = list.filter((id) => id !== employeeId)
        } else {
          if (list.length >= capacity) return current
          nextList = [...list, employeeId]
        }
        return { ...current, assignments: { ...current.assignments, [type]: nextList } }
      }),
    [update],
  )

  const produceAsphalt = useCallback(
    (amount: number) =>
      update((current) => {
        if (current.refineryLevel < ASPHALT_BALANCE.unlockLevel) return current
        const space = ASPHALT_BALANCE.maxStorage - current.productInventory.asphalt
        const actual = Math.min(amount, current.crudeOil, space)
        if (actual <= 0) return current
        return {
          ...current,
          crudeOil: current.crudeOil - actual,
          productInventory: { ...current.productInventory, asphalt: current.productInventory.asphalt + actual },
        }
      }),
    [update],
  )

  const fulfillStandingOrder = useCallback(
    (key: StandingOrderKey) =>
      update((current) => {
        const order = STANDING_ORDER_BALANCE.find((o) => o.key === key)
        if (!order) return current
        if (current.refineryLevel < order.unlockLevel) return current
        const cooldownAt = current.standingOrderCooldowns[key]
        if (cooldownAt !== undefined && cooldownAt > current.tickCount) return current
        const inventory = current.productInventory[order.productKey]
        if (inventory < order.required) return current
        return applyMilestones({
          ...current,
          money: current.money + order.reward,
          researchPoints: current.researchPoints + order.rpReward,
          reputation: current.reputation + order.reputationReward,
          yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + order.reward },
          productInventory: { ...current.productInventory, [order.productKey]: inventory - order.required },
          standingOrderCooldowns: {
            ...current.standingOrderCooldowns,
            [key]: current.tickCount + order.cooldownTicks,
          },
        })
      }),
    [update],
  )

  const buyShipment = useCallback(
    (option: ShipmentOption) => update((current) => orderShipmentFn(current, option, Date.now())),
    [update],
  )

  const chooseEventOption = useCallback(
    (option: 'A' | 'B') => {
      if (!pendingChoiceEvent) return
      update((current) => applyWinGoal(applyChoiceEventOption(current, pendingChoiceEvent, option)))
      pendingChoiceEventRef.current = null
      setPendingChoiceEvent(null)
    },
    [update, pendingChoiceEvent],
  )

  const renameRefinery = useCallback(
    (name: string) => update((current) => ({ ...current, refineryName: name })),
    [update],
  )

  const manualSave = useCallback(() => {
    if (gameRef.current) saveStoredGameState(gameRef.current)
  }, [])

  const updateAutoTrade = useCallback((partial: Partial<AutoTradeSettings>) => {
    setAutoTrade((current) => {
      const next = sanitizeAutoTrade({ ...current, ...partial })
      autoTradeRef.current = next
      AsyncStorage.setItem(AUTO_TRADE_KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])

  const resetGame = useCallback(() => {
    clearStoredGameState()
    const fresh = createInitialGameState()
    gameRef.current = fresh
    setGame(fresh)
    setHasSave(false)
  }, [])

  return {
    game,
    loaded,
    hasSave,
    autoTrade,
    updateAutoTrade,
    derived: game ? calculateDerivedStats(game) : null,
    pendingChoiceEvent,
    pendingAward,
    pendingEraBanner,
    pendingWinCelebration,
    pendingComboDiscovery,
    buyCrude,
    sellGasoline,
    sellProduct,
    placeBuilding,
    upgradeBuilding,
    upgradeRefinery,
    expandGrid,
    unlockResearch,
    installPerk,
    hireWorker,
    hireCandidate,
    refreshRecruitmentPool,
    activateBoost,
    trainEmployee,
    toggleAssignment,
    produceAsphalt,
    fulfillStandingOrder,
    buyShipment,
    chooseEventOption,
    completeContract: (contract: Contract) =>
      update((current) => {
        if (current.refineryLevel < contract.unlockLevel) return current
        if (current.completedContractIds.includes(contract.id)) return current

        const isPetro = (contract.petrochemicalsRequired ?? 0) > 0
        const isLube = !isPetro && (contract.lubricantsRequired ?? 0) > 0
        const isJet = !isPetro && !isLube && (contract.jetFuelRequired ?? 0) > 0
        const isAsphalt = !isPetro && !isLube && !isJet && (contract.asphaltRequired ?? 0) > 0

        if (isPetro && current.productInventory.petrochemicals < (contract.petrochemicalsRequired ?? 0)) return current
        if (isLube && current.productInventory.lubricants < (contract.lubricantsRequired ?? 0)) return current
        if (isJet && current.productInventory.jetFuel < (contract.jetFuelRequired ?? 0)) return current
        if (isAsphalt && current.productInventory.asphalt < (contract.asphaltRequired ?? 0)) return current
        if (!isPetro && !isLube && !isJet && !isAsphalt && current.gasoline < contract.gasolineRequired) return current

        const stats = calculateDerivedStats(current)
        const reward = Math.round(contract.reward * stats.contractRewardMultiplier)
        const rpReward = Math.round(contract.rpReward * stats.contractRpRewardMultiplier)

        const productInventory = isPetro
          ? { ...current.productInventory, petrochemicals: current.productInventory.petrochemicals - (contract.petrochemicalsRequired ?? 0) }
          : isLube
            ? { ...current.productInventory, lubricants: current.productInventory.lubricants - (contract.lubricantsRequired ?? 0) }
            : isJet
              ? { ...current.productInventory, jetFuel: current.productInventory.jetFuel - (contract.jetFuelRequired ?? 0) }
              : isAsphalt
                ? { ...current.productInventory, asphalt: current.productInventory.asphalt - (contract.asphaltRequired ?? 0) }
                : current.productInventory

        return applyWinGoal(applyMilestones({
          ...current,
          gasoline: isPetro || isLube || isJet || isAsphalt ? current.gasoline : current.gasoline - contract.gasolineRequired,
          productInventory,
          money: current.money + reward,
          researchPoints: current.researchPoints + rpReward,
          reputation: current.reputation + contract.reputationReward,
          completedContractCount: current.completedContractCount + 1,
          completedContractIds: [...current.completedContractIds, contract.id],
          yearStats: {
            ...current.yearStats,
            moneyEarned: current.yearStats.moneyEarned + reward,
            contractsCompleted: current.yearStats.contractsCompleted + 1,
          },
        }))
      }),
    renameRefinery,
    manualSave,
    resetGame,
    dismissAward: () => setPendingAward(null),
    dismissEraBanner: () => setPendingEraBanner(null),
    dismissWinCelebration: () => setPendingWinCelebration(false),
    dismissComboDiscovery: () => setPendingComboDiscovery(null),
  }
}
