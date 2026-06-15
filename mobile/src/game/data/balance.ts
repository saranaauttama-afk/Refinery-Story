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
  // completedMilestoneKeys / hasNewMilestone in useGameLoop.ts). This is a
  // fallback: if ~4 min of game time (1200 ticks) pass with no milestone
  // and no event currently shown, fire one anyway so longer gaps between
  // milestones still get occasional choice events.
  choiceEventFallbackTicks: 1200,
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

export const EXPANSION_BALANCE = [
  { level: 0, size: 3, cells: 9 },
  { level: 1, size: 4, cells: 16, cost: 25000, requiresRefineryLevel: 5 },
  { level: 2, size: 5, cells: 25, cost: 100000, requiresRefineryLevel: 10 },
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
  refineryUpgradeBaseCost: 60,
  refineryUpgradeLevelStep: 18,
  // Non-cash gate alongside the cost: cumulative lifetime gasoline output
  // required to advance past a level. Mainly matters early (Lv1-5ish) --
  // it forces "build a basic production line and run it for a bit" before
  // the first few upgrades, rather than buying Lv2+ with zero buildings
  // placed. At higher levels this is essentially always already satisfied
  // by an active refinery, so cost becomes the dominant gate again.
  refineryUpgradeProductionPerLevel: 50,
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
} as const

export const EVENT_BALANCE = {
  crudeDiscountAmount: 10,
  machineTuneUpMoneyReward: 200,
  minorLeakCrudeLoss: 20,
  qualityBonusGasolineAmount: 20,
  marketDemandSpikeMoneyReward: 750,
  safetyInspectionPassReputationReward: 10,
  safetyInspectionFailMoneyPenalty: 200,
  safetyInspectionReputationThreshold: 50,
  equipmentWearGasolineLoss: 10,
  efficientBatchGasolineAmount: 30,
  localNewsCoverageReputationGain: 15,
  supplierDiscountCrudeAmount: 15,
  equipmentInspectionMoneyCost: 120,
  equipmentInspectionReputationGain: 10,
  workerSuggestionRpGain: 3,
  storageContaminationGasolineLoss: 15,
  communityVisitMoneyCost: 150,
  communityVisitReputationGain: 20,
  // Feedstock-chain events (Charm Pass) — only fire once the player has built
  // distillation (maxFeedstockStorage > baseFeedstockStorage).
  distillationHiccupFeedstockLoss: 8,
  feedstockSurplusConvertAmount: 12,
  feedstockSurplusCashPerUnit: 15,
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
    reward: 300,
    rpReward: 2,
    reputationReward: 3,
  },
  {
    id: 2,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 50,
    reward: 900,
    rpReward: 5,
    reputationReward: 6,
  },
  {
    id: 3,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 100,
    reward: 2200,
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
    reward: 480,
    rpReward: 3,
    reputationReward: 4,
  },
  {
    id: 9,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 65,
    reward: 1150,
    rpReward: 6,
    reputationReward: 8,
  },
  {
    id: 10,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 120,
    reward: 2700,
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
] as const

export type StandingOrderConfig = (typeof STANDING_ORDER_BALANCE)[number]

export const SHIPMENT_BALANCE = [
  { key: 'miniDelivery' as const, amount: 50, cost: 450, delayMs: 15_000 },
  { key: 'localTruck' as const, amount: 100, cost: 900, delayMs: 30_000 },
  { key: 'coastalTanker' as const, amount: 500, cost: 4000, delayMs: 90_000 },
  { key: 'importedShip' as const, amount: 1500, cost: 10500, delayMs: 180_000 },
  { key: 'tankerConvoy' as const, amount: 3000, cost: 20000, delayMs: 300_000 },
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
// closeBusinessYear). Roughly 15% of hire cost, so a worker "pays rent" but
// still earns out over several years. Leveled crews cost more (see levelWageRate),
// tying the leveling system to ongoing upkeep — the missing hiring tension.
export const WAGE_BALANCE = {
  perWorker: {
    operator: 80,
    mechanic: 120,
    salesAgent: 150,
    safetyOfficer: 180,
    chemist: 220,
    logisticsCoordinator: 300,
    fuelSpecialist: 220,
    aviationSpecialist: 450,
    chemicalEngineer: 700,
  } as Record<string, number>,
  // Each crew level above 1 adds this fraction to that type's wage.
  // Level 5 crew costs 1 + 4*0.1 = 1.4x wage.
  levelWageRate: 0.1,
  // If cash can't cover payroll, the player pays what they can and takes this
  // reputation hit (gentle — no hard bankruptcy in this prototype).
  unpaidReputationPenalty: 10,
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
