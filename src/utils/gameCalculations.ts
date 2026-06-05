import {
  BONUS_BALANCE,
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
    },
    grid: Array(EXPANSION_BALANCE[0].cells).fill(null),
    gridExpansionLevel: 0,
    prototypeCompleted: false,
    everBoughtCrude: false,
    starterGuideDismissed: false,
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
  }
}

function getEmptyWorkerCounts(): WorkerCounts {
  return {
    operator: 0,
    mechanic: 0,
    salesAgent: 0,
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
  const hasBiggerTanks = game.unlockedResearchIds.includes('biggerTanks')
  const hasIndustrialStorage =
    game.unlockedResearchIds.includes('industrialStorage')
  const hasPremiumFuel = game.unlockedResearchIds.includes('premiumFuel')
  const hasPremiumContracts =
    game.unlockedResearchIds.includes('premiumContracts')
  const activeWorkers = getActiveWorkers(game.workerCounts)
  const operatorCount = game.workerCounts.operator
  const mechanicCount = game.workerCounts.mechanic
  const salesAgentCount = game.workerCounts.salesAgent
  const laboratoryCount = buildingCounts.laboratory
  const maintenanceWorkshopCount = buildingCounts.maintenanceWorkshop
  const salesOfficeCount = buildingCounts.salesOffice
  const baseCrudeStorage =
    STORAGE_BALANCE.baseCrudeStorage +
    buildingCounts.crudeTank * STORAGE_BALANCE.crudeTankStorageBonus
  const baseGasolineStorage =
    STORAGE_BALANCE.baseGasolineStorage +
    buildingCounts.productTank * STORAGE_BALANCE.productTankStorageBonus
  const storageMultiplier =
    1 + comboStats.crudeToProduct * BONUS_BALANCE.adjacencyBonusRate
  const researchStorageBonus =
    (hasBiggerTanks ? STORAGE_BALANCE.biggerTanksStorageBonus : 0) +
    (hasIndustrialStorage ? STORAGE_BALANCE.industrialStorageBonus : 0)
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
      : 1)
  const workerProductionMultiplier =
    1 + operatorCount * BONUS_BALANCE.operatorProductionBonusRate
  const productionInterval = Math.max(
    PRODUCTION_BALANCE.minProductionMs,
    baseProductionInterval /
      productionMultiplier /
      researchProductionMultiplier /
      workerProductionMultiplier,
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
    1 + salesOfficeCount * BONUS_BALANCE.salesOfficeContractBonusRate
  const contractRewardMultiplier =
    reputationContractRewardMultiplier *
    researchContractRewardMultiplier *
    specialBuildingContractRewardMultiplier
  const specialBuildingRpRewardMultiplier =
    1 + laboratoryCount * BONUS_BALANCE.laboratoryRpBonusRate
  const contractRpRewardMultiplier = specialBuildingRpRewardMultiplier
  const eventPenaltyMultiplier = Math.pow(
    BONUS_BALANCE.maintenanceWorkshopPenaltyRate,
    maintenanceWorkshopCount,
  )
  const researchSellPriceBonus = hasPremiumFuel
    ? BONUS_BALANCE.premiumFuelSellPriceBonus
    : 0
  const workerSellPriceBonus =
    salesAgentCount * BONUS_BALANCE.salesAgentSellPriceBonus
  const sellPrice =
    Math.round(ECONOMY_BALANCE.gasolinePrice * sellPriceMultiplier) +
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
      completedMilestoneKeys: [...nextGame.completedMilestoneKeys, 'researchBeginner'],
      activityLog: addLog(nextGame.activityLog, message),
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
          game.crudeOil + 100,
        ),
        reputation: Math.max(0, game.reputation - 5),
        activityLog: addLog(game.activityLog, logMessage),
      }
    }
    return {
      ...game,
      reputation: game.reputation + 5,
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

  // workerRecruitment
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
