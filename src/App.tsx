import { useEffect, useRef, useState } from 'react'
import ActivityLog from './components/ActivityLog'
import AsphaltPanel from './components/AsphaltPanel'
import ProductPanel from './components/ProductPanel'
import BilingualText from './components/BilingualText'
import BuildingGrid from './components/BuildingGrid'
import CrudeShipmentsPanel from './components/CrudeShipmentsPanel'
import DevToolsPanel from './components/DevToolsPanel'
import ComboPanel from './components/ComboPanel'
import ContractsPanel from './components/ContractsPanel'
import EventsPanel from './components/EventsPanel'
import BuildingEffectsPanel from './components/BuildingEffectsPanel'
import ExpansionPanel from './components/ExpansionPanel'
import GoalPanel from './components/GoalPanel'
import StarterGuidePanel from './components/StarterGuidePanel'
import MilestonesPanel from './components/MilestonesPanel'
import ProductionPanel from './components/ProductionPanel'
import ResearchPanel from './components/ResearchPanel'
import ResourcePanel from './components/ResourcePanel'
import SavePanel from './components/SavePanel'
import StaffPanel from './components/StaffPanel'
import StatsPanel from './components/StatsPanel'
import WorkerPresenceBar from './components/WorkerPresenceBar'
import RefineryProgressionPanel from './components/RefineryProgressionPanel'
import ChoiceEventModal from './components/ChoiceEventModal'
import RefineryUpgradesPanel from './components/RefineryUpgradesPanel'
import EraPanel from './components/EraPanel'
import AwardsPanel from './components/AwardsPanel'
import AwardCeremonyModal from './components/AwardCeremonyModal'
import ComboDiscoveryToast from './components/ComboDiscoveryToast'
import EraBannerToast from './components/EraBannerToast'
import { BUILDINGS } from './data/buildings'
import { ASPHALT_BALANCE, AWARDS_BALANCE, ESG_BALANCE, FEEDSTOCK_BALANCE, PLANT_PRODUCTION, STANDING_ORDER_BALANCE, BUILDING_UPGRADE_BALANCE, EXPANSION_BALANCE } from './data/balance'
import type { PaidExpansionEntry, ShipmentOption } from './data/balance'
import { getRandomChoiceEvent } from './data/choiceEvents'
import { SELLABLE_PRODUCTS } from './data/products'
import type { HiddenComboConfig } from './data/hiddenCombos'
import { WORKERS } from './data/workers'
import { serializeBilingualText, text } from './translations'
import type { AwardRecord, BuildingType, ChoiceEvent, Contract, EraConfig, PerkConfig, ResearchItem, StandingOrderKey, WorkerConfig, WorkerType } from './types'
import {
  CRUDE_COST,
  RANDOM_EVENT_INTERVAL_MS,
  TICK_MS,
  addLog,
  applyChoiceEventOption,
  applyMilestones,
  applyRandomEvent,
  applyShipmentArrivals,
  applyStaffXp,
  applyWinGoal,
  calculateDerivedStats,
  getNewlyDiscoveredCombos,
  getRefineryTitle,
  closeBusinessYear,
  getTrainingCost,
  createNewEmployee,
  getAssignmentCapacity,
  getEsgDrift,
  getSpecialistMultiplier,
  getProductSellPrice,
  getYearlyPayroll,
  getRandomEvent,
  getUpgradeCost,
  orderShipment,
} from './utils/gameCalculations'
import {
  clearStoredGameState,
  loadStoredGameState,
  saveStoredGameState,
} from './utils/gameStorage'
import './App.css'

function App() {
  const [initialLoad] = useState(loadStoredGameState)
  const [game, setGame] = useState(initialLoad.game)
  const [saveStatusMessage, setSaveStatusMessage] = useState(initialLoad.message)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType>('crudeTank')
  const [pendingChoiceEvent, setPendingChoiceEvent] = useState<ChoiceEvent | null>(null)
  const [pendingAward, setPendingAward] = useState<AwardRecord | null>(null)
  const [pendingEraBanner, setPendingEraBanner] = useState<EraConfig | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(initialLoad.game.refineryName)
  const [pendingComboDiscoveries, setPendingComboDiscoveries] = useState<HiddenComboConfig[]>([])
  const gameRef = useRef(game)
  const {
    activeContracts,
    activeMilestones,
    activeResearchItems,
    activeWorkers,
    availableSpace,
    canProcessCrude,
    comboStats,
    contractRewardMultiplier,
    contractRpRewardMultiplier,
    eventPenaltyMultiplier,
    maxCrudeStorage,
    maxGasolineStorage,
    productionInterval,
    productionMultiplier,
    productionRate,
    progressPercent,
    reputationTier,
    nextReputationTier,
    researchProductionMultiplier,
    sellPrice,
    statusLabel,
    upgradeCost,
    workerProductionMultiplier,
    productSellMultiplier,
    buildingCounts,
    currentEra,
    nextEra,
    maxFeedstockStorage,
    feedstockPerDistillationCycle,
  } = calculateDerivedStats(game)

  const productSellPrices: Record<'jetFuel' | 'lubricants' | 'petrochemicals', number> = {
    jetFuel: getProductSellPrice('jetFuel', productSellMultiplier),
    lubricants: getProductSellPrice('lubricants', productSellMultiplier),
    petrochemicals: getProductSellPrice('petrochemicals', productSellMultiplier),
  }
  const productPlantCounts: Record<'jetFuel' | 'lubricants' | 'petrochemicals', number> = {
    jetFuel: buildingCounts.jetFuelPlant,
    lubricants: buildingCounts.lubricantPlant,
    petrochemicals: buildingCounts.petrochemicalPlant,
  }
  const productSellHandlers: Record<'jetFuel' | 'lubricants' | 'petrochemicals', (amount: number) => void> = {
    jetFuel: handleSellJetFuel,
    lubricants: handleSellLubricants,
    petrochemicals: handleSellPetrochemicals,
  }

  const petrochemicalDone = game.completedContractIds.includes(7)

  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => {
        const nextTick = current.tickCount + 1
        const currentStats = calculateDerivedStats(current)
        const currentMaxGasoline = currentStats.maxGasolineStorage

        let crudeOil = current.crudeOil
        let feedstock = current.feedstock
        let productInventory = current.productInventory
        let plantActivityLog = current.activityLog

        // --- Distillation: crude → feedstock ---
        // Each distillation cycle converts crude into feedstock (capped by storage).
        // This is the heart of the chain: downstream plants run on feedstock.
        if (
          currentStats.feedstockPerDistillationCycle > 0 &&
          nextTick % FEEDSTOCK_BALANCE.distillationIntervalTicks === 0
        ) {
          const distillationUnits = currentStats.buildingCounts.distillationUnit
          const crudeNeeded = distillationUnits * FEEDSTOCK_BALANCE.crudePerDistillationCycle
          const feedstockSpace = currentStats.maxFeedstockStorage - feedstock
          if (crudeOil >= crudeNeeded && feedstockSpace > 0) {
            const feedstockMade = Math.min(
              Math.floor(currentStats.feedstockPerDistillationCycle),
              feedstockSpace,
            )
            if (feedstockMade > 0) {
              crudeOil -= crudeNeeded
              feedstock += feedstockMade
            }
          }
        }

        // --- Downstream plants: feedstock → product (unified loop) ---
        // Replaces three near-identical blocks. Each plant consumes feedstock and
        // produces its product, scaled by an optional specialist worker.
        for (const plant of PLANT_PRODUCTION) {
          const plantCount = currentStats.buildingCounts[plant.buildingKey]
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
          plantActivityLog = addLog(
            plantActivityLog,
            serializeBilingualText(
              text.logs.producedPlant(plant.productKey, plantCount, produced),
            ),
          )
        }

        // --- Gasoline production (Tier 1: crude-direct, unchanged) ---
        if (crudeOil < 1 || current.gasoline >= currentMaxGasoline) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: 0,
            crudeOil,
            feedstock,
            productInventory,
            activityLog: plantActivityLog,
          }
        }

        const interval = currentStats.productionInterval
        const nextProgress = current.productionProgress + TICK_MS

        if (nextProgress < interval) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: nextProgress,
            crudeOil,
            feedstock,
            productInventory,
            activityLog: plantActivityLog,
          }
        }

        const storageRoom = currentMaxGasoline - current.gasoline
        const batchesProduced = Math.min(
          Math.floor(nextProgress / interval),
          crudeOil,
          storageRoom,
        )

        if (batchesProduced < 1) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: 0,
            crudeOil,
            feedstock,
            productInventory,
            activityLog: plantActivityLog,
          }
        }

        const crudeRemaining = crudeOil - batchesProduced
        const gasolineTotal = current.gasoline + batchesProduced
        const leftoverProgress =
          crudeRemaining > 0 && gasolineTotal < currentMaxGasoline
            ? nextProgress - batchesProduced * interval
            : 0

        const gasolineLog = serializeBilingualText(
          text.logs.processedCrude(batchesProduced, batchesProduced),
        )

        // --- ESG/Safety axis drift ---
        // Dirty buildings pull the score down; safetyOfficer staff pull it
        // up. Clamped to [minScore, maxScore].
        const esgDelta = getEsgDrift(current, currentStats.buildingCounts)
        const esgScore = Math.max(
          ESG_BALANCE.minScore,
          Math.min(ESG_BALANCE.maxScore, current.esgScore + esgDelta),
        )

        return applyMilestones({
          ...current,
          tickCount: nextTick,
          crudeOil: crudeRemaining,
          feedstock,
          gasoline: gasolineTotal,
          totalGasolineProduced: current.totalGasolineProduced + batchesProduced,
          productionProgress: leftoverProgress,
          productInventory,
          esgScore,
          yearStats: {
            ...current.yearStats,
            gasolineProduced: current.yearStats.gasolineProduced + batchesProduced,
          },
          activityLog: addLog(plantActivityLog, gasolineLog),
        })
      })
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const eventTimer = window.setInterval(() => {
      setGame((current) => applyRandomEvent(current, getRandomEvent(current)))
    }, RANDOM_EVENT_INTERVAL_MS)

    return () => window.clearInterval(eventTimer)
  }, [])

  useEffect(() => {
    const choiceEventTimer = window.setInterval(() => {
      setPendingChoiceEvent((current) => current ?? getRandomChoiceEvent())
    }, 60000)

    return () => window.clearInterval(choiceEventTimer)
  }, [])

  useEffect(() => {
    const deliveryTimer = window.setInterval(() => {
      setGame((current) => {
        if (current.pendingShipments.length === 0) return current
        return applyShipmentArrivals(current, Date.now())
      })
    }, 1000)
    return () => window.clearInterval(deliveryTimer)
  }, [])

  // System 1 + 4: staff XP accrual and annual-award evaluation.
  // Runs on the same cadence as the production tick but kept separate so it
  // does not complicate the production return paths.
  useEffect(() => {
    const staffTimer = window.setInterval(() => {
      setGame((current) => {
        let next = current

        // Staff XP / level-ups
        const { employees, levelUpLog } = applyStaffXp(next)
        if (levelUpLog) {
          next = {
            ...next,
            employees,
            activityLog: addLog(next.activityLog, levelUpLog),
          }
        } else {
          next = { ...next, employees }
        }

        // Annual award check
        if (next.tickCount - next.yearStartTick >= AWARDS_BALANCE.yearLengthTicks) {
          const { game: afterAward, record } = closeBusinessYear(next)
          next = afterAward
          setPendingAward(record)
        }

        // System 3: detect era advancement and announce it once.
        const era = calculateDerivedStats(next).currentEra
        if (era.index > next.highestEraIndex) {
          next = {
            ...next,
            highestEraIndex: era.index,
            activityLog: addLog(
              next.activityLog,
              serializeBilingualText(text.logs.eraAdvanced(era.name)),
            ),
          }
          setPendingEraBanner(era)
        }

        // System 5: hidden/discoverable combos — one-time reward + toast the
        // first time a qualifying 3-building layout appears on the grid.
        const newlyDiscovered = getNewlyDiscoveredCombos(next.grid, next.discoveredCombos)
        if (newlyDiscovered.length > 0) {
          let activityLog = next.activityLog
          let money = next.money
          let researchPoints = next.researchPoints
          let reputation = next.reputation
          for (const combo of newlyDiscovered) {
            money += combo.cashReward
            researchPoints += combo.rpReward
            reputation += combo.reputationReward ?? 0
            activityLog = addLog(
              activityLog,
              serializeBilingualText(
                text.logs.comboDiscovered(combo.name, combo.cashReward, combo.rpReward),
              ),
            )
          }
          next = {
            ...next,
            money,
            researchPoints,
            reputation,
            activityLog,
            discoveredCombos: [
              ...next.discoveredCombos,
              ...newlyDiscovered.map((combo) => combo.key),
            ],
          }
          setPendingComboDiscoveries((queue) => [...queue, ...newlyDiscovered])
        }

        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(staffTimer)
  }, [])

  useEffect(() => {
    const autosaveTimer = window.setInterval(() => {
      saveStoredGameState(gameRef.current)
      setSaveStatusMessage(text.save.autosaved)
    }, 10000)

    return () => window.clearInterval(autosaveTimer)
  }, [])

  function handleBuyCrudeAmount(amount: number) {
    setGame((current) => {
      const currentMaxCrude = calculateDerivedStats(current).maxCrudeStorage
      const canAfford = Math.floor(current.money / CRUDE_COST)
      const space = currentMaxCrude - current.crudeOil
      const actualAmount = Math.min(amount, canAfford, space)

      if (actualAmount <= 0) return current

      const totalCost = actualAmount * CRUDE_COST

      return {
        ...current,
        money: current.money - totalCost,
        crudeOil: current.crudeOil + actualAmount,
        everBoughtCrude: true,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.boughtCrude(actualAmount, totalCost)),
        ),
      }
    })
  }

  function handleSellGasolineAmount(amount: number) {
    setGame((current) => {
      const actualAmount = Math.min(amount, current.gasoline)
      if (actualAmount <= 0) return current

      const currentSellPrice = calculateDerivedStats(current).sellPrice
      const totalRevenue = actualAmount * currentSellPrice

      return {
        ...current,
        gasoline: current.gasoline - actualAmount,
        money: current.money + totalRevenue,
        yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + totalRevenue },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldGasoline(actualAmount, totalRevenue)),
        ),
      }
    })
  }

  function handleSellLubricants(amount: number) {
    setGame((current) => {
      const actualAmount = Math.min(amount, current.productInventory.lubricants)
      if (actualAmount <= 0) return current

      const mult = calculateDerivedStats(current).productSellMultiplier
      const price = getProductSellPrice('lubricants', mult)
      const totalRevenue = actualAmount * price

      return {
        ...current,
        money: current.money + totalRevenue,
        yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + totalRevenue },
        productInventory: {
          ...current.productInventory,
          lubricants: current.productInventory.lubricants - actualAmount,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldLubricants(actualAmount, totalRevenue)),
        ),
      }
    })
  }

  function handleSellJetFuel(amount: number) {
    setGame((current) => {
      const actualAmount = Math.min(amount, current.productInventory.jetFuel)
      if (actualAmount <= 0) return current

      const mult = calculateDerivedStats(current).productSellMultiplier
      const price = getProductSellPrice('jetFuel', mult)
      const totalRevenue = actualAmount * price

      return {
        ...current,
        money: current.money + totalRevenue,
        yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + totalRevenue },
        productInventory: {
          ...current.productInventory,
          jetFuel: current.productInventory.jetFuel - actualAmount,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldJetFuel(actualAmount, totalRevenue)),
        ),
      }
    })
  }

  function handleUpgradeRefinery() {
    setGame((current) => {
      const nextUpgradeCost = getUpgradeCost(current.refineryLevel)

      if (current.money < nextUpgradeCost) {
        return current
      }

      return applyWinGoal({
        ...current,
        money: current.money - nextUpgradeCost,
        refineryLevel: current.refineryLevel + 1,
        upgradePoints: current.upgradePoints + 1,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.upgradedRefinery(current.refineryLevel + 1),
          ),
        ),
      })
    })
  }

  function handleCompleteContract(contract: Contract) {
    setGame((current) => {
      if (current.refineryLevel < contract.unlockLevel) {
        return current
      }

      if (current.completedContractIds.includes(contract.id)) {
        return current
      }

      const isPetrochemicalsContract = (contract.petrochemicalsRequired ?? 0) > 0
      const isLubricantsContract = !isPetrochemicalsContract && (contract.lubricantsRequired ?? 0) > 0
      const isJetFuelContract = !isPetrochemicalsContract && !isLubricantsContract && (contract.jetFuelRequired ?? 0) > 0
      const isAsphaltContract = !isPetrochemicalsContract && !isLubricantsContract && !isJetFuelContract && (contract.asphaltRequired ?? 0) > 0

      if (isPetrochemicalsContract) {
        if (current.productInventory.petrochemicals < (contract.petrochemicalsRequired ?? 0)) {
          return current
        }
      } else if (isLubricantsContract) {
        if (current.productInventory.lubricants < (contract.lubricantsRequired ?? 0)) {
          return current
        }
      } else if (isJetFuelContract) {
        if (current.productInventory.jetFuel < (contract.jetFuelRequired ?? 0)) {
          return current
        }
      } else if (isAsphaltContract) {
        if (current.productInventory.asphalt < (contract.asphaltRequired ?? 0)) {
          return current
        }
      } else {
        if (current.gasoline < contract.gasolineRequired) {
          return current
        }
      }

      const currentStats = calculateDerivedStats(current)
      const currentContractReward = Math.round(
        contract.reward * currentStats.contractRewardMultiplier,
      )
      const currentContractRpReward = Math.round(
        contract.rpReward * currentStats.contractRpRewardMultiplier,
      )
      const currentContractReputationReward = contract.reputationReward

      const nextProductInventory = isPetrochemicalsContract
        ? {
            ...current.productInventory,
            petrochemicals: current.productInventory.petrochemicals - (contract.petrochemicalsRequired ?? 0),
          }
        : isLubricantsContract
          ? {
              ...current.productInventory,
              lubricants: current.productInventory.lubricants - (contract.lubricantsRequired ?? 0),
            }
          : isJetFuelContract
            ? {
                ...current.productInventory,
                jetFuel: current.productInventory.jetFuel - (contract.jetFuelRequired ?? 0),
              }
            : isAsphaltContract
              ? {
                  ...current.productInventory,
                  asphalt: current.productInventory.asphalt - (contract.asphaltRequired ?? 0),
                }
              : current.productInventory

      return applyWinGoal(applyMilestones({
        ...current,
        gasoline: isAsphaltContract || isJetFuelContract || isLubricantsContract || isPetrochemicalsContract
          ? current.gasoline
          : current.gasoline - contract.gasolineRequired,
        productInventory: nextProductInventory,
        money: current.money + currentContractReward,
        researchPoints: current.researchPoints + currentContractRpReward,
        reputation: current.reputation + currentContractReputationReward,
        completedContractCount: current.completedContractCount + 1,
        completedContractIds: [...current.completedContractIds, contract.id],
        yearStats: {
          ...current.yearStats,
          moneyEarned: current.yearStats.moneyEarned + currentContractReward,
          contractsCompleted: current.yearStats.contractsCompleted + 1,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.completedContractWithReputation(
              contract.name,
              currentContractReward,
              currentContractRpReward,
              currentContractReputationReward,
            ),
          ),
        ),
      }))
    })
  }

  function handleUnlockResearch(research: ResearchItem) {
    setGame((current) => {
      if (current.unlockedResearchIds.includes(research.key)) {
        return current
      }

      if (current.researchPoints < research.cost) {
        return current
      }

      return applyMilestones({
        ...current,
        researchPoints: current.researchPoints - research.cost,
        unlockedResearchCount: current.unlockedResearchCount + 1,
        unlockedResearchIds: [...current.unlockedResearchIds, research.key],
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.unlockedResearch(research.name, research.cost),
          ),
        ),
      })
    })
  }

  function handleHireWorker(worker: WorkerConfig) {
    setGame((current) => {
      if (current.money < worker.cost) {
        return current
      }
      if (worker.unlockLevel && current.refineryLevel < worker.unlockLevel) {
        return current
      }

      return applyMilestones((() => {
        const newEmployee = createNewEmployee(current.employees, worker.key)
        let activityLog = addLog(
          current.activityLog,
          serializeBilingualText(text.logs.hiredWorker(worker.name, worker.cost)),
        )
        if (newEmployee.trait === 'veteran') {
          activityLog = addLog(
            activityLog,
            serializeBilingualText(text.logs.veteranHire(newEmployee.name)),
          )
        }
        return {
          ...current,
          money: current.money - worker.cost,
          totalWorkersHired: current.totalWorkersHired + 1,
          workerCounts: {
            ...current.workerCounts,
            [worker.key]: current.workerCounts[worker.key] + 1,
          },
          employees: [...current.employees, newEmployee],
          activityLog,
        }
      })())
    })
  }

  // Phase 2: the player picks WHICH employee to train (each gets their own
  // Train button in StaffPanel). Cost depends only on the employee's own
  // level; the type's display name (for the log) is looked up via WORKERS.
  function handleTrainEmployee(employeeId: string) {
    setGame((current) => {
      const target = current.employees.find((employee) => employee.id === employeeId)
      if (!target || target.level >= 5) return current
      const cost = getTrainingCost(target.level)
      if (current.money < cost.money || current.researchPoints < cost.rp) {
        return current
      }
      const worker = WORKERS.find((w) => w.key === target.type)
      const newLevel = target.level + 1
      return {
        ...current,
        money: current.money - cost.money,
        researchPoints: current.researchPoints - cost.rp,
        // Carry leftover XP into the new level (start fresh toward next threshold).
        employees: current.employees.map((employee) =>
          employee.id === target.id ? { ...employee, level: newLevel, xp: 0 } : employee,
        ),
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.staffTrained(target.name, worker!.name, newLevel)),
        ),
      }
    })
  }

  // Phase 3: assign/unassign a specific specialist employee to their plant.
  // Capacity = how many of that plant exist; toggling on when full is a
  // no-op (player must unassign someone else or build another plant).
  function handleToggleAssignment(employeeId: string, type: WorkerType) {
    setGame((current) => {
      const employee = current.employees.find((e) => e.id === employeeId && e.type === type)
      if (!employee) return current
      const capacity = getAssignmentCapacity(calculateDerivedStats(current).buildingCounts, type)
      const list = current.assignments[type] ?? []
      const isAssigned = list.includes(employeeId)
      let newList: string[]
      if (isAssigned) {
        newList = list.filter((id) => id !== employeeId)
      } else {
        if (list.length >= capacity) return current
        newList = [...list, employeeId]
      }
      return { ...current, assignments: { ...current.assignments, [type]: newList } }
    })
  }

  function handleInstallPerk(perk: PerkConfig) {
    setGame((current) => {
      if (current.unlockedPerks.includes(perk.key)) return current
      if (current.upgradePoints < perk.cost) return current
      if (perk.prerequisite && !current.unlockedPerks.includes(perk.prerequisite)) {
        return current
      }
      return {
        ...current,
        upgradePoints: current.upgradePoints - perk.cost,
        unlockedPerks: [...current.unlockedPerks, perk.key],
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.perkUnlocked(perk.name)),
        ),
      }
    })
  }

  function handleExpandGrid() {
    setGame((current) => {
      const nextLevel = current.gridExpansionLevel + 1

      if (nextLevel >= EXPANSION_BALANCE.length) return current

      const nextEntry = EXPANSION_BALANCE[nextLevel] as PaidExpansionEntry

      if (
        current.money < nextEntry.cost ||
        current.refineryLevel < nextEntry.requiresRefineryLevel
      ) {
        return current
      }

      const newCells = nextEntry.cells - EXPANSION_BALANCE[current.gridExpansionLevel].cells

      return applyWinGoal({
        ...current,
        money: current.money - nextEntry.cost,
        gridExpansionLevel: nextLevel,
        grid: [...current.grid, ...Array(newCells).fill(null)],
        gridLevels: [...current.gridLevels, ...Array(newCells).fill(1)],
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.expansion.nextSize(nextEntry.size),
          ),
        ),
      })
    })
  }

  function handlePlaceBuilding(cellIndex: number) {
    setGame((current) => {
      const building = selectedBuilding
      const cell = current.grid[cellIndex]
      const buildingData = BUILDINGS[building]

      const buildingUnlockLevel = buildingData.unlockLevel ?? 1
      if (
        cell !== null ||
        current.money < buildingData.cost ||
        current.refineryLevel < buildingUnlockLevel
      ) {
        return current
      }

      const nextGrid = [...current.grid]
      nextGrid[cellIndex] = building
      const nextLevelsPlace = [...current.gridLevels]
      nextLevelsPlace[cellIndex] = 1

      return {
        ...current,
        money: current.money - buildingData.cost,
        grid: nextGrid,
        gridLevels: nextLevelsPlace,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.placedBuilding(buildingData.name, buildingData.cost),
          ),
        ),
      }
    })
  }

  function handleRemoveBuilding(cellIndex: number) {
    setGame((current) => {
      const cell = current.grid[cellIndex]
      if (!cell) return current

      const buildingData = BUILDINGS[cell]
      const nextGrid = [...current.grid]
      nextGrid[cellIndex] = null
      const nextLevelsRemove = [...current.gridLevels]
      nextLevelsRemove[cellIndex] = 1

      return {
        ...current,
        grid: nextGrid,
        gridLevels: nextLevelsRemove,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.removedBuilding(buildingData.name)),
        ),
      }
    })
  }

  function handleOrderShipment(option: ShipmentOption) {
    setGame((current) => orderShipment(current, option, Date.now()))
  }

  function handleUpgradeBuilding(cellIndex: number) {
    setGame((current) => {
      const cell = current.grid[cellIndex]
      if (!cell) return current

      const isUpgradeable =
        cell === 'crudeTank' || cell === 'productTank' || cell === 'distillationUnit'
      if (!isUpgradeable) return current

      const currentLevel = current.gridLevels[cellIndex] ?? 1
      if (currentLevel >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel) return current

      const cost =
        currentLevel === 1
          ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
          : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost

      if (current.money < cost) return current

      const nextLevel = currentLevel + 1
      const nextLevels = [...current.gridLevels]
      nextLevels[cellIndex] = nextLevel
      const buildingData = BUILDINGS[cell]

      return {
        ...current,
        money: current.money - cost,
        gridLevels: nextLevels,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.upgradedBuilding(buildingData.name, nextLevel, cost),
          ),
        ),
      }
    })
  }

  function handleDismissStarterGuide() {
    setGame((current) => ({ ...current, starterGuideDismissed: true }))
  }

  function handleRenameRefinery(name: string) {
    const trimmed = name.trim().slice(0, 40)
    if (trimmed.length === 0) {
      setNameDraft(game.refineryName)
      setIsEditingName(false)
      return
    }
    setGame((current) => ({ ...current, refineryName: trimmed }))
    setNameDraft(trimmed)
    setIsEditingName(false)
  }

  function handleDevAddMoney() {
    setGame((current) => ({
      ...current,
      money: current.money + 10000,
      activityLog: addLog(
        current.activityLog,
        serializeBilingualText(text.devTools.logAddMoney(10000)),
      ),
    }))
  }

  function handleDevAddRP() {
    setGame((current) => ({
      ...current,
      researchPoints: current.researchPoints + 100,
      activityLog: addLog(
        current.activityLog,
        serializeBilingualText(text.devTools.logAddRP(100)),
      ),
    }))
  }

  function handleDevAddReputation() {
    setGame((current) => ({
      ...current,
      reputation: current.reputation + 100,
      activityLog: addLog(
        current.activityLog,
        serializeBilingualText(text.devTools.logAddReputation(100)),
      ),
    }))
  }

  // Dev tool: toggle ESG score between the two extremes for quick testing
  // of incident-event weighting and the premium contract bonus.
  function handleDevToggleEsg() {
    setGame((current) => {
      const esgScore = current.esgScore >= 50 ? ESG_BALANCE.minScore : ESG_BALANCE.maxScore
      return {
        ...current,
        esgScore,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.devTools.logSetEsg(esgScore)),
        ),
      }
    })
  }

  function handleDevAddCrude() {
    setGame((current) => {
      const stats = calculateDerivedStats(current)
      const added = Math.min(500, stats.maxCrudeStorage - current.crudeOil)
      if (added <= 0) return current
      return {
        ...current,
        crudeOil: current.crudeOil + added,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.devTools.logAddCrude(added)),
        ),
      }
    })
  }

  function handleDevAddGasoline() {
    setGame((current) => {
      const stats = calculateDerivedStats(current)
      const added = Math.min(500, stats.maxGasolineStorage - current.gasoline)
      if (added <= 0) return current
      return {
        ...current,
        gasoline: current.gasoline + added,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.devTools.logAddGasoline(added)),
        ),
      }
    })
  }

  function handleProduceAsphalt(amount: number) {
    setGame((current) => {
      if (current.refineryLevel < ASPHALT_BALANCE.unlockLevel) return current
      const space = ASPHALT_BALANCE.maxStorage - current.productInventory.asphalt
      const actualAmount = Math.min(amount, current.crudeOil, space)
      if (actualAmount <= 0) return current
      return {
        ...current,
        crudeOil: current.crudeOil - actualAmount,
        productInventory: {
          ...current.productInventory,
          asphalt: current.productInventory.asphalt + actualAmount,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.asphalt.logProduced(actualAmount)),
        ),
      }
    })
  }

  function handleSellPetrochemicals(amount: number) {
    setGame((current) => {
      const actualAmount = Math.min(amount, current.productInventory.petrochemicals)
      if (actualAmount <= 0) return current

      const mult = calculateDerivedStats(current).productSellMultiplier
      const price = getProductSellPrice('petrochemicals', mult)
      const totalRevenue = actualAmount * price

      return {
        ...current,
        money: current.money + totalRevenue,
        yearStats: { ...current.yearStats, moneyEarned: current.yearStats.moneyEarned + totalRevenue },
        productInventory: {
          ...current.productInventory,
          petrochemicals: current.productInventory.petrochemicals - actualAmount,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldPetrochemicals(actualAmount, totalRevenue)),
        ),
      }
    })
  }

  function handleFulfillStandingOrder(key: StandingOrderKey) {
    setGame((current) => {
      const order = STANDING_ORDER_BALANCE.find((o) => o.key === key)
      if (!order) return current
      if (current.refineryLevel < order.unlockLevel) return current

      // Guard: still on cooldown
      const cooldownAt = current.standingOrderCooldowns[key]
      if (cooldownAt !== undefined && cooldownAt > current.tickCount) return current

      // Guard: insufficient inventory
      const inventory = current.productInventory[order.productKey]
      if (inventory < order.required) return current

      const orderText = text.standingOrders.orders[key]
      return applyMilestones({
        ...current,
        money: current.money + order.reward,
        researchPoints: current.researchPoints + order.rpReward,
        reputation: current.reputation + order.reputationReward,
        yearStats: {
          ...current.yearStats,
          moneyEarned: current.yearStats.moneyEarned + order.reward,
        },
        productInventory: {
          ...current.productInventory,
          [order.productKey]: inventory - order.required,
        },
        standingOrderCooldowns: {
          ...current.standingOrderCooldowns,
          [key]: current.tickCount + order.cooldownTicks,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.standingOrders.fulfilled(orderText.name, order.reward),
          ),
        ),
      })
    })
  }

  function handleDevSetLevel(level: number) {
    setGame((current) => {
      if (current.refineryLevel === level) return current
      return applyWinGoal({
        ...current,
        refineryLevel: level,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.devTools.logSetLevel(level)),
        ),
      })
    })
  }

  function handleTriggerTestEvent() {
    setGame((current) => applyRandomEvent(current, getRandomEvent(current)))
  }

  function handleTriggerChoiceEvent() {
    setPendingChoiceEvent(getRandomChoiceEvent())
  }

  function handleChooseOption(option: 'A' | 'B') {
    if (!pendingChoiceEvent) return
    setGame((current) => applyWinGoal(applyChoiceEventOption(current, pendingChoiceEvent, option)))
    setPendingChoiceEvent(null)
  }

  function handleManualSave() {
    saveStoredGameState(game)
    setSaveStatusMessage(text.save.manualSaved)
  }

  function handleResetSave() {
    clearStoredGameState()
    const resetState = loadStoredGameState().game
    const resetMessage = text.save.reset

    setGame({
      ...resetState,
      activityLog: addLog(
        resetState.activityLog,
        serializeBilingualText(resetMessage),
      ),
    })
    setSelectedBuilding('crudeTank')
    setSaveStatusMessage(resetMessage)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">
          <BilingualText text={text.app.eyebrow} />
        </p>
        <div className="hero-name-row">
          {isEditingName ? (
            <input
              className="hero-name-input"
              value={nameDraft}
              autoFocus
              maxLength={40}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => handleRenameRefinery(nameDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameRefinery(nameDraft)
                if (e.key === 'Escape') {
                  setNameDraft(game.refineryName)
                  setIsEditingName(false)
                }
              }}
            />
          ) : (
            <h1 className="hero-name">{game.refineryName}</h1>
          )}
          <button
            type="button"
            className="hero-rename-button"
            onClick={() => {
              if (isEditingName) {
                handleRenameRefinery(nameDraft)
              } else {
                setNameDraft(game.refineryName)
                setIsEditingName(true)
              }
            }}
          >
            <BilingualText
              text={isEditingName ? text.refinery.saveButton : text.refinery.editButton}
            />
          </button>
        </div>
        <p className="hero-title">
          <BilingualText text={getRefineryTitle(game.refineryLevel)} />
        </p>
        <p className="hero-tagline">
          <BilingualText text={text.app.title} />
        </p>
      </section>

      {!game.starterGuideDismissed && (
        <StarterGuidePanel
          everBoughtCrude={game.everBoughtCrude}
          hasProducedGasoline={game.totalGasolineProduced > 0}
          hasCompletedContract={game.completedContractCount > 0}
          onDismiss={handleDismissStarterGuide}
        />
      )}

      <div className="sticky-resources">
        <ResourcePanel
          money={game.money}
          researchPoints={game.researchPoints}
          reputation={game.reputation}
          esgScore={game.esgScore}
          crudeOil={game.crudeOil}
          maxCrudeStorage={maxCrudeStorage}
          feedstock={game.feedstock}
          maxFeedstockStorage={maxFeedstockStorage}
          feedstockPerCycle={feedstockPerDistillationCycle}
          gasoline={game.gasoline}
          maxGasolineStorage={maxGasolineStorage}
          lubricants={game.productInventory.lubricants}
          jetFuel={game.productInventory.jetFuel}
          petrochemicals={game.productInventory.petrochemicals}
        />
      </div>

      <section className="app-section">
        <div className="production-stack">
          <section className="control-grid">
            <ProductionPanel
              canProcessCrude={canProcessCrude}
              crudeOil={game.crudeOil}
              gasoline={game.gasoline}
              maxCrudeStorage={maxCrudeStorage}
              maxGasolineStorage={maxGasolineStorage}
              money={game.money}
              productionInterval={productionInterval}
              progressPercent={progressPercent}
              sellPrice={sellPrice}
              statusLabel={statusLabel}
              upgradeCost={upgradeCost}
              onBuyCrudeAmount={handleBuyCrudeAmount}
              onSellGasolineAmount={handleSellGasolineAmount}
              onUpgradeRefinery={handleUpgradeRefinery}
            />
            <StatsPanel
              refineryLevel={game.refineryLevel}
              productionRate={productionRate}
              sellPrice={sellPrice}
              maxCrudeStorage={maxCrudeStorage}
              maxGasolineStorage={maxGasolineStorage}
              availableSpace={availableSpace}
            />
          </section>

          <ComboPanel comboStats={comboStats} />
          <RefineryProgressionPanel refineryLevel={game.refineryLevel} />
          <CrudeShipmentsPanel
            money={game.money}
            pendingShipments={game.pendingShipments}
            tickCount={game.tickCount}
            crudeOil={game.crudeOil}
            maxCrudeStorage={maxCrudeStorage}
            logisticsCount={game.workerCounts.logisticsCoordinator}
            onOrder={handleOrderShipment}
          />
          <AsphaltPanel
            refineryLevel={game.refineryLevel}
            asphalt={game.productInventory.asphalt}
            crudeOil={game.crudeOil}
            completedContractIds={game.completedContractIds}
            onProduceAsphalt={handleProduceAsphalt}
          />
          {SELLABLE_PRODUCTS.map((product) => (
            <ProductPanel
              key={product.key}
              config={product}
              refineryLevel={game.refineryLevel}
              inventory={game.productInventory[product.key]}
              sellPrice={productSellPrices[product.key]}
              plantCount={productPlantCounts[product.key]}
              feedstock={game.feedstock}
              onSell={productSellHandlers[product.key]}
            />
          ))}
        </div>
      </section>

      <section className="app-section">
        <BuildingGrid
          grid={game.grid}
          gridLevels={game.gridLevels}
          gridExpansionLevel={game.gridExpansionLevel}
          money={game.money}
          refineryLevel={game.refineryLevel}
          selectedBuilding={selectedBuilding}
          onPlaceBuilding={handlePlaceBuilding}
          onSelectBuilding={setSelectedBuilding}
          onRemoveBuilding={handleRemoveBuilding}
          onUpgradeBuilding={handleUpgradeBuilding}
        />
        <WorkerPresenceBar workerCounts={game.workerCounts} employees={game.employees} />
        <ExpansionPanel
          gridExpansionLevel={game.gridExpansionLevel}
          refineryLevel={game.refineryLevel}
          money={game.money}
          onExpandGrid={handleExpandGrid}
        />
        <BuildingEffectsPanel
          maxCrudeStorage={maxCrudeStorage}
          maxGasolineStorage={maxGasolineStorage}
          contractRewardMultiplier={contractRewardMultiplier}
          contractRpRewardMultiplier={contractRpRewardMultiplier}
          eventPenaltyMultiplier={eventPenaltyMultiplier}
          productionMultiplier={productionMultiplier}
          researchProductionMultiplier={researchProductionMultiplier}
          workerProductionMultiplier={workerProductionMultiplier}
        />
      </section>

      <section className="app-section">
        <GoalPanel
          refineryLevel={game.refineryLevel}
          reputation={game.reputation}
          petrochemicalDone={petrochemicalDone}
          gridExpansionLevel={game.gridExpansionLevel}
          isComplete={game.prototypeCompleted}
        />

        <section className="progression-grid">
          <ContractsPanel
            activeContracts={activeContracts}
            gasoline={game.gasoline}
            asphalt={game.productInventory.asphalt}
            jetFuel={game.productInventory.jetFuel}
            lubricants={game.productInventory.lubricants}
            petrochemicals={game.productInventory.petrochemicals}
            refineryLevel={game.refineryLevel}
            currentReputation={game.reputation}
            currentReputationTier={reputationTier}
            nextReputationTier={nextReputationTier}
            standingOrderCooldowns={game.standingOrderCooldowns}
            tickCount={game.tickCount}
            onCompleteContract={handleCompleteContract}
            onFulfillStandingOrder={handleFulfillStandingOrder}
          />
          <ResearchPanel
            researchPoints={game.researchPoints}
            activeResearchItems={activeResearchItems}
            onUnlockResearch={handleUnlockResearch}
          />
          <StaffPanel
            money={game.money}
            researchPoints={game.researchPoints}
            refineryLevel={game.refineryLevel}
            activeWorkers={activeWorkers}
            employees={game.employees}
            assignments={game.assignments}
            buildingCounts={buildingCounts}
            onHireWorker={handleHireWorker}
            onTrainEmployee={handleTrainEmployee}
            onToggleAssignment={handleToggleAssignment}
          />
          <RefineryUpgradesPanel
            upgradePoints={game.upgradePoints}
            unlockedPerks={game.unlockedPerks}
            onInstallPerk={handleInstallPerk}
          />
          <EraPanel
            currentEra={currentEra}
            nextEra={nextEra}
            unlockedResearchCount={game.unlockedResearchCount}
            refineryLevel={game.refineryLevel}
          />
          <AwardsPanel
            businessYear={game.businessYear}
            yearStats={game.yearStats}
            yearProgressPercent={Math.min(
              100,
              Math.round(
                ((game.tickCount - game.yearStartTick) / AWARDS_BALANCE.yearLengthTicks) * 100,
              ),
            )}
            projectedPayroll={getYearlyPayroll(game)}
            awardHistory={game.awardHistory}
          />
          <MilestonesPanel activeMilestones={activeMilestones} />
        </section>
      </section>

      <section className="app-section">
        <section className="system-grid">
          <div className="system-side">
            <EventsPanel
              lastEventMessage={game.lastEventMessage}
            />
            <SavePanel
              statusMessage={saveStatusMessage}
              onSave={handleManualSave}
              onReset={handleResetSave}
            />
          </div>
          <ActivityLog entries={game.activityLog} />
        </section>
      </section>

      <DevToolsPanel
        onAddMoney={handleDevAddMoney}
        onAddRP={handleDevAddRP}
        onAddReputation={handleDevAddReputation}
        onToggleEsg={handleDevToggleEsg}
        onAddCrude={handleDevAddCrude}
        onAddGasoline={handleDevAddGasoline}
        onSetLevel5={() => handleDevSetLevel(5)}
        onSetLevel10={() => handleDevSetLevel(10)}
        onTriggerEvent={handleTriggerTestEvent}
        onTriggerChoiceEvent={handleTriggerChoiceEvent}
      />

      {pendingChoiceEvent && (
        <ChoiceEventModal
          event={pendingChoiceEvent}
          onChoose={handleChooseOption}
        />
      )}

      {pendingAward && (
        <AwardCeremonyModal
          record={pendingAward}
          playerName={game.refineryName}
          onClose={() => setPendingAward(null)}
        />
      )}

      {pendingEraBanner && (
        <EraBannerToast
          era={pendingEraBanner}
          onClose={() => setPendingEraBanner(null)}
        />
      )}

      {pendingComboDiscoveries.length > 0 && (
        <ComboDiscoveryToast
          combo={pendingComboDiscoveries[0]}
          offset={!!pendingEraBanner}
          onClose={() => setPendingComboDiscoveries((queue) => queue.slice(1))}
        />
      )}
    </main>
  )
}

export default App
