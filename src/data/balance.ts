// Early-game pacing and economy live here so tuning does not require
// searching through simulation code.

export const CORE_BALANCE = {
  tickMs: 200,
  gridSize: 9,
  maxLogItems: 6,
  randomEventIntervalMs: 30000,
} as const

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
  crudeTankStorageBonus: 3,
  productTankStorageBonus: 3,
  biggerTanksStorageBonus: 20,
  industrialStorageBonus: 50,
  mechanicStorageBonus: 10,
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
} as const

export const EVENT_BALANCE = {
  crudeDiscountAmount: 50,
  machineTuneUpMoneyReward: 200,
  minorLeakCrudeLoss: 20,
  qualityBonusGasolineAmount: 20,
} as const

export const MILESTONE_BALANCE = {
  firstFuelMoneyReward: 300,
  smallSupplierRpReward: 5,
  growingRefineryMoneyReward: 1000,
  researchBeginnerMoneyReward: 500,
} as const

export const CONTRACT_BALANCE = [
  {
    id: 1,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 20,
    reward: 300,
    rpReward: 2,
    reputationReward: 1,
  },
  {
    id: 2,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 50,
    reward: 900,
    rpReward: 5,
    reputationReward: 2,
  },
  {
    id: 3,
    tier: 1,
    unlockLevel: 1,
    gasolineRequired: 100,
    reward: 2200,
    rpReward: 10,
    reputationReward: 5,
  },
  {
    id: 4,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 250,
    reward: 5000,
    rpReward: 20,
    reputationReward: 10,
  },
  {
    id: 5,
    tier: 2,
    unlockLevel: 3,
    gasolineRequired: 400,
    reward: 8500,
    rpReward: 35,
    reputationReward: 15,
  },
  {
    id: 6,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 750,
    reward: 20000,
    rpReward: 75,
    reputationReward: 25,
  },
  {
    id: 7,
    tier: 3,
    unlockLevel: 5,
    gasolineRequired: 1000,
    reward: 30000,
    rpReward: 100,
    reputationReward: 35,
  },
] as const

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
