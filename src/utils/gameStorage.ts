import type { BilingualTextValue, GameState, WorkerCounts } from '../types'
import { text } from '../translations'
import { createInitialGameState } from './gameCalculations'

const STORAGE_KEY = 'refinery-story-save'

type LoadResult = {
  game: GameState
  message: BilingualTextValue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getSafeNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getSafeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function getSafeString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function getSafeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : fallback
}

function getSafeGrid(value: unknown, fallback: GameState['grid']) {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value.every(
    (cell) =>
      cell === null ||
      cell === 'crudeTank' ||
      cell === 'distillationUnit' ||
      cell === 'productTank' ||
      cell === 'laboratory' ||
      cell === 'maintenanceWorkshop' ||
      cell === 'salesOffice',
  )
    ? value
    : fallback
}

function getSafeWorkerCounts(value: unknown, fallback: WorkerCounts) {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    operator: getSafeNumber(value.operator, fallback.operator),
    mechanic: getSafeNumber(value.mechanic, fallback.mechanic),
    salesAgent: getSafeNumber(value.salesAgent, fallback.salesAgent),
  }
}

function sanitizeLoadedGameState(value: unknown) {
  const fallback = createInitialGameState()

  if (!isRecord(value)) {
    return fallback
  }

  return {
    ...fallback,
    money: getSafeNumber(value.money, fallback.money),
    researchPoints: getSafeNumber(value.researchPoints, fallback.researchPoints),
    reputation: getSafeNumber(value.reputation, fallback.reputation),
    crudeOil: getSafeNumber(value.crudeOil, fallback.crudeOil),
    gasoline: getSafeNumber(value.gasoline, fallback.gasoline),
    refineryLevel: getSafeNumber(value.refineryLevel, fallback.refineryLevel),
    productionProgress: getSafeNumber(
      value.productionProgress,
      fallback.productionProgress,
    ),
    tickCount: getSafeNumber(value.tickCount, fallback.tickCount),
    lastEventMessage: getSafeString(value.lastEventMessage, fallback.lastEventMessage),
    totalGasolineProduced: getSafeNumber(
      value.totalGasolineProduced,
      fallback.totalGasolineProduced,
    ),
    completedContractCount: getSafeNumber(
      value.completedContractCount,
      fallback.completedContractCount,
    ),
    totalWorkersHired: getSafeNumber(
      value.totalWorkersHired,
      fallback.totalWorkersHired,
    ),
    unlockedResearchCount: getSafeNumber(
      value.unlockedResearchCount,
      fallback.unlockedResearchCount,
    ),
    activityLog: getSafeStringArray(value.activityLog, fallback.activityLog),
    completedContractIds: getSafeNumberArray(
      value.completedContractIds,
      fallback.completedContractIds,
    ),
    completedMilestoneKeys: getSafeStringArray(
      value.completedMilestoneKeys,
      fallback.completedMilestoneKeys,
    ) as GameState['completedMilestoneKeys'],
    unlockedResearchIds: getSafeStringArray(
      value.unlockedResearchIds,
      fallback.unlockedResearchIds,
    ) as GameState['unlockedResearchIds'],
    workerCounts: getSafeWorkerCounts(value.workerCounts, fallback.workerCounts),
    grid: getSafeGrid(value.grid, fallback.grid),
    gridExpansionLevel: getSafeNumber(value.gridExpansionLevel, fallback.gridExpansionLevel),
    prototypeCompleted: getSafeBoolean(value.prototypeCompleted, fallback.prototypeCompleted),
    everBoughtCrude: getSafeBoolean(value.everBoughtCrude, fallback.everBoughtCrude),
    starterGuideDismissed: getSafeBoolean(value.starterGuideDismissed, fallback.starterGuideDismissed),
  }
}

function getSafeNumberArray(value: unknown, fallback: number[]) {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
    ? value
    : fallback
}

export function loadStoredGameState(): LoadResult {
  if (typeof window === 'undefined') {
    return {
      game: createInitialGameState(),
      message: text.save.ready,
    }
  }

  const savedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!savedValue) {
    return {
      game: createInitialGameState(),
      message: text.save.noSave,
    }
  }

  try {
    const parsed = JSON.parse(savedValue)

    return {
      game: sanitizeLoadedGameState(parsed),
      message: text.save.loaded,
    }
  } catch {
    return {
      game: createInitialGameState(),
      message: text.save.invalid,
    }
  }
}

export function saveStoredGameState(game: GameState) {
  if (typeof window === 'undefined') {
    return false
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  return true
}

export function clearStoredGameState() {
  if (typeof window === 'undefined') {
    return false
  }

  window.localStorage.removeItem(STORAGE_KEY)
  return true
}
