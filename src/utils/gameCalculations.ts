import {
  BONUS_BALANCE,
  BUILDING_UPGRADE_BALANCE,
  CORE_BALANCE,
  ECONOMY_BALANCE,
  EVENT_BALANCE,
  EXPANSION_BALANCE,
  MILESTONE_BALANCE,
  PRODUCTION_BALANCE,
  REPUTATION_TIER_BALANCE,
  STARTING_BALANCE,
  STORAGE_BALANCE,
} from '../data/balance'
import type { ShipmentOption } from '../data/balance'
import { CONTRACTS } from '../data/contracts'
import { RANDOM_EVENTS } from '../data/events'
import { MILESTONES } from '../data/milestones'
import { RESEARCH_ITEMS } from '../data/research'
import { WORKERS } from '../data/workers'
import { serializeBilingualText, text } from '../translations'
import type {
  ActiveWorkerItem,
  BuildingCounts,
  BilingualTextValue,
  ChoiceEvent,
  ComboStats,
  DerivedStats,
  GameState,
  GridCell,
  PendingShipment,
  RandomEvent,
  ReputationTier,
  WorkerCounts,
} from '../types'

export const TICK_MS = CORE_BALANCE.tickMs
export const GRID_SIZE = CORE_BALANCE.gridSize
export const STARTING_MONEY = STARTING_BALANCE.money
export const STARTING_CRUDE = STARTING_BALANCE.crudeOil
export const CRUDE_COST = ECONOMY_BALANCE.crudeCost
export const RANDOM_EVENT_INTERVAL_MS = CORE_BALANCE.randomEventIntervalMs

export const REPUTATION_TIERS: ReputationTier[] = [
  {
    name: text.reputation.tiers.starter,
    minimumReputation: REPUTATION_TIER_BALANCE[0].minimumReputation,
    contractRewardBonusRate: REPUTATION_TIER_BALANCE[0].contractRewardBonusRate,
  },
  {
    name: text.reputation.tiers.smallBonus,
    minimumReputation: REPUTATION_TIER_BALANCE[1].minimumReputation,
    contractRewardBonusRate: REPUTATION_TIER_BALANCE[1].contractRewardBonusRate,
  },
  {
    name: text.reputation.tiers.trustedSupplier,
    minimumReputation: REPUTATION_TIER_BALANCE[2].minimumReputation,
    contractRewardBonusRate: REPUTATION_TIER_BALANCE[2].contractRewardBonusRate,
  },
  {
    name: text.reputation.tiers.industryLeader,
    minimumReputation: REPUTATION_TIER_BALANCE[3].minimumReputation,
    contractRewardBonusRate: REPUTATION_TIER_BALANCE[3].contractRewardBonusRate,
  },
]

export function getGridColumns(expansionLevel: number): number {
  const entry = EXPANSION_BALANCE[Math.min(expansionLevel, EXPANSION_BALANCE.length - 1)]
  return entry.size
}

export function createInitialGameState(): GameState {
  return {
    money: STARTING_MONEY,
    researchPoints: 0,
    reputation: STARTING_BALANCE.reputation,
    crudeOil: STARTING_CRUDE,
    gasoline: 0,
    refineryLevel: 1,
    productionProgress: 0,
    tickCount: 0,
    lastEventMessage: serializeBilingualText(text.events.noEvent),
    totalGasolineProduced: 0,
    completedContractCount: 0,
    totalWorkersHired: 0,
    unlockedResearchCount: 0,
    activityLog: [serializeBilingualText(text.logs.refineryOnline)],
    completedContractIds: [],
    completedMilestoneKeys: [],
    unlockedResearchIds: [],
    workerCounts: {
      operator: 0,
      mechanic: 0,
      salesAgent: 0,
      safetyOfficer: 0,
      chemist: 0,
      logisticsCoordinator: 0,
      fuelSpecialist: 0,
      aviationSpecialist: 0,
      chemicalEngineer: 0,
    },
    grid: Array(EXPANSION_BALANCE[0].cells).fill(null),
    gridLevels: Array(EXPANSION_BALANCE[0].cells).fill(1),
    gridExpansionLevel: 0,
    prototypeCompleted: false,
    everBoughtCrude: false,
    starterGuideDismissed: false,
    pendingShipments: [],
    standingOrderCooldowns: {},
    productInventory: {
      gasoline: 0,
      asphalt: 0,
      jetFuel: 0,
      lubricants: 0,
      petrochemicals: 0,
    },
  }
}

export function getUpgradeCost(level: number) {
  return (
    ECONOMY_BALANCE.refineryUpgradeBaseCost +
    level * ECONOMY_BALANCE.refineryUpgradeLevelStep
  )
}

export function addLog(logs: string[], message: string) {
  return [message, ...logs].slice(0, CORE_BALANCE.maxLogItems)
}

export function getRandomEvent() {
  const randomIndex = Math.floor(Math.random() * RANDOM_EVENTS.length)
  return RANDOM_EVENTS[randomIndex]
}

function getEmptyBuildingCounts(): BuildingCounts {
  return {
    crudeTank: 0,
    distillationUnit: 0,
    productTank: 0,
    laboratory: 0,
    maintenanceWorkshop: 0,
    salesOffice: 0,
    lubricantPlant: 0,
    jetFuelPlant: 0,
    petrochemicalPlant: 0,
  }
}

function getEmptyWorkerCounts(): WorkerCounts {
  return {
    operator: 0,
    mechanic: 0,
    salesAgent: 0,
    safetyOfficer: 0,
    chemist: 0,
    logisticsCoordinator: 0,
    fuelSpecialist: 0,
    aviationSpecialist: 0,
    chemicalEngineer: 0,
  }
}

function getActiveWorkers(workerCounts: Partial<WorkerCounts>): ActiveWorkerItem[] {
  const safeCounts = {
    ...getEmptyWorkerCounts(),
    ...workerCounts,
  }

  return WORKERS.map((worker) => ({
    ...worker,
    count: safeCounts[worker.key],
  }))
}

function getComboStats(grid: GridCell[]): ComboStats {
  const combos: ComboStats = {
    crudeToDistillation: 0,
    distillationToProduct: 0,
    crudeToProduct: 0,
  }

  const cols = Math.round(Math.sqrt(grid.length))

  grid.forEach((cell, index) => {
    if (!cell) {
      return
    }

    const rightNeighbor = index % cols < cols - 1 ? grid[index + 1] : null
    const bottomNeighbor = index < cols * (cols - 1) ? grid[index + cols] : null
    const neighbors = [rightNeighbor, bottomNeighbor]

    neighbors.forEach((neighbor) => {
      if (!neighbor) {
        return
      }

      if (
        (cell === 'crudeTank' && neighbor === 'distillationUnit') ||
        (cell === 'distillationUnit' && neighbor === 'crudeTank')
      ) {
        combos.crudeToDistillation += 1
      }

      if (
        (cell === 'distillationUnit' && neighbor === 'productTank') ||
        (cell === 'productTank' && neighbor === 'distillationUnit')
      ) {
        combos.distillationToProduct += 1
      }

      if (
        (cell === 'crudeTank' && neighbor === 'productTank') ||
        (cell === 'productTank' && neighbor === 'crudeTank')
      ) {
        combos.crudeToProduct += 1
      }
    })
  })

  return combos
}

function countBuildings(grid: GridCell[]) {
  return grid.reduce((counts, cell) => {
    if (cell) {
      counts[cell] += 1
    }

    return counts
  }, getEmptyBuildingCounts())
}

function getBaseProductionInterval(level: number, distillationUnits: number) {
  return Math.max(
    PRODUCTION_BALANCE.minProductionMs,
    PRODUCTION_BALANCE.baseProductionMs -
      (level - 1) * PRODUCTION_BALANCE.refineryUpgradeSpeedStepMs -
      distillationUnits * PRODUCTION_BALANCE.distillationUnitSpeedBonusMs,
  )
}

function getResearchName(researchKey: string): BilingualTextValue | undefined {
  return RESEARCH_ITEMS.find((item) => item.key === researchKey)?.name
}

function getCurrentReputationTier(reputation: number) {
  return REPUTATION_TIERS.reduce((currentTier, tier) => {
    if (reputation >= tier.minimumReputation) {
      return tier
    }

    return currentTier
  }, REPUTATION_TIERS[0])
}

function getNextReputationTier(reputation: number) {
  return REPUTATION_TIERS.find((tier) => tier.minimumReputation > reputation)
}

export function calculateDerivedStats(game: GameState): DerivedStats {
  const buildingCounts = countBuildings(game.grid)
  const comboStats = getComboStats(game.grid)
  const hasBetterPumps = game.unlockedResearchIds.includes('betterPumps')
  const hasAdvancedDistillation =
    game.unlockedResearchIds.includes('advancedDistillation')
  const hasAdvancedProcessing =
    game.unlockedResearchIds.includes('advancedProcessing')
  const hasBiggerTanks = game.unlockedResearchIds.includes('biggerTanks')
  const hasIndustrialStorage =
    game.unlockedResearchIds.includes('industrialStorage')
  const hasStorageOptimization =
    game.unlockedResearchIds.includes('storageOptimization')
  const hasPremiumFuel = game.unlockedResearchIds.includes('premiumFuel')
  const hasPremiumContracts =
    game.unlockedResearchIds.includes('premiumContracts')
  const hasContractAnalytics =
    game.unlockedResearchIds.includes('contractAnalytics')
  const hasSaferOperations =
    game.unlockedResearchIds.includes('saferOperations')
  const activeWorkers = getActiveWorkers(game.workerCounts)
  const operatorCount = game.workerCounts.operator
  const mechanicCount = game.workerCounts.mechanic
  const salesAgentCount = game.workerCounts.salesAgent
  const chemistCount = game.workerCounts.chemist ?? 0
  const safetyOfficerCount = game.workerCounts.safetyOfficer ?? 0
  const fuelSpecialistCount = game.workerCounts.fuelSpecialist ?? 0
  let crudeTankStorageTotal = 0
  let productTankStorageTotal = 0
  let distillationUpgradeBonusRate = 0
  let laboratoryRpBonusTotal = 0
  let workshopPenaltyMultiplier = 1
  let salesOfficeContractBonusTotal = 0
  for (let i = 0; i < game.grid.length; i++) {
    const cell = game.grid[i]
    if (!cell) continue
    const level = game.gridLevels[i] ?? 1
    if (cell === 'crudeTank') {
      crudeTankStorageTotal += BUILDING_UPGRADE_BALANCE.crudeTankStorageByLevel[level] ?? 25
    } else if (cell === 'productTank') {
      productTankStorageTotal += BUILDING_UPGRADE_BALANCE.productTankStorageByLevel[level] ?? 25
    } else if (cell === 'distillationUnit') {
      distillationUpgradeBonusRate +=
        BUILDING_UPGRADE_BALANCE.distillationUnitBonusRateByLevel[level] ?? 0
    } else if (cell === 'laboratory') {
      laboratoryRpBonusTotal +=
        BUILDING_UPGRADE_BALANCE.laboratoryRpBonusRateByLevel[level] ?? 0.1
    } else if (cell === 'maintenanceWorkshop') {
      workshopPenaltyMultiplier *=
        BUILDING_UPGRADE_BALANCE.maintenanceWorkshopPenaltyRateByLevel[level] ?? 0.5
    } else if (cell === 'salesOffice') {
      salesOfficeContractBonusTotal +=
        BUILDING_UPGRADE_BALANCE.salesOfficeContractBonusRateByLevel[level] ?? 0.1
    }
  }
  const distillationUpgradeProductionMultiplier = 1 + distillationUpgradeBonusRate

  const baseCrudeStorage = STORAGE_BALANCE.baseCrudeStorage + crudeTankStorageTotal
  const baseGasolineStorage = STORAGE_BALANCE.baseGasolineStorage + productTankStorageTotal
  const storageMultiplier =
    1 + comboStats.crudeToProduct * BONUS_BALANCE.adjacencyBonusRate
  const researchStorageBonus =
    (hasBiggerTanks ? STORAGE_BALANCE.biggerTanksStorageBonus : 0) +
    (hasIndustrialStorage ? STORAGE_BALANCE.industrialStorageBonus : 0) +
    (hasStorageOptimization ? STORAGE_BALANCE.storageOptimizationBonus : 0)
  const workerStorageBonus =
    mechanicCount * STORAGE_BALANCE.mechanicStorageBonus
  const maxCrudeStorage =
    Math.round(baseCrudeStorage * storageMultiplier) +
    researchStorageBonus +
    workerStorageBonus
  const maxGasolineStorage =
    Math.round(baseGasolineStorage * storageMultiplier) +
    researchStorageBonus +
    workerStorageBonus
  const baseProductionInterval = getBaseProductionInterval(
    game.refineryLevel,
    buildingCounts.distillationUnit,
  )
  const productionMultiplier =
    1 + comboStats.crudeToDistillation * BONUS_BALANCE.adjacencyBonusRate
  const researchProductionMultiplier =
    (hasBetterPumps ? 1 + BONUS_BALANCE.betterPumpsBonusRate : 1) *
    (hasAdvancedDistillation
      ? 1 + BONUS_BALANCE.advancedDistillationBonusRate
      : 1) *
    (hasAdvancedProcessing ? 1 + BONUS_BALANCE.advancedProcessingBonusRate : 1)
  const workerProductionMultiplier =
    1 + operatorCount * BONUS_BALANCE.operatorProductionBonusRate
  const productionInterval = Math.max(
    PRODUCTION_BALANCE.minProductionMs,
    baseProductionInterval /
      productionMultiplier /
      researchProductionMultiplier /
      workerProductionMultiplier /
      distillationUpgradeProductionMultiplier,
  )
  const productionRate = 1000 / productionInterval
  const sellPriceMultiplier =
    1 + comboStats.distillationToProduct * BONUS_BALANCE.adjacencyBonusRate
  const reputationTier = getCurrentReputationTier(game.reputation)
  const nextReputationTier = getNextReputationTier(game.reputation)
  const reputationContractRewardMultiplier =
    1 + reputationTier.contractRewardBonusRate
  const researchContractRewardMultiplier = hasPremiumContracts
    ? 1 + BONUS_BALANCE.premiumContractsBonusRate
    : 1
  const specialBuildingContractRewardMultiplier =
    1 + salesOfficeContractBonusTotal
  const contractRewardMultiplier =
    reputationContractRewardMultiplier *
    researchContractRewardMultiplier *
    specialBuildingContractRewardMultiplier
  const specialBuildingRpRewardMultiplier =
    1 + laboratoryRpBonusTotal
  const chemistRpMultiplier = 1 + chemistCount * BONUS_BALANCE.chemistRpBonusRate
  const researchContractRpMultiplier = hasContractAnalytics
    ? 1 + BONUS_BALANCE.contractAnalyticsRpBonusRate
    : 1
  const contractRpRewardMultiplier =
    specialBuildingRpRewardMultiplier * chemistRpMultiplier * researchContractRpMultiplier
  const eventPenaltyMultiplier =
    workshopPenaltyMultiplier *
    Math.pow(BONUS_BALANCE.safetyOfficerPenaltyRate, safetyOfficerCount) *
    (hasSaferOperations ? BONUS_BALANCE.saferOperationsPenaltyRate : 1)
  const researchSellPriceBonus = hasPremiumFuel
    ? BONUS_BALANCE.premiumFuelSellPriceBonus
    : 0
  const workerSellPriceBonus =
    salesAgentCount * BONUS_BALANCE.salesAgentSellPriceBonus
  const fuelSpecialistSellPriceMultiplier =
    1 + fuelSpecialistCount * BONUS_BALANCE.fuelSpecialistSellPriceBonusRate
  const sellPrice =
    Math.round(ECONOMY_BALANCE.gasolinePrice * sellPriceMultiplier * fuelSpecialistSellPriceMultiplier) +
    researchSellPriceBonus +
    workerSellPriceBonus
  const upgradeCost = getUpgradeCost(game.refineryLevel)
  const availableSpace = game.grid.filter((cell) => cell === null).length
  const activeContracts = CONTRACTS.map((contract) => ({
    ...contract,
    isCompleted: game.completedContractIds.includes(contract.id),
    isUnlocked: game.refineryLevel >= contract.unlockLevel,
    currentReward: Math.round(contract.reward * contractRewardMultiplier),
    currentRpReward: Math.round(contract.rpReward * contractRpRewardMultiplier),
    currentReputationReward: contract.reputationReward,
    unlockRequirement:
      game.refineryLevel >= contract.unlockLevel
        ? undefined
        : text.contracts.unlockAtLevel(contract.unlockLevel),
  }))
  const activeMilestones = MILESTONES.map((milestone) => ({
    ...milestone,
    isCompleted: game.completedMilestoneKeys.includes(milestone.key),
  }))
  const activeResearchItems = RESEARCH_ITEMS.map((item) => ({
    ...item,
    isUnlocked: game.unlockedResearchIds.includes(item.key),
    isVisible:
      !item.prerequisite ||
      game.unlockedResearchIds.includes(item.prerequisite) ||
      game.unlockedResearchIds.includes(item.key),
    prerequisiteName: item.prerequisite
      ? getResearchName(item.prerequisite)
      : undefined,
  })).filter((item) => item.isVisible)
  const canProcessCrude = game.crudeOil > 0 && game.gasoline < maxGasolineStorage
  const progressPercent = canProcessCrude
    ? Math.min((game.productionProgress / productionInterval) * 100, 100)
    : 0

  let statusLabel = text.production.status.waiting
  if (game.gasoline >= maxGasolineStorage) {
    statusLabel = text.production.status.tankFull
  } else if (game.crudeOil > 0) {
    statusLabel = text.production.status.processing
  }

  return {
    activeContracts,
    activeMilestones,
    activeResearchItems,
    activeWorkers,
    availableSpace,
    baseCrudeStorage,
    baseGasolineStorage,
    baseProductionInterval,
    buildingCounts,
    canProcessCrude,
    comboStats,
    contractRewardMultiplier,
    contractRpRewardMultiplier,
    reputationContractRewardMultiplier,
    eventPenaltyMultiplier,
    reputationTier,
    nextReputationTier,
    maxCrudeStorage,
    maxGasolineStorage,
    productionInterval,
    researchContractRewardMultiplier,
    researchProductionMultiplier,
    researchSellPriceBonus,
    researchStorageBonus,
    specialBuildingContractRewardMultiplier,
    specialBuildingRpRewardMultiplier,
    workerProductionMultiplier,
    workerSellPriceBonus,
    workerStorageBonus,
    productionMultiplier,
    productionRate,
    progressPercent,
    sellPrice,
    sellPriceMultiplier,
    statusLabel,
    storageMultiplier,
    upgradeCost,
  }
}

export function applyWinGoal(game: GameState): GameState {
  if (game.prototypeCompleted) return game

  const allGoalsDone =
    game.refineryLevel >= 10 &&
    game.reputation >= 250 &&
    game.completedContractIds.includes(7) &&
    game.gridExpansionLevel >= 2

  if (!allGoalsDone) return game

  return {
    ...game,
    prototypeCompleted: true,
    activityLog: addLog(
      game.activityLog,
      serializeBilingualText(text.goal.completionLog),
    ),
  }
}

export function applyMilestones(game: GameState) {
  let nextGame = game

  if (
    !nextGame.completedMilestoneKeys.includes('firstFuel') &&
    nextGame.totalGasolineProduced >= 50
  ) {
    const message = serializeBilingualText(text.logs.milestoneFirstFuel)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.firstFuelMoneyReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'firstFuel'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('smallSupplier') &&
    nextGame.completedContractCount >= 2
  ) {
    const message = serializeBilingualText(text.logs.milestoneSmallSupplier)
    nextGame = {
      ...nextGame,
      researchPoints:
        nextGame.researchPoints + MILESTONE_BALANCE.smallSupplierRpReward,
      reputation:
        nextGame.reputation + MILESTONE_BALANCE.smallSupplierReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'smallSupplier'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('growingRefinery') &&
    nextGame.totalWorkersHired >= 3
  ) {
    const message = serializeBilingualText(text.logs.milestoneGrowingRefinery)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.growingRefineryMoneyReward,
      reputation:
        nextGame.reputation + MILESTONE_BALANCE.growingRefineryReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'growingRefinery'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('researchBeginner') &&
    nextGame.unlockedResearchCount >= 1
  ) {
    const message = serializeBilingualText(text.logs.milestoneResearchBeginner)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.researchBeginnerMoneyReward,
      reputation:
        nextGame.reputation + MILESTONE_BALANCE.researchBeginnerReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'researchBeginner'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('upgradeBuilder') &&
    nextGame.gridLevels.some((l) => l >= 2)
  ) {
    const message = serializeBilingualText(text.logs.milestoneUpgradeBuilder)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.upgradeBuilderMoneyReward,
      researchPoints: nextGame.researchPoints + MILESTONE_BALANCE.upgradeBuilderRpReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'upgradeBuilder'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('reputedSupplier') &&
    nextGame.reputation >= 50
  ) {
    const message = serializeBilingualText(text.logs.milestoneReputedSupplier)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.reputedSupplierMoneyReward,
      researchPoints: nextGame.researchPoints + MILESTONE_BALANCE.reputedSupplierRpReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'reputedSupplier'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('industrialProducer') &&
    nextGame.totalGasolineProduced >= 500
  ) {
    const message = serializeBilingualText(text.logs.milestoneIndustrialProducer)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.industrialProducerMoneyReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'industrialProducer'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('refineryLevel5') &&
    nextGame.refineryLevel >= 5
  ) {
    const message = serializeBilingualText(text.logs.milestoneRefineryLevel5)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.refineryLevel5MoneyReward,
      reputation: nextGame.reputation + MILESTONE_BALANCE.refineryLevel5ReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'refineryLevel5'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('researchAdvanced') &&
    nextGame.unlockedResearchCount >= 3
  ) {
    const message = serializeBilingualText(text.logs.milestoneResearchAdvanced)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.researchAdvancedMoneyReward,
      reputation: nextGame.reputation + MILESTONE_BALANCE.researchAdvancedReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'researchAdvanced'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('contractVeteran') &&
    nextGame.completedContractCount >= 10
  ) {
    const message = serializeBilingualText(text.logs.milestoneContractVeteran)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.contractVeteranMoneyReward,
      researchPoints: nextGame.researchPoints + MILESTONE_BALANCE.contractVeteranRpReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'contractVeteran'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('tierThreeContractor') &&
    CONTRACTS.some((c) => c.tier === 3 && nextGame.completedContractIds.includes(c.id))
  ) {
    const message = serializeBilingualText(text.logs.milestoneTierThreeContractor)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.tierThreeContractorMoneyReward,
      reputation: nextGame.reputation + MILESTONE_BALANCE.tierThreeContractorReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'tierThreeContractor'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('fullWorkforce') &&
    Object.values(nextGame.workerCounts).every((count) => count > 0)
  ) {
    const message = serializeBilingualText(text.logs.milestoneFullWorkforce)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.fullWorkforceMoneyReward,
      reputation: nextGame.reputation + MILESTONE_BALANCE.fullWorkforceReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'fullWorkforce'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('jetFuelPioneer') &&
    nextGame.grid.includes('jetFuelPlant')
  ) {
    const message = serializeBilingualText(text.logs.milestoneJetFuelPioneer)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.jetFuelPioneerMoneyReward,
      reputation: nextGame.reputation + MILESTONE_BALANCE.jetFuelPioneerReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'jetFuelPioneer'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('aviationPartner') &&
    CONTRACTS.some(
      (c) => (c.jetFuelRequired ?? 0) > 0 && nextGame.completedContractIds.includes(c.id),
    )
  ) {
    const message = serializeBilingualText(text.logs.milestoneAviationPartner)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.aviationPartnerMoneyReward,
      researchPoints: nextGame.researchPoints + MILESTONE_BALANCE.aviationPartnerRpReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'aviationPartner'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (
    !nextGame.completedMilestoneKeys.includes('petrochemicalPioneer') &&
    nextGame.grid.includes('petrochemicalPlant')
  ) {
    const message = serializeBilingualText(text.logs.milestonePetrochemicalPioneer)
    nextGame = {
      ...nextGame,
      money: nextGame.money + MILESTONE_BALANCE.petrochemicalPioneerMoneyReward,
      reputation:
        nextGame.reputation + MILESTONE_BALANCE.petrochemicalPioneerReputationReward,
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'petrochemicalPioneer'],
      activityLog: addLog(nextGame.activityLog, message),
    }
  }

  if (!nextGame.completedMilestoneKeys.includes('productMogul')) {
    const completedIds = nextGame.completedContractIds
    const hasGasoline = CONTRACTS.some(
      (c) => c.gasolineRequired > 0 && completedIds.includes(c.id),
    )
    const hasAsphalt = CONTRACTS.some(
      (c) => (c.asphaltRequired ?? 0) > 0 && completedIds.includes(c.id),
    )
    const hasJetFuel = CONTRACTS.some(
      (c) => (c.jetFuelRequired ?? 0) > 0 && completedIds.includes(c.id),
    )
    const hasLubricants = CONTRACTS.some(
      (c) => (c.lubricantsRequired ?? 0) > 0 && completedIds.includes(c.id),
    )
    const hasPetrochemicals = CONTRACTS.some(
      (c) => (c.petrochemicalsRequired ?? 0) > 0 && completedIds.includes(c.id),
    )

    if (hasGasoline && hasAsphalt && hasJetFuel && hasLubricants && hasPetrochemicals) {
      const message = serializeBilingualText(text.logs.milestoneProductMogul)
      nextGame = {
        ...nextGame,
        money: nextGame.money + MILESTONE_BALANCE.productMogulMoneyReward,
        reputation: nextGame.reputation + MILESTONE_BALANCE.productMogulReputationReward,
        completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'productMogul'],
        activityLog: addLog(nextGame.activityLog, message),
      }
    }
  }

  return nextGame
}

export function applyRandomEvent(game: GameState, event: RandomEvent) {
  const stats = calculateDerivedStats(game)

  if (event.key === 'crudeDiscount') {
    return {
      ...game,
      crudeOil: Math.min(
        stats.maxCrudeStorage,
        game.crudeOil + EVENT_BALANCE.crudeDiscountAmount,
      ),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'machineTuneUp') {
    return {
      ...game,
      money: game.money + EVENT_BALANCE.machineTuneUpMoneyReward,
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'minorLeak') {
    const crudeLoss = Math.floor(
      EVENT_BALANCE.minorLeakCrudeLoss * stats.eventPenaltyMultiplier,
    )

    return {
      ...game,
      crudeOil: Math.max(0, game.crudeOil - crudeLoss),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'qualityBonus') {
    return {
      ...game,
      gasoline: Math.min(
        stats.maxGasolineStorage,
        game.gasoline + EVENT_BALANCE.qualityBonusGasolineAmount,
      ),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'marketDemandSpike') {
    return {
      ...game,
      money: game.money + EVENT_BALANCE.marketDemandSpikeMoneyReward,
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'safetyInspection') {
    const passed = game.reputation >= EVENT_BALANCE.safetyInspectionReputationThreshold
    const message = passed
      ? serializeBilingualText(text.data.events.safetyInspection.message)
      : serializeBilingualText(text.data.safetyInspectionFailMessage)
    if (passed) {
      return {
        ...game,
        reputation: game.reputation + EVENT_BALANCE.safetyInspectionPassReputationReward,
        lastEventMessage: message,
        activityLog: addLog(game.activityLog, message),
      }
    }
    return {
      ...game,
      money: Math.max(0, game.money - EVENT_BALANCE.safetyInspectionFailMoneyPenalty),
      lastEventMessage: message,
      activityLog: addLog(game.activityLog, message),
    }
  }

  if (event.key === 'equipmentWear') {
    return {
      ...game,
      gasoline: Math.max(0, game.gasoline - EVENT_BALANCE.equipmentWearGasolineLoss),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'efficientBatch') {
    return {
      ...game,
      gasoline: Math.min(
        stats.maxGasolineStorage,
        game.gasoline + EVENT_BALANCE.efficientBatchGasolineAmount,
      ),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'localNewsCoverage') {
    return {
      ...game,
      reputation: game.reputation + EVENT_BALANCE.localNewsCoverageReputationGain,
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'supplierDiscount') {
    return {
      ...game,
      crudeOil: Math.min(
        stats.maxCrudeStorage,
        game.crudeOil + EVENT_BALANCE.supplierDiscountCrudeAmount,
      ),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'equipmentInspection') {
    return {
      ...game,
      money: Math.max(0, game.money - EVENT_BALANCE.equipmentInspectionMoneyCost),
      reputation: game.reputation + EVENT_BALANCE.equipmentInspectionReputationGain,
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'workerSuggestion') {
    return {
      ...game,
      researchPoints: game.researchPoints + EVENT_BALANCE.workerSuggestionRpGain,
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'storageContamination') {
    const gasolineLoss = Math.floor(
      EVENT_BALANCE.storageContaminationGasolineLoss * stats.eventPenaltyMultiplier,
    )
    return {
      ...game,
      gasoline: Math.max(0, game.gasoline - gasolineLoss),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  // communityVisit
  return {
    ...game,
    money: Math.max(0, game.money - EVENT_BALANCE.communityVisitMoneyCost),
    reputation: game.reputation + EVENT_BALANCE.communityVisitReputationGain,
    lastEventMessage: event.message,
    activityLog: addLog(game.activityLog, event.message),
  }
}

export function orderShipment(
  game: GameState,
  option: ShipmentOption,
  now: number,
): GameState {
  if (game.money < option.cost) return game

  const shipment: PendingShipment = {
    id: now,
    amount: option.amount,
    arrivesAt: now + option.delayMs,
  }

  const delaySecs = option.delayMs / 1000
  const name = text.shipments.names[option.key]

  return {
    ...game,
    money: game.money - option.cost,
    pendingShipments: [...game.pendingShipments, shipment],
    activityLog: addLog(
      game.activityLog,
      serializeBilingualText(
        text.shipments.logOrdered(name, option.amount, option.cost, delaySecs),
      ),
    ),
  }
}

export function applyShipmentArrivals(game: GameState, now: number): GameState {
  const arrived = game.pendingShipments.filter((s) => s.arrivesAt <= now)
  if (arrived.length === 0) return game

  const remaining = game.pendingShipments.filter((s) => s.arrivesAt > now)
  let nextGame: GameState = { ...game, pendingShipments: remaining }

  for (const shipment of arrived) {
    const currentStats = calculateDerivedStats(nextGame)
    const logisticsCount = nextGame.workerCounts.logisticsCoordinator ?? 0
    const logisticsMultiplier = 1 + logisticsCount * BONUS_BALANCE.logisticsCoordinatorShipmentBonusRate
    const boostedAmount = Math.floor(shipment.amount * logisticsMultiplier)
    const space = currentStats.maxCrudeStorage - nextGame.crudeOil
    const delivered = Math.min(boostedAmount, Math.max(0, space))
    const excess = boostedAmount - delivered

    nextGame = {
      ...nextGame,
      crudeOil: nextGame.crudeOil + delivered,
      activityLog: addLog(
        nextGame.activityLog,
        serializeBilingualText(
          text.shipments.logArrived(delivered, excess),
        ),
      ),
    }
  }

  return nextGame
}

export function applyChoiceEventOption(
  game: GameState,
  event: ChoiceEvent,
  option: 'A' | 'B',
): GameState {
  const stats = calculateDerivedStats(game)
  const chosenLabel = option === 'A' ? event.optionA : event.optionB
  const logMessage = serializeBilingualText(
    text.choiceEvents.logChose(event.title, chosenLabel),
  )

  if (event.key === 'supplierNegotiation') {
    if (option === 'A') {
      return {
        ...game,
        crudeOil: Math.min(
          stats.maxCrudeStorage,
          game.crudeOil + 50,
        ),
        reputation: Math.max(0, game.reputation - 8),
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: game.reputation + 10,
      money: game.money - 500,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'researchGrant') {
    if (option === 'A') {
      return {
        ...game,
        researchPoints: game.researchPoints + 20,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      money: game.money + 1000,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'workerRecruitment') {
    if (option === 'A') {
      return applyMilestones({
        ...game,
        totalWorkersHired: game.totalWorkersHired + 1,
        workerCounts: {
          ...game.workerCounts,
          operator: game.workerCounts.operator + 1,
        },
        activityLog: addLog(game.activityLog, logMessage),
      })
    }
    return applyMilestones({
      ...game,
      totalWorkersHired: game.totalWorkersHired + 1,
      workerCounts: {
        ...game.workerCounts,
        mechanic: game.workerCounts.mechanic + 1,
      },
      activityLog: addLog(game.activityLog, logMessage),
    })
  }

  if (event.key === 'equipmentEmergency') {
    const stats = calculateDerivedStats(game)
    if (option === 'A') {
      return {
        ...game,
        money: Math.max(0, game.money - 600),
        gasoline: Math.min(stats.maxGasolineStorage, game.gasoline + 20),
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      crudeOil: Math.max(0, game.crudeOil - 20),
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'governmentIncentive') {
    if (option === 'A') {
      return {
        ...game,
        money: game.money + 1500,
        reputation: Math.max(0, game.reputation - 10),
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: game.reputation + 25,
      researchPoints: game.researchPoints + 5,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'qualityAlert') {
    if (option === 'A') {
      return {
        ...game,
        gasoline: Math.max(0, game.gasoline - 20),
        reputation: game.reputation + 15,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: Math.max(0, game.reputation - 10),
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'supplyChainDelay') {
    if (option === 'A') {
      return {
        ...game,
        money: Math.max(0, game.money - 400),
        crudeOil: Math.min(stats.maxCrudeStorage, game.crudeOil + 30),
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: game.reputation + 5,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'investorVisit') {
    if (option === 'A') {
      return {
        ...game,
        money: Math.max(0, game.money - 300),
        reputation: game.reputation + 20,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: Math.max(0, game.reputation - 5),
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'oldEquipmentSale') {
    if (option === 'A') {
      return {
        ...game,
        money: game.money + 800,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      crudeOil: Math.min(stats.maxCrudeStorage, game.crudeOil + 30),
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'trainingRequest') {
    if (option === 'A') {
      return {
        ...game,
        money: Math.max(0, game.money - 500),
        researchPoints: game.researchPoints + 8,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  if (event.key === 'communityComplaint') {
    if (option === 'A') {
      return {
        ...game,
        money: Math.max(0, game.money - 350),
        reputation: game.reputation + 15,
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: Math.max(0, game.reputation - 12),
      activityLog: addLog(game.activityLog, logMessage),
    }
  }

  // rushOrder
  if (option === 'A') {
    return {
      ...game,
      gasoline: Math.max(0, game.gasoline - 30),
      money: game.money + 800,
      activityLog: addLog(game.activityLog, logMessage),
    }
  }
  return {
    ...game,
    reputation: game.reputation + 10,
    activityLog: addLog(game.activityLog, logMessage),
  }
}
