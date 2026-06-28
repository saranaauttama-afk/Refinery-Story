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
  PRODUCTION_BALANCE,
  BOOST_BALANCE,
  ESG_BALANCE,
  DEMAND_SHIFT_BALANCE,
} from '../data/balance'

export type AutoTradeSettings = {
  enabled: boolean
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

  if (stats.maxCrudeStorage > 0) {
    const crudePct = (next.crudeOil / stats.maxCrudeStorage) * 100
    if (crudePct < settings.buyThreshold) {
      // Overshoot to threshold + buffer (not exactly the threshold) so
      // crude visibly drains back down via production before the next
      // top-up, instead of being corrected to the same number every tick.
      const targetPct = Math.min(100, settings.buyThreshold + AUTO_TRADE_BUFFER_PERCENT)
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

  if (stats.maxGasolineStorage > 0) {
    const gasolinePct = (next.gasoline / stats.maxGasolineStorage) * 100
    // Saturation-aware (see autoSellTargetPct): hold when gasoline's price is
    // depressed, but still dump to avoid overflow; undershoot to target - buffer
    // so it visibly refills before the next sell-off.
    const targetPct = autoSellTargetPct(gasolinePct, settings.sellThreshold, getProductMarketLevel(next, 'gasoline'))
    if (targetPct !== null) {
      const targetGasoline = Math.floor((targetPct / 100) * stats.maxGasolineStorage)
      const excess = Math.max(0, next.gasoline - targetGasoline)
      if (excess > 0) {
        next = {
          ...next,
          gasoline: next.gasoline - excess,
          money: next.money + excess * stats.sellPrice,
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

  // --- Power Plant: crude -> electricity (Production Complexity Expansion
  // Phase 2) ---
  // Burns crude (not feedstock) every 25-tick (5s) cycle, same cadence as
  // downstream plants. Capped by maxElectricityStorage. With 0 Power
  // Plants built this block does nothing (powerPlantCount === 0), and
  // electricityDemand below is simply never enforced.
  const powerPlantCount = stats.buildingCounts.powerPlant
  if (powerPlantCount > 0 && nextTick % POWER_PLANT_BALANCE.intervalTicks === 0) {
    const crudeNeeded = powerPlantCount * POWER_PLANT_BALANCE.crudePerCycle
    const electricitySpace = stats.maxElectricityStorage - electricity
    if (crudeOil >= crudeNeeded && electricitySpace > 0) {
      const electricityMade = Math.min(
        powerPlantCount * POWER_PLANT_BALANCE.electricityPerCycle,
        electricitySpace,
      )
      if (electricityMade > 0) {
        crudeOil -= crudeNeeded
        electricity += electricityMade
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

  // --- Polymer Plant: petrochemicals -> plasticPellets (Production
  // Complexity Expansion Phase 3) ---
  // Same 25-tick (5s) cadence. Standalone block (not part of the shared
  // feedstock PLANT_PRODUCTION loop below) since its input is
  // `petrochemicals`, a different pool with its own dedicated
  // producer/consumer relationship -- 1 plant = 1 product, like every
  // other plant. Petrochemicals keeps its existing dual role: this
  // consumes from the same productInventory.petrochemicals that can also
  // be sold directly via sellProduct. polymerEngineer specialist (tier 3)
  // multiplies output, same pattern as chemicalEngineer/aviationSpecialist.
  {
    const polymerPlantCount = stats.buildingCounts.polymerPlant
    if (polymerPlantCount > 0 && nextTick % POLYMER_PLANT_BALANCE.intervalTicks === 0) {
      const petrochemicalsNeeded = polymerPlantCount * POLYMER_PLANT_BALANCE.petrochemicalsPerCycle
      const plasticPelletsSpace = stats.maxPlasticPelletsStorage - productInventory.plasticPellets
      // Production Complexity Expansion Phase 2/3 (completed): Polymer
      // Plant now also competes for the electricity pool, same as the 3
      // PLANT_PRODUCTION plants. Runs before the downstream-plants loop
      // below, so it draws from whatever Power Plants generated this tick
      // before downstream plants get their share -- same ordering as the
      // Waste Treatment Plant block above. With 0 Power Plants built,
      // electricitySufficient stays true (no-op).
      const electricityNeeded = polymerPlantCount * POLYMER_PLANT_BALANCE.electricityPerCycle
      const electricitySufficient = stats.buildingCounts.powerPlant <= 0 || electricity >= electricityNeeded
      if (
        productInventory.petrochemicals >= petrochemicalsNeeded &&
        plasticPelletsSpace > 0 &&
        electricitySufficient
      ) {
        const totalOutput = getTotalCellOutput(
          current,
          'polymerPlant',
          POLYMER_PLANT_BALANCE.plasticPelletsPerCycle,
          'polymerEngineer',
          BONUS_BALANCE.polymerEngineerPlasticPelletsBonusRate,
        )
        const produced = Math.min(Math.round(totalOutput), plasticPelletsSpace)
        if (produced > 0) {
          productInventory = {
            ...productInventory,
            petrochemicals: productInventory.petrochemicals - petrochemicalsNeeded,
            plasticPellets: productInventory.plasticPellets + produced,
          }
          if (stats.buildingCounts.powerPlant > 0) {
            electricity -= electricityNeeded
          }
        }
      }
    }
  }

  // --- Downstream plants: feedstock -> product ---
  // Feedstock is a single shared pool that lubricant/jet fuel/petrochem
  // all draw from every 25-tick (5s) cycle. Originally this was
  // first-come-first-served in a fixed order, which could leave one plant
  // type producing 0% for minutes while another produced 100%. Fixed to
  // proportional sharing (every eligible plant gets the same shareRatio of
  // its normal output), then extended here with player-adjustable
  // per-plant PRIORITY weights (Feedstock Priority card, Refinery tab,
  // feedstockPriority in GameState/FEEDSTOCK_PRIORITY_BALANCE):
  //
  // - priority = 0: this plant is excluded entirely -- never produces,
  //   never competes for feedstock, regardless of supply (a hard "off"
  //   switch for when the player doesn't want more of that product right
  //   now).
  // - priority = 1 (default, 100%): unchanged from the plain proportional
  //   split.
  // - priority > 1: this plant's *demand* is weighted up for the scarcity
  //   split below, so it gets a bigger slice of shareRatio (closer to its
  //   normal 100%) at the expense of lower-priority plants -- but its
  //   output is still capped at its own normal 100% (priority lets you
  //   reach full output sooner under scarcity, not exceed it).
  //
  // When supply >= total (unweighted) demand, every eligible plant still
  // gets its normal full output regardless of priority -- priority only
  // matters when plants are competing for a shortage.
  const eligiblePlants = PLANT_PRODUCTION.filter((plant) => {
    const plantCount = stats.buildingCounts[plant.buildingKey]
    if (plantCount <= 0 || nextTick % plant.intervalTicks !== 0) return false
    if ((current.feedstockPriority[plant.buildingKey] ?? 1) <= 0) return false
    return getProductMaxStorage(stats, plant.productKey) - productInventory[plant.productKey] > 0
  })
  const totalFeedstockDemand = eligiblePlants.reduce(
    (sum, plant) => sum + stats.buildingCounts[plant.buildingKey] * plant.feedstockPerCycle,
    0,
  )
  if (totalFeedstockDemand > 0 && feedstock > 0) {
    const sufficient = feedstock >= totalFeedstockDemand
    // Priority only changes the SPLIT during scarcity -- when supply is
    // sufficient, every plant gets full output regardless of weight, so
    // the weighted total is only needed in the scarce branch.
    const totalWeightedDemand = sufficient
      ? totalFeedstockDemand
      : eligiblePlants.reduce(
          (sum, plant) =>
            sum +
            stats.buildingCounts[plant.buildingKey] *
              plant.feedstockPerCycle *
              (current.feedstockPriority[plant.buildingKey] ?? 1),
          0,
        )
    const shareRatio = sufficient ? 1 : feedstock / totalWeightedDemand

    // --- Electricity throttle (Production Complexity Expansion Phase 2) ---
    // Independent second constraint on top of the feedstock shareRatio
    // above. Only enforced once the player has built >= 1 Power Plant --
    // before that, electricityShareRatio stays at 1 (no-op), so every save
    // without a Power Plant behaves exactly as before Phase 2.
    const totalElectricityDemand = eligiblePlants.reduce(
      (sum, plant) => sum + stats.buildingCounts[plant.buildingKey] * plant.electricityPerCycle,
      0,
    )
    const electricitySufficient =
      stats.buildingCounts.powerPlant <= 0 || electricity >= totalElectricityDemand
    const electricityShareRatio = electricitySufficient
      ? 1
      : totalElectricityDemand > 0
        ? electricity / totalElectricityDemand
        : 1
    const combinedShareRatio = Math.min(shareRatio, electricityShareRatio)
    const combinedSufficient = sufficient && electricitySufficient

    for (const plant of eligiblePlants) {
      const productSpace = getProductMaxStorage(stats, plant.productKey) - productInventory[plant.productKey]
      const priority = current.feedstockPriority[plant.buildingKey] ?? 1
      const normalOutput = getTotalCellOutput(
        current,
        plant.buildingKey,
        plant.outputPerCycle,
        plant.specialistWorker,
        plant.specialistBonusRate,
      )
      // Full share: round as before (preserves old behavior exactly when
      // both feedstock and electricity are sufficient). Reduced share:
      // floor of (normal output * priority * combinedShareRatio), capped
      // at the plant's own normal output so priority can only help it
      // reach 100% sooner, never exceed it. combinedShareRatio is the
      // tighter of the feedstock-scarcity ratio and the
      // electricity-scarcity ratio -- whichever resource is scarcer this
      // tick governs the throttle.
      const produced = combinedSufficient
        ? Math.min(Math.round(normalOutput), productSpace)
        : Math.min(
            Math.floor(normalOutput * priority * combinedShareRatio),
            Math.round(normalOutput),
            productSpace,
          )
      if (produced <= 0) continue

      productInventory = {
        ...productInventory,
        [plant.productKey]: productInventory[plant.productKey] + produced,
      }
    }
    feedstock = sufficient ? feedstock - totalFeedstockDemand : 0
    electricity = electricitySufficient
      ? electricity - totalElectricityDemand
      : 0
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
    // Production Complexity Expansion Phase 2 (completed): once the player
    // has built >= 1 Power Plant, Tier-1 gasoline production also competes
    // for the same electricity pool as the downstream plants -- capping
    // batchesProduced by however many batches the remaining electricity can
    // cover, same as the existing crudeOil/storageRoom caps. With 0 Power
    // Plants built, electricityBatchCap stays at Infinity (no-op), so every
    // save without a Power Plant behaves exactly as before this change.
    const electricityBatchCap =
      stats.buildingCounts.powerPlant > 0
        ? Math.floor(electricity / PRODUCTION_BALANCE.electricityPerGasolineBatch)
        : Infinity
    const batchesProduced = Math.min(
      Math.floor(nextProgress / interval),
      crudeOil,
      storageRoom,
      electricityBatchCap,
    )

    if (batchesProduced >= 1) {
      const perkYieldMultiplier =
        (1 + stats.perkProductionBonusRate) * stats.prestigeOutputMultiplier * stats.speedOverflowYieldMultiplier
      const rawYield = batchesProduced * perkYieldMultiplier + gasolineYieldCarry
      const produced = Math.min(Math.floor(rawYield), storageRoom)
      gasolineYieldCarry = produced === Math.floor(rawYield) ? rawYield - produced : 0

      crudeOil -= batchesProduced
      const electricityRemaining = stats.buildingCounts.powerPlant > 0 ? electricity - batchesProduced * PRODUCTION_BALANCE.electricityPerGasolineBatch : Infinity
      if (stats.buildingCounts.powerPlant > 0) {
        electricity = electricityRemaining
      }
      gasoline += produced
      totalGasolineProduced += produced

      productionProgress =
        crudeOil > 0 && gasoline < stats.maxGasolineStorage && electricityRemaining > 0
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
    esgScore,
    gasolineDemandMultiplier,
    petrochemicalsDemandMultiplier,
    productMarket,
  })
}
