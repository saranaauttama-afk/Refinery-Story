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
  money: 120,
  crudeOil: 2,
  reputation: 0,
} as const

export const ECONOMY_BALANCE = {
  gasolinePrice: 18,
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
  baseCrudeStorage: 4,
  baseGasolineStorage: 4,
  crudeTankStorageBonus: 25,
  productTankStorageBonus: 25,
  biggerTanksStorageBonus: 50,
  industrialStorageBonus: 150,
  mechanicStorageBonus: 25,
} as const

export const BONUS_BALANCE = {
  adjacencyBonusRate: 0.1,
  betterPumpsBonusRate: 0.1,
  advancedDistillationBonusRate: 0.25,
  premiumContractsBonusRate: 0.2,
  laboratoryRpBonusRate: 0.1,
  salesOfficeContractBonusRate: 0.1,
  maintenanceWorkshopPenaltyRate: 0.5,
  operatorProductionBonusRate: 0.1,
  premiumFuelSellPriceBonus: 5,
  salesAgentSellPriceBonus: 3,
  chemistRpBonusRate: 0.1,
  logisticsCoordinatorShipmentBonusRate: 0.1,
} as const

export const EVENT_BALANCE = {
  crudeDiscountAmount: 10,
  machineTuneUpMoneyReward: 200,
  minorLeakCrudeLoss: 20,
  qualityBonusGasolineAmount: 20,
  marketDemandSpikeMoneyReward: 750,
  safetyInspectionPassReputationReward: 10,
  safetyInspectionFailMoneyPenalty: 300,
  safetyInspectionReputationThreshold: 50,
  equipmentWearGasolineLoss: 10,
  efficientBatchGasolineAmount: 30,
} as const

export const MILESTONE_BALANCE = {
  firstFuelMoneyReward: 300,
  smallSupplierRpReward: 5,
  smallSupplierReputationReward: 10,
  growingRefineryMoneyReward: 1000,
  growingRefineryReputationReward: 15,
  researchBeginnerMoneyReward: 500,
  researchBeginnerReputationReward: 20,
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
    reputationReward: 25,
  },
  {
    id: 5,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 300,
    reward: 6500,
    rpReward: 25,
    reputationReward: 35,
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
] as const

export const BUILDING_UPGRADE_BALANCE = {
  upgradeLv1ToLv2Cost: 5_000,
  upgradeLv2ToLv3Cost: 15_000,
  maxBuildingLevel: 3,
  // Index 0 is unused; index 1/2/3 = level bonus
  crudeTankStorageByLevel: [0, 25, 50, 100],
  productTankStorageByLevel: [0, 25, 50, 100],
  distillationUnitBonusRateByLevel: [0, 0, 0.25, 0.5],
}

export const SHIPMENT_BALANCE = [
  { key: 'localTruck' as const, amount: 100, cost: 900, delayMs: 30_000 },
  { key: 'coastalTanker' as const, amount: 500, cost: 4000, delayMs: 90_000 },
  { key: 'importedShip' as const, amount: 1500, cost: 10500, delayMs: 180_000 },
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
