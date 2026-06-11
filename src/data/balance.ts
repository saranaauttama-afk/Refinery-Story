// Early-game pacing and economy live here so tuning does not require
// searching through simulation code.

export const CORE_BALANCE = {
  tickMs: 200,
  gridSize: 9,
  maxLogItems: 6,
  randomEventIntervalMs: 30000,
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
  crudeCost: 10,
  refineryUpgradeBaseCost: 55,
  refineryUpgradeLevelStep: 35,
} as const

export const PRODUCTION_BALANCE = {
  baseProductionMs: 1000,
  minProductionMs: 250,
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
  salesAgentSellPriceBonus: 3,
  chemistRpBonusRate: 0.1,
  logisticsCoordinatorShipmentBonusRate: 0.1,
  safetyOfficerPenaltyRate: 0.85,
  fuelSpecialistSellPriceBonusRate: 0.05,
  aviationSpecialistJetFuelBonusRate: 0.20,
  chemicalEngineerPetrochemicalsBonusRate: 0.20,
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
  // Crude consumed per plant per production cycle
  crudePerCycle: 10,
  // Lubricants produced per plant per production cycle
  lubricantsPerCycle: 5,
  // Production fires every N game ticks (25 ticks = 5 seconds at 200ms/tick)
  intervalTicks: 25,
  // Maximum lubricants inventory
  maxStorage: 200,
} as const

export const JET_FUEL_PLANT_BALANCE = {
  unlockLevel: 10,
  cost: 8000,
  // Crude consumed per plant per production cycle
  crudePerCycle: 20,
  // Jet fuel produced per plant per production cycle
  jetFuelPerCycle: 5,
  // Production fires every N game ticks (25 ticks = 5 seconds at 200ms/tick)
  intervalTicks: 25,
} as const

export const PETROCHEMICAL_PLANT_BALANCE = {
  unlockLevel: 15,
  cost: 15000,
  // Crude consumed per plant per production cycle
  crudePerCycle: 30,
  // Petrochemicals produced per plant per production cycle
  petrochemicalsPerCycle: 5,
  // Production fires every N game ticks (25 ticks = 5 seconds at 200ms/tick)
  intervalTicks: 25,
  // Maximum petrochemicals inventory
  maxStorage: 200,
} as const

export const JET_FUEL_BALANCE = {
  // Crude consumed (and jet fuel produced) per small production action
  batchSize: 25,
  // Crude consumed (and jet fuel produced) per large production action
  largeBatchSize: 75,
  // Maximum jet fuel inventory — raised to 200 so Contract 20 (200 jet fuel) is reachable
  maxStorage: 200,
  // Refinery level required to unlock jet fuel processing
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
    key: 'jetFuelCharter' as const,
    productKey: 'jetFuel' as const,
    required: 60,
    reward: 2200,
    rpReward: 15,
    reputationReward: 10,
    cooldownTicks: 1500,
    unlockLevel: 7,
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
