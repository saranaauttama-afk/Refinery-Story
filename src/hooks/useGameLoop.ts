import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AwardRecord,
  BuildingType,
  ChoiceEvent,
  Contract,
  DerivedStats,
  Employee,
  EraConfig,
  HiddenEventConfig,
  GameState,
  PerkConfig,
  RecruitmentCandidate,
  ResearchItem,
  StandingOrderKey,
  WorkerConfig,
} from '../game/types'
import {
  applyChoiceEventOption,
  applyMilestones,
  applyMoraleDrift,
  applyRandomEvent,
  applyShipmentArrivals,
  applyStaffXp,
  applyWinGoal,
  applyLegendGoal,
  calculateDerivedStats,
  clampMorale,
  closeBusinessYear,
  getMaxHireCount,
  CRUDE_COST,
  TICK_MS,
  RANDOM_EVENT_INTERVAL_TICKS,
  CHOICE_EVENT_FALLBACK_TICKS,
  AUTO_TRADE_BUFFER_PERCENT,
  addLog,
  createInitialGameState,
  prestigeGame,
  createNewEmployee,
  getDemandShiftDelta,
  getEsgDrift,
  getProductMaxStorage,
  getTotalCellOutput,
  getWasteGeneratedPerTick,
  getWasteOverflowEsgPenalty,
  getCellSynergy,
  getNewlyDiscoveredCombos,
  getNewlyUnlockedHiddenEvents,
  getProductSellPrice,
  getCrudePrice,
  getProductMarketLevel,
  applyProductSaturation,
  recoverProductMarket,
  getRandomEvent,
  getSpecialistMultiplierForCell,
  getTrainingCost,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  getUpgradeReputationRequirement,
  getUpgradeResearchRequirement,
  orderShipment as orderShipmentFn,
} from '../game/utils/gameCalculations'
import {
  clearStoredGameState,
  loadStoredGameState,
  saveStoredGameState,
} from '../game/utils/gameStorage'
import {
  remapAnchoredSquareArray,
  remapAnchoredSquareAssignments,
} from '../game/utils/gridExpansion'
import {
  ASPHALT_BALANCE,
  AWARDS_BALANCE,
  BOOST_BALANCE,
  FEEDSTOCK_PRIORITY_BALANCE,
  DEMAND_SHIFT_BALANCE,
  ESG_BALANCE,
  EXPANSION_BALANCE,
  FEEDSTOCK_BALANCE,
  BUILDING_UPGRADE_BALANCE,
  PLANT_PRODUCTION,
  POWER_PLANT_BALANCE,
  GRID_EDIT_BALANCE,
  PRODUCTION_BALANCE,
  WASTE_TREATMENT_PLANT_BALANCE,
  POLYMER_PLANT_BALANCE,
  BONUS_BALANCE,
  MORALE_BALANCE,
  STAFF_LEVEL_BALANCE,
  SPECIALIZATION_BALANCE,
  STANDING_ORDER_BALANCE,
  MARKET_BALANCE,
  MAX_REFINERY_LEVEL,
  type PaidExpansionEntry,
  type ShipmentOption,
} from '../game/data/balance'
import { text } from '../game/translations'
import { MILESTONE_HEADLINES } from '../components/MilestoneHeadline'
import { shouldSpawnCrisis, spawnCrisis, applyCrisisPenalty } from '../game/data/crisisEvents'
import { BUILDINGS } from '../game/data/buildings'
import { SELLABLE_PRODUCTS, type SellableProductKey } from '../game/data/products'
import { CHOICE_EVENTS, getRandomChoiceEvent, getRandomStaffEvent } from '../game/data/choiceEvents'
import type { HiddenComboConfig } from '../game/data/hiddenCombos'
import { HIDDEN_EVENTS } from '../game/data/hiddenEvents'
import {
  generateRecruitmentPool,
  getManualRefreshCost,
  hireCandidateEmployee,
  RECRUITMENT_BALANCE,
} from '../game/data/recruitment'

const SAVE_INTERVAL_MS = 5000

// Flow-rate tracker tuning. The window is long enough (~150 ticks ≈ 30s of play
// at 1x) that one-off jumps (a manual crude buy, a contract payout) are diluted
// into a stable trend rather than spiking the readout, and we only recompute the
// displayed rate every few ticks to avoid re-rendering the HUD every single tick.
const RATE_WINDOW_TICKS = 150
const RATE_REFRESH_TICKS = 5
// 1 tick = TICK_MS (200ms) → 300 ticks per real minute at 1x speed.
const TICKS_PER_MINUTE = 60000 / 200

// Session cash-history sampling for the growth chart: one point every ~6s of
// play, keeping the most recent ~80 (≈ the last 8 minutes at 1x).
const HISTORY_SAMPLE_TICKS = 30
const HISTORY_MAX_POINTS = 80

export type FlowRates = {
  moneyPerMin: number
  gasPerMin: number
}

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
import {
  tick,
  applyAutoTrade,
  DEFAULT_PRODUCT_SELL_THRESHOLD,
  type AutoTradeSettings,
} from '../game/utils/gameTick'

const AUTO_TRADE_KEY = 'refinery-story-autotrade'
const DEFAULT_AUTO_TRADE: AutoTradeSettings = {
  enabled: false,
  buyThreshold: 20,
  sellThreshold: 80,
  productSellThresholds: {},
}

function sanitizeAutoTrade(value: unknown): AutoTradeSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_AUTO_TRADE
  const v = value as Partial<AutoTradeSettings>
  const clamp = (n: unknown, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback
  const rawProductThresholds =
    typeof v.productSellThresholds === 'object' && v.productSellThresholds !== null
      ? (v.productSellThresholds as Partial<Record<SellableProductKey, unknown>>)
      : {}
  const productSellThresholds: Partial<Record<SellableProductKey, number>> = {}
  for (const product of SELLABLE_PRODUCTS) {
    const raw = rawProductThresholds[product.key]
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      productSellThresholds[product.key] = clamp(raw, DEFAULT_PRODUCT_SELL_THRESHOLD)
    }
  }
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_AUTO_TRADE.enabled,
    buyThreshold: clamp(v.buyThreshold, DEFAULT_AUTO_TRADE.buyThreshold),
    sellThreshold: clamp(v.sellThreshold, DEFAULT_AUTO_TRADE.sellThreshold),
    productSellThresholds,
  }
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


export function useGameLoop() {
  const [game, setGame] = useState<GameState | null>(null)
  const gameRef = useRef<GameState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  // Game speed (Kairosoft-style): 0 = paused, 1/2/3 = fast-forward. Drives the
  // tick interval period below -- a pure pause model, so nothing advances
  // while paused and everything (production, calendar, shipments) scales
  // together when sped up. Session-only; resets to 1x on reload.
  const [speed, setSpeed] = useState(1)
  const [autoTrade, setAutoTrade] = useState<AutoTradeSettings>(DEFAULT_AUTO_TRADE)
  const autoTradeRef = useRef<AutoTradeSettings>(DEFAULT_AUTO_TRADE)
  const [pendingChoiceEvent, setPendingChoiceEvent] = useState<ChoiceEvent | null>(null)
  const pendingChoiceEventRef = useRef<ChoiceEvent | null>(null)
  const [pendingAward, setPendingAward] = useState<AwardRecord | null>(null)
  const [pendingEraBanner, setPendingEraBanner] = useState<EraConfig | null>(null)
  const [pendingMilestoneHeadline, setPendingMilestoneHeadline] = useState<{ icon: string; title: string; body: string } | null>(null)
  const [pendingWinCelebration, setPendingWinCelebration] = useState(false)
  const [pendingLegendCelebration, setPendingLegendCelebration] = useState(false)
  const [pendingComboDiscovery, setPendingComboDiscovery] = useState<HiddenComboConfig | null>(null)
  // Bumps each time a placement forms a positive adjacency pair — drives a
  // transient "Synergy!" toast (reinforces the green grid auras).
  const [synergyToastKey, setSynergyToastKey] = useState(0)
  // Hidden Event banner: which difficulty just unlocked (for the toast's
  // styling/copy only -- never the actual reward, since the design
  // requires a separate tap-to-claim step on the relevant tab to reveal
  // it). Distinct from pendingComboDiscovery's combo (which IS revealed
  // immediately, no separate claim step) -- different UX on purpose.
  const [pendingHiddenEventUnlock, setPendingHiddenEventUnlock] = useState<HiddenEventConfig | null>(null)

  // --- Flow-rate tracker (UI legibility) ---
  // The sim is rich (production, auto-trade, market, morale, specialization) but
  // the HUD only ever showed *stocks*, never *flows* -- a player couldn't tell if
  // the factory was net-profitable or how fast it was producing. We derive rates
  // from real state deltas over a rolling tick window (rather than re-deriving the
  // tick math, which would drift), so the numbers automatically reflect every
  // system. Keyed on tickCount, so the window freezes when the game is paused.
  const [flowRates, setFlowRates] = useState<FlowRates>({ moneyPerMin: 0, gasPerMin: 0 })
  const flowSamplesRef = useRef<{ tick: number; money: number; gas: number }[]>([])
  // Cash-over-time series for the growth chart (More Info sheet).
  const [moneyHistory, setMoneyHistory] = useState<number[]>([])

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

  const triggerStaffEvent = useCallback((next: GameState): GameState => {
    if (pendingChoiceEventRef.current) return next
    const event = getRandomStaffEvent()
    pendingChoiceEventRef.current = event
    setPendingChoiceEvent(event)
    return { ...next, lastStaffEventTick: next.tickCount, lastChoiceEventTick: next.tickCount }
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

  // Main production tick: production + ESG/demand drift + staff XP +
  // era-advance detection + year-end award close. Runs every TICK_MS / speed,
  // so 2x/3x fast-forward shortens the period and "paused" (speed 0) tears the
  // interval down entirely -- the whole sim freezes, no catch-up on resume.
  useEffect(() => {
    if (!loaded || speed <= 0) return
    const period = TICK_MS / speed
    const interval = setInterval(() => {
      setGame((current) => {
        if (!current) return current
        let next = tick(current)

        const { employees, levelUpLog, moraleDelta } = applyStaffXp(next)
        next = {
          ...next,
          employees,
          staffMorale: clampMorale(applyMoraleDrift(next.staffMorale) + moraleDelta),
        }
        if (levelUpLog) {
          next = { ...next, activityLog: addLog(next.activityLog, levelUpLog) }
        }

        const derivedForTick = calculateDerivedStats(next)
        const era = derivedForTick.currentEra
        if (era.index > next.highestEraIndex) {
          next = { ...next, highestEraIndex: era.index }
          setPendingEraBanner(era)
        }

        // Milestone headlines — fire when a key milestone is newly completed
        const prevKeys = (game ?? next).completedMilestoneKeys
        const newKeys = next.completedMilestoneKeys.filter((k) => !prevKeys.includes(k))
        for (const key of newKeys) {
          const headline = MILESTONE_HEADLINES[key]
          if (headline) {
            setPendingMilestoneHeadline(headline)
            break  // show one at a time
          }
        }

        // Crisis event system — spawn occasionally, apply penalty on expiry
        if (shouldSpawnCrisis(next, next.tickCount)) {
          const crisis = spawnCrisis(next, next.tickCount)
          if (crisis) next = { ...next, activeCrisis: crisis, lastCrisisTick: next.tickCount }
        }
        if (next.activeCrisis && next.tickCount >= next.activeCrisis.expiresAtTick) {
          next = applyCrisisPenalty(next)
        }

        // Hidden Event system: checked every tick (cheap -- short,
        // hand-curated list) since time-based conditions can become true
        // without any player action (e.g. the clock turning midnight).
        // Newly-met conditions get marked 'unlocked' and stay that way
        // indefinitely until the player taps to claim -- no deadline.
        const newlyUnlockedEvents = getNewlyUnlockedHiddenEvents(
          next,
          derivedForTick,
          next.discoveredHiddenEvents,
        )
        if (newlyUnlockedEvents.length > 0) {
          next = {
            ...next,
            discoveredHiddenEvents: [
              ...next.discoveredHiddenEvents,
              ...newlyUnlockedEvents.map((e) => e.key),
            ],
            hiddenEventStatus: {
              ...next.hiddenEventStatus,
              ...Object.fromEntries(newlyUnlockedEvents.map((e) => [e.key, 'unlocked' as const])),
            },
          }
          setPendingHiddenEventUnlock(newlyUnlockedEvents[0])
        }

        if (next.tickCount - next.yearStartTick >= AWARDS_BALANCE.yearLengthTicks) {
          const { game: afterAward, record } = closeBusinessYear(next)
          next = afterAward
          setPendingAward(record)
        }

        next = applyAutoTrade(next, autoTradeRef.current, derivedForTick)
        next = applyRecruitmentRefresh(next)

        // Crude shipments now arrive on the game clock (tick-based), so they
        // advance and pause together with production -- a consistent pause
        // model. Checked here in the main tick instead of a separate
        // wall-clock timer.
        if (next.pendingShipments.length > 0) {
          next = applyShipmentArrivals(next)
        }

        if (shouldFireRandomEvent(next)) {
          // getRandomEvent now rolls the ESG-gated incident chance and may
          // return null (no incident this cycle) — only apply when one fires.
          const incident = getRandomEvent(next)
          if (incident) next = applyRandomEvent(next, incident)
        }

        if (hasNewMilestone(current, next)) {
          next = triggerChoiceEvent(next)
        } else if (shouldFireChoiceEventFallback(next)) {
          next = triggerChoiceEvent(next)
        }

        if (
          next.employees.length >= MORALE_BALANCE.staffEventMinEmployees &&
          next.tickCount - next.lastStaffEventTick >= MORALE_BALANCE.staffEventCooldownTicks &&
          !pendingChoiceEventRef.current
        ) {
          next = triggerStaffEvent(next)
        }

        // Endgame: catch tick-driven completions (money via auto-trade/sells,
        // an S-grade year from the award close above).
        next = applyLegendGoal(next)
        if (!current.legendAchieved && next.legendAchieved) {
          setPendingLegendCelebration(true)
        }

        // Flow-rate sampling: record (tick, money, lifetime gasoline), drop
        // anything older than the window, and every RATE_REFRESH_TICKS recompute
        // the $/min and gas/min trend from the oldest surviving sample.
        const samples = flowSamplesRef.current
        samples.push({ tick: next.tickCount, money: next.money, gas: next.totalGasolineProduced })
        while (samples.length > 1 && next.tickCount - samples[0].tick > RATE_WINDOW_TICKS) {
          samples.shift()
        }
        if (next.tickCount % RATE_REFRESH_TICKS === 0) {
          const oldest = samples[0]
          const elapsed = next.tickCount - oldest.tick
          if (elapsed > 0) {
            const scale = TICKS_PER_MINUTE / elapsed
            setFlowRates({
              moneyPerMin: Math.round((next.money - oldest.money) * scale),
              gasPerMin: Math.round((next.totalGasolineProduced - oldest.gas) * scale),
            })
          }
        }

        // Cash-history sampling for the growth chart.
        if (next.tickCount % HISTORY_SAMPLE_TICKS === 0) {
          setMoneyHistory((h) => {
            const nh = [...h, Math.round(next.money)]
            return nh.length > HISTORY_MAX_POINTS ? nh.slice(nh.length - HISTORY_MAX_POINTS) : nh
          })
        }

        gameRef.current = next
        return next
      })
    }, period)
    return () => clearInterval(interval)
  }, [loaded, triggerChoiceEvent, triggerStaffEvent, speed])

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
      // Endgame: catch action-driven completions (upgrade to Lv20, research,
      // grid expansion). Tick-driven ones (money, awards) are caught in the
      // main tick loop.
      next = applyLegendGoal(next)
      if (!current.legendAchieved && next.legendAchieved) {
        setPendingLegendCelebration(true)
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
        // Dynamic Market: crude is bought at the current spot price (wave).
        const crudePrice = stats.crudePrice
        const canAfford = Math.floor(current.money / crudePrice)
        const space = stats.maxCrudeStorage - current.crudeOil
        const actual = Math.min(amount, canAfford, space)
        if (actual <= 0) return current
        return {
          ...current,
          money: current.money - actual * crudePrice,
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
        // stats.sellPrice already factors gasoline's market saturation; the
        // sale then pushes that saturation down a bit further.
        return {
          ...current,
          gasoline: current.gasoline - actual,
          money: current.money + actual * stats.sellPrice,
          yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + actual * stats.sellPrice },
          productMarket: applyProductSaturation(current.productMarket, 'gasoline', actual),
        }
      }),
    [update],
  )

  const sellProduct = useCallback(
    (key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets', amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const have = current.productInventory[key]
        const actual = Math.min(amount, have)
        if (actual <= 0) return current
        const demandMultiplier = key === 'petrochemicals' ? current.petrochemicalsDemandMultiplier : 1
        // Dynamic Market: effective price = base * sell multipliers * this
        // product's saturation level. Selling then lowers that level.
        const price = Math.round(
          getProductSellPrice(key, stats.productSellMultiplier, demandMultiplier) *
            getProductMarketLevel(current, key),
        )
        if (price <= 0) return current
        return {
          ...current,
          productInventory: { ...current.productInventory, [key]: have - actual },
          money: current.money + price * actual,
          yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + price * actual },
          productMarket: applyProductSaturation(current.productMarket, key, actual),
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
        // Hidden Event 'building' rewards grant a limited number of free/
        // discounted placements that bypass the normal cost AND unlock
        // level (see HiddenEventReward in types.ts) -- the reward itself
        // is the access, the player shouldn't also need to already be
        // unlocked for it normally.
        const hiddenUsesRemaining = current.hiddenBuildingUsesRemaining[building] ?? 0
        const usingHiddenGrant = hiddenUsesRemaining > 0
        const effectiveCost = usingHiddenGrant ? 0 : buildingData.cost
        if (cell !== null) return current
        if (!usingHiddenGrant && (current.money < effectiveCost || current.refineryLevel < unlockLevel)) {
          return current
        }
        const grid = [...current.grid]
        grid[cellIndex] = building
        const gridLevels = [...current.gridLevels]
        gridLevels[cellIndex] = 1

        let next: GameState = {
          ...current,
          money: current.money - effectiveCost,
          grid,
          gridLevels,
          ...(usingHiddenGrant
            ? {
                hiddenBuildingUsesRemaining: {
                  ...current.hiddenBuildingUsesRemaining,
                  [building]: hiddenUsesRemaining - 1,
                },
              }
            : {}),
          activityLog: addLog(
            current.activityLog,
            usingHiddenGrant
              ? `Built ${buildingData.name.en} (free -- Hidden Event reward)`
              : `Built ${buildingData.name.en} (-$${buildingData.cost})`,
          ),
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

        // Positive adjacency feedback: if the just-placed building forms a
        // synergy pair with a neighbour, pop a brief "Synergy!" toast.
        if (getCellSynergy(next.grid, cellIndex) === 'bonus') {
          setSynergyToastKey((k) => k + 1)
        }

        return next
      }),
    [update],
  )

  // Removes a building from the grid, refunding GRID_EDIT_BALANCE.
  // demolishRefundRate (50%) of its ORIGINAL purchase cost -- upgrade
  // spend on that cell is not refunded, it's simply lost along with the
  // building. Clears that cell's level (back to the grid's default,
  // matching how a fresh empty cell behaves) and unassigns any specialist
  // staff working there (their employee record is untouched, just freed
  // up to be assigned elsewhere). No-op on an already-empty cell.
  const demolishBuilding = useCallback(
    (cellIndex: number) =>
      update((current) => {
        const building = current.grid[cellIndex]
        if (!building) return current
        const refund = Math.round(BUILDINGS[building].cost * GRID_EDIT_BALANCE.demolishRefundRate)
        const grid = [...current.grid]
        grid[cellIndex] = null
        const gridLevels = [...current.gridLevels]
        gridLevels[cellIndex] = 1
        const assignments = { ...current.assignments }
        delete assignments[cellIndex]
        return {
          ...current,
          money: current.money + refund,
          grid,
          gridLevels,
          assignments,
          activityLog: addLog(
            current.activityLog,
            `Demolished ${BUILDINGS[building].name.en} (+$${refund} refund)`,
          ),
        }
      }),
    [update],
  )

  // Moves a building from an occupied cell to an EMPTY one, for a flat fee
  // (GRID_EDIT_BALANCE.moveCost). The building's level and any assigned
  // specialist travel WITH it -- since gridLevels/assignments are both
  // keyed by cellIndex, this means re-keying both: fromIndex's level moves
  // to toIndex (fromIndex resets to the default), and if an employee was
  // assigned at fromIndex, their assignment key moves to toIndex too. A
  // Lv3 Petrochemical Plant with a chemicalEngineer assigned stays exactly
  // as productive after the move, just relocated. No-op if fromIndex is
  // empty, toIndex is already occupied, fromIndex === toIndex, or the
  // player can't afford the fee.
  const moveBuilding = useCallback(
    (fromIndex: number, toIndex: number) =>
      update((current) => {
        const building = current.grid[fromIndex]
        if (!building) return current
        if (current.grid[toIndex] !== null) return current
        if (fromIndex === toIndex) return current
        if (current.money < GRID_EDIT_BALANCE.moveCost) return current

        const grid = [...current.grid]
        grid[fromIndex] = null
        grid[toIndex] = building

        const gridLevels = [...current.gridLevels]
        const level = gridLevels[fromIndex] ?? 1
        gridLevels[fromIndex] = 1
        gridLevels[toIndex] = level

        const assignments = { ...current.assignments }
        const assignedEmployeeId = assignments[fromIndex]
        delete assignments[fromIndex]
        if (assignedEmployeeId) assignments[toIndex] = assignedEmployeeId

        return {
          ...current,
          money: current.money - GRID_EDIT_BALANCE.moveCost,
          grid,
          gridLevels,
          assignments,
          activityLog: addLog(
            current.activityLog,
            `Moved ${BUILDINGS[building].name.en} (-$${GRID_EDIT_BALANCE.moveCost})`,
          ),
        }
      }),
    [update],
  )

  // Swaps the buildings (and their levels + any assigned specialists) at
  // two OCCUPIED cells, for a flat fee (GRID_EDIT_BALANCE.swapCost) --
  // cheaper than two moves, since it's a single rearrangement. Useful for
  // chasing a Hidden Combo (adjacency-based) without demolishing+rebuying
  // either building. No-op if either cell is empty, the two indices are
  // the same, or the player can't afford the fee.
  const swapBuildings = useCallback(
    (indexA: number, indexB: number) =>
      update((current) => {
        const buildingA = current.grid[indexA]
        const buildingB = current.grid[indexB]
        if (!buildingA || !buildingB) return current
        if (indexA === indexB) return current
        if (current.money < GRID_EDIT_BALANCE.swapCost) return current

        const grid = [...current.grid]
        grid[indexA] = buildingB
        grid[indexB] = buildingA

        const gridLevels = [...current.gridLevels]
        const levelA = gridLevels[indexA] ?? 1
        const levelB = gridLevels[indexB] ?? 1
        gridLevels[indexA] = levelB
        gridLevels[indexB] = levelA

        const assignments = { ...current.assignments }
        const employeeAtA = assignments[indexA]
        const employeeAtB = assignments[indexB]
        if (employeeAtB) assignments[indexA] = employeeAtB
        else delete assignments[indexA]
        if (employeeAtA) assignments[indexB] = employeeAtA
        else delete assignments[indexB]

        return {
          ...current,
          money: current.money - GRID_EDIT_BALANCE.swapCost,
          grid,
          gridLevels,
          assignments,
          activityLog: addLog(
            current.activityLog,
            `Swapped ${BUILDINGS[buildingA].name.en} and ${BUILDINGS[buildingB].name.en} (-$${GRID_EDIT_BALANCE.swapCost})`,
          ),
        }
      }),
    [update],
  )

  // Hidden Event system: reveals + grants the reward for an 'unlocked'
  // (condition met, not yet claimed) Hidden Event. No-op if the key isn't
  // unlocked or is already claimed -- the UI should only ever call this
  // for keys in 'unlocked' status, but this guards against stale taps.
  const claimHiddenEvent = useCallback(
    (key: string) =>
      update((current) => {
        if (current.hiddenEventStatus[key] !== 'unlocked') return current
        const config = HIDDEN_EVENTS.find((e) => e.key === key)
        if (!config) return current

        let next: GameState = {
          ...current,
          hiddenEventStatus: { ...current.hiddenEventStatus, [key]: 'claimed' },
          activityLog: addLog(current.activityLog, `✨ Hidden Event: ${config.name.en}!`),
        }

        switch (config.reward.kind) {
          case 'contract': {
            next = { ...next, hiddenContracts: [...next.hiddenContracts, config.reward.contract] }
            break
          }
          case 'building': {
            const { building, uses, costOverride } = config.reward
            next = {
              ...next,
              hiddenBuildingUsesRemaining: {
                ...next.hiddenBuildingUsesRemaining,
                [building]: (next.hiddenBuildingUsesRemaining[building] ?? 0) + uses,
              },
              // costOverride currently always 0 (free) in HIDDEN_EVENTS,
              // but the field exists for a future discounted-not-free
              // event -- placeBuilding always treats any hidden grant as
              // free (see its usingHiddenGrant branch), so a non-zero
              // costOverride isn't wired up yet. Flag if this ever
              // matters: would need placeBuilding to read it instead of
              // hardcoding 0.
              ...(costOverride !== undefined && costOverride !== 0
                ? { activityLog: addLog(next.activityLog, 'Note: costOverride != 0 is not yet implemented') }
                : {}),
            }
            break
          }
          case 'staff': {
            const { workerType, name, startingLevel } = config.reward
            const employee: Employee = {
              id: `hidden-${key}`,
              type: workerType,
              name,
              level: startingLevel,
              xp: 0,
              trait: 'veteran',
            }
            next = {
              ...next,
              employees: [...next.employees, employee],
              workerCounts: {
                ...next.workerCounts,
                [workerType]: next.workerCounts[workerType] + 1,
              },
            }
            break
          }
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
        // Every building with a ...ByLevel table in BUILDING_UPGRADE_BALANCE
        // is upgradeable. crudeTank/productTank/distillationUnit were the
        // original 3; laboratory/maintenanceWorkshop/salesOffice had tables
        // but were missing from this list (their bonuses were stuck at Lv1
        // in normal play); lubricantPlant/jetFuelPlant/petrochemicalPlant/
        // polymerPlant are the new Production Complexity Expansion tables
        // (Lv1 = no bonus, so this is backward compatible -- existing saves
        // at Lv1 see no change until the player upgrades).
        const isUpgradeable =
          cell === 'crudeTank' ||
          cell === 'productTank' ||
          cell === 'distillationUnit' ||
          cell === 'laboratory' ||
          cell === 'maintenanceWorkshop' ||
          cell === 'salesOffice' ||
          cell === 'lubricantPlant' ||
          cell === 'jetFuelPlant' ||
          cell === 'petrochemicalPlant' ||
          cell === 'polymerPlant'
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
        if (current.refineryLevel >= MAX_REFINERY_LEVEL) return current
        const cost = getUpgradeCost(current.refineryLevel)
        const requiredProduction = getUpgradeProductionRequirement(current.refineryLevel)
        const requiredReputation = getUpgradeReputationRequirement(current.refineryLevel)
        const requiredResearch = getUpgradeResearchRequirement(current.refineryLevel)
        if (current.money < cost) return current
        if (current.totalGasolineProduced < requiredProduction) return current
        if (current.reputation < requiredReputation) return current
        if (current.unlockedResearchIds.length < requiredResearch) return current
        const next = applyWinGoal({
          ...current,
          money: current.money - cost,
          refineryLevel: current.refineryLevel + 1,
          upgradePoints: current.upgradePoints + 1,
        })
        if (
          next.refineryLevel >= SPECIALIZATION_BALANCE.unlockLevel &&
          !next.specialization &&
          !pendingChoiceEventRef.current
        ) {
          const event = CHOICE_EVENTS.specializationChoice
          pendingChoiceEventRef.current = event
          setPendingChoiceEvent(event)
        }
        return next
      }),
    [update],
  )

  const expandGrid = useCallback(
    () =>
      update((current) => {
        const nextLevel = current.gridExpansionLevel + 1
        if (nextLevel >= EXPANSION_BALANCE.length) return current
        const currentEntry = EXPANSION_BALANCE[current.gridExpansionLevel]
        const nextEntry = EXPANSION_BALANCE[nextLevel] as PaidExpansionEntry
        if (current.money < nextEntry.cost || current.refineryLevel < nextEntry.requiresRefineryLevel) {
          return current
        }
        return applyWinGoal({
          ...current,
          money: current.money - nextEntry.cost,
          gridExpansionLevel: nextLevel,
          grid: remapAnchoredSquareArray(current.grid, currentEntry.size, nextEntry.size, null),
          gridLevels: remapAnchoredSquareArray(current.gridLevels, currentEntry.size, nextEntry.size, 1),
          assignments: remapAnchoredSquareAssignments(current.assignments, currentEntry.size, nextEntry.size),
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
        const cap = getMaxHireCount(current.refineryLevel)
        if (current.workerCounts[worker.key] >= cap) return current
        const mentorBonus = current.mentorXpBonus?.[worker.key] ?? 0
        const base = createNewEmployee(current.employees, worker.key)
        const newEmployee = {
          ...base,
          xp: base.xp + mentorBonus,
          hiredOnYear: current.businessYear,
        }
        const nextMentorXpBonus = mentorBonus > 0
          ? { ...current.mentorXpBonus, [worker.key]: 0 }
          : current.mentorXpBonus
        return applyMilestones({
          ...current,
          money: current.money - worker.cost,
          staffMorale: clampMorale(current.staffMorale + MORALE_BALANCE.hireBoost),
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [worker.key]: current.workerCounts[worker.key] + 1,
          },
          employees: [...current.employees, newEmployee],
          mentorXpBonus: nextMentorXpBonus,
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

        const cap = getMaxHireCount(current.refineryLevel)
        if (current.workerCounts[candidate.type] >= cap) return current

        const mentorBonus = current.mentorXpBonus?.[candidate.type] ?? 0
        const baseCandidate = hireCandidateEmployee(current.employees, candidate)
        const newEmployee = {
          ...baseCandidate,
          xp: baseCandidate.xp + mentorBonus,
          hiredOnYear: current.businessYear,
        }
        const nextMentorXpBonus = mentorBonus > 0
          ? { ...current.mentorXpBonus, [candidate.type]: 0 }
          : current.mentorXpBonus
        const replacement = generateRecruitmentPool(current.refineryLevel, current.recruitmentNameCounter)
        const recruitmentPool = [...current.recruitmentPool]
        recruitmentPool[slotIndex] = replacement.pool[0]

        return applyMilestones({
          ...current,
          money: current.money - candidate.cost,
          staffMorale: clampMorale(current.staffMorale + MORALE_BALANCE.hireBoost),
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [candidate.type]: current.workerCounts[candidate.type] + 1,
          },
          employees: [...current.employees, newEmployee],
          recruitmentPool,
          recruitmentNameCounter: current.recruitmentNameCounter + 1,
          mentorXpBonus: nextMentorXpBonus,
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

  // Feedstock Priority card (Refinery tab): adjust one downstream plant's
  // priority weight by +/- FEEDSTOCK_PRIORITY_BALANCE.step, clamped to
  // [min, max]. 0 = off (this plant never produces).
  const adjustFeedstockPriority = useCallback(
    (buildingKey: keyof GameState['feedstockPriority'], delta: number) =>
      update((current) => {
        const { min, max, step } = FEEDSTOCK_PRIORITY_BALANCE
        const next = Math.max(min, Math.min(max, current.feedstockPriority[buildingKey] + delta * step))
        if (next === current.feedstockPriority[buildingKey]) return current
        return {
          ...current,
          feedstockPriority: { ...current.feedstockPriority, [buildingKey]: next },
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

  // Per-Plant Staff Assignment (design doc Part A): assigns an employee to
  // a SPECIFIC grid cell, not a worker-type pool. Validates the cell holds
  // a building whose specialistWorker matches the employee's type
  // (including polymerEngineer -> polymerPlant, which isn't in
  // PLANT_PRODUCTION). Enforces "1 employee = at most 1 cell" by clearing
  // any previous assignment for this employee, and "1 cell = at most 1
  // employee" by overwriting whatever was on the target cell.
  const assignEmployeeToCell = useCallback(
    (employeeId: string, cellIndex: number) =>
      update((current) => {
        const employee = current.employees.find((e) => e.id === employeeId)
        if (!employee) return current
        const cell = current.grid[cellIndex]
        if (!cell) return current
        const expectedWorker =
          cell === 'polymerPlant' ? 'polymerEngineer' : PLANT_PRODUCTION.find((p) => p.buildingKey === cell)?.specialistWorker
        if (expectedWorker !== employee.type) return current
        const nextAssignments = { ...current.assignments }
        // Clear this employee's previous cell, if any.
        for (const key of Object.keys(nextAssignments)) {
          if (nextAssignments[Number(key)] === employeeId) delete nextAssignments[Number(key)]
        }
        nextAssignments[cellIndex] = employeeId
        return { ...current, assignments: nextAssignments }
      }),
    [update],
  )

  const unassignCell = useCallback(
    (cellIndex: number) =>
      update((current) => {
        if (!(cellIndex in current.assignments)) return current
        const nextAssignments = { ...current.assignments }
        delete nextAssignments[cellIndex]
        return { ...current, assignments: nextAssignments }
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
    (option: ShipmentOption) => update((current) => orderShipmentFn(current, option)),
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
    flowSamplesRef.current = []
    setFlowRates({ moneyPerMin: 0, gasPerMin: 0 })
    setMoneyHistory([])
  }, [])

  // Prestige / New Game+: fresh run keeping the (bumped) prestige level for a
  // permanent production bonus. Only offered once Industry Legend is reached.
  const prestige = useCallback(() => {
    setGame((current) => {
      const next = current ? prestigeGame(current) : createInitialGameState()
      gameRef.current = next
      return next
    })
    flowSamplesRef.current = []
    setFlowRates({ moneyPerMin: 0, gasPerMin: 0 })
    setMoneyHistory([])
  }, [])

  // Cycles 1x → 2x → 3x → ⏸(0) → 1x. The factory screen's speed button calls
  // this; the label reads `speed` to show the current state.
  const cycleSpeed = useCallback(() => {
    setSpeed((s) => (s >= 3 ? 0 : s + 1))
  }, [])

  return {
    game,
    loaded,
    hasSave,
    speed,
    cycleSpeed,
    autoTrade,
    updateAutoTrade,
    flowRates,
    moneyHistory,
    derived: game ? calculateDerivedStats(game) : null,
    pendingChoiceEvent,
    pendingAward,
    pendingEraBanner,
    pendingMilestoneHeadline,
    pendingWinCelebration,
    pendingLegendCelebration,
    pendingComboDiscovery,
    synergyToastKey,
    pendingHiddenEventUnlock,
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
    expandGrid,
    unlockResearch,
    installPerk,
    hireWorker,
    hireCandidate,
    refreshRecruitmentPool,
    activateBoost,
    adjustFeedstockPriority,
    trainEmployee,
    assignEmployeeToCell,
    unassignCell,
    produceAsphalt,
    fulfillStandingOrder,
    buyShipment,
    chooseEventOption,
    completeContract: (contract: Contract) =>
      update((current) => {
        if (current.refineryLevel < contract.unlockLevel) return current
        if (current.completedContractIds.includes(contract.id)) return current

        type ProductCost = { key: keyof typeof current.productInventory; need: number }
        const allCosts: ProductCost[] = [
          { key: 'petrochemicals', need: contract.petrochemicalsRequired ?? 0 },
          { key: 'lubricants', need: contract.lubricantsRequired ?? 0 },
          { key: 'jetFuel', need: contract.jetFuelRequired ?? 0 },
          { key: 'asphalt', need: contract.asphaltRequired ?? 0 },
          { key: 'recycledMaterial', need: contract.recycledMaterialRequired ?? 0 },
          { key: 'plasticPellets', need: contract.plasticPelletsRequired ?? 0 },
        ]
        const costs = allCosts.filter((c): c is ProductCost => c.need > 0)

        for (const c of costs) {
          if (current.productInventory[c.key] < c.need) return current
        }
        const isProductContract = costs.length > 0
        if (!isProductContract && current.gasoline < contract.gasolineRequired) return current

        const stats = calculateDerivedStats(current)
        const reward = Math.round(contract.reward * stats.contractRewardMultiplier)
        const rpReward = Math.round(contract.rpReward * stats.contractRpRewardMultiplier)

        const productInventory = { ...current.productInventory }
        for (const c of costs) {
          productInventory[c.key] -= c.need
        }

        return applyWinGoal(applyMilestones({
          ...current,
          gasoline: isProductContract ? current.gasoline : current.gasoline - contract.gasolineRequired,
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
    prestige,
    dismissAward: () => setPendingAward(null),
    dismissEraBanner: () => setPendingEraBanner(null),
    dismissMilestoneHeadline: () => setPendingMilestoneHeadline(null),
    fixCrisis: () =>
      update((current) => {
        if (!current.activeCrisis) return current
        const cost = current.activeCrisis.fixCost
        if (current.money < cost) return current
        return { ...current, money: current.money - cost, activeCrisis: null }
      }),
    ignoreCrisis: () =>
      update((current) => {
        if (!current.activeCrisis) return current
        return applyCrisisPenalty(current)
      }),
    dismissWinCelebration: () => setPendingWinCelebration(false),
    dismissLegendCelebration: () => setPendingLegendCelebration(false),
    dismissComboDiscovery: () => setPendingComboDiscovery(null),
    dismissHiddenEventUnlock: () => setPendingHiddenEventUnlock(null),
  }
}
