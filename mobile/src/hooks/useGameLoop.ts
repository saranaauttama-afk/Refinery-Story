import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuildingType, Contract, GameState, PerkConfig, ResearchItem, WorkerConfig } from '../game/types'
import {
  applyMilestones,
  applyWinGoal,
  calculateDerivedStats,
  CRUDE_COST,
  TICK_MS,
  addLog,
  createInitialGameState,
  createNewEmployee,
  getDemandShiftDelta,
  getEsgDrift,
  getProductSellPrice,
  getSpecialistMultiplier,
  getUpgradeCost,
} from '../game/utils/gameCalculations'
import {
  clearStoredGameState,
  loadStoredGameState,
  saveStoredGameState,
} from '../game/utils/gameStorage'
import {
  DEMAND_SHIFT_BALANCE,
  ESG_BALANCE,
  EXPANSION_BALANCE,
  FEEDSTOCK_BALANCE,
  BUILDING_UPGRADE_BALANCE,
  PLANT_PRODUCTION,
  type PaidExpansionEntry,
} from '../game/data/balance'
import { BUILDINGS } from '../game/data/buildings'

const SAVE_INTERVAL_MS = 5000

// Full production tick: feedstock (crude -> feedstock), downstream plants
// (feedstock -> lubricants/jetFuel/petrochemicals), gasoline (crude ->
// gasoline, incl. Efficiency-perk yield carry), ESG drift, Energy Transition
// demand shift. NOT ported: random/choice events, contracts auto-progress,
// shipments, asphalt production, rivals/awards year-end rollover -- those
// are manual actions or a later pass.
function tick(current: GameState): GameState {
  const stats = calculateDerivedStats(current)
  const nextTick = current.tickCount + 1

  let crudeOil = current.crudeOil
  let feedstock = current.feedstock
  let productInventory = current.productInventory

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

  // --- Downstream plants: feedstock -> product ---
  for (const plant of PLANT_PRODUCTION) {
    const plantCount = stats.buildingCounts[plant.buildingKey]
    if (plantCount <= 0 || nextTick % plant.intervalTicks !== 0) continue

    const feedstockNeeded = plantCount * plant.feedstockPerCycle
    const productSpace = plant.maxStorage - productInventory[plant.productKey]
    if (feedstock < feedstockNeeded || productSpace <= 0) continue

    const specialistMultiplier = getSpecialistMultiplier(current, plant, plantCount)
    const produced = Math.min(
      Math.round(plantCount * plant.outputPerCycle * specialistMultiplier),
      productSpace,
    )
    if (produced <= 0) continue

    feedstock -= feedstockNeeded
    productInventory = {
      ...productInventory,
      [plant.productKey]: productInventory[plant.productKey] + produced,
    }
  }

  // --- Gasoline production: crude -> gasoline (with Efficiency yield carry) ---
  const nextProgress = current.productionProgress + TICK_MS
  const interval = stats.productionInterval
  let gasoline = current.gasoline
  let productionProgress = nextProgress
  let gasolineYieldCarry = current.gasolineYieldCarry
  let totalGasolineProduced = current.totalGasolineProduced

  if (nextProgress >= interval) {
    const storageRoom = stats.maxGasolineStorage - gasoline
    const batchesProduced = Math.min(Math.floor(nextProgress / interval), crudeOil, storageRoom)

    if (batchesProduced >= 1) {
      const perkYieldMultiplier = 1 + stats.perkProductionBonusRate
      const rawYield = batchesProduced * perkYieldMultiplier + gasolineYieldCarry
      const produced = Math.min(Math.floor(rawYield), storageRoom)
      gasolineYieldCarry = produced === Math.floor(rawYield) ? rawYield - produced : 0

      crudeOil -= batchesProduced
      gasoline += produced
      totalGasolineProduced += produced

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
  const esgScore = Math.max(
    ESG_BALANCE.minScore,
    Math.min(ESG_BALANCE.maxScore, current.esgScore + esgDelta),
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

  return applyMilestones({
    ...current,
    tickCount: nextTick,
    crudeOil,
    feedstock,
    productInventory,
    gasoline,
    productionProgress,
    gasolineYieldCarry,
    totalGasolineProduced,
    esgScore,
    gasolineDemandMultiplier,
    petrochemicalsDemandMultiplier,
  })
}

export function useGameLoop() {
  const [game, setGame] = useState<GameState | null>(null)
  const gameRef = useRef<GameState | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadStoredGameState().then(({ game: loadedGame }) => {
      gameRef.current = loadedGame
      setGame(loadedGame)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setGame((current) => {
        if (!current) return current
        const next = tick(current)
        gameRef.current = next
        return next
      })
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      if (gameRef.current) saveStoredGameState(gameRef.current)
    }, SAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loaded])

  // Generic updater: fn returns the next state, or `current` unchanged if
  // the action isn't valid (insufficient funds, etc.)
  const update = useCallback((fn: (current: GameState) => GameState) => {
    setGame((current) => {
      if (!current) return current
      const next = fn(current)
      gameRef.current = next
      return next
    })
  }, [])

  const buyCrude = useCallback(
    (amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const canAfford = Math.floor(current.money / CRUDE_COST)
        const space = stats.maxCrudeStorage - current.crudeOil
        const actual = Math.min(amount, canAfford, space)
        if (actual <= 0) return current
        return {
          ...current,
          money: current.money - actual * CRUDE_COST,
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
        return {
          ...current,
          gasoline: current.gasoline - actual,
          money: current.money + actual * stats.sellPrice,
        }
      }),
    [update],
  )

  // Sell from productInventory (lubricants / jetFuel / petrochemicals).
  const sellProduct = useCallback(
    (key: 'lubricants' | 'jetFuel' | 'petrochemicals', amount: number) =>
      update((current) => {
        const stats = calculateDerivedStats(current)
        const have = current.productInventory[key]
        const actual = Math.min(amount, have)
        if (actual <= 0) return current
        const demandMultiplier = key === 'petrochemicals' ? current.petrochemicalsDemandMultiplier : 1
        const price = getProductSellPrice(key, stats.productSellMultiplier, demandMultiplier)
        if (price <= 0) return current
        return {
          ...current,
          productInventory: { ...current.productInventory, [key]: have - actual },
          money: current.money + price * actual,
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
        if (cell !== null || current.money < buildingData.cost || current.refineryLevel < unlockLevel) {
          return current
        }
        const grid = [...current.grid]
        grid[cellIndex] = building
        const gridLevels = [...current.gridLevels]
        gridLevels[cellIndex] = 1
        return {
          ...current,
          money: current.money - buildingData.cost,
          grid,
          gridLevels,
          activityLog: addLog(current.activityLog, `Built ${buildingData.name.en} (-$${buildingData.cost})`),
        }
      }),
    [update],
  )

  const upgradeBuilding = useCallback(
    (cellIndex: number) =>
      update((current) => {
        const cell = current.grid[cellIndex]
        if (!cell) return current
        const isUpgradeable = cell === 'crudeTank' || cell === 'productTank' || cell === 'distillationUnit'
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
        const cost = getUpgradeCost(current.refineryLevel)
        if (current.money < cost) return current
        return applyWinGoal({
          ...current,
          money: current.money - cost,
          refineryLevel: current.refineryLevel + 1,
          upgradePoints: current.upgradePoints + 1,
        })
      }),
    [update],
  )

  const expandGrid = useCallback(
    () =>
      update((current) => {
        const nextLevel = current.gridExpansionLevel + 1
        if (nextLevel >= EXPANSION_BALANCE.length) return current
        const nextEntry = EXPANSION_BALANCE[nextLevel] as PaidExpansionEntry
        if (current.money < nextEntry.cost || current.refineryLevel < nextEntry.requiresRefineryLevel) {
          return current
        }
        const newCells = nextEntry.cells - EXPANSION_BALANCE[current.gridExpansionLevel].cells
        return applyWinGoal({
          ...current,
          money: current.money - nextEntry.cost,
          gridExpansionLevel: nextLevel,
          grid: [...current.grid, ...Array(newCells).fill(null)],
          gridLevels: [...current.gridLevels, ...Array(newCells).fill(1)],
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
        const newEmployee = createNewEmployee(current.employees, worker.key)
        return applyMilestones({
          ...current,
          money: current.money - worker.cost,
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [worker.key]: current.workerCounts[worker.key] + 1,
          },
          employees: [...current.employees, newEmployee],
        })
      }),
    [update],
  )

  const completeContract = useCallback(
    (contract: Contract) =>
      update((current) => {
        if (current.refineryLevel < contract.unlockLevel) return current
        if (current.completedContractIds.includes(contract.id)) return current

        const isPetro = (contract.petrochemicalsRequired ?? 0) > 0
        const isLube = !isPetro && (contract.lubricantsRequired ?? 0) > 0
        const isJet = !isPetro && !isLube && (contract.jetFuelRequired ?? 0) > 0
        const isAsphalt = !isPetro && !isLube && !isJet && (contract.asphaltRequired ?? 0) > 0

        if (isPetro && current.productInventory.petrochemicals < (contract.petrochemicalsRequired ?? 0)) return current
        if (isLube && current.productInventory.lubricants < (contract.lubricantsRequired ?? 0)) return current
        if (isJet && current.productInventory.jetFuel < (contract.jetFuelRequired ?? 0)) return current
        if (isAsphalt && current.productInventory.asphalt < (contract.asphaltRequired ?? 0)) return current
        if (!isPetro && !isLube && !isJet && !isAsphalt && current.gasoline < contract.gasolineRequired) return current

        const stats = calculateDerivedStats(current)
        const reward = Math.round(contract.reward * stats.contractRewardMultiplier)
        const rpReward = Math.round(contract.rpReward * stats.contractRpRewardMultiplier)

        const productInventory = isPetro
          ? { ...current.productInventory, petrochemicals: current.productInventory.petrochemicals - (contract.petrochemicalsRequired ?? 0) }
          : isLube
            ? { ...current.productInventory, lubricants: current.productInventory.lubricants - (contract.lubricantsRequired ?? 0) }
            : isJet
              ? { ...current.productInventory, jetFuel: current.productInventory.jetFuel - (contract.jetFuelRequired ?? 0) }
              : isAsphalt
                ? { ...current.productInventory, asphalt: current.productInventory.asphalt - (contract.asphaltRequired ?? 0) }
                : current.productInventory

        return applyWinGoal(applyMilestones({
          ...current,
          gasoline: isPetro || isLube || isJet || isAsphalt ? current.gasoline : current.gasoline - contract.gasolineRequired,
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
    [update],
  )

  const renameRefinery = useCallback(
    (name: string) => update((current) => ({ ...current, refineryName: name })),
    [update],
  )

  const resetGame = useCallback(() => {
    clearStoredGameState()
    const fresh = createInitialGameState()
    gameRef.current = fresh
    setGame(fresh)
  }, [])

  return {
    game,
    loaded,
    derived: game ? calculateDerivedStats(game) : null,
    buyCrude,
    sellGasoline,
    sellProduct,
    placeBuilding,
    upgradeBuilding,
    upgradeRefinery,
    expandGrid,
    unlockResearch,
    installPerk,
    hireWorker,
    completeContract,
    renameRefinery,
    resetGame,
  }
}
