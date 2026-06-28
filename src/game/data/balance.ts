// Early-game pacing and economy live here so tuning does not require
// searching through simulation code.

import type { BuildingType, ProductKey } from '../types'

export const CORE_BALANCE = {
  tickMs: 200,
  gridSize: 9,
  maxLogItems: 6,
  // Auto-trade buy/sell to "threshold +/- buffer" instead of snapping
  // exactly to the threshold every tick -- otherwise (since production
  // consumes/produces every tick too) the level gets corrected back to the
  // exact threshold every single tick and the displayed number never
  // visibly moves. With a buffer, crude oscillates between
  // [buyThreshold, buyThreshold + buffer] and gasoline between
  // [sellThreshold - buffer, sellThreshold] -- a visible sawtooth.
  autoTradeBufferPercent: 10,
  // Kept for reference; mobile fires random events on a tick-count check
  // instead (see randomEventIntervalTicks) so they stay in sync with the
  // main game loop (no real-time setInterval drift on background/resume).
  randomEventIntervalMs: 30000,
  // Random events (equipment wear, market blips, etc.) are checked every
  // ~30s of game time (150 ticks @ 200ms), and only actually fire if the
  // refinery is "active" (crudeOil > 0) -- an idle refinery with no crude
  // to process doesn't generate operational events.
  randomEventIntervalTicks: 150,
  // Choice events are primarily milestone-triggered (see
  // completedMilestoneKeys / hasNewMilestone in useGameLoop.ts) -- those
  // still fire immediately, uncapped, whenever a milestone completes.
  // This is a fallback: if a full in-game day (1800 ticks --
  // CALENDAR_BALANCE.dayLengthTicks) passes with no milestone and no
  // event currently shown, fire one anyway so longer gaps between
  // milestones still get occasional choice events, capped to roughly
  // once per in-game day rather than the previous ~4 real minutes
  // (1200 ticks), which worked out to ~1.5x per in-game day -- felt too
  // frequent per explicit feedback. Deliberately the same numeric value
  // as dayLengthTicks rather than importing CALENDAR_BALANCE here (would
  // create an import cycle between balance constants); if dayLengthTicks
  // ever changes, this should be revisited to match.
  choiceEventFallbackTicks: 1800,
} as const

// Demolish/Move/Swap buildings -- lets the player fix an early layout
// mistake or rearrange for a new Hidden Combo without losing the
// building's accumulated level/staff assignment (those travel WITH the
// building, see demolishBuilding/moveBuilding/swapBuildings in
// useGameLoop.ts).
export const GRID_EDIT_BALANCE = {
  // Demolish refunds a fraction of the ORIGINAL purchase cost (not
  // anything spent on upgrades) -- 50%, enough to make demolishing a
  // genuine mistake recoverable without making "buy then immediately
  // demolish for a discount loop" attractive (buying then demolishing
  // always nets a 50% loss).
  demolishRefundRate: 0.5,
  // Move (to an empty cell) and Swap (two occupied cells) are flat fees,
  // not tied to building cost -- intentionally much cheaper than
  // buy+demolish (which would cost the building's full price plus lose
  // the 50% demolish refund) so rearranging stays a viable alternative to
  // re-buying, not just a worse version of it.
  moveCost: 200,
  swapCost: 100,
} as const

// Active "🔥 Boost" button (mobile-only): a player-activated temporary
// production multiplier with a cooldown -- gives players something to
// actively tap instead of only waiting on auto-trade/ticks.
export const BOOST_BALANCE = {
  durationTicks: 150, // ~30s active (boosted gasoline production)
  // Total cycle from activation, including the active duration -- i.e.
  // ~90s of cooldown after the 30s boost ends before it's available again.
  cooldownTicks: 600,
  // Multiplies the gasoline-production clock while active (effectively
  // ~2x gasoline output rate).
  productionMultiplier: 2,
} as const

// In-game calendar clock (day/night cycle + day-of-week/day-of-month for
// Hidden Event trigger conditions). Deliberately INDEPENDENT of
// AWARDS_BALANCE.yearLengthTicks (the existing 12-real-minute "year" used
// for seasonal demand/awards) -- tying a 6-minute "day" to a 12-minute
// "year" would mean 1 year = 2 days, which doesn't read as a calendar at
// all. Instead this clock runs its own day/week/month cycle for flavor and
// Hidden Event timing only; it does not affect seasonal demand, awards, or
// any other existing system. Not meant to be calendar-accurate (no real
// "365 days" or leap years) -- day-of-month/day-of-week are just numbers
// derived from tickCount for trigger conditions to check against, tunable
// independently of each other.
export const CALENDAR_BALANCE = {
  // 1 in-game day = 6 real minutes = 1800 ticks @ 200ms/tick.
  dayLengthTicks: 1800,
  // Hour-of-day boundaries for the day/night visual tint (24-hour clock,
  // 0-23). 6 = sunrise (screen brightens), 18 = sunset (screen dims).
  dayStartHour: 6,
  nightStartHour: 18,
  // 7 in-game days per "week" (for weekday-based Hidden Event conditions).
  daysPerWeek: 7,
  // 30 in-game days per "month" (for day-of-month Hidden Event conditions).
  // Not tied to daysPerWeek (30 isn't a multiple of 7) -- intentional, this
  // is a flavor calendar, not a real one.
  daysPerMonth: 30,
} as const

export const EXPANSION_BALANCE = [
  { level: 0, size: 3, cells: 9 },
  { level: 1, size: 4, cells: 16, cost: 25000, requiresRefineryLevel: 5 },
  { level: 2, size: 5, cells: 25, cost: 100000, requiresRefineryLevel: 10 },
  // Grid Expansion Tier 4 (backlog item, see README "What's NOT done" for
  // the original discussion). Added once the "revisit" condition was met:
  // Production Complexity Expansion shipped 3 new building types (Power
  // Plant, Waste Treatment Plant, Polymer Plant), bringing the total to 12
  // -- a 5x5 (25-cell) grid is tight for that many building types plus
  // their dedicated Tank Farm storage buildings. Cost and level gate follow
  // the existing pattern (each tier roughly 4x the previous cost, gated
  // ~5-10 refinery levels past the previous tier's requirement).
  { level: 3, size: 6, cells: 36, cost: 400000, requiresRefineryLevel: 20 },
] as const

export type PaidExpansionEntry = {
  level: number
  size: number
  cells: number
  cost: number
  requiresRefineryLevel: number
}

export const STARTING_BALANCE = {
  money: 200,
  crudeOil: 5,
  reputation: 0,
} as const

// --- Dynamic Market (Roadmap feature 1) ---
// Crude spot price swings on a deterministic wave (replayable, derived from
// tickCount) so buying is a timing decision: stockpile when cheap. Each
// product also has a demand-saturation level (1.0 = full price): selling
// pushes it down and it recovers over time, so dumping a lot of one product
// crashes its own price -- the structural fix for "petrochem obsoletes
// everything" (over-producing one product tanks its margin, rewarding a
// diversified catalogue). See getCrudePrice / getProductMarketLevel and the
// productMarket field on GameState.
export const MARKET_BALANCE = {
  // Crude price wave around ECONOMY_BALANCE.crudeCost.
  crudeAmplitude: 0.35, // +/-35% -> roughly $6.5 .. $13.5 at base 10
  crudePeriodTicks: 2700, // ~1.5 in-game days per full cycle
  // Per-product demand saturation.
  saturationFloor: 0.45, // price never falls below 45% of base
  saturationPerUnitSold: 0.004, // each unit sold drops the level by this
  saturationRecoveryPerTick: 0.0015, // recovery toward 1.0 each tick
} as const

export const ECONOMY_BALANCE = {
  gasolinePrice: 18,
  lubricantPrice: 45,
  jetFuelPrice: 90,
  petrochemicalsPrice: 150,
  recycledMaterialPrice: 25,
  // Production Complexity Expansion Phase 3: ~2x petrochemicals per unit --
  // the "process further" incentive (sell petrochemicals raw at 150, or
  // feed them into the Polymer Plant for plasticPellets at 300).
  plasticPelletsPrice: 300,
  crudeCost: 10,
  // Mobile rebalance: refinery-level upgrades were nearly free under the
  // old linear formula (55 + 35*level) -- the cumulative cost to reach
  // Lv15 (which unlocks the $15,000 Petrochemical Plant) was only ~$5,025,
  // less than 1/3 of the building it unlocks. Switched to quadratic
  // (60 + 18*level^2): cumulative cost to Lv10 (~$7,530, vs the $8,000 Jet
  // Fuel Plant it unlocks) and Lv15 (~$23,220, vs $15,000) now roughly
  // track the infrastructure each level gates, without exploding at very
  // high levels the way an exponential curve would.
  refineryUpgradeBaseCost: 200,
  refineryUpgradeLevelStep: 50,
  // Non-cash gate alongside the cost: cumulative lifetime gasoline output
  // required to advance past a level. Scales harder now to enforce
  // "run your refinery for a while" before leveling..
  refineryUpgradeProductionPerLevel: 200,
} as const

export const PRODUCTION_BALANCE = {
  baseProductionMs: 1000,
  // Lowered 250 → 180 (Economy Pass). Operators + research were hitting the old
  // 250ms floor by mid-game, leaving the Efficiency perk branch little room
  // late-game. 180ms adds modest headroom without doubling max throughput.
  // NOTE: Efficiency perks still overlap operators near the floor — a future
  // pass could repurpose that branch to yield-per-batch instead of speed.
  minProductionMs: 180,
  refineryUpgradeSpeedStepMs: 120,
  distillationUnitSpeedBonusMs: 120,
  // Production Complexity Expansion Phase 2 (completed): electricity cost
  // per batch of Tier-1 gasoline production. Only enforced once the player
  // has built >= 1 Power Plant -- before that, gasoline production is
  // unaffected (fully backward compatible with every save before this).
  // Deliberately small relative to POWER_PLANT_BALANCE.electricityPerCycle
  // (12 electricity / 5s cycle = ~2.4/tick at the 25-tick cadence) since
  // gasoline's own production cadence runs much faster (productionInterval
  // is typically well under 1s once Operators/research/perks are factored
  // in) -- a 1-electricity-per-batch cost keeps Tier-1 gasoline from being
  // trivially starved by a single Power Plant while still making it
  // compete for the same pool as the downstream plants, completing the
  // original "ALL production buildings" intent from the Phase 2 design.
  electricityPerGasolineBatch: 1,
} as const

export const STORAGE_BALANCE = {
  baseCrudeStorage: 10,    // was 4 — raised so starting 5 crude fits within cap
  baseGasolineStorage: 20, // was 4 — raised so Contract 1 (20 gasoline) is reachable without a forced Product Tank purchase
  crudeTankStorageBonus: 25,
  productTankStorageBonus: 25,
  biggerTanksStorageBonus: 50,
  industrialStorageBonus: 150,
  mechanicStorageBonus: 25,
  storageOptimizationBonus: 75,
} as const

export const BONUS_BALANCE = {
  adjacencyBonusRate: 0.1,
  betterPumpsBonusRate: 0.1,
  advancedDistillationBonusRate: 0.25,
  advancedProcessingBonusRate: 0.1,
  premiumContractsBonusRate: 0.2,
  contractAnalyticsRpBonusRate: 0.20,
  laboratoryRpBonusRate: 0.1,
  salesOfficeContractBonusRate: 0.1,
  maintenanceWorkshopPenaltyRate: 0.5,
  saferOperationsPenaltyRate: 0.85,
  operatorProductionBonusRate: 0.1,
  premiumFuelSellPriceBonus: 5,
  // Sales Agent now gives a PERCENTAGE sell-price bonus applied to every product
  // (was a flat +$3 that was huge on gasoline and meaningless on $150 petrochem).
  salesAgentSellPriceBonusRate: 0.04,
  chemistRpBonusRate: 0.1,
  logisticsCoordinatorShipmentBonusRate: 0.1,
  safetyOfficerPenaltyRate: 0.85,
  fuelSpecialistSellPriceBonusRate: 0.05,
  aviationSpecialistJetFuelBonusRate: 0.20,
  chemicalEngineerPetrochemicalsBonusRate: 0.20,
  polymerEngineerPlasticPelletsBonusRate: 0.20,
  // Diminishing returns when STACKING the same worker type. The linear additive
  // bonuses (operator yield, sales-agent/fuel-specialist sell price, chemist RP,
  // mechanic storage) used to scale 1:1 with headcount, so the only optimal play
  // was "fill every bench slot to the cap" — no decision. The effective count
  // feeding those bonuses is now count^this exponent: the 1st hire is full value,
  // each additional one of the SAME type is worth progressively less, so spreading
  // across roles competes with stacking one. 1.0 = old linear behavior.
  // 4 stacked: 4^0.7 = 2.64 effective (vs 4); marginal 3rd→4th ≈ 0.48.
  workerStackDiminishingExponent: 0.7,
} as const

// Random incidents only (the trivial freebie events were removed — see
// events.ts / applyRandomEvent). Each value is the raw setback before the
// safety-officer eventPenaltyMultiplier is applied.
export const EVENT_BALANCE = {
  minorLeakCrudeLoss: 20,
  equipmentWearGasolineLoss: 10,
  storageContaminationGasolineLoss: 15,
  // Feedstock-chain incident — only fires once the player has built
  // distillation (maxFeedstockStorage > baseFeedstockStorage).
  distillationHiccupFeedstockLoss: 8,
} as const

export const MILESTONE_BALANCE = {
  firstFuelMoneyReward: 300,
  smallSupplierRpReward: 5,
  smallSupplierReputationReward: 10,
  growingRefineryMoneyReward: 1000,
  growingRefineryReputationReward: 15,
  researchBeginnerMoneyReward: 500,
  researchBeginnerReputationReward: 20,
  // Midgame milestones
  upgradeBuilderMoneyReward: 500,
  upgradeBuilderRpReward: 5,
  reputedSupplierMoneyReward: 800,
  reputedSupplierRpReward: 10,
  industrialProducerMoneyReward: 1200,
  refineryLevel5MoneyReward: 1500,
  refineryLevel5ReputationReward: 20,
  researchAdvancedMoneyReward: 1000,
  researchAdvancedReputationReward: 15,
  contractVeteranMoneyReward: 2000,
  contractVeteranRpReward: 15,
  tierThreeContractorMoneyReward: 3000,
  tierThreeContractorReputationReward: 40,
  fullWorkforceMoneyReward: 3000,
  fullWorkforceReputationReward: 35,
  // Late-game milestones (Level 10–15 gap)
  jetFuelPioneerMoneyReward: 2500,
  jetFuelPioneerReputationReward: 25,
  aviationPartnerMoneyReward: 4000,
  aviationPartnerRpReward: 30,
  petrochemicalPioneerMoneyReward: 5000,
  petrochemicalPioneerReputationReward: 50,
  productMogulMoneyReward: 10000,
  productMogulReputationReward: 75,
} as const

export const CONTRACT_BALANCE = [
  {
    id: 1,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 20,
    // Economy audit: tier-1 contracts must clearly beat spot-selling
    // gasoline ($18/unit) to feel worth doing. 20 gas -> $440 = $22/unit.
    reward: 440,
    rpReward: 2,
    reputationReward: 3,
  },
  {
    id: 2,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 50,
    reward: 1150,
    rpReward: 5,
    reputationReward: 6,
  },
  {
    id: 3,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 100,
    reward: 2400,
    rpReward: 10,
    reputationReward: 12,
  },
  {
    id: 4,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 200,
    reward: 4000,
    rpReward: 16,
    reputationReward: 28,
  },
  {
    id: 5,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 300,
    reward: 6500,
    rpReward: 25,
    reputationReward: 42,
  },
  {
    id: 6,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 500,
    reward: 13000,
    rpReward: 50,
    reputationReward: 60,
  },
  {
    id: 7,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 700,
    reward: 21000,
    rpReward: 70,
    reputationReward: 90,
  },
  // Tier 1 additions
  {
    id: 8,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 30,
    reward: 690,
    rpReward: 3,
    reputationReward: 4,
  },
  {
    id: 9,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 65,
    reward: 1500,
    rpReward: 6,
    reputationReward: 8,
  },
  {
    id: 10,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 120,
    reward: 2900,
    rpReward: 12,
    reputationReward: 14,
  },
  // Tier 2 additions
  {
    id: 11,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 150,
    reward: 3200,
    rpReward: 13,
    reputationReward: 24,
  },
  {
    id: 12,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 250,
    reward: 5200,
    rpReward: 20,
    reputationReward: 36,
  },
  {
    id: 13,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 380,
    reward: 8000,
    rpReward: 30,
    reputationReward: 52,
  },
  // Tier 3 additions
  {
    id: 14,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 600,
    reward: 16000,
    rpReward: 55,
    reputationReward: 72,
  },
  {
    id: 15,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 850,
    reward: 25500,
    rpReward: 82,
    reputationReward: 105,
  },
  {
    id: 16,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 1000,
    reward: 32000,
    rpReward: 100,
    reputationReward: 130,
  },
  // Jet Fuel contracts — Phase C product expansion
  {
    id: 19,
    tier: 3,
    unlockLevel: 7,
    gasolineRequired: 0,
    jetFuelRequired: 100,
    reward: 4500,
    rpReward: 38,
    reputationReward: 50,
  },
  {
    id: 20,
    tier: 3,
    unlockLevel: 9,
    gasolineRequired: 0,
    jetFuelRequired: 200,
    reward: 12000,
    rpReward: 60,
    reputationReward: 85,
  },
  // Asphalt contracts — Phase B product expansion
  {
    id: 17,
    tier: 2,
    unlockLevel: 5,
    gasolineRequired: 0,
    asphaltRequired: 75,
    reward: 2200,
    rpReward: 12,
    reputationReward: 20,
  },
  {
    id: 18,
    tier: 3,
    unlockLevel: 7,
    gasolineRequired: 0,
    asphaltRequired: 150,
    reward: 8000,
    rpReward: 30,
    reputationReward: 40,
  },
  // Lubricant contracts — Phase D product expansion
  {
    id: 21,
    tier: 2,
    unlockLevel: 5,
    gasolineRequired: 0,
    lubricantsRequired: 50,
    reward: 3000,
    rpReward: 10,
    reputationReward: 8,
  },
  {
    id: 22,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 0,
    lubricantsRequired: 100,
    reward: 7000,
    rpReward: 20,
    reputationReward: 15,
  },
  {
    id: 23,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 0,
    lubricantsRequired: 180,
    reward: 13000,
    rpReward: 35,
    reputationReward: 25,
  },
  // Petrochemical contracts — Phase E product expansion
  {
    id: 24,
    tier: 3,
    unlockLevel: 15,
    gasolineRequired: 0,
    petrochemicalsRequired: 50,
    reward: 15000,
    rpReward: 55,
    reputationReward: 65,
  },
  {
    id: 25,
    tier: 3,
    unlockLevel: 15,
    gasolineRequired: 0,
    petrochemicalsRequired: 100,
    reward: 35000,
    rpReward: 100,
    reputationReward: 110,
  },
  {
    id: 26,
    tier: 3,
    unlockLevel: 15,
    gasolineRequired: 0,
    petrochemicalsRequired: 200,
    reward: 75000,
    rpReward: 160,
    reputationReward: 180,
  },

  // --- Phase F: Recycled Material contracts (Waste Treatment Plant, Lv8+) ---
  // Waste Treatment Plant converts waste → recycledMaterial at $25/unit.
  // Direct sell of 30 units = $750 base. These contracts pay a premium + RP/rep
  // as an incentive to manage waste actively rather than just auto-selling.
  {
    id: 27,
    tier: 2,
    unlockLevel: 8,
    gasolineRequired: 0,
    recycledMaterialRequired: 30,
    reward: 1200,
    rpReward: 10,
    reputationReward: 8,
  },
  {
    id: 28,
    tier: 2,
    unlockLevel: 9,
    gasolineRequired: 0,
    recycledMaterialRequired: 60,
    reward: 2800,
    rpReward: 20,
    reputationReward: 15,
  },
  {
    id: 29,
    tier: 3,
    unlockLevel: 11,
    gasolineRequired: 0,
    recycledMaterialRequired: 120,
    reward: 6500,
    rpReward: 40,
    reputationReward: 30,
  },

  // --- Phase G: Plastic Pellets contracts (Polymer Plant, Lv20+) ---
  // Polymer Plant converts petrochemicals → plasticPellets at $300/unit.
  // Direct sell of 20 units = $6,000 base. These contracts pay a premium —
  // a true endgame product with high value and limited throughput.
  {
    id: 30,
    tier: 3,
    unlockLevel: 20,
    gasolineRequired: 0,
    plasticPelletsRequired: 20,
    reward: 9000,
    rpReward: 50,
    reputationReward: 45,
  },
  {
    id: 31,
    tier: 3,
    unlockLevel: 21,
    gasolineRequired: 0,
    plasticPelletsRequired: 40,
    reward: 20000,
    rpReward: 90,
    reputationReward: 80,
  },
  {
    id: 32,
    tier: 3,
    unlockLevel: 22,
    gasolineRequired: 0,
    plasticPelletsRequired: 80,
    reward: 45000,
    rpReward: 150,
    reputationReward: 140,
  },
] as const

export const BUILDING_UPGRADE_BALANCE = {
  upgradeLv1ToLv2Cost: 3_500,
  upgradeLv2ToLv3Cost: 10_000,
  maxBuildingLevel: 3,
  // Index 0 is unused; index 1/2/3 = level bonus
  // Production / storage buildings
  crudeTankStorageByLevel: [0, 25, 50, 100],
  productTankStorageByLevel: [0, 25, 50, 100],
  distillationUnitBonusRateByLevel: [0, 0, 0.25, 0.5],
  // Production Complexity Expansion: per-instance output bonus for the 4
  // production plants (lubricant/jetFuel/petrochemical/polymer). Same
  // shape and values as distillationUnitBonusRateByLevel -- Lv1 = base
  // (no bonus, matches pre-upgrade behavior exactly), Lv2 = +25%, Lv3 =
  // +50% output for THAT plant instance. Summed across all instances of a
  // plant type (see calculateDerivedStats), then applied as a multiplier
  // on outputPerCycle alongside the existing specialist multiplier. Gives
  // upgrading these plants an actual effect -- previously upgrade cost was
  // payable but had zero effect on the 4 production plants.
  lubricantPlantOutputBonusRateByLevel: [0, 0, 0.25, 0.5],
  jetFuelPlantOutputBonusRateByLevel: [0, 0, 0.25, 0.5],
  petrochemicalPlantOutputBonusRateByLevel: [0, 0, 0.25, 0.5],
  polymerPlantOutputBonusRateByLevel: [0, 0, 0.25, 0.5],
  // Support buildings — Lv1 matches the previous flat-rate constant exactly
  laboratoryRpBonusRateByLevel: [0, 0.1, 0.2, 0.35],
  maintenanceWorkshopPenaltyRateByLevel: [0, 0.5, 0.35, 0.20],
  salesOfficeContractBonusRateByLevel: [0, 0.1, 0.2, 0.35],
}

// 5 seconds = 25 ticks at 200ms per tick
export const LUBRICANT_PLANT_BALANCE = {
  unlockLevel: 5,
  cost: 3000,
} as const

export const JET_FUEL_PLANT_BALANCE = {
  unlockLevel: 10,
  cost: 8000,
} as const

export const PETROCHEMICAL_PLANT_BALANCE = {
  unlockLevel: 15,
  cost: 15000,
} as const

// Production Complexity Expansion Phase 3: Polymer Plant consumes
// `petrochemicals` (the existing final product, which keeps its dual
// role -- still sellable raw at petrochemicalsPrice, OR fed in here for a
// higher-value product) and produces `plasticPellets`. Implemented as its
// own standalone block in useGameLoop.ts (NOT part of PLANT_PRODUCTION /
// the shared feedstock pool), since its input is a different pool
// entirely. 1 plant = 1 product, same as every other plant. Output scales
// via plant upgrade levels (existing pattern) and the polymerEngineer
// specialist (BONUS_BALANCE.polymerEngineerPlasticPelletsBonusRate).
export const POLYMER_PLANT_BALANCE = {
  unlockLevel: 20,
  cost: 25000,
  intervalTicks: 25,
  petrochemicalsPerCycle: 10,
  plasticPelletsPerCycle: 5,
  maxPlasticPelletsStorage: 200,
  // Production Complexity Expansion Phase 2/3 (completed): electricity
  // consumed per cycle, same cadence/pattern as the 3 PLANT_PRODUCTION
  // plants' electricityPerCycle (3/4/5 for lubricant/jetFuel/petrochemical,
  // increasing with tier). Polymer Plant is the most advanced tier, so 6
  // continues that progression. Only enforced once the player has built
  // >= 1 Power Plant -- before that, this is a no-op (fully backward
  // compatible). This was the other half of the "electricity-gate Tier-1
  // gasoline + Polymer Plant" backlog item -- previously Polymer Plant had
  // no electricity cost at all, unlike every other production building.
  electricityPerCycle: 6,
} as const

// Tank Farm (Per-Product Storage, design doc Part B): 5 dedicated storage
// buildings, one per secondary product whose maxStorage was previously a
// fixed constant. Each placed tank adds storagePerTank to that product's
// cap -- same additive pattern as maxFeedstockStorage scaling with
// distillationUnitCount, just per-instance instead of per-count-times-
// constant (each tank type has its own bonus amount). Flat bonus, no
// upgrade levels (consistent with how the Phase 1-3 plants' storage caps
// are flat constants). storagePerTank is calibrated roughly inversely to
// the product's sell price (cheaper products get bigger per-tank bonuses)
// so tank cost/benefit feels comparable across products. unlockLevel
// matches each product's plant, so a tank becomes buildable as soon as the
// corresponding plant is.
export const TANK_FARM_BALANCE = {
  lubricantTank: { unlockLevel: 5, cost: 1500, storagePerTank: 75 },
  jetFuelTank: { unlockLevel: 10, cost: 4000, storagePerTank: 60 },
  petrochemicalTank: { unlockLevel: 15, cost: 7500, storagePerTank: 50 },
  recyclingBunker: { unlockLevel: 8, cost: 3000, storagePerTank: 100 },
  pelletSilo: { unlockLevel: 20, cost: 12000, storagePerTank: 40 },
} as const

// Production Complexity Expansion Phase 2: Power Plant burns crude to
// generate electricity, consumed by the 3 downstream PLANT_PRODUCTION
// plants (see PlantProductionConfig.electricityPerCycle). Electricity is
// purely additive: with 0 Power Plants built, electricityDemand from the
// downstream loop is ignored entirely (current.electricity stays 0,
// plants run exactly as before Phase 2 -- no existing save is affected
// until the player builds one).
//
// 1 Power Plant generates 12/cycle (every 5s, same cadence as downstream
// plants) -- enough to fully cover 1 of each downstream plant (3+4+5=12).
// Burns crude (not feedstock), so it doesn't compete with the
// distillation->feedstock->plants chain.
export const POWER_PLANT_BALANCE = {
  unlockLevel: 5,
  cost: 4000,
  intervalTicks: 25,
  crudePerCycle: 4,
  electricityPerCycle: 12,
  maxElectricityStorage: 60,
} as const

export const JET_FUEL_BALANCE = {
  // Refinery level required to unlock jet fuel processing (panel visible; the
  // Jet Fuel Plant itself unlocks later at JET_FUEL_PLANT_BALANCE.unlockLevel).
  unlockLevel: 7,
} as const

export const ASPHALT_BALANCE = {
  // Crude consumed (and asphalt produced) per small production action
  batchSize: 10,
  // Crude consumed (and asphalt produced) per large production action
  largeBatchSize: 50,
  // Maximum asphalt inventory — shared for all asphalt contracts
  maxStorage: 150,
  // Refinery level required to unlock asphalt processing
  unlockLevel: 5,
} as const

// Cooldowns expressed in game ticks (1 tick = CORE_BALANCE.tickMs ms = 200ms).
// 3 min = 180,000ms / 200ms = 900 ticks
// 4 min = 240,000ms / 200ms = 1200 ticks
// 5 min = 300,000ms / 200ms = 1500 ticks
export const STANDING_ORDER_BALANCE = [
  {
    key: 'asphaltMaintenance' as const,
    productKey: 'asphalt' as const,
    required: 40,
    reward: 900,
    rpReward: 5,
    reputationReward: 5,
    cooldownTicks: 900,
    unlockLevel: 5,
  },
  {
    // Reworked alongside Jet Fuel Plant consolidation:
    // unlockLevel 7 → 10 (jet fuel cannot be produced before the plant unlocks at Level 10)
    // reward 2,200 → 7,000 (direct sell of 60 jet fuel is $5,400 base — the old
    // reward was strictly worse than just selling, making the order a trap)
    key: 'jetFuelCharter' as const,
    productKey: 'jetFuel' as const,
    required: 60,
    reward: 7000,
    rpReward: 20,
    reputationReward: 15,
    cooldownTicks: 1500,
    unlockLevel: 10,
  },
  {
    // Direct sell of 60 lubricants is $2,700 base — the order pays a premium plus RP/rep.
    key: 'lubricantSupply' as const,
    productKey: 'lubricants' as const,
    required: 60,
    reward: 3800,
    rpReward: 12,
    reputationReward: 8,
    cooldownTicks: 1200,
    unlockLevel: 6,
  },
  {
    // Direct sell of 40 petrochemicals is $6,000 base — the order pays a premium plus RP/rep.
    key: 'petrochemExport' as const,
    productKey: 'petrochemicals' as const,
    required: 40,
    reward: 8500,
    rpReward: 35,
    reputationReward: 30,
    cooldownTicks: 1500,
    unlockLevel: 15,
  },
  {
    // Direct sell of 40 recycledMaterial is $1,000 base — premium for consistent
    // waste management. Unlocks with Waste Treatment Plant (Lv8).
    key: 'recyclingContract' as const,
    productKey: 'recycledMaterial' as const,
    required: 40,
    reward: 1600,
    rpReward: 8,
    reputationReward: 10,
    cooldownTicks: 900,
    unlockLevel: 8,
  },
  {
    // Direct sell of 20 plasticPellets is $6,000 base — premium for high-tier
    // manufacturing output. Unlocks with Polymer Plant (Lv20).
    key: 'pelletExport' as const,
    productKey: 'plasticPellets' as const,
    required: 20,
    reward: 8000,
    rpReward: 40,
    reputationReward: 35,
    cooldownTicks: 1800,
    unlockLevel: 20,
  },
] as const

export type StandingOrderConfig = (typeof STANDING_ORDER_BALANCE)[number]

// delayTicks (not wall-clock) is the source of truth for arrival timing, so
// shipments advance on the same game clock as production and pause when the
// app is backgrounded -- a pure pause model (see useGameLoop tick loop).
// delayTicks = delaySeconds * 5 (5 ticks/sec at 200ms). delayMs is kept only
// for the "~Ns" display copy in the Supply UI.
export const SHIPMENT_BALANCE = [
  { key: 'miniDelivery' as const, amount: 50, cost: 450, delayMs: 15_000, delayTicks: 75 },
  { key: 'localTruck' as const, amount: 100, cost: 900, delayMs: 30_000, delayTicks: 150 },
  { key: 'coastalTanker' as const, amount: 500, cost: 4000, delayMs: 90_000, delayTicks: 450 },
  { key: 'importedShip' as const, amount: 1500, cost: 10500, delayMs: 180_000, delayTicks: 900 },
  { key: 'tankerConvoy' as const, amount: 3000, cost: 20000, delayMs: 300_000, delayTicks: 1500 },
]

export type ShipmentOption = (typeof SHIPMENT_BALANCE)[number]

export const REPUTATION_TIER_BALANCE = [
  {
    key: 'starter',
    minimumReputation: 0,
    contractRewardBonusRate: 0,
  },
  {
    key: 'smallBonus',
    minimumReputation: 25,
    contractRewardBonusRate: 0.05,
  },
  {
    key: 'trustedSupplier',
    minimumReputation: 100,
    contractRewardBonusRate: 0.1,
  },
  {
    key: 'industryLeader',
    minimumReputation: 250,
    contractRewardBonusRate: 0.2,
  },
] as const

// --- System 1: Staff Training & Levels ---
export const STAFF_LEVEL_BALANCE = {
  maxLevel: 5,
  // XP gained per worker of a type, per production tick. With 3 workers of a
  // type the crew earns 3 XP/tick. At 200ms/tick that is ~15 XP/sec for a crew of 3.
  xpPerWorkerPerTick: 1,
  // XP required to advance from level N to N+1. Index = current level.
  // Level 1→2 needs 1,200 XP (~80s for a crew of 3); ramps up after.
  xpToNextLevel: [0, 1200, 3000, 6000, 12000],
  // Each level above 1 multiplies that worker type's bonus effectiveness.
  // Level 1 = 1.0x, Level 5 = 1.0 + 4*0.15 = 1.6x.
  bonusPerLevelRate: 0.15,
  // Instant training: cost to add one level worth of XP, scaled by target level.
  trainBaseCost: 600,
  trainCostPerLevel: 500,
  trainRpCost: 5,
  // Individual Staff Phase 4: small chance for a new hire to be a "Veteran"
  // — a permanent personal effectiveness bonus on top of their level
  // multiplier (stacks additively). Pure luck, no extra wage cost.
  veteranHireChance: 0.05,
  veteranBonusRate: 0.2,
} as const

// --- System 4: Annual Awards ---
// A "business year" is a fixed number of ticks. At year end performance is
// graded and rewarded, then the per-year counters reset.
export const AWARDS_BALANCE = {
  // 3,600 ticks * 200ms = 720,000ms = 12 minutes per business year.
  yearLengthTicks: 3600,
  // Score thresholds for each grade, fixed for the whole game (not
  // year-scaled). This IS the intended design: rivals.ts is calibrated
  // against these exact static thresholds, and ESG/Energy-Transition
  // already provide ongoing late-game pressure (incident risk, demand
  // shift) without a generic "rising score bar" stacking on top.
  // (Previously had a dead `thresholdGrowthPerYear` field that
  // `getAwardGrade` never read -- removed 2026-06-13, see TECH_DEBT.)
  gradeThresholds: { S: 1400, A: 850, B: 400, C: 0 },
  // Cash reward by grade.
  cashByGrade: { S: 12000, A: 6000, B: 3000, C: 1000 },
  // Reputation reward by grade.
  reputationByGrade: { S: 40, A: 25, B: 12, C: 5 },
  // Score weights. Gasoline throughput self-caps (production floor) and would
  // otherwise dominate, so it is weighted low; contracts (the skill goal) high.
  weights: {
    perGasoline: 0.4,      // 0.4 points per gasoline produced this year
    perThousandMoney: 7,   // 7 points per $1,000 NET earned this year
    perContract: 80,       // 80 points per contract completed this year
  },
} as const

// --- Staff wages / payroll (Economy Pass) ---
// Annual wage per worker by type (deducted each business year, see
// closeBusinessYear). Each worker "pays rent" yet still earns out; leveled crews
// cost more (see levelWageRate), tying leveling to ongoing upkeep. Doubled in
// Economy Pass 2 so a full bench is a visible recurring line item (see perWorker
// note) — the original wages were ~0.6% of gross and created no hiring tension.
// Hiring cap + retirement (Phase 5 of Individual Staff system).
// Per-type cap scales with refinery level so early game stays small and
// late game allows a full bench. Formula: floor(BASE + refineryLevel / STEP).
// At Lv1=2, Lv3=3, Lv6=4, Lv9=5, Lv12=6, Lv15=7 -- never truly infinite.
// retirementAfterYears: employee retires this many business years after hire.
// retirementWarningYears: show a warning badge this many years before retirement.
// Maximum refinery level. Beyond this, upgradeRefinery() is a no-op.
// All content (buildings, eras, contracts, standing orders) is available
// by Lv20. The cap exists to give the game a clear ceiling.
export const MAX_REFINERY_LEVEL = 20

export const HIRING_BALANCE = {
  capBase: 2,
  capStep: 3,
  retirementAfterYears: 5,
  retirementWarningYears: 1,
  // Severance = annualWage * employeeLevel * this rate. Lv5 chemist
  // (wage 220, level 5) gets 220*5*0.5 = $550 back -- meaningful but
  // not so large it makes retirement feel free.
  severanceWageMultiplier: 0.5,
  // Minimum level for a retiree to leave a mentoring bonus for their
  // successor. Lv1/2 retirees contributed little, so no legacy.
  mentorMinLevel: 3,
  // XP bonus the next hire of the same type receives = retiree's
  // level * this multiplier. Lv5 retiree → 5*20 = 100 XP head start.
  mentorXpPerLevel: 20,
} as const

export const WAGE_BALANCE = {
  // Economy Pass 2 (staff tension): wages were ~0.6% of gross at mid-game, so
  // "fill every bench slot" had no recurring cost. Roughly doubled the
  // production/sell roles so a full crew is a visible annual line item that the
  // diminishing-returns curve (workerStackDiminishingExponent) makes you weigh
  // before stacking a 3rd/4th of the same type.
  perWorker: {
    operator: 160,
    mechanic: 220,
    salesAgent: 300,
    safetyOfficer: 320,
    chemist: 400,
    logisticsCoordinator: 520,
    fuelSpecialist: 400,
    aviationSpecialist: 700,
    chemicalEngineer: 1000,
  } as Record<string, number>,
  // Each crew level above 1 adds this fraction to that type's wage.
  // Level 5 crew costs 1 + 4*0.1 = 1.4x wage.
  levelWageRate: 0.1,
  // If cash can't cover payroll, the player pays what they can and takes this
  // reputation hit (gentle — no hard bankruptcy in this prototype).
  unpaidReputationPenalty: 10,
} as const

// --- Building maintenance (Economy audit: ongoing money sink) ---
// Deducted each business year in closeBusinessYear, alongside payroll. Every
// built tile costs a flat upkeep plus a fraction of its purchase price, so a
// sprawling factory has real running costs and "build one of everything" is no
// longer free. Kept modest on purpose -- the heavier late-game money pressure
// comes from the Dynamic Market (fluctuating crude cost), not from upkeep
// alone. A full 36-tile factory lands around a few thousand $/year.
export const MAINTENANCE_BALANCE = {
  flatPerBuilding: 40,
  costRate: 0.05,
} as const

// --- Specialization (Roadmap feature 2) ---
// Permanent one-time choice at Level 5. Each path grants exclusive bonuses
// and a trade-off, forcing a strategic direction. The existing perk tree
// and Dynamic Market supply the tactical layer; this supplies the strategic
// identity that shapes the rest of the run.
// --- Prestige / New Game+ ---
// Unlocked once Industry Legend is reached. Restarting "prestiges": the run
// resets but prestigeLevel carries forward, granting a permanent stacking
// production bonus so each replay starts meaningfully stronger.
export const PRESTIGE_BALANCE = {
  bonusPerLevel: 0.1, // +10% production per prestige level
} as const

export const SPECIALIZATION_BALANCE = {
  unlockLevel: 5,
  green: {
    esgRegenMultiplier: 1.5,
    sellPriceBonusRate: 0.10,
    yearEndReputationBonus: 15,
    wageCostReduction: 0.20,
    productionSpeedPenalty: 0.10,
  },
  industrial: {
    productionOutputBonus: 0.15,
    crudeStorageBonusRate: 0.25,
    contractCashBonusRate: 0.20,
    maintenanceCostReduction: 0.25,
    esgDecayMultiplier: 1.3,
  },
} as const

// --- People / Morale layer (Roadmap feature 4) ---
// Global morale (0-100) drifts toward equilibrium each tick. High morale
// boosts worker effectiveness; low morale penalizes it. Reacts to staff
// events, level-ups, hires, retirements, wage payment status, and year-end
// grade. Kairosoft-style recurring soft decisions.
export const MORALE_BALANCE = {
  startingMorale: 70,
  minMorale: 10,
  maxMorale: 100,
  equilibrium: 60,
  driftPerTick: 0.003,
  levelUpBoost: 3,
  hireBoost: 2,
  retirementDrop: -5,
  unpaidWageDrop: -15,
  goodYearBoost: 8,
  badYearDrop: -5,
  lowMoraleThreshold: 40,
  highMoraleThreshold: 75,
  lowMoralePenalty: 0.85,
  highMoraleBonus: 1.10,
  staffEventCooldownTicks: 1800,
  staffEventMinEmployees: 3,
} as const

// --- Refinery Process Chain: feedstock layer ---
// Distillation Units convert crude → feedstock; downstream plants consume it.
export const FEEDSTOCK_BALANCE = {
  // Distillation fires every N ticks (5 ticks = 1s at 200ms/tick).
  distillationIntervalTicks: 5,
  // Per distillation unit, per cycle: consume this much crude...
  crudePerDistillationCycle: 3,
  // ...to produce this much feedstock (base).
  feedstockPerDistillationCycle: 2,
  // Each crude→distillation adjacency pair adds this much feedstock per cycle
  // (reuses the existing combo system — placing distillation next to crude tanks
  // pays off in the chain, not just in speed).
  feedstockPerAdjacency: 0.5,
  // Feedstock storage cap = base + per-distillation-unit.
  baseFeedstockStorage: 40,
  feedstockStoragePerDistillationUnit: 25,
} as const

// Player-adjustable per-plant feedstock priority weights (Feedstock
// Priority card on the Refinery tab). 0 = off (this plant never produces),
// default 1 = 100% (normal). Only affects the proportional split when
// feedstock is SCARCE (total demand > supply) -- when supply covers
// demand, every built plant still gets its normal full output regardless
// of weight. See the downstream-plants loop in useGameLoop.ts tick().
export const FEEDSTOCK_PRIORITY_BALANCE = {
  min: 0,
  max: 2,
  step: 0.25,
  default: 1,
} as const

// Unified downstream-plant production. These three plants now consume FEEDSTOCK
// (not raw crude). One config-driven tick loop replaces three duplicated blocks.
export type PlantProductionConfig = {
  buildingKey: 'lubricantPlant' | 'jetFuelPlant' | 'petrochemicalPlant'
  productKey: 'lubricants' | 'jetFuel' | 'petrochemicals'
  feedstockPerCycle: number
  outputPerCycle: number
  intervalTicks: number
  maxStorage: number
  // Production Complexity Expansion Phase 2: electricity consumed per cycle
  // (same cadence as feedstockPerCycle). Only enforced once >= 1 Power
  // Plant is built -- see POWER_PLANT_BALANCE and the downstream-plants
  // loop in useGameLoop.ts.
  electricityPerCycle: number
  // Production Complexity Expansion Phase 3: generic input override. When
  // absent (all 3 current plants), the plant consumes `feedstock` as
  // before. Reserved for future tiers (e.g. a plant consuming
  // `plasticPellets`) that need a non-feedstock input -- NOT used by
  // Polymer Plant itself, which is implemented as its own standalone block
  // (see POLYMER_PLANT_BALANCE) since it has its own dedicated
  // petrochemicals->plasticPellets pool, not the shared feedstock pool.
  inputProduct?: ProductKey
  // Optional specialist worker that multiplies this plant's output.
  specialistWorker?: 'aviationSpecialist' | 'chemicalEngineer'
  specialistBonusRate?: number
}

export const PLANT_PRODUCTION: PlantProductionConfig[] = [
  {
    buildingKey: 'lubricantPlant',
    productKey: 'lubricants',
    feedstockPerCycle: 6,
    outputPerCycle: 5,
    intervalTicks: 25,
    maxStorage: 200,
    electricityPerCycle: 3,
  },
  {
    buildingKey: 'jetFuelPlant',
    productKey: 'jetFuel',
    feedstockPerCycle: 8,
    outputPerCycle: 5,
    intervalTicks: 25,
    maxStorage: 200,
    electricityPerCycle: 4,
    specialistWorker: 'aviationSpecialist',
    specialistBonusRate: BONUS_BALANCE.aviationSpecialistJetFuelBonusRate,
  },
  {
    buildingKey: 'petrochemicalPlant',
    productKey: 'petrochemicals',
    feedstockPerCycle: 10,
    outputPerCycle: 5,
    intervalTicks: 25,
    maxStorage: 200,
    electricityPerCycle: 5,
    specialistWorker: 'chemicalEngineer',
    specialistBonusRate: BONUS_BALANCE.chemicalEngineerPetrochemicalsBonusRate,
  },
]

// --- ESG / Safety axis ---
// A second strategic axis (BACKLOG "Strategic Differentiation #1"): cheap,
// fast expansion (more "dirty" refining buildings) pulls the score DOWN;
// investing in safetyOfficer staff pulls it UP. High score = fewer incident
// events + a premium contract bonus. Low score = more incident events.
// Score is 0-100, starts neutral at 50.
export const ESG_BALANCE = {
  startingScore: 50,
  minScore: 0,
  maxScore: 100,
  // Per-tick drift. At 1 effective safetyOfficer (level1) vs 2 dirty
  // buildings (a typical Tier-1 start: crudeTank + distillationUnit), net
  // drift is slightly positive (+0.001/tick). Adding more refining capacity
  // without more/better safety staff tips the balance negative.
  decayPerDirtyBuildingPerTick: 0.003,
  regenPerSafetyOfficerPerTick: 0.007,
  // Incident-event selection chance (see getIncidentChance / getRandomEvent).
  // At esgScore=50 this equals ~25%, roughly matching the old uniform-random
  // share of incident-flagged events.
  baseIncidentChance: 0.25,
  minIncidentChance: 0.05,
  maxIncidentChance: 0.45,
  // High-ESG premium contract bonus (BACKLOG: "unlocks premium contracts").
  premiumThreshold: 70,
  premiumContractRewardBonusRate: 0.1,
} as const

// Buildings that pull the ESG score down each tick (core refining/
// processing capacity). Storage, research, sales, and maintenance buildings
// are NOT "dirty" — expanding those doesn't cost ESG.
export const ESG_DIRTY_BUILDINGS: BuildingType[] = [
  'crudeTank',
  'distillationUnit',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
]

// --- Layout depth (Roadmap feature 3): negative adjacency ---
// A "sensitive" building (research / sales) loses dirtyPenaltyRate of its bonus
// if it sits orthogonally adjacent to a heavy "polluting" plant -- a real
// reason to keep those buildings away from the dirty production core, turning
// tile placement into a tradeoff rather than "fill every cell". Distinct from
// ESG_DIRTY_BUILDINGS (storage tanks aren't "polluting" for layout purposes).
export const LAYOUT_BALANCE = {
  dirtyPenaltyRate: 0.5,
  sensitiveBuildings: ['laboratory', 'salesOffice'] as BuildingType[],
  pollutingBuildings: [
    'distillationUnit',
    'lubricantPlant',
    'jetFuelPlant',
    'petrochemicalPlant',
    'powerPlant',
    'wasteTreatmentPlant',
    'polymerPlant',
  ] as BuildingType[],
} as const

// --- Production Complexity Expansion Phase 1: waste byproduct ---
// Every "dirty" production building (reuses ESG_DIRTY_BUILDINGS) emits a
// small amount of waste per tick. Waste has its own storage cap; once
// full, waste at/over the cap applies an extra ESG penalty (on top of the
// existing per-dirty-building drift). Purely additive: does not change any
// existing production formula.
export const WASTE_BALANCE = {
  wastePerDirtyBuildingPerTick: 0.02,
  baseWasteStorage: 50,
  overCapEsgPenaltyPerTick: 0.01,
} as const

// Waste Treatment Plant: consumes accumulated `waste` and produces
// `recycledMaterial` (a sellable secondary product). Keeps waste under the
// storage cap, avoiding the ESG overflow penalty above. Low value per unit
// (vs. petrochemicals at 150) -- a mitigation building, not a new income
// strategy.
export const WASTE_TREATMENT_PLANT_BALANCE = {
  unlockLevel: 8,
  cost: 6000,
  intervalTicks: 25,
  wastePerCycle: 4,
  recycledMaterialPerCycle: 2,
  maxRecycledMaterialStorage: 150,
} as const

// --- Energy Transition era: demand shift (Strategic Differentiation #2) ---
// While the player is in the 'energyTransition' era, gasoline demand
// gradually declines while petrochemicals demand gradually rises -- a real
// late-game inflection point (vs. eras 1-3, which only add flat bonuses).
// Both multipliers are monotonic: they never reverse once shifted.
export const DEMAND_SHIFT_BALANCE = {
  // 0.0001/tick * 3000 ticks (~10min, under 1 business year) = full 0.3 swing.
  shiftPerTick: 0.0001,
  gasolineDemandFloor: 0.7,
  petrochemicalsDemandCeiling: 1.3,
} as const

// --- Seasonal demand volatility (Strategic Differentiation #4) ---
// Within each ~12-minute business year, gasoline demand cycles smoothly
// through a "season" -- a planning layer Kairosoft-style games don't have
// (static prices for the whole game). Purely derived from
// (tickCount - yearStartTick) / yearLengthTicks, no new state needed.
export const SEASONAL_BALANCE = {
  // Multiplier oscillates in [1-amplitude, 1+amplitude] -- 0.15 => 0.85x to
  // 1.15x (a ~35% swing peak-to-trough), gentle enough that off-season
  // gasoline still sells for a reasonable price.
  amplitude: 0.15,
} as const
