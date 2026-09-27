// RN-free economic tick + auto-trade, extracted from useGameLoop so a headless
// balance sim can run the real per-tick economy end to end (useGameLoop imports
// react-native/AsyncStorage, which a Node sim can't load). Behaviour is identical
// to the in-hook versions; this file is the single source of truth now.
import type { GameState, DerivedStats, BuildingType } from '../types'
import { SELLABLE_PRODUCTS, type SellableProductKey } from '../data/products'
import {
  AUTO_TRADE_BUFFER_PERCENT,
  TICK_MS,
  calculateDerivedStats,
  applyMilestones,
  applyProductSaturation,
  recoverProductMarket,
  getProductMarketLevel,
  getProductSellPrice,
  getProductMaxStorage,
  getTotalCellOutput,
  getPowerGenerationStats,
  getWasteGeneratedPerTick,
  getWasteOverflowEsgPenalty,
  getEsgDrift,
  getDemandShiftDelta,
} from './gameCalculations'
import {
  MARKET_BALANCE,
  BONUS_BALANCE,
  FEEDSTOCK_BALANCE,
  POWER_PLANT_BALANCE,
  WASTE_TREATMENT_PLANT_BALANCE,
  POLYMER_PLANT_BALANCE,
  PLANT_PRODUCTION,
  BOOST_BALANCE,
  ESG_BALANCE,
  DEMAND_SHIFT_BALANCE,
} from '../data/balance'

export type AutoTradeSettings = {
  enabled: boolean // master switch (the AUTO button)
  // Per-stream on/off, gated under `enabled`. Let the player auto-buy crude but
  // hand-sell gas, or auto-sell only some products. Missing = on (default).
  crudeBuyEnabled: boolean
  gasolineSellEnabled: boolean
  productSellEnabled: Partial<Record<SellableProductKey, boolean>>
  buyThreshold: number // 0-100, % of maxCrudeStorage below which to top up
  sellThreshold: number // 0-100, % of maxGasolineStorage above which to sell down to
  // One threshold per secondary product (lubricants, jetFuel,
  // petrochemicals, recycledMaterial, plasticPellets), same meaning as
  // sellThreshold above but for that product's own storage cap. Only
  // acted on for products the player actually has a plant for (checked
  // via buildingCounts in applyAutoTrade) -- a missing/undefined entry
  // here just means "use the default", not "off"; per-product on/off
  // isn't separately tracked since there's no real reason to want
  // crude/gasoline auto-trade on but a specific secondary product's
  // auto-sell off while the master switch is on.
  productSellThresholds: Partial<Record<SellableProductKey, number>>
}

export const DEFAULT_PRODUCT_SELL_THRESHOLD = 80

// Highest crude auto-buy threshold. At a literal 100% the top-up refilled every
// tick, pinning crude to full (the "crude never drains" bug report). Capping
// just under 100 guarantees a visible buy→drain cycle.
export const CRUDE_BUY_THRESHOLD_MAX = 95

type WorkRequest = {
  key: string
  outputProduct: SellableProductKey
  outputAtFullWork: number
  input: 'feedstock' | 'petrochemicals'
  inputAtFullWork: number
  electricityAtFullWork: number
  weight: number
  maxWorkFraction: number
}

/**
 * Progressively shares one scarce resource between requests. Each returned
 * fraction is in [0, request.maxWorkFraction]. A request that reaches its cap
 * releases the rest of its share to the other requests. This makes the result
 * deterministic, bounded by the actual resource pool, and independent of the
 * order in which product types happen to be listed below.
 */
export function allocateWeightedWork(
  requests: WorkRequest[],
  available: number,
  demand: (request: WorkRequest) => number,
): number[] {
  const fractions = requests.map(() => 0)
  let remainingResource = Math.max(0, available)
  let active = requests
    .map((request, index) => ({ request, index }))
    .filter(({ request }) => request.maxWorkFraction > 0 && demand(request) > 0)

  while (active.length > 0 && remainingResource > 1e-9) {
    const weightedDemand = active.reduce(
      (sum, { request }) => sum + demand(request) * Math.max(0, request.weight),
      0,
    )
    if (weightedDemand <= 0) break

    const capped: typeof active = []
    for (const entry of active) {
      const { request, index } = entry
      const proposed = remainingResource * Math.max(0, request.weight) / weightedDemand
      const room = request.maxWorkFraction - fractions[index]
      if (proposed >= room - 1e-9) capped.push(entry)
    }

    if (capped.length === 0) {
      for (const { request, index } of active) {
        fractions[index] += remainingResource * Math.max(0, request.weight) / weightedDemand
      }
      remainingResource = 0
      break
    }

    const cappedIndexes = new Set(capped.map(({ index }) => index))
    for (const { request, index } of capped) {
      const added = Math.max(0, request.maxWorkFraction - fractions[index])
      fractions[index] += added
      remainingResource -= added * demand(request)
    }
    active = active.filter(({ index }) => !cappedIndexes.has(index))
  }

  return fractions.map((fraction, index) =>
    Math.max(0, Math.min(requests[index].maxWorkFraction, fraction)),
  )
}

// Maps each secondary product to the building that produces it (used to
// gate auto-sell on "does the player actually have this plant") and to a
// getter for that product's max storage field on DerivedStats (each
// product has its own differently-named maxXStorage field, so this is
// just a lookup table rather than a switch repeated at every call site).
const PRODUCT_PLANT_BUILDING: Record<SellableProductKey, BuildingType> = {
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
  petrochemicals: 'petrochemicalPlant',
  recycledMaterial: 'wasteTreatmentPlant',
  plasticPellets: 'polymerPlant',
}

const PRODUCT_MAX_STORAGE_KEY: Record<SellableProductKey, (stats: DerivedStats) => number> = {
  lubricants: (stats) => stats.maxLubricantsStorage,
  jetFuel: (stats) => stats.maxJetFuelStorage,
  petrochemicals: (stats) => stats.maxPetrochemicalsStorage,
  recycledMaterial: (stats) => stats.maxRecycledMaterialStorage,
  plasticPellets: (stats) => stats.maxPlasticPelletsStorage,
}

// Saturation-aware auto-sell target. Returns the storage % to sell DOWN to, or
// null to hold this tick. When the market is healthy, sell to the threshold as
// before; when the price is already depressed, HOLD for recovery — but still
// dump down to the overflow guard once the tank is nearly full, so production is
// never wasted to a full tank (a balance sim showed pure "hold below floor"
// loses ~54% under overproduction). Shared by gasoline and every secondary product.
function autoSellTargetPct(stockPct: number, sellThreshold: number, marketLevel: number): number | null {
  if (stockPct <= sellThreshold) return null
  if (marketLevel >= MARKET_BALANCE.autoSellMarketFloor) {
    return Math.max(0, sellThreshold - AUTO_TRADE_BUFFER_PERCENT)
  }
  if (stockPct > MARKET_BALANCE.autoSellOverflowGuardPct) {
    return Math.max(0, MARKET_BALANCE.autoSellOverflowGuardPct - AUTO_TRADE_BUFFER_PERCENT)
  }
  return null
}

// Pure, exported for testing. Runs after the main tick: top up crude toward
// buyThreshold% (limited by cash + storage), then sell gasoline down to
// sellThreshold% if it's currently above that.
export function applyAutoTrade(current: GameState, settings: AutoTradeSettings, precomputedStats?: DerivedStats): GameState {
  if (!settings.enabled) return current
  const stats = precomputedStats ?? calculateDerivedStats(current)
  let next = current

  if (settings.crudeBuyEnabled && stats.maxCrudeStorage > 0) {
    const crudePct = (next.crudeOil / stats.maxCrudeStorage) * 100
    // Cap the effective buy threshold below 100 so crude always drains a little
    // before the next top-up — at a literal 100% it refilled every tick and
    // looked frozen (reported bug).
    const effBuyThreshold = Math.min(settings.buyThreshold, CRUDE_BUY_THRESHOLD_MAX)
    if (crudePct < effBuyThreshold) {
      // Overshoot to threshold + buffer (not exactly the threshold) so
      // crude visibly drains back down via production before the next
      // top-up, instead of being corrected to the same number every tick.
      const targetPct = Math.min(100, effBuyThreshold + AUTO_TRADE_BUFFER_PERCENT)
      const targetCrude = Math.floor((targetPct / 100) * stats.maxCrudeStorage)
      const needed = Math.max(0, targetCrude - next.crudeOil)
      // Dynamic Market: auto-buy at the current spot price (no timing edge --
      // manual buying when crude is cheap can still beat auto-trade).
      const affordable = Math.floor(next.money / stats.crudePrice)
      const space = stats.maxCrudeStorage - next.crudeOil
      const amount = Math.min(needed, affordable, space)
      if (amount > 0) {
        next = {
          ...next,
          money: next.money - amount * stats.crudePrice,
          crudeOil: next.crudeOil + amount,
          everBoughtCrude: true,
        }
      }
    }
  }

  if (settings.gasolineSellEnabled && stats.maxGasolineStorage > 0) {
    const gasolinePct = (next.gasoline / stats.maxGasolineStorage) * 100
    // B2: gasoline is the high-volume COMMODITY line — overproduced ~4x vs what
    // the market absorbs, and its margin is thin (downstream carries the profit).
    // The saturation-aware HOLD (used for the high-value products below) just
    // stalls gasoline production against a full tank, starving the lifetime-
    // gasoline endgame goal and contract supply — and an earlier sim showed
    // dumping gasoline nets *more* than holding under overproduction anyway. So
    // keep gasoline flowing: plain sell-down-to-threshold, throughput over price.
    const targetPct = gasolinePct > settings.sellThreshold
      ? Math.max(0, settings.sellThreshold - AUTO_TRADE_BUFFER_PERCENT)
      : null
    if (targetPct !== null) {
      const targetGasoline = Math.floor((targetPct / 100) * stats.maxGasolineStorage)
      const excess = Math.max(0, next.gasoline - targetGasoline)
      if (excess > 0) {
        next = {
          ...next,
          gasoline: next.gasoline - excess,
          money: next.money + excess * stats.sellPrice,
          // Credit production sales to the annual award's "money earned" (it
          // previously counted only contracts/standing orders -- the core sell
          // loop was invisible to the award score).
          yearStats: { ...next.yearStats, moneyEarned: next.yearStats.moneyEarned + excess * stats.sellPrice },
          productMarket: applyProductSaturation(next.productMarket, 'gasoline', excess),
        }
      }
    }
  }

  // Same threshold/buffer/overshoot pattern as gasoline above, but for
  // each of the 5 secondary products (lubricants, jetFuel,
  // petrochemicals, recycledMaterial, plasticPellets) -- this is what
  // lets a player who's built e.g. a Lubricant Plant stop manually
  // tapping the sell chip every few minutes once Auto-trade is on. Only
  // acts on a product if the player has at least one of its producing
  // plant (checked via the same buildingCounts the rest of the game uses
  // for "is this plant built yet" gating) -- no point auto-selling a
  // product that's permanently at 0 because there's nothing producing
  // it, and showing an active threshold for it would be confusing UI
  // noise on top of being a no-op.
  for (const product of SELLABLE_PRODUCTS) {
    if (settings.productSellEnabled[product.key] === false) continue // per-product off
    const plantBuilding = PRODUCT_PLANT_BUILDING[product.key]
    if ((stats.buildingCounts[plantBuilding] ?? 0) <= 0) continue
    const maxStorage = PRODUCT_MAX_STORAGE_KEY[product.key](stats)
    if (maxStorage <= 0) continue
    const threshold = settings.productSellThresholds[product.key] ?? DEFAULT_PRODUCT_SELL_THRESHOLD
    const have = next.productInventory[product.key]
    const pct = (have / maxStorage) * 100
    // Saturation-aware (same rule as gasoline): hold for recovery while the
    // price is depressed, but still dump to avoid overflow.
    const targetPct = autoSellTargetPct(pct, threshold, getProductMarketLevel(next, product.key))
    if (targetPct === null) continue
    const targetAmount = Math.floor((targetPct / 100) * maxStorage)
    const excess = Math.max(0, have - targetAmount)
    if (excess <= 0) continue
    const demandMultiplier = product.key === 'petrochemicals' ? next.petrochemicalsDemandMultiplier : 1
    // Dynamic Market: effective price includes this product's saturation, and
    // the auto-sell pushes that saturation down further.
    const price = Math.round(
      getProductSellPrice(product.key, stats.productSellMultiplier, demandMultiplier) *
        getProductMarketLevel(next, product.key),
    )
    if (price <= 0) continue
    next = {
      ...next,
      productInventory: { ...next.productInventory, [product.key]: have - excess },
      money: next.money + excess * price,
      yearStats: { ...next.yearStats, moneyEarned: next.yearStats.moneyEarned + excess * price },
      productMarket: applyProductSaturation(next.productMarket, product.key, excess),
    }
  }

  return next
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
  let electricity = current.electricity
  let productInventory = current.productInventory

  // --- Production Complexity Expansion Phase 1: waste byproduct ---
  // Dirty buildings emit waste each tick, capped by storage. Computed
  // early so the Waste Treatment Plant block below can consume it.
  const wasteGenerated = getWasteGeneratedPerTick(stats.buildingCounts)
  let waste = Math.min(current.waste + wasteGenerated, stats.maxWasteStorage)

  // --- Distillation: crude -> feedstock ---
  // Feedstock has no use before the player owns a downstream plant. Running
  // this line in the Lv1-4 starter refinery burned 3 crude/second into an
  // unsellable stockpile, making the opening loop lose roughly $1,200/minute.
  // Keep the gasoline speed benefit of Distillation Units, but only start the
  // separate feedstock line once there is a real consumer on the grid.
  const hasFeedstockConsumer =
    stats.buildingCounts.lubricantPlant > 0 ||
    stats.buildingCounts.jetFuelPlant > 0 ||
    stats.buildingCounts.petrochemicalPlant > 0
  if (
    hasFeedstockConsumer &&
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

  // --- Site power + owned generators ---
  // The permanent site connection is always explicit. Owned generators add
  // level-based supply/capacity; building the first one never introduces a new
  // gasoline tax. Generation is partial when fuel/space is partial and a full
  // battery burns no crude.
  if (nextTick % POWER_PLANT_BALANCE.intervalTicks === 0) {
    const generation = getPowerGenerationStats(current)
    let electricitySpace = Math.max(0, generation.storageCapacity - electricity)
    const siteMade = Math.min(generation.siteSupplyPerCycle, electricitySpace)
    electricity += siteMade
    electricitySpace -= siteMade

    if (generation.generatorSupplyPerCycle > 0 && electricitySpace > 1e-9) {
      const boostMultiplier = current.tickCount < current.boostActiveUntilTick ? BOOST_BALANCE.productionMultiplier : 1
      const progressAtGasolineStep = current.productionProgress + TICK_MS * boostMultiplier
      const gasolineBatchesDue = Math.min(
        Math.floor(progressAtGasolineStep / stats.productionInterval),
        Math.max(0, stats.maxGasolineStorage - current.gasoline),
      )
      const gasolineCrudeReserve = Math.min(crudeOil, gasolineBatchesDue)
      const generatorFuelAvailable = Math.max(0, crudeOil - gasolineCrudeReserve)
      const scale = Math.min(
        1,
        generation.generatorCrudePerCycle > 0 ? generatorFuelAvailable / generation.generatorCrudePerCycle : 0,
        electricitySpace / generation.generatorSupplyPerCycle,
      )
      if (scale > 1e-9) {
        crudeOil -= generation.generatorCrudePerCycle * scale
        electricity += generation.generatorSupplyPerCycle * scale
      }
    }
  }

  // --- Waste Treatment Plant: waste -> recycledMaterial (Production
  // Complexity Expansion Phase 1) ---
  // Same 25-tick (5s) cadence as the downstream plants. Separate from the
  // PLANT_PRODUCTION loop since its input is `waste` (not `feedstock`) and
  // it has no specialist worker. Purely additive.
  {
    const wasteTreatmentCount = stats.buildingCounts.wasteTreatmentPlant
    if (wasteTreatmentCount > 0 && nextTick % WASTE_TREATMENT_PLANT_BALANCE.intervalTicks === 0) {
      const wasteNeeded = wasteTreatmentCount * WASTE_TREATMENT_PLANT_BALANCE.wastePerCycle
      const recycledSpace = stats.maxRecycledMaterialStorage - productInventory.recycledMaterial
      if (waste >= wasteNeeded && recycledSpace > 0) {
        const produced = Math.min(
          wasteTreatmentCount * WASTE_TREATMENT_PLANT_BALANCE.recycledMaterialPerCycle,
          recycledSpace,
        )
        if (produced > 0) {
          waste -= wasteNeeded
          productInventory = {
            ...productInventory,
            recycledMaterial: productInventory.recycledMaterial + produced,
          }
        }
      }
    }
  }

  // --- Atomic advanced processing plan ---
  // Build every due request first, share its input and electricity pools, then
  // commit input/output from the exact same work fraction. Polymer participates
  // in the electricity allocation instead of consuming first by update order.
  // R0 preserves the legacy "power is enforced once a generator exists" rule;
  // V3-02 replaces that switch with an explicit permanent site supply.
  const workRequests: WorkRequest[] = []
  for (const plant of PLANT_PRODUCTION) {
    const plantCount = stats.buildingCounts[plant.buildingKey]
    const weight = current.feedstockPriority[plant.buildingKey] ?? 1
    if (plantCount <= 0 || weight <= 0 || nextTick % plant.intervalTicks !== 0) continue
    const outputAtFullWork = getTotalCellOutput(
      current,
      plant.buildingKey,
      plant.outputPerCycle,
      plant.specialistWorker,
      plant.specialistBonusRate,
    )
    const outputSpace = Math.max(0, getProductMaxStorage(stats, plant.productKey) - productInventory[plant.productKey])
    workRequests.push({
      key: plant.buildingKey,
      outputProduct: plant.productKey,
      outputAtFullWork,
      input: 'feedstock',
      inputAtFullWork: plantCount * plant.feedstockPerCycle,
      electricityAtFullWork: plantCount * plant.electricityPerCycle,
      weight,
      maxWorkFraction: outputAtFullWork > 0 ? Math.min(1, outputSpace / outputAtFullWork) : 0,
    })
  }

  const polymerPlantCount = stats.buildingCounts.polymerPlant
  if (polymerPlantCount > 0 && nextTick % POLYMER_PLANT_BALANCE.intervalTicks === 0) {
    const outputAtFullWork = getTotalCellOutput(
      current,
      'polymerPlant',
      POLYMER_PLANT_BALANCE.plasticPelletsPerCycle,
      'polymerEngineer',
      BONUS_BALANCE.polymerEngineerPlasticPelletsBonusRate,
    )
    const outputSpace = Math.max(0, stats.maxPlasticPelletsStorage - productInventory.plasticPellets)
    workRequests.push({
      key: 'polymerPlant',
      outputProduct: 'plasticPellets',
      outputAtFullWork,
      input: 'petrochemicals',
      inputAtFullWork: polymerPlantCount * POLYMER_PLANT_BALANCE.petrochemicalsPerCycle,
      electricityAtFullWork: polymerPlantCount * POLYMER_PLANT_BALANCE.electricityPerCycle,
      weight: 1,
      maxWorkFraction: outputAtFullWork > 0 ? Math.min(1, outputSpace / outputAtFullWork) : 0,
    })
  }

  if (workRequests.length > 0) {
    const downstreamIndexes = workRequests
      .map((request, index) => ({ request, index }))
      .filter(({ request }) => request.input === 'feedstock')
    const downstreamRequests = downstreamIndexes.map(({ request }) => request)
    const downstreamFractions = allocateWeightedWork(
      downstreamRequests,
      feedstock,
      (request) => request.inputAtFullWork,
    )
    const inputFractions = workRequests.map(() => 0)
    downstreamIndexes.forEach(({ index }, localIndex) => {
      inputFractions[index] = downstreamFractions[localIndex]
    })
    workRequests.forEach((request, index) => {
      if (request.input === 'petrochemicals') {
        inputFractions[index] = request.inputAtFullWork > 0
          ? Math.min(request.maxWorkFraction, productInventory.petrochemicals / request.inputAtFullWork)
          : 0
      }
    })

    const electricityIsEnforced = true
    const electricityRequests = workRequests.map((request, index) => ({
      ...request,
      maxWorkFraction: inputFractions[index],
    }))
    const workFractions = electricityIsEnforced
      ? allocateWeightedWork(electricityRequests, electricity, (request) => request.electricityAtFullWork)
      : inputFractions

    let feedstockConsumed = 0
    let petrochemicalsConsumed = 0
    let electricityConsumed = 0
    workRequests.forEach((request, index) => {
      const fraction = Math.max(0, Math.min(request.maxWorkFraction, workFractions[index]))
      if (fraction <= 1e-9) return
      const produced = request.outputAtFullWork * fraction
      productInventory = {
        ...productInventory,
        [request.outputProduct]: productInventory[request.outputProduct] + produced,
      }
      if (request.input === 'feedstock') feedstockConsumed += request.inputAtFullWork * fraction
      else petrochemicalsConsumed += request.inputAtFullWork * fraction
      if (electricityIsEnforced) electricityConsumed += request.electricityAtFullWork * fraction
    })
    feedstock = Math.max(0, feedstock - feedstockConsumed)
    productInventory = {
      ...productInventory,
      petrochemicals: Math.max(0, productInventory.petrochemicals - petrochemicalsConsumed),
    }
    if (electricityIsEnforced) electricity = Math.max(0, electricity - electricityConsumed)
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
  // Per-year gasoline output for the annual award. This was declared, weighted
  // (AWARDS_BALANCE.weights.perGasoline) and read in getAwardScore, but never
  // incremented anywhere -- so the gasoline term of the award was always 0.
  let yearGasolineProduced = current.yearStats.gasolineProduced

  if (nextProgress >= interval) {
    const storageRoom = stats.maxGasolineStorage - gasoline
    const batchesProduced = Math.min(
      Math.floor(nextProgress / interval),
      crudeOil,
      storageRoom,
    )

    if (batchesProduced >= 1) {
      const perkYieldMultiplier =
        (1 + stats.perkProductionBonusRate) * stats.prestigeOutputMultiplier * stats.speedOverflowYieldMultiplier
      const rawYield = batchesProduced * perkYieldMultiplier + gasolineYieldCarry
      const produced = Math.min(Math.floor(rawYield), storageRoom)
      gasolineYieldCarry = produced === Math.floor(rawYield) ? rawYield - produced : 0

      crudeOil -= batchesProduced
      gasoline += produced
      totalGasolineProduced += produced
      yearGasolineProduced += produced

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
  // Production Complexity Expansion Phase 1: waste at/over cap (after any
  // Waste Treatment Plant processing above) applies an extra ESG penalty
  // this tick, on top of the dirty-building drift.
  const wasteOverflowPenalty = getWasteOverflowEsgPenalty(waste, stats.maxWasteStorage)
  const esgScore = Math.max(
    ESG_BALANCE.minScore,
    Math.min(ESG_BALANCE.maxScore, current.esgScore + esgDelta + wasteOverflowPenalty),
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

  // Dynamic Market: product demand-saturation recovers toward full price each
  // tick (selling pushes it down, see the sell handlers / auto-trade).
  const productMarket = recoverProductMarket(current.productMarket)

  return applyMilestones({
    ...current,
    tickCount: nextTick,
    crudeOil,
    feedstock,
    electricity,
    waste,
    productInventory,
    gasoline,
    productionProgress,
    gasolineYieldCarry,
    totalGasolineProduced,
    yearStats: { ...current.yearStats, gasolineProduced: yearGasolineProduced },
    esgScore,
    gasolineDemandMultiplier,
    petrochemicalsDemandMultiplier,
    productMarket,
  })
}
