import { useEffect, useRef, useState } from 'react'
import ActivityLog from './components/ActivityLog'
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
import WorkforcePanel from './components/WorkforcePanel'
import RefineryProgressionPanel from './components/RefineryProgressionPanel'
import ChoiceEventModal from './components/ChoiceEventModal'
import { BUILDINGS } from './data/buildings'
import { BUILDING_UPGRADE_BALANCE, EXPANSION_BALANCE } from './data/balance'
import type { PaidExpansionEntry, ShipmentOption } from './data/balance'
import { getRandomChoiceEvent } from './data/choiceEvents'
import { serializeBilingualText, text } from './translations'
import type { BuildingType, ChoiceEvent, Contract, ResearchItem, WorkerConfig } from './types'
import {
  CRUDE_COST,
  RANDOM_EVENT_INTERVAL_MS,
  TICK_MS,
  addLog,
  applyChoiceEventOption,
  applyMilestones,
  applyRandomEvent,
  applyShipmentArrivals,
  applyWinGoal,
  calculateDerivedStats,
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
  } = calculateDerivedStats(game)

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

        if (current.crudeOil < 1 || current.gasoline >= currentMaxGasoline) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: 0,
          }
        }

        const interval = currentStats.productionInterval
        const nextProgress = current.productionProgress + TICK_MS

        if (nextProgress < interval) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: nextProgress,
          }
        }

        const storageRoom = currentMaxGasoline - current.gasoline
        const batchesProduced = Math.min(
          Math.floor(nextProgress / interval),
          current.crudeOil,
          storageRoom,
        )

        if (batchesProduced < 1) {
          return {
            ...current,
            tickCount: nextTick,
            productionProgress: 0,
          }
        }

        const crudeRemaining = current.crudeOil - batchesProduced
        const gasolineTotal = current.gasoline + batchesProduced
        const leftoverProgress =
          crudeRemaining > 0 && gasolineTotal < currentMaxGasoline
            ? nextProgress - batchesProduced * interval
            : 0

        return applyMilestones({
          ...current,
          tickCount: nextTick,
          crudeOil: crudeRemaining,
          gasoline: gasolineTotal,
          totalGasolineProduced: current.totalGasolineProduced + batchesProduced,
          productionProgress: leftoverProgress,
          activityLog: addLog(
            current.activityLog,
            serializeBilingualText(
              text.logs.processedCrude(batchesProduced, batchesProduced),
            ),
          ),
        })
      })
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const eventTimer = window.setInterval(() => {
      setGame((current) => applyRandomEvent(current, getRandomEvent()))
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
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldGasoline(actualAmount, totalRevenue)),
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

      if (current.gasoline < contract.gasolineRequired) {
        return current
      }

      const currentStats = calculateDerivedStats(current)
      const currentContractReward = Math.round(
        contract.reward * currentStats.contractRewardMultiplier,
      )
      const currentContractRpReward = Math.round(
        contract.rpReward * currentStats.contractRpRewardMultiplier,
      )
      const currentContractReputationReward = contract.reputationReward

      return applyWinGoal(applyMilestones({
        ...current,
        gasoline: current.gasoline - contract.gasolineRequired,
        money: current.money + currentContractReward,
        researchPoints: current.researchPoints + currentContractRpReward,
        reputation: current.reputation + currentContractReputationReward,
        completedContractCount: current.completedContractCount + 1,
        completedContractIds: [...current.completedContractIds, contract.id],
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

      return applyMilestones({
        ...current,
        money: current.money - worker.cost,
        totalWorkersHired: current.totalWorkersHired + 1,
        workerCounts: {
          ...current.workerCounts,
          [worker.key]: current.workerCounts[worker.key] + 1,
        },
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.hiredWorker(worker.name, worker.cost)),
        ),
      })
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
    setGame((current) => applyRandomEvent(current, getRandomEvent()))
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
        <h1>
          <BilingualText text={text.app.title} />
        </h1>
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
          crudeOil={game.crudeOil}
          maxCrudeStorage={maxCrudeStorage}
          gasoline={game.gasoline}
          maxGasolineStorage={maxGasolineStorage}
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
            onOrder={handleOrderShipment}
          />
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
        <WorkforcePanel activeWorkers={activeWorkers} />
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
            currentReputation={game.reputation}
            currentReputationTier={reputationTier}
            nextReputationTier={nextReputationTier}
            onCompleteContract={handleCompleteContract}
          />
          <ResearchPanel
            researchPoints={game.researchPoints}
            activeResearchItems={activeResearchItems}
            onUnlockResearch={handleUnlockResearch}
          />
          <StaffPanel
            money={game.money}
            refineryLevel={game.refineryLevel}
            activeWorkers={activeWorkers}
            onHireWorker={handleHireWorker}
          />
          <MilestonesPanel activeMilestones={activeMilestones} />
        </section>
      </section>

      <section className="app-section">
        <section className="system-grid">
          <div className="system-side">
            <EventsPanel
              lastEventMessage={game.lastEventMessage}
              onTriggerEvent={handleTriggerTestEvent}
              onTriggerChoiceEvent={handleTriggerChoiceEvent}
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
        onAddCrude={handleDevAddCrude}
        onAddGasoline={handleDevAddGasoline}
        onSetLevel5={() => handleDevSetLevel(5)}
        onSetLevel10={() => handleDevSetLevel(10)}
      />

      {pendingChoiceEvent && (
        <ChoiceEventModal
          event={pendingChoiceEvent}
          onChoose={handleChooseOption}
        />
      )}
    </main>
  )
}

export default App
