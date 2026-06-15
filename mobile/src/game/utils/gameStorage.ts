import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  AwardRecord,
  BilingualTextValue,
  Employee,
  GameState,
  PendingShipment,
  PerkKey,
  RecruitmentCandidate,
  StandingOrderKey,
  WorkerCounts,
  WorkerType,
  YearStats,
} from '../types'
import { text } from '../translations'
import { countBuildings, createInitialGameState, DEFAULT_REFINERY_NAME, getEmployeesByType } from './gameCalculations'
import { DEMAND_SHIFT_BALANCE, ESG_BALANCE, FEEDSTOCK_PRIORITY_BALANCE, PLANT_PRODUCTION } from '../data/balance'
import { HIDDEN_COMBOS } from '../data/hiddenCombos'
import { getStaffName } from '../data/staffNames'
import { generateRecruitmentPool, getUnlockedWorkerTypes, RECRUITMENT_BALANCE } from '../data/recruitment'

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
      cell === 'salesOffice' ||
      cell === 'lubricantPlant' ||
      cell === 'jetFuelPlant' ||
      cell === 'petrochemicalPlant' ||
      cell === 'powerPlant',
  )
    ? value
    : fallback
}

function getSafeGridLevels(value: unknown, length: number): number[] {
  const result: number[] = Array(length).fill(1)
  if (!Array.isArray(value)) return result
  for (let i = 0; i < length; i++) {
    const item = value[i]
    if (item === 1 || item === 2 || item === 3) {
      result[i] = item
    }
  }
  return result
}

function getSafePendingShipments(value: unknown): PendingShipment[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is PendingShipment =>
      isRecord(item) &&
      typeof item.id === 'number' &&
      typeof item.amount === 'number' &&
      typeof item.arrivesAt === 'number',
  )
}

function getSafeWorkerCounts(value: unknown, fallback: WorkerCounts) {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    operator: getSafeNumber(value.operator, fallback.operator),
    mechanic: getSafeNumber(value.mechanic, fallback.mechanic),
    salesAgent: getSafeNumber(value.salesAgent, fallback.salesAgent),
    safetyOfficer: getSafeNumber(value.safetyOfficer, fallback.safetyOfficer),
    chemist: getSafeNumber(value.chemist, fallback.chemist),
    logisticsCoordinator: getSafeNumber(value.logisticsCoordinator, fallback.logisticsCoordinator),
    fuelSpecialist: getSafeNumber(value.fuelSpecialist, 0),
    aviationSpecialist: getSafeNumber(value.aviationSpecialist, 0),
    chemicalEngineer: getSafeNumber(value.chemicalEngineer, 0),
  }
}

// System 1: worker levels default to 1, xp defaults to 0 for every type.
const WORKER_TYPE_KEYS = [
  'operator',
  'mechanic',
  'salesAgent',
  'safetyOfficer',
  'chemist',
  'logisticsCoordinator',
  'fuelSpecialist',
  'aviationSpecialist',
  'chemicalEngineer',
] as const

// Individual Staff (Phase 1): each WorkerType's employees are represented as
// a list of {id, type, name, level, xp}. Two cases:
//  - New-shape save: value.employees is already an array — sanitize each
//    entry, slice/pad to match workerCounts[type] (the count invariant).
//  - Old-shape save (or no employees field): synthesize one Employee per
//    existing worker, ALL getting the OLD SHARED LEVEL (so
//    getEffectiveWorkerSum is numerically identical right after migration),
//    xp reset to 0, names from the old per-type roster (Charm Pass) or the
//    name pool.
function getSafeEmployees(value: unknown, workerCounts: WorkerCounts): Employee[] {
  const rawEmployees = isRecord(value) ? value.employees : undefined

  if (Array.isArray(rawEmployees)) {
    const result: Employee[] = []
    for (const key of WORKER_TYPE_KEYS) {
      const ofType = rawEmployees
        .filter(
          (item): item is Record<string, unknown> =>
            isRecord(item) && item.type === key,
        )
        .map((item, i): Employee => ({
          id: getSafeString(item.id, `${key}-${i}`),
          type: key,
          name: getSafeString(item.name, getStaffName(i)),
          level: clampLevel(getSafeNumber(item.level, 1)),
          xp: Math.max(0, getSafeNumber(item.xp, 0)),
          ...(item.trait === 'veteran' ? { trait: 'veteran' as const } : {}),
        }))
        .slice(0, workerCounts[key])
      while (ofType.length < workerCounts[key]) {
        const i = ofType.length
        ofType.push({ id: `${key}-${i}`, type: key, name: getStaffName(i), level: 1, xp: 0 })
      }
      result.push(...ofType)
    }
    return result
  }

  // Old shape: workerLevels (shared level per type) + workerXp (discarded) +
  // workerNames (Charm Pass per-type roster).
  const oldLevels = isRecord(value) ? value.workerLevels : undefined
  const oldNames = isRecord(value) ? value.workerNames : undefined
  const result: Employee[] = []
  for (const key of WORKER_TYPE_KEYS) {
    const sharedLevel = clampLevel(
      isRecord(oldLevels) ? getSafeNumber(oldLevels[key], 1) : 1,
    )
    const names = isRecord(oldNames) && Array.isArray(oldNames[key]) ? oldNames[key] : []
    for (let i = 0; i < workerCounts[key]; i++) {
      result.push({
        id: `${key}-${i}`,
        type: key,
        name: typeof names[i] === 'string' ? names[i] : getStaffName(i),
        level: sharedLevel,
        xp: 0,
      })
    }
  }
  return result
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(5, Math.floor(level)))
}

// Individual Staff Phase 3: sanitize plant-specialist assignments. For each
// specialist worker type (aviationSpecialist -> jetFuelPlant,
// chemicalEngineer -> petrochemicalPlant): keep only valid employee IDs of
// the correct type, capped at plant capacity. If the saved list is empty but
// employees of that type exist (old saves, or saves from before this
// feature), auto-assign in hire order up to capacity — keeps existing saves
// productive rather than a sudden cliff to zero specialist bonus.
function getSafeAssignments(
  value: unknown,
  employees: Employee[],
  grid: GameState['grid'],
): Partial<Record<WorkerType, string[]>> {
  const buildingCounts = countBuildings(grid)
  const raw = isRecord(value) ? value.assignments : undefined
  const result: Partial<Record<WorkerType, string[]>> = {}

  for (const plant of PLANT_PRODUCTION) {
    const type = plant.specialistWorker
    if (!type) continue
    const capacity = buildingCounts[plant.buildingKey]
    const ofType = getEmployeesByType(employees, type)
    const validIds = new Set(ofType.map((employee) => employee.id))
    const saved = isRecord(raw) && Array.isArray(raw[type])
      ? (raw[type] as unknown[]).filter(
          (id): id is string => typeof id === 'string' && validIds.has(id),
        )
      : []

    if (saved.length > 0) {
      result[type] = saved.slice(0, capacity)
    } else if (ofType.length > 0 && capacity > 0) {
      result[type] = ofType.slice(0, capacity).map((employee) => employee.id)
    } else {
      result[type] = []
    }
  }

  return result
}

const RECRUITMENT_TIERS = ['rookie', 'skilled', 'expert', 'star']

// Mobile-only: validates the saved recruitment pool. If it's missing,
// malformed, or the wrong size, regenerates a fresh pool for the current
// refinery level (rather than trying to repair individual candidates --
// this only happens on corrupted/pre-feature saves).
function getSafeRecruitmentPool(
  value: Record<string, unknown>,
  refineryLevel: number,
  nameCounter: number,
): RecruitmentCandidate[] {
  const raw = value.recruitmentPool
  const unlockedTypes = new Set(getUnlockedWorkerTypes(refineryLevel))

  if (Array.isArray(raw) && raw.length === RECRUITMENT_BALANCE.poolSize) {
    const valid = raw.every((item) => {
      if (!isRecord(item)) return false
      return (
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        unlockedTypes.has(item.type as WorkerType) &&
        typeof item.name === 'string' &&
        typeof item.tier === 'string' &&
        RECRUITMENT_TIERS.includes(item.tier as string) &&
        typeof item.startingLevel === 'number' &&
        typeof item.cost === 'number' &&
        typeof item.isVeteran === 'boolean'
      )
    })
    if (valid) return raw as unknown as RecruitmentCandidate[]
  }

  return generateRecruitmentPool(refineryLevel, nameCounter).pool
}

// System 2: only keep recognized perk keys.
const PERK_KEYS: PerkKey[] = [
  'efficiency1', 'efficiency2', 'efficiency3',
  'capacity1', 'capacity2', 'capacity3',
  'quality1', 'quality2', 'quality3',
]

function getSafePerks(value: unknown): PerkKey[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is PerkKey => PERK_KEYS.includes(v as PerkKey))
}

// System 4: year stats and award history.
function getSafeYearStats(value: unknown): YearStats {
  if (!isRecord(value)) {
    return { gasolineProduced: 0, moneyEarned: 0, contractsCompleted: 0 }
  }
  return {
    gasolineProduced: getSafeNumber(value.gasolineProduced, 0),
    moneyEarned: getSafeNumber(value.moneyEarned, 0),
    contractsCompleted: getSafeNumber(value.contractsCompleted, 0),
  }
}

function getSafeAwardHistory(value: unknown): AwardRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is AwardRecord =>
        isRecord(item) &&
        typeof item.year === 'number' &&
        typeof item.score === 'number' &&
        (item.grade === 'S' || item.grade === 'A' || item.grade === 'B' || item.grade === 'C'),
    )
    .map((item) => ({
      ...item,
      // payroll/netProfit added in the Economy Pass; default for older records.
      payroll: typeof item.payroll === 'number' ? item.payroll : 0,
      netProfit:
        typeof item.netProfit === 'number' ? item.netProfit : item.moneyEarned ?? 0,
      couldNotAfford: typeof item.couldNotAfford === 'boolean' ? item.couldNotAfford : false,
      rivals: Array.isArray(item.rivals) ? item.rivals : [],
      playerRank: typeof item.playerRank === 'number' ? item.playerRank : 1,
    }))
    .slice(0, 12)
}

export function sanitizeLoadedGameState(value: unknown) {
  const fallback = createInitialGameState()

  if (!isRecord(value)) {
    return fallback
  }

  const grid = getSafeGrid(value.grid, fallback.grid)
  const workerCounts = getSafeWorkerCounts(value.workerCounts, fallback.workerCounts)
  const employees = getSafeEmployees(value, workerCounts)

  return {
    ...fallback,
    money: getSafeNumber(value.money, fallback.money),
    researchPoints: getSafeNumber(value.researchPoints, fallback.researchPoints),
    reputation: getSafeNumber(value.reputation, fallback.reputation),
    crudeOil: getSafeNumber(value.crudeOil, fallback.crudeOil),
    gasoline: getSafeNumber(value.gasoline, fallback.gasoline),
    feedstock: getSafeNumber(value.feedstock, 0),
    electricity: Math.max(0, getSafeNumber(value.electricity, 0)),
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
    workerCounts,
    employees,
    assignments: getSafeAssignments(value, employees, grid),
    recruitmentPool: getSafeRecruitmentPool(
      value,
      getSafeNumber(value.refineryLevel, fallback.refineryLevel),
      getSafeNumber(value.recruitmentNameCounter, 0),
    ),
    recruitmentRefreshAt: getSafeNumber(
      value.recruitmentRefreshAt,
      getSafeNumber(value.tickCount, fallback.tickCount) + RECRUITMENT_BALANCE.refreshIntervalTicks,
    ),
    recruitmentNameCounter: getSafeNumber(value.recruitmentNameCounter, RECRUITMENT_BALANCE.poolSize),
    // For saves predating this field, default to "now" (current tickCount)
    // rather than 0 -- otherwise an established save (large tickCount,
    // missing this field) would compute tickCount - 0 >= 1200 and fire the
    // choice-event fallback immediately on the first tick after load. This
    // mirrors the recruitmentRefreshAt migration above: treat it as "a
    // choice event was just shown", giving a full fallback window before
    // the next one.
    lastChoiceEventTick: getSafeNumber(
      value.lastChoiceEventTick,
      getSafeNumber(value.tickCount, fallback.tickCount),
    ),
    boostActiveUntilTick: getSafeNumber(value.boostActiveUntilTick, 0),
    boostAvailableAtTick: getSafeNumber(value.boostAvailableAtTick, 0),
    esgScore: Math.max(
      ESG_BALANCE.minScore,
      Math.min(ESG_BALANCE.maxScore, getSafeNumber(value.esgScore, fallback.esgScore)),
    ),
    gasolineDemandMultiplier: Math.max(
      DEMAND_SHIFT_BALANCE.gasolineDemandFloor,
      Math.min(1, getSafeNumber(value.gasolineDemandMultiplier, fallback.gasolineDemandMultiplier)),
    ),
    gasolineYieldCarry: Math.max(
      0,
      Math.min(1, getSafeNumber(value.gasolineYieldCarry, fallback.gasolineYieldCarry)),
    ),
    petrochemicalsDemandMultiplier: Math.max(
      1,
      Math.min(
        DEMAND_SHIFT_BALANCE.petrochemicalsDemandCeiling,
        getSafeNumber(value.petrochemicalsDemandMultiplier, fallback.petrochemicalsDemandMultiplier),
      ),
    ),
    discoveredCombos: getSafeStringArray(value.discoveredCombos, []).filter((key) =>
      HIDDEN_COMBOS.some((combo) => combo.key === key),
    ),
    upgradePoints: getSafeNumber(value.upgradePoints, 0),
    unlockedPerks: getSafePerks(value.unlockedPerks),
    highestEraIndex: getSafeNumber(value.highestEraIndex, 0),
    businessYear: Math.max(1, getSafeNumber(value.businessYear, 1)),
    yearStartTick: getSafeNumber(value.yearStartTick, 0),
    yearStats: getSafeYearStats(value.yearStats),
    awardHistory: getSafeAwardHistory(value.awardHistory),
    grid,
    gridLevels: getSafeGridLevels(value.gridLevels, grid.length),
    gridExpansionLevel: getSafeNumber(value.gridExpansionLevel, fallback.gridExpansionLevel),
    prototypeCompleted: getSafeBoolean(value.prototypeCompleted, fallback.prototypeCompleted),
    everBoughtCrude: getSafeBoolean(value.everBoughtCrude, fallback.everBoughtCrude),
    starterGuideDismissed: getSafeBoolean(value.starterGuideDismissed, fallback.starterGuideDismissed),
    refineryName: getSafeString(value.refineryName, DEFAULT_REFINERY_NAME).trim().slice(0, 40) || DEFAULT_REFINERY_NAME,
    pendingShipments: getSafePendingShipments(value.pendingShipments),
    standingOrderCooldowns: getSafeStandingOrderCooldowns(value.standingOrderCooldowns),
    feedstockPriority: getSafeFeedstockPriority(value),
    // productInventory is now live gameplay state for all secondary products.
    // gasoline mirrors value.gasoline (source of truth for the primary product).
    // Previously asphalt/jetFuel/lubricants/petrochemicals were reset to 0 on
    // every load, wiping the player's secondary product stock — now preserved.
    productInventory: {
      gasoline: getSafeNumber(value.gasoline, fallback.gasoline),
      asphalt: getSafeProductAmount(value.productInventory, 'asphalt'),
      jetFuel: getSafeProductAmount(value.productInventory, 'jetFuel'),
      lubricants: getSafeProductAmount(value.productInventory, 'lubricants'),
      petrochemicals: getSafeProductAmount(value.productInventory, 'petrochemicals'),
    },
  }
}

function getSafeNumberArray(value: unknown, fallback: number[]) {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
    ? value
    : fallback
}

const STANDING_ORDER_KEYS: StandingOrderKey[] = [
  'asphaltMaintenance',
  'jetFuelCharter',
  'lubricantSupply',
  'petrochemExport',
]
// Reads a single product amount from a saved productInventory record.
// Missing or invalid values default to 0 so old saves load safely.
function getSafeProductAmount(value: unknown, key: string): number {
  if (!isRecord(value)) return 0
  const amount = value[key]
  return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
    ? amount
    : 0
}

function getSafeStandingOrderCooldowns(
  value: unknown,
): Partial<Record<StandingOrderKey, number>> {
  if (!isRecord(value)) return {}
  const result: Partial<Record<StandingOrderKey, number>> = {}
  for (const key of STANDING_ORDER_KEYS) {
    const entry = value[key]
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      result[key] = entry
    }
  }
  return result
}

// Feedstock Priority weights (Refinery tab card). For each downstream
// plant, keep a saved value only if it's a finite number within
// [min, max]; otherwise fall back to the default (100%). Old saves
// (created before this feature) have no feedstockPriority at all, so
// every plant defaults to 100% -- identical to the proportional-sharing
// behavior they already had.
function getSafeFeedstockPriority(value: unknown): GameState['feedstockPriority'] {
  const raw = isRecord(value) ? value.feedstockPriority : undefined
  const result: GameState['feedstockPriority'] = {
    lubricantPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
    jetFuelPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
    petrochemicalPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
  }
  if (isRecord(raw)) {
    for (const key of ['lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant'] as const) {
      const entry = raw[key]
      if (
        typeof entry === 'number' &&
        Number.isFinite(entry) &&
        entry >= FEEDSTOCK_PRIORITY_BALANCE.min &&
        entry <= FEEDSTOCK_PRIORITY_BALANCE.max
      ) {
        result[key] = entry
      }
    }
  }
  return result
}

// --- Expo port note ---
// Web used synchronous window.localStorage; React Native has no
// synchronous storage, so these three I/O functions are now async
// (AsyncStorage). sanitizeLoadedGameState/createInitialGameState above are
// unchanged pure logic -- only the I/O wrapper changed.

export async function loadStoredGameState(): Promise<LoadResult> {
  let savedValue: string | null = null

  try {
    savedValue = await AsyncStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      game: createInitialGameState(),
      message: text.save.invalid,
    }
  }

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

export async function saveStoredGameState(game: GameState): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    return true
  } catch {
    return false
  }
}

export async function clearStoredGameState(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
