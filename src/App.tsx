import { useEffect, useRef, useState } from 'react'
import ActivityLog from './components/ActivityLog'
import BilingualText from './components/BilingualText'
import BuildingGrid from './components/BuildingGrid'
import ComboPanel from './components/ComboPanel'
import ContractsPanel from './components/ContractsPanel'
import EventsPanel from './components/EventsPanel'
import MilestonesPanel from './components/MilestonesPanel'
import ProductionPanel from './components/ProductionPanel'
import ResearchPanel from './components/ResearchPanel'
import ResourcePanel from './components/ResourcePanel'
import SavePanel from './components/SavePanel'
import StaffPanel from './components/StaffPanel'
import StatsPanel from './components/StatsPanel'
import { BUILDINGS } from './data/buildings'
import { serializeBilingualText, text } from './translations'
import type { BuildingType, Contract, ResearchItem, WorkerConfig } from './types'
import {
  CRUDE_COST,
  RANDOM_EVENT_INTERVAL_MS,
  TICK_MS,
  addLog,
  applyMilestones,
  applyRandomEvent,
  calculateDerivedStats,
  getRandomEvent,
  getUpgradeCost,
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
  const gameRef = useRef(game)
  const {
    activeContracts,
    activeMilestones,
    activeResearchItems,
    activeWorkers,
    availableSpace,
    canProcessCrude,
    comboStats,
    maxCrudeStorage,
    maxGasolineStorage,
    productionInterval,
    productionRate,
    progressPercent,
    reputationTier,
    nextReputationTier,
    sellPrice,
    statusLabel,
    upgradeCost,
  } = calculateDerivedStats(game)

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
    const autosaveTimer = window.setInterval(() => {
      saveStoredGameState(gameRef.current)
      setSaveStatusMessage(text.save.autosaved)
    }, 10000)

    return () => window.clearInterval(autosaveTimer)
  }, [])

  function handleBuyCrude() {
    setGame((current) => {
      const currentMaxCrude = calculateDerivedStats(current).maxCrudeStorage

      if (current.money < CRUDE_COST || current.crudeOil >= currentMaxCrude) {
        return current
      }

      return {
        ...current,
        money: current.money - CRUDE_COST,
        crudeOil: current.crudeOil + 1,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.boughtCrude(CRUDE_COST)),
        ),
      }
    })
  }

  function handleSellGasoline() {
    setGame((current) => {
      if (current.gasoline < 1) {
        return current
      }

      const currentSellPrice = calculateDerivedStats(current).sellPrice

      return {
        ...current,
        gasoline: current.gasoline - 1,
        money: current.money + currentSellPrice,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(text.logs.soldGasoline(currentSellPrice)),
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

      return {
        ...current,
        money: current.money - nextUpgradeCost,
        refineryLevel: current.refineryLevel + 1,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.upgradedRefinery(current.refineryLevel + 1),
          ),
        ),
      }
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

      return applyMilestones({
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
      })
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

  function handlePlaceBuilding(cellIndex: number) {
    setGame((current) => {
      const building = selectedBuilding
      const cell = current.grid[cellIndex]
      const buildingData = BUILDINGS[building]

      if (cell !== null || current.money < buildingData.cost) {
        return current
      }

      const nextGrid = [...current.grid]
      nextGrid[cellIndex] = building

      return {
        ...current,
        money: current.money - buildingData.cost,
        grid: nextGrid,
        activityLog: addLog(
          current.activityLog,
          serializeBilingualText(
            text.logs.placedBuilding(buildingData.name, buildingData.cost),
          ),
        ),
      }
    })
  }

  function handleTriggerTestEvent() {
    setGame((current) => applyRandomEvent(current, getRandomEvent()))
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
        <p className="hero-copy">
          <BilingualText text={text.app.heroCopy} />
        </p>
      </section>

      <section className="app-section">
        <div className="section-heading">
          <p className="section-kicker">
            <BilingualText text={text.app.sections.summary.kicker} />
          </p>
          <h2 className="section-title">
            <BilingualText text={text.app.sections.summary.title} />
          </h2>
          <p className="section-copy">
            <BilingualText text={text.app.sections.summary.description} />
          </p>
        </div>

        <ResourcePanel
          money={game.money}
          researchPoints={game.researchPoints}
          reputation={game.reputation}
          crudeOil={game.crudeOil}
          maxCrudeStorage={maxCrudeStorage}
          gasoline={game.gasoline}
          maxGasolineStorage={maxGasolineStorage}
        />
      </section>

      <section className="app-section">
        <div className="section-heading">
          <p className="section-kicker">
            <BilingualText text={text.app.sections.production.kicker} />
          </p>
          <h2 className="section-title">
            <BilingualText text={text.app.sections.production.title} />
          </h2>
          <p className="section-copy">
            <BilingualText text={text.app.sections.production.description} />
          </p>
        </div>

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
              onBuyCrude={handleBuyCrude}
              onSellGasoline={handleSellGasoline}
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
        </div>
      </section>

      <section className="app-section">
        <div className="section-heading">
          <p className="section-kicker">
            <BilingualText text={text.app.sections.grid.kicker} />
          </p>
          <h2 className="section-title">
            <BilingualText text={text.app.sections.grid.title} />
          </h2>
          <p className="section-copy">
            <BilingualText text={text.app.sections.grid.description} />
          </p>
        </div>

        <BuildingGrid
          grid={game.grid}
          money={game.money}
          selectedBuilding={selectedBuilding}
          onPlaceBuilding={handlePlaceBuilding}
          onSelectBuilding={setSelectedBuilding}
        />
      </section>

      <section className="app-section">
        <div className="section-heading">
          <p className="section-kicker">
            <BilingualText text={text.app.sections.progression.kicker} />
          </p>
          <h2 className="section-title">
            <BilingualText text={text.app.sections.progression.title} />
          </h2>
          <p className="section-copy">
            <BilingualText text={text.app.sections.progression.description} />
          </p>
        </div>

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
            activeWorkers={activeWorkers}
            onHireWorker={handleHireWorker}
          />
          <MilestonesPanel activeMilestones={activeMilestones} />
        </section>
      </section>

      <section className="app-section">
        <div className="section-heading">
          <p className="section-kicker">
            <BilingualText text={text.app.sections.systems.kicker} />
          </p>
          <h2 className="section-title">
            <BilingualText text={text.app.sections.systems.title} />
          </h2>
          <p className="section-copy">
            <BilingualText text={text.app.sections.systems.description} />
          </p>
        </div>

        <section className="system-grid">
          <div className="system-side">
            <EventsPanel
              lastEventMessage={game.lastEventMessage}
              onTriggerEvent={handleTriggerTestEvent}
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
    </main>
  )
}

export default App
