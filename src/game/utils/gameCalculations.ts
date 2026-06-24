import {
  AWARDS_BALANCE,
  CALENDAR_BALANCE,
  BONUS_BALANCE,
  BUILDING_UPGRADE_BALANCE,
  CORE_BALANCE,
  DEMAND_SHIFT_BALANCE,
  ECONOMY_BALANCE,
  ESG_BALANCE,
  ESG_DIRTY_BUILDINGS,
  EVENT_BALANCE,
  EXPANSION_BALANCE,
  FEEDSTOCK_BALANCE,
  FEEDSTOCK_PRIORITY_BALANCE,
  MILESTONE_BALANCE,
  PLANT_PRODUCTION,
  POLYMER_PLANT_BALANCE,
  POWER_PLANT_BALANCE,
  PRODUCTION_BALANCE,
  REPUTATION_TIER_BALANCE,
  SEASONAL_BALANCE,
  STAFF_LEVEL_BALANCE,
  STARTING_BALANCE,
  STORAGE_BALANCE,
  TANK_FARM_BALANCE,
  WAGE_BALANCE,
  WASTE_BALANCE,
  WASTE_TREATMENT_PLANT_BALANCE,
} from '../data/balance'
import type { PlantProductionConfig, ShipmentOption } from '../data/balance'
import { CONTRACTS } from '../data/contracts'
import { getCurrentEra, getNextEra } from '../data/eras'
import { RANDOM_EVENTS } from '../data/events'
import { HIDDEN_COMBOS } from '../data/hiddenCombos'
import { HIDDEN_EVENTS } from '../data/hiddenEvents'
import type { HiddenComboConfig } from '../data/hiddenCombos'
import { MILESTONES } from '../data/milestones'
import { PERK_EFFECTS } from '../data/perks'
import { RESEARCH_ITEMS } from '../data/research'
import { getRivalBaselineScore, RIVAL_REFINERIES } from '../data/rivals'
import { getStaffName } from '../data/staffNames'
import { generateRecruitmentPool, RECRUITMENT_BALANCE } from '../data/recruitment'
import { WORKERS } from '../data/workers'
import { serializeBilingualText, text } from '../translations'
import type {
  ActiveWorkerItem,
  AwardGrade,
  ActiveContract,
  AwardRecord,
  RivalResult,
  BuildingCounts,
  BuildingType,
  BilingualTextValue,
  ChoiceEvent,
  ComboStats,
  DerivedStats,
  GameClock,
  HiddenEventConfig,
  HiddenEventGameCondition,
  HiddenEventTimeCondition,
  GameState,
  GridCell,
  Employee,
  EraConfig,
  MilestoneKey,
  MilestoneProgress,
  PendingShipment,
  PerkKey,
  RandomEvent,
  ReputationTier,
  WorkerCounts,
  WorkerType,
  YearStats,
} from '../types'

export const TICK_MS = CORE_BALANCE.tickMs
export const GRID_SIZE = CORE_BALANCE.gridSize
export const STARTING_MONEY = STARTING_BALANCE.money
export const STARTING_CRUDE = STARTING_BALANCE.crudeOil
export const CRUDE_COST = ECONOMY_BALANCE.crudeCost

// Default name shown until the player renames their refinery from the hero panel.
export const DEFAULT_REFINERY_NAME = 'Sunrise Refinery'

// Refinery "title" — a Kairosoft-style company rank shown next to the name in
// the hero panel, derived purely from refinery level (no extra save state).
// Thresholds line up with the advanced-plant unlock levels (5/10/15).
export function getRefineryTitle(level: number): BilingualTextValue {
  if (level >= 15) return text.refinery.titleIndustryLeader
  if (level >= 10) return text.refinery.titleNationalProducer
  if (level >= 5) return text.refinery.titleRegionalSupplier
  return text.refinery.titleLocalRefinery
}
export const RANDOM_EVENT_INTERVAL_MS = CORE_BALANCE.randomEventIntervalMs
export const RANDOM_EVENT_INTERVAL_TICKS = CORE_BALANCE.randomEventIntervalTicks
export const CHOICE_EVENT_FALLBACK_TICKS = CORE_BALANCE.choiceEventFallbackTicks
export const AUTO_TRADE_BUFFER_PERCENT = CORE_BALANCE.autoTradeBufferPercent

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
    feedstock: 0,
    electricity: 0,
    waste: 0,
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
      polymerEngineer: 0,
    },
    employees: [],
    assignments: {},
    ...(() => {
      const { pool, nextNameIndex } = generateRecruitmentPool(1, 0)
      return {
        recruitmentPool: pool,
        recruitmentRefreshAt: RECRUITMENT_BALANCE.refreshIntervalTicks,
        recruitmentNameCounter: nextNameIndex,
      }
    })(),
    lastChoiceEventTick: 0,
    boostActiveUntilTick: 0,
    boostAvailableAtTick: 0,
    esgScore: ESG_BALANCE.startingScore,
    gasolineDemandMultiplier: 1,
    petrochemicalsDemandMultiplier: 1,
    gasolineYieldCarry: 0,
    discoveredCombos: [],
    discoveredHiddenEvents: [],
    hiddenEventStatus: {},
    hiddenBuildingUsesRemaining: {},
    hiddenContracts: [],
    upgradePoints: 0,
    unlockedPerks: [],
    highestEraIndex: 0,
    businessYear: 1,
    yearStartTick: 0,
    yearStats: { gasolineProduced: 0, moneyEarned: 0, contractsCompleted: 0 },
    awardHistory: [],
    grid: Array(EXPANSION_BALANCE[0].cells).fill(null),
    gridLevels: Array(EXPANSION_BALANCE[0].cells).fill(1),
    gridExpansionLevel: 0,
    prototypeCompleted: false,
    everBoughtCrude: false,
    starterGuideDismissed: false,
    refineryName: DEFAULT_REFINERY_NAME,
    pendingShipments: [],
    standingOrderCooldowns: {},
    feedstockPriority: {
      lubricantPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
      jetFuelPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
      petrochemicalPlant: FEEDSTOCK_PRIORITY_BALANCE.default,
    },
    productInventory: {
      gasoline: 0,
      asphalt: 0,
      jetFuel: 0,
      lubricants: 0,
      petrochemicals: 0,
      recycledMaterial: 0,
      plasticPellets: 0,
    },
  }
}

export function getUpgradeCost(level: number) {
  return (
    ECONOMY_BALANCE.refineryUpgradeBaseCost +
    ECONOMY_BALANCE.refineryUpgradeLevelStep * level * level
  )
}

// Cumulative lifetime gasoline output required to advance past `level`.
export function getUpgradeProductionRequirement(level: number) {
  return ECONOMY_BALANCE.refineryUpgradeProductionPerLevel * level
}

export function addLog(logs: string[], message: string) {
  return [message, ...logs].slice(0, CORE_BALANCE.maxLogItems)
}

export function getRandomEvent(game: GameState) {
  const hasDistillationChain =
    calculateDerivedStats(game).maxFeedstockStorage > FEEDSTOCK_BALANCE.baseFeedstockStorage
  const eligible = RANDOM_EVENTS.filter(
    (event) => !event.requiresFeedstockChain || hasDistillationChain,
  )
  const incidentEvents = eligible.filter((event) => event.isIncident)
  const otherEvents = eligible.filter((event) => !event.isIncident)
  const pickIncident =
    incidentEvents.length > 0 && Math.random() < getIncidentChance(game.esgScore)
  const pool = pickIncident || otherEvents.length === 0 ? incidentEvents : otherEvents
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
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
    powerPlant: 0,
    wasteTreatmentPlant: 0,
    polymerPlant: 0,
    lubricantTank: 0,
    jetFuelTank: 0,
    petrochemicalTank: 0,
    recyclingBunker: 0,
    pelletSilo: 0,
  }
}

export function getEmptyWorkerCounts(): WorkerCounts {
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
    polymerEngineer: 0,
  }
}

// --- Individual Staff (Phase 1) helpers ---

import { getEmployeesByType as _getEmployeesByType } from './employeeUtils'
// Re-exported from employeeUtils to break the circular dependency:
//   gameCalculations → recruitment → gameCalculations
// The implementation lives in employeeUtils.ts; callers that already import
// from gameCalculations continue to work unchanged.
export { getEmployeesByType } from './employeeUtils'

// "Concentrated training" target: the lowest-level employee of a type (ties
// broken by lowest XP, then hire order). Returns null if the type has no
// employees, or all are at maxLevel. Used by both passive XP accrual and
// paid training, so progress always lands on the same person.
export function getTrainingTarget(employees: Employee[], type: WorkerType): Employee | null {
  let best: Employee | null = null
  for (const employee of employees) {
    if (employee.type !== type) continue
    if (employee.level >= STAFF_LEVEL_BALANCE.maxLevel) continue
    if (
      !best ||
      employee.level < best.level ||
      (employee.level === best.level && employee.xp < best.xp)
    ) {
      best = employee
    }
  }
  return best
}

// Multiplier applied to a worker type's bonus based on its crew level.
// Level 1 = 1.0x, each level above adds STAFF_LEVEL_BALANCE.bonusPerLevelRate.
export function getWorkerLevelMultiplier(level: number): number {
  const safeLevel = Math.max(1, Math.min(STAFF_LEVEL_BALANCE.maxLevel, level))
  return 1 + (safeLevel - 1) * STAFF_LEVEL_BALANCE.bonusPerLevelRate
}

// An employee's full personal effectiveness multiplier: level multiplier
// plus a flat veteranBonusRate if they have the 'veteran' trait (Phase 4).
export function getEmployeeMultiplier(employee: Employee): number {
  const veteranBonus = employee.trait === 'veteran' ? STAFF_LEVEL_BALANCE.veteranBonusRate : 0
  return getWorkerLevelMultiplier(employee.level) + veteranBonus
}

// Sum of getEmployeeMultiplier across all employees of a type — replaces
// the old `count * multiplier(sharedLevel)`. At uniform level (no veterans)
// this equals that; as individuals level up (or roll veteran), it rises.
export function getEffectiveWorkerSum(employees: Employee[], type: WorkerType): number {
  return _getEmployeesByType(employees, type).reduce(
    (sum, employee) => sum + getEmployeeMultiplier(employee),
    0,
  )
}

// Phase 4: roll whether a new hire is a Veteran (rare, permanent bonus).
export function rollVeteranTrait(): Employee['trait'] {
  return Math.random() < STAFF_LEVEL_BALANCE.veteranHireChance ? 'veteran' : undefined
}

// Builds a new hire: next name from the pool (cycled by current headcount of
// this type), level 1, xp 0, and a Veteran trait roll. Used by the hire
// handler and both free-hire choice-event outcomes.
export function createNewEmployee(employees: Employee[], type: WorkerType): Employee {
  // Mobile note: upstream getStaffName(index) was keyed per-type
  // (getEmployeesByType(employees, type).length), so the FIRST hire of
  // every type got index 0 -- if a player hires one of each of the 9
  // worker types (the natural flow on the mobile Staff tab), all 9 get the
  // same name ("Mara"). Use a global hire-order index instead: each new
  // employee, of any type, gets the next name in STAFF_NAME_POOL. `id`
  // stays unique either way since it's never parsed, just compared.
  const typeIndex = _getEmployeesByType(employees, type).length
  const globalIndex = employees.length
  const trait = rollVeteranTrait()
  return {
    id: `${type}-${typeIndex}`,
    type,
    name: getStaffName(globalIndex),
    level: 1,
    xp: 0,
    ...(trait ? { trait } : {}),
  }
}

// --- Per-Plant Staff Assignment (design doc Part A) ---

// How many specialist slots a plant TYPE has in total = how many of that
// building exist on the grid. Used for "X total slots" display purposes
// (e.g. Staff tab); the actual assign/unassign action is per-cell, not
// against this aggregate.
export function getAssignmentCapacity(buildingCounts: BuildingCounts, type: WorkerType): number {
  const plant = PLANT_PRODUCTION.find((p) => p.specialistWorker === type)
  if (plant) return buildingCounts[plant.buildingKey]
  if (type === 'polymerEngineer') return buildingCounts.polymerPlant
  return 0
}

// The employee assigned to a specific grid cell, if any. Returns null if
// the cell has no assignment, or if the assigned id doesn't match a live
// employee (defensive -- shouldn't happen, but a stale id is better
// treated as "no one assigned" than crashing).
export function getEmployeeAssignedToCell(game: GameState, cellIndex: number): Employee | null {
  const employeeId = game.assignments[cellIndex]
  if (!employeeId) return null
  return game.employees.find((e) => e.id === employeeId) ?? null
}

// The cellIndex (if any) a given employee is currently assigned to. Used
// by the Staff tab ("Assigned: Petrochemical Plant #2" / "Unassigned")
// and to enforce "1 employee = at most 1 cell" when assigning elsewhere.
export function getCellAssignedToEmployee(game: GameState, employeeId: string): number | null {
  for (const [cellIndex, id] of Object.entries(game.assignments)) {
    if (id === employeeId) return Number(cellIndex)
  }
  return null
}

// Specialist output multiplier for ONE plant cell, based on whichever
// single employee (if any) is assigned to that specific cellIndex. This
// is the per-cell replacement for the old pool-based getSpecialistMultiplier
// -- 1 assigned specialist now only ever boosts the ONE cell they're
// assigned to, not every plant of that type (see design doc Part A for
// why the old aggregate model was an economy-breaking scaling problem).
export function getSpecialistMultiplierForCell(
  game: GameState,
  cellIndex: number,
  specialistWorker: WorkerType | undefined,
  specialistBonusRate: number | undefined,
): number {
  if (!specialistWorker || !specialistBonusRate) return 1
  const employee = getEmployeeAssignedToCell(game, cellIndex)
  if (!employee || employee.type !== specialistWorker) return 1
  return 1 + getEmployeeMultiplier(employee) * specialistBonusRate

}

// One line of "what does this tile do right now" info, for the Building
// Info sheet (tap any built tile). `bonus` is rendered in green -- the
// extra amount coming from upgrades (next level preview) or assigned
// specialist staff, so the player can see what hiring/upgrading would add.
export type BuildingEffectLine = {
  label: string
  value: string
  bonus?: string
  // Shown in orange -- a heads-up about a constraint (e.g. feedstock
  // supply can't keep up with total demand from built plants).
  warning?: string
}

export function getBuildingEffectLines(
  cell: BuildingType,
  level: number,
  game: GameState,
  derived: DerivedStats,
  cellIndex: number,
): BuildingEffectLine[] {
  switch (cell) {
    case 'crudeTank':
    case 'productTank': {
      const byLevel =
        cell === 'crudeTank'
          ? BUILDING_UPGRADE_BALANCE.crudeTankStorageByLevel
          : BUILDING_UPGRADE_BALANCE.productTankStorageByLevel
      const current = byLevel[level] ?? byLevel[1]
      const next = byLevel[level + 1]
      return [
        {
          label: cell === 'crudeTank' ? 'Crude storage from this tank' : 'Gasoline storage from this tank',
          value: `+${current}`,
          bonus: next !== undefined ? `(+${next - current} at Lv${level + 1})` : undefined,
        },
      ]
    }
    case 'distillationUnit': {
      const byLevel = BUILDING_UPGRADE_BALANCE.distillationUnitBonusRateByLevel
      const current = byLevel[level] ?? byLevel[1]
      const next = byLevel[level + 1]
      return [
        {
          label: 'Production & feedstock speed bonus',
          value: `+${Math.round(current * 100)}%`,
          bonus:
            next !== undefined
              ? `(+${Math.round((next - current) * 100)}% at Lv${level + 1})`
              : undefined,
        },
      ]
    }
    case 'lubricantPlant':
    case 'jetFuelPlant':
    case 'petrochemicalPlant': {
      const plant = PLANT_PRODUCTION.find((p) => p.buildingKey === cell)
      if (!plant) return []
      const seconds = (plant.intervalTicks * TICK_MS) / 1000
      const base = plant.outputPerCycle
      const specialistMultiplier = getSpecialistMultiplierForCell(
        game,
        cellIndex,
        plant.specialistWorker,
        plant.specialistBonusRate,
      )
      const levelMultiplier = getCellLevelMultiplier(level, cell)
      const boosted = Math.round(base * specialistMultiplier * levelMultiplier)
      const bonusAmount = boosted - base
      let bonus: string | undefined
      if (bonusAmount > 0) {
        const parts: string[] = []
        const assignedEmployee = getEmployeeAssignedToCell(game, cellIndex)
        if (plant.specialistWorker && assignedEmployee?.type === plant.specialistWorker) {
          const specialistName = WORKERS.find((w) => w.key === plant.specialistWorker)?.name.en ?? 'specialist'
          parts.push(`assigned ${specialistName}`)
        }
        if (levelMultiplier > 1) {
          parts.push('this plant\'s level upgrades')
        }
        bonus = `(+${bonusAmount} from ${parts.join(' + ')})`
      }
      const line: BuildingEffectLine = {
        label: 'Output from this plant',
        value: `${boosted} ${plant.productKey} / ${seconds}s`,
        bonus,
      }

      // Feedstock supply vs total demand across all built downstream
      // plants (lubricant/jet fuel/petrochem share one feedstock pool,
      // split proportionally every 25-tick cycle -- see tick()). If
      // supply can't cover total demand, every plant runs at a reduced
      // rate (not just this one).
      const supplyPer25Ticks = derived.feedstockPerDistillationCycle * 5
      const demandPer25Ticks = PLANT_PRODUCTION.reduce(
        (sum, p) => sum + derived.buildingCounts[p.buildingKey] * p.feedstockPerCycle,
        0,
      )
      if (demandPer25Ticks > supplyPer25Ticks) {
        const pct = Math.round((supplyPer25Ticks / demandPer25Ticks) * 100)
        line.warning = `Feedstock supply (${Math.floor(supplyPer25Ticks)}/${seconds}s) covers only ${pct}% of total demand (${demandPer25Ticks}/${seconds}s) -- all downstream plants run at a reduced rate. Build more Distillation Units for full output, or adjust Feedstock Priority below to favor this plant.`
      }

      const priorityLine: BuildingEffectLine = {
        label: 'Feedstock priority',
        value: `${Math.round((game.feedstockPriority[cell] ?? 1) * 100)}%`,
      }
      if ((game.feedstockPriority[cell] ?? 1) <= 0) {
        priorityLine.warning = 'Set to 0% (off) -- this plant never produces. Adjust in the Feedstock Priority card below.'
      }

      const lines = [line, priorityLine]

      // Electricity supply vs demand (Production Complexity Expansion
      // Phase 2). Only relevant once >= 1 Power Plant is built -- before
      // that, downstream plants don't need electricity at all.
      if (derived.buildingCounts.powerPlant > 0 && derived.electricityDemandPerCycle > 0) {
        const electricitySupplyPerCycle = derived.buildingCounts.powerPlant * POWER_PLANT_BALANCE.electricityPerCycle
        const electricityLine: BuildingEffectLine = {
          label: 'Electricity demand (this plant)',
          value: `${plant.electricityPerCycle} / ${seconds}s`,
        }
        if (derived.electricityDemandPerCycle > electricitySupplyPerCycle) {
          const pct = Math.round((electricitySupplyPerCycle / derived.electricityDemandPerCycle) * 100)
          electricityLine.warning = `Electricity supply (${electricitySupplyPerCycle}/${seconds}s) covers only ${pct}% of total demand (${derived.electricityDemandPerCycle}/${seconds}s) -- all downstream plants run at a reduced rate. Build more Power Plants for full output.`
        }
        lines.push(electricityLine)
      }

      return lines
    }
    case 'powerPlant': {
      const seconds = (POWER_PLANT_BALANCE.intervalTicks * TICK_MS) / 1000
      return [
        {
          label: 'Electricity output per plant',
          value: `+${POWER_PLANT_BALANCE.electricityPerCycle} / ${seconds}s`,
        },
        {
          label: 'Crude consumed per plant',
          value: `-${POWER_PLANT_BALANCE.crudePerCycle} / ${seconds}s`,
        },
        {
          label: 'Powers',
          value: 'Jet Fuel, Petrochemical, Lubricant & Polymer Plants, plus gasoline production',
        },
      ]
    }
    case 'wasteTreatmentPlant': {
      const seconds = (WASTE_TREATMENT_PLANT_BALANCE.intervalTicks * TICK_MS) / 1000
      return [
        {
          label: 'Recycled material output per plant',
          value: `+${WASTE_TREATMENT_PLANT_BALANCE.recycledMaterialPerCycle} / ${seconds}s`,
        },
        {
          label: 'Waste consumed per plant',
          value: `-${WASTE_TREATMENT_PLANT_BALANCE.wastePerCycle} / ${seconds}s`,
        },
      ]
    }
    case 'polymerPlant': {
      const plantCount = derived.buildingCounts.polymerPlant
      const seconds = (POLYMER_PLANT_BALANCE.intervalTicks * TICK_MS) / 1000
      const base = POLYMER_PLANT_BALANCE.plasticPelletsPerCycle
      const specialistMultiplier = getSpecialistMultiplierForCell(
        game,
        cellIndex,
        'polymerEngineer',
        BONUS_BALANCE.polymerEngineerPlasticPelletsBonusRate,
      )
      const levelMultiplier = getCellLevelMultiplier(level, 'polymerPlant')
      const boosted = Math.round(base * specialistMultiplier * levelMultiplier)
      const bonusAmount = boosted - base
      let bonus: string | undefined
      if (bonusAmount > 0) {
        const parts: string[] = []
        const assignedEmployee = getEmployeeAssignedToCell(game, cellIndex)
        if (assignedEmployee?.type === 'polymerEngineer') {
          const specialistName = WORKERS.find((w) => w.key === 'polymerEngineer')?.name.en ?? 'Polymer Engineer'
          parts.push(`assigned ${specialistName}`)
        }
        if (levelMultiplier > 1) {
          parts.push('this plant\'s level upgrades')
        }
        bonus = `(+${bonusAmount} from ${parts.join(' + ')})`
      }
      const line: BuildingEffectLine = {
        label: 'Output from this plant',
        value: `${boosted} plasticPellets / ${seconds}s`,
        bonus,
      }
      const inputLine: BuildingEffectLine = {
        label: 'Petrochemicals consumed per plant',
        value: `-${POLYMER_PLANT_BALANCE.petrochemicalsPerCycle} / ${seconds}s`,
      }
      if (game.productInventory.petrochemicals < plantCount * POLYMER_PLANT_BALANCE.petrochemicalsPerCycle) {
        inputLine.warning =
          'Not enough petrochemicals in stock for this plant to run its next cycle. Petrochemicals are still sellable directly -- keep some in reserve, or build more Petrochemical Plants.'
      }
      const lines = [line, inputLine]

      // Electricity supply vs demand (Production Complexity Expansion
      // Phase 2/3, completed). Only relevant once >= 1 Power Plant is
      // built -- before that, Polymer Plant doesn't need electricity at
      // all (matches the 3 PLANT_PRODUCTION plants' pattern).
      if (derived.buildingCounts.powerPlant > 0) {
        const electricitySupplyPerCycle = derived.buildingCounts.powerPlant * POWER_PLANT_BALANCE.electricityPerCycle
        const electricityLine: BuildingEffectLine = {
          label: 'Electricity demand (this plant)',
          value: `${POLYMER_PLANT_BALANCE.electricityPerCycle} / ${seconds}s`,
        }
        if (derived.electricityDemandPerCycle > electricitySupplyPerCycle) {
          const pct = Math.round((electricitySupplyPerCycle / derived.electricityDemandPerCycle) * 100)
          electricityLine.warning = `Electricity supply (${electricitySupplyPerCycle}/${seconds}s) covers only ${pct}% of total demand (${derived.electricityDemandPerCycle}/${seconds}s) -- this plant may not run every cycle. Build more Power Plants for full output.`
        }
        lines.push(electricityLine)
      }

      return lines
    }
    case 'lubricantTank':
    case 'jetFuelTank':
    case 'petrochemicalTank':
    case 'recyclingBunker':
    case 'pelletSilo': {
      const config = TANK_FARM_BALANCE[cell]
      const productLabel: Record<typeof cell, string> = {
        lubricantTank: 'lubricants',
        jetFuelTank: 'jet fuel',
        petrochemicalTank: 'petrochemicals',
        recyclingBunker: 'recycled material',
        pelletSilo: 'plastic pellets',
      }
      return [
        {
          label: `${productLabel[cell]} storage from this tank`,
          value: `+${config.storagePerTank}`,
        },
      ]
    }
    case 'laboratory': {
      const rate = BUILDING_UPGRADE_BALANCE.laboratoryRpBonusRateByLevel[1] ?? 0.1
      const count = derived.buildingCounts.laboratory
      return [
        {
          label: 'Research points from contracts',
          value: `+${Math.round(rate * 100)}%`,
          bonus: count > 1 ? `(x${count} labs = +${Math.round(rate * 100 * count)}% total)` : undefined,
        },
      ]
    }
    case 'maintenanceWorkshop': {
      const rate = BUILDING_UPGRADE_BALANCE.maintenanceWorkshopPenaltyRateByLevel[1] ?? 0.5
      const count = derived.buildingCounts.maintenanceWorkshop
      const totalReduction = 1 - Math.pow(rate, count)
      return [
        {
          label: 'Negative event penalty reduction',
          value: `-${Math.round((1 - rate) * 100)}%`,
          bonus:
            count > 1 ? `(x${count} workshops = -${Math.round(totalReduction * 100)}% total)` : undefined,
        },
      ]
    }
    case 'salesOffice': {
      const rate = BUILDING_UPGRADE_BALANCE.salesOfficeContractBonusRateByLevel[1] ?? 0.1
      const count = derived.buildingCounts.salesOffice
      return [
        {
          label: 'Contract rewards',
          value: `+${Math.round(rate * 100)}%`,
          bonus: count > 1 ? `(x${count} offices = +${Math.round(rate * 100 * count)}% total)` : undefined,
        },
      ]
    }
    default:
      return []
  }
}

// --- ESG / Safety axis ---

// Per-tick ESG drift: "dirty" buildings (core refining/processing) pull the
// score down; safetyOfficer staff (scaled by their own effectiveness, incl.
// level/veteran) pull it up. Net can be positive or negative depending on
// how a player has built. Caller clamps to [minScore, maxScore].
// Per-Plant Staff Assignment (design doc Part A): per-cell level-upgrade
// multiplier, replacing the old "summed across all instances" version.
// Direct lookup against that ONE cell's own gridLevels entry -- a Lv2
// plant gets ×1.25 regardless of what level any other plant of the same
// type is at. (The old getPlantOutputUpgradeMultiplier summed
// ...OutputBonusRateByLevel[level] across every cell of a buildingKey,
// which was correct for the old aggregate tick-loop model but not for
// per-cell computation -- see design doc for why.)
function getCellLevelMultiplier(level: number, buildingKey: BuildingType): number {
  const byLevel = (() => {
    switch (buildingKey) {
      case 'lubricantPlant':
        return BUILDING_UPGRADE_BALANCE.lubricantPlantOutputBonusRateByLevel
      case 'jetFuelPlant':
        return BUILDING_UPGRADE_BALANCE.jetFuelPlantOutputBonusRateByLevel
      case 'petrochemicalPlant':
        return BUILDING_UPGRADE_BALANCE.petrochemicalPlantOutputBonusRateByLevel
      case 'polymerPlant':
        return BUILDING_UPGRADE_BALANCE.polymerPlantOutputBonusRateByLevel
      default:
        return undefined
    }
  })()
  if (!byLevel) return 1
  return 1 + (byLevel[level] ?? 0)
}

// Total output-per-cycle for ALL cells of one plant buildingKey, summing
// each cell's own (base output * that cell's level multiplier * that
// cell's assigned-specialist multiplier). This is the per-cell
// replacement for the old aggregate `plantCount * outputPerCycle *
// specialistMultiplier * outputUpgradeMultiplier` formula -- a Lv3 plant
// with a high-level specialist assigned now contributes much more than a
// Lv1 plant with no one assigned, rather than every plant of that type
// getting the same blended bonus. Returns 0 if the buildingKey isn't
// found on the grid at all (defensive; callers should already know
// plantCount > 0 before calling this).
export function getTotalCellOutput(
  game: GameState,
  buildingKey: 'lubricantPlant' | 'jetFuelPlant' | 'petrochemicalPlant' | 'polymerPlant',
  baseOutputPerCycle: number,
  specialistWorker: WorkerType | undefined,
  specialistBonusRate: number | undefined,
): number {
  let total = 0
  for (let cellIndex = 0; cellIndex < game.grid.length; cellIndex++) {
    if (game.grid[cellIndex] !== buildingKey) continue
    const level = game.gridLevels[cellIndex] ?? 1
    const levelMultiplier = getCellLevelMultiplier(level, buildingKey)
    const specialistMultiplier = getSpecialistMultiplierForCell(
      game,
      cellIndex,
      specialistWorker,
      specialistBonusRate,
    )
    total += baseOutputPerCycle * levelMultiplier * specialistMultiplier
  }
  return total
}


// Tank Farm (Per-Product Storage, design doc Part B): maps a
// PLANT_PRODUCTION productKey to its current maxStorage (base +
// tankCount * storagePerTank, see calculateDerivedStats). Used by the
// downstream-plants loop instead of the static PlantProductionConfig.maxStorage.
export function getProductMaxStorage(
  derived: DerivedStats,
  productKey: 'lubricants' | 'jetFuel' | 'petrochemicals',
): number {
  switch (productKey) {
    case 'lubricants':
      return derived.maxLubricantsStorage
    case 'jetFuel':
      return derived.maxJetFuelStorage
    case 'petrochemicals':
      return derived.maxPetrochemicalsStorage
  }
}

// Which inventory the contract's reward is tied to, and how much of it the
// player currently has vs needs. Each Contract has exactly one of the
// X Required fields set (gasolineRequired is always present as a fallback
// of 0 for non-gasoline contracts -- see CONTRACT_BALANCE). Shared between
// the Business tab's contract list and the Refinery tab's "Current
// Contract" dashboard card so both compute this identically.
export function getContractProgress(
  contract: ActiveContract,
  game: GameState,
): { have: number; need: number; unit: string } {
  if ((contract.petrochemicalsRequired ?? 0) > 0) {
    return { have: game.productInventory.petrochemicals, need: contract.petrochemicalsRequired ?? 0, unit: 'petrochem' }
  }
  if ((contract.lubricantsRequired ?? 0) > 0) {
    return { have: game.productInventory.lubricants, need: contract.lubricantsRequired ?? 0, unit: 'lubricants' }
  }
  if ((contract.jetFuelRequired ?? 0) > 0) {
    return { have: game.productInventory.jetFuel, need: contract.jetFuelRequired ?? 0, unit: 'jet fuel' }
  }
  if ((contract.asphaltRequired ?? 0) > 0) {
    return { have: game.productInventory.asphalt, need: contract.asphaltRequired ?? 0, unit: 'asphalt' }
  }
  if ((contract.recycledMaterialRequired ?? 0) > 0) {
    return { have: game.productInventory.recycledMaterial, need: contract.recycledMaterialRequired ?? 0, unit: 'recycled' }
  }
  if ((contract.plasticPelletsRequired ?? 0) > 0) {
    return { have: game.productInventory.plasticPellets, need: contract.plasticPelletsRequired ?? 0, unit: 'pellets' }
  }
  return { have: game.gasoline, need: contract.gasolineRequired, unit: 'gasoline' }
}

export function getEsgDrift(game: GameState, buildingCounts: BuildingCounts): number {
  const dirtyCount = ESG_DIRTY_BUILDINGS.reduce((sum, key) => sum + buildingCounts[key], 0)
  const safetyEffectiveSum = getEffectiveWorkerSum(game.employees, 'safetyOfficer')
  return (
    safetyEffectiveSum * ESG_BALANCE.regenPerSafetyOfficerPerTick -
    dirtyCount * ESG_BALANCE.decayPerDirtyBuildingPerTick
  )
}

// --- Production Complexity Expansion Phase 1: waste byproduct ---

// Waste generated this tick, scaled by how many "dirty" buildings are
// running (reuses ESG_DIRTY_BUILDINGS). Caller clamps to remaining storage.
export function getWasteGeneratedPerTick(buildingCounts: BuildingCounts): number {
  const dirtyCount = ESG_DIRTY_BUILDINGS.reduce((sum, key) => sum + buildingCounts[key], 0)
  return dirtyCount * WASTE_BALANCE.wastePerDirtyBuildingPerTick
}

// Extra ESG drift (on top of getEsgDrift) applied while waste is at/over
// its storage cap.
export function getWasteOverflowEsgPenalty(waste: number, maxWasteStorage: number): number {
  return waste >= maxWasteStorage ? -WASTE_BALANCE.overCapEsgPenaltyPerTick : 0
}

// Chance that the next random-event roll picks an "incident" (isIncident)
// event instead of a normal one. ~25% at the neutral score of 50 (roughly
// matching the old uniform-random share of incident events), falling to a
// 5% floor at 100 and rising to a 45% ceiling at 0.
export function getIncidentChance(esgScore: number): number {
  const raw = ESG_BALANCE.baseIncidentChance * (2 - esgScore / 50)
  return Math.max(ESG_BALANCE.minIncidentChance, Math.min(ESG_BALANCE.maxIncidentChance, raw))
}

// Display tier for the ESG score (UI label).
export function getEsgTier(esgScore: number): BilingualTextValue {
  if (esgScore >= 85) return text.resources.esgExcellent
  if (esgScore >= 60) return text.resources.esgGood
  if (esgScore >= 35) return text.resources.esgFair
  return text.resources.esgPoor
}

// --- Energy Transition era: demand shift (Strategic Differentiation #2) ---

// Per-tick demand drift for the current era. Only the energyTransition era
// (currentEra.demandShift) drifts; earlier eras return zero deltas. Caller
// applies + clamps: gasoline toward gasolineDemandFloor (only decreases),
// petrochemicals toward petrochemicalsDemandCeiling (only increases).
export function getDemandShiftDelta(currentEra: EraConfig): {
  gasolineDelta: number
  petrochemicalsDelta: number
} {
  if (!currentEra.demandShift) {
    return { gasolineDelta: 0, petrochemicalsDelta: 0 }
  }
  return {
    gasolineDelta: -DEMAND_SHIFT_BALANCE.shiftPerTick,
    petrochemicalsDelta: DEMAND_SHIFT_BALANCE.shiftPerTick,
  }
}

// --- Seasonal demand volatility (Strategic Differentiation #4) ---

// Gasoline demand cycles smoothly through one full sine wave per business
// year. Purely derived from the current position in the year -- no new
// state, monotonic GameState.yearStartTick already exists. Returns a
// multiplier in [1-amplitude, 1+amplitude].
export function getSeasonalGasolineMultiplier(tickCount: number, yearStartTick: number): number {
  const yearLength = AWARDS_BALANCE.yearLengthTicks
  const ticksIntoYear = ((tickCount - yearStartTick) % yearLength + yearLength) % yearLength
  const phase = ticksIntoYear / yearLength
  return 1 + SEASONAL_BALANCE.amplitude * Math.sin(2 * Math.PI * phase)
}

// Flavor label for the current point in the seasonal cycle, based on which
// quarter of the sine wave the year is in:
// [0, 0.25) demand rising toward peak, [0.25, 0.5) past peak and cooling,
// [0.5, 0.75) demand falling toward the trough, [0.75, 1) recovering.
export function getSeasonLabel(tickCount: number, yearStartTick: number): BilingualTextValue {
  const yearLength = AWARDS_BALANCE.yearLengthTicks
  const ticksIntoYear = ((tickCount - yearStartTick) % yearLength + yearLength) % yearLength
  const phase = ticksIntoYear / yearLength
  if (phase < 0.25) return text.stats.seasonRising
  if (phase < 0.5) return text.stats.seasonPeak
  if (phase < 0.75) return text.stats.seasonFalling
  return text.stats.seasonOff
}

// --- In-game calendar clock (day/night + day-of-week/day-of-month) ---
// Deliberately independent of the year/season system above -- see
// CALENDAR_BALANCE's comment for why. Everything here is derived purely
// from tickCount (no new GameState field needed), same pattern as season.
// GameClock type lives in types.ts (avoids a circular import since
// DerivedStats also references it).
export function getGameClock(tickCount: number): GameClock {
  const { dayLengthTicks, dayStartHour, nightStartHour, daysPerWeek, daysPerMonth } = CALENDAR_BALANCE
  const ticksIntoDay = tickCount % dayLengthTicks
  const hourOfDay = Math.floor((ticksIntoDay / dayLengthTicks) * 24)
  const absoluteDay = Math.floor(tickCount / dayLengthTicks)
  return {
    hourOfDay,
    dayOfWeek: absoluteDay % daysPerWeek,
    dayOfMonth: absoluteDay % daysPerMonth,
    isDaytime: hourOfDay >= dayStartHour && hourOfDay < nightStartHour,
  }
}

// 24-hour "HH:00" label for the resource bar / clock display. Minutes
// aren't tracked (hourOfDay is the finest granularity exposed), so this is
// always on the hour.
export function formatGameClockTime(clock: GameClock): string {
  return `${clock.hourOfDay.toString().padStart(2, '0')}:00`
}

// Base sell price per secondary product (gasoline has its own combo-aware price).
const PRODUCT_BASE_PRICE: Record<string, number> = {
  lubricants: ECONOMY_BALANCE.lubricantPrice,
  jetFuel: ECONOMY_BALANCE.jetFuelPrice,
  petrochemicals: ECONOMY_BALANCE.petrochemicalsPrice,
  recycledMaterial: ECONOMY_BALANCE.recycledMaterialPrice,
  plasticPellets: ECONOMY_BALANCE.plasticPelletsPrice,
}

// Sell price for a secondary product = base × global product sell multiplier
// × demandMultiplier (1.0 unless the Energy Transition era has shifted
// demand for this product — see DEMAND_SHIFT_BALANCE).
// Used by both the sell handlers and the ProductPanel so they never drift.
export function getProductSellPrice(
  productKey: string,
  productSellMultiplier: number,
  demandMultiplier = 1,
): number {
  const base = PRODUCT_BASE_PRICE[productKey] ?? 0
  return Math.round(base * productSellMultiplier * demandMultiplier)
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

// Scans every 3-consecutive-cell run (horizontal and vertical) on the grid
// for a building-type SET (order-independent, all 3 cells filled, all 3
// types distinct) matching a HIDDEN_COMBOS entry. Returns the keys of any
// matching combos not already in `discovered` — called each tick; the
// caller applies rewards/logs/toasts and adds the keys to discoveredCombos.
export function getNewlyDiscoveredCombos(
  grid: GridCell[],
  discovered: string[],
): HiddenComboConfig[] {
  const cols = Math.round(Math.sqrt(grid.length))
  const found = new Set<string>()

  function checkTriple(a: GridCell, b: GridCell, c: GridCell) {
    if (!a || !b || !c) return
    const cellSet = new Set([a, b, c])
    if (cellSet.size !== 3) return // all three must be distinct types
    for (const combo of HIDDEN_COMBOS) {
      if (discovered.includes(combo.key) || found.has(combo.key)) continue
      if (combo.buildings.length !== 3) continue
      const comboSet = new Set(combo.buildings)
      if (comboSet.size !== cellSet.size) continue
      let matches = true
      for (const type of cellSet) {
        if (!comboSet.has(type)) {
          matches = false
          break
        }
      }
      if (matches) found.add(combo.key)
    }
  }

  // Horizontal runs of 3
  for (let row = 0; row < cols; row++) {
    for (let col = 0; col <= cols - 3; col++) {
      const base = row * cols + col
      checkTriple(grid[base], grid[base + 1], grid[base + 2])
    }
  }
  // Vertical runs of 3
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row <= cols - 3; row++) {
      const base = row * cols + col
      checkTriple(grid[base], grid[base + cols], grid[base + cols * 2])
    }
  }

  return HIDDEN_COMBOS.filter((combo) => found.has(combo.key))
}

// --- Hidden Event system ---
// See HiddenEventConfig in types.ts for the full design rationale. These
// functions are pure (grid/clock/state in, boolean/list out) so they're
// easy to unit-test in isolation, same as the combo functions above.

function getIsTimeConditionMet(condition: HiddenEventTimeCondition, clock: GameClock): boolean {
  switch (condition.type) {
    case 'hourRange': {
      const { startHour, endHour } = condition
      if (startHour === endHour) return true // 24h window, always true
      if (startHour < endHour) {
        return clock.hourOfDay >= startHour && clock.hourOfDay < endHour
      }
      // Wraps past midnight, e.g. 22-2 means 22:00-23:59 or 0:00-1:59.
      return clock.hourOfDay >= startHour || clock.hourOfDay < endHour
    }
    case 'dayOfWeek':
      return clock.dayOfWeek === condition.day
    case 'dayOfMonth':
      return clock.dayOfMonth === condition.day
  }
}

function getIsGameConditionMet(condition: HiddenEventGameCondition, game: GameState, derived: DerivedStats): boolean {
  switch (condition.type) {
    case 'minRefineryLevel':
      return game.refineryLevel >= condition.level
    case 'minMoney':
      return game.money >= condition.amount
    case 'minBuildingCount':
      return derived.buildingCounts[condition.building] >= condition.count
  }
}

function getIsHiddenEventConditionMet(config: HiddenEventConfig, game: GameState, derived: DerivedStats): boolean {
  if (!config.timeConditions.every((c) => getIsTimeConditionMet(c, derived.gameClock))) return false
  if (config.gameConditions && !config.gameConditions.every((c) => getIsGameConditionMet(c, game, derived))) {
    return false
  }
  return true
}

// Checked every tick (cheap -- HIDDEN_EVENTS is a short, hand-curated
// list). Returns configs whose condition just became true and that
// aren't already in `discovered` -- once a key is in `discovered` its
// condition is never re-evaluated, so a one-time event can't re-trigger
// later when its time/game condition becomes true again (e.g. next
// Friday). The caller (useGameLoop.ts) marks these 'unlocked' (not yet
// claimed) and they stay that way indefinitely until the player taps to
// claim -- see design discussion: no deadline, no expiry.
export function getNewlyUnlockedHiddenEvents(
  game: GameState,
  derived: DerivedStats,
  discovered: string[],
): HiddenEventConfig[] {
  return HIDDEN_EVENTS.filter(
    (config) => !discovered.includes(config.key) && getIsHiddenEventConditionMet(config, game, derived),
  )
}

export function countBuildings(grid: GridCell[]) {
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
  // Effective worker contribution = sum of each employee's level multiplier.
  // At uniform level this equals the old count*multiplier(sharedLevel); now
  // it rises smoothly as individuals level up one at a time.
  const effectiveWorkers = (type: WorkerType) => getEffectiveWorkerSum(game.employees, type)
  const operatorCount = effectiveWorkers('operator')
  const mechanicCount = effectiveWorkers('mechanic')
  const salesAgentCount = effectiveWorkers('salesAgent')
  const chemistCount = effectiveWorkers('chemist')
  const safetyOfficerCount = effectiveWorkers('safetyOfficer')
  const fuelSpecialistCount = effectiveWorkers('fuelSpecialist')

  // --- System 2: Refinery Perk Tree bonuses ---
  const unlockedPerks = game.unlockedPerks ?? []
  let perkProductionBonusRate = 0
  let perkStorageBonusRate = 0
  let perkSellPriceBonusRate = 0
  for (const perkKey of unlockedPerks) {
    const effect = PERK_EFFECTS[perkKey as PerkKey] as
      | { production?: number; storage?: number; sellPrice?: number }
      | undefined
    if (!effect) continue
    perkProductionBonusRate += effect.production ?? 0
    perkStorageBonusRate += effect.storage ?? 0
    perkSellPriceBonusRate += effect.sellPrice ?? 0
  }

  // --- System 3: Tech Era bonuses ---
  const currentEra = getCurrentEra(game.unlockedResearchCount, game.refineryLevel)
  const nextEra = getNextEra(currentEra.index)
  const eraSellPriceBonusRate = currentEra.sellPriceBonusRate
  const eraResearchRateBonusRate = currentEra.researchRateBonusRate

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

  // --- Process chain: feedstock storage + distillation output ---
  // Feedstock cap scales with how much distillation capacity you've built.
  const distillationUnitCount = buildingCounts.distillationUnit
  const maxFeedstockStorage =
    FEEDSTOCK_BALANCE.baseFeedstockStorage +
    distillationUnitCount * FEEDSTOCK_BALANCE.feedstockStoragePerDistillationUnit
  // Waste storage (Production Complexity Expansion Phase 1): flat cap for
  // now. The Waste Treatment Plant is the way to manage waste, not a
  // storage increase.
  const maxWasteStorage = WASTE_BALANCE.baseWasteStorage

  // --- Tank Farm (Per-Product Storage, design doc Part B) ---
  // Each secondary product's storage cap = its base constant (the
  // PLANT_PRODUCTION / standalone-block maxStorage value, previously
  // fixed) + tankCount * storagePerTank for that product's tank building.
  // Flat bonus, no upgrade levels.
  const lubricantPlantConfig = PLANT_PRODUCTION.find((p) => p.buildingKey === 'lubricantPlant')
  const jetFuelPlantConfig = PLANT_PRODUCTION.find((p) => p.buildingKey === 'jetFuelPlant')
  const petrochemicalPlantConfig = PLANT_PRODUCTION.find((p) => p.buildingKey === 'petrochemicalPlant')
  const maxLubricantsStorage =
    (lubricantPlantConfig?.maxStorage ?? 0) +
    buildingCounts.lubricantTank * TANK_FARM_BALANCE.lubricantTank.storagePerTank
  const maxJetFuelStorage =
    (jetFuelPlantConfig?.maxStorage ?? 0) +
    buildingCounts.jetFuelTank * TANK_FARM_BALANCE.jetFuelTank.storagePerTank
  const maxPetrochemicalsStorage =
    (petrochemicalPlantConfig?.maxStorage ?? 0) +
    buildingCounts.petrochemicalTank * TANK_FARM_BALANCE.petrochemicalTank.storagePerTank
  const maxRecycledMaterialStorage =
    WASTE_TREATMENT_PLANT_BALANCE.maxRecycledMaterialStorage +
    buildingCounts.recyclingBunker * TANK_FARM_BALANCE.recyclingBunker.storagePerTank
  const maxPlasticPelletsStorage =
    POLYMER_PLANT_BALANCE.maxPlasticPelletsStorage +
    buildingCounts.pelletSilo * TANK_FARM_BALANCE.pelletSilo.storagePerTank

  // --- Production Complexity Expansion Phase 2: electricity ---
  // Flat storage cap per Power Plant built. Demand is the sum of every
  // downstream plant's electricityPerCycle * count, regardless of whether
  // any Power Plant exists -- the tick loop only enforces this demand when
  // buildingCounts.powerPlant > 0 (see useGameLoop.ts), so this number is
  // harmless to compute unconditionally and is useful for the UI even
  // before the player builds their first Power Plant.
  const maxElectricityStorage = buildingCounts.powerPlant * POWER_PLANT_BALANCE.maxElectricityStorage
  // Electricity demand per 25-tick (5s) cycle, for the UI's supply-vs-demand
  // display. Includes the 3 PLANT_PRODUCTION plants AND Polymer Plant (same
  // 25-tick cadence, standalone block -- see useGameLoop.ts). Does NOT
  // include Tier-1 gasoline production, which runs on its own much shorter
  // productionInterval cadence and isn't directly comparable to a
  // per-25-tick number -- its electricity gating is enforced in the tick
  // loop (PRODUCTION_BALANCE.electricityPerGasolineBatch) but not reflected
  // in this aggregate display.
  const electricityDemandPerCycle =
    PLANT_PRODUCTION.reduce((sum, plant) => sum + buildingCounts[plant.buildingKey] * plant.electricityPerCycle, 0) +
    buildingCounts.polymerPlant * POLYMER_PLANT_BALANCE.electricityPerCycle
  // Feedstock produced per distillation cycle across all units, boosted by
  // crude→distillation adjacency (reuses the combo system) AND by Distillation
  // Unit level upgrades. distillationUpgradeProductionMultiplier already boosts
  // gasoline production speed for the same upgrades — applying it here too means
  // upgrading a Distillation Unit (the "heart of the chain") helps the feedstock
  // chain just as much as it helps gasoline, instead of doing nothing for it.
  const feedstockPerDistillationCycle =
    (distillationUnitCount * FEEDSTOCK_BALANCE.feedstockPerDistillationCycle +
      comboStats.crudeToDistillation * FEEDSTOCK_BALANCE.feedstockPerAdjacency) *
    distillationUpgradeProductionMultiplier

  const baseCrudeStorage = STORAGE_BALANCE.baseCrudeStorage + crudeTankStorageTotal
  const baseGasolineStorage = STORAGE_BALANCE.baseGasolineStorage + productTankStorageTotal
  const storageMultiplier =
    1 + comboStats.crudeToProduct * BONUS_BALANCE.adjacencyBonusRate
  const researchStorageBonus =
    (hasBiggerTanks ? STORAGE_BALANCE.biggerTanksStorageBonus : 0) +
    (hasIndustrialStorage ? STORAGE_BALANCE.industrialStorageBonus : 0) +
    (hasStorageOptimization ? STORAGE_BALANCE.storageOptimizationBonus : 0)
  const workerStorageBonus = Math.round(
    mechanicCount * STORAGE_BALANCE.mechanicStorageBonus,
  )
  // Perk capacity branch adds a multiplicative storage bonus on top of base+combo.
  const perkStorageMultiplier = 1 + perkStorageBonusRate
  const maxCrudeStorage =
    Math.round(baseCrudeStorage * storageMultiplier * perkStorageMultiplier) +
    researchStorageBonus +
    workerStorageBonus
  const maxGasolineStorage =
    Math.round(baseGasolineStorage * storageMultiplier * perkStorageMultiplier) +
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
  // Efficiency perks no longer divide productionInterval (see
  // PERK_EFFECTS comment) -- they boost gasoline yield-per-batch instead,
  // applied in the App.tsx tick loop via perkProductionBonusRate.
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
  // ESG/Safety axis: high score unlocks a "premium/ESG-conscious buyer"
  // contract bonus (BACKLOG strategic differentiation #1).
  const esgContractRewardMultiplier =
    game.esgScore >= ESG_BALANCE.premiumThreshold
      ? 1 + ESG_BALANCE.premiumContractRewardBonusRate
      : 1
  const contractRewardMultiplier =
    reputationContractRewardMultiplier *
    researchContractRewardMultiplier *
    specialBuildingContractRewardMultiplier *
    esgContractRewardMultiplier
  const specialBuildingRpRewardMultiplier =
    1 + laboratoryRpBonusTotal
  const chemistRpMultiplier = 1 + chemistCount * BONUS_BALANCE.chemistRpBonusRate
  const researchContractRpMultiplier = hasContractAnalytics
    ? 1 + BONUS_BALANCE.contractAnalyticsRpBonusRate
    : 1
  const contractRpRewardMultiplier =
    specialBuildingRpRewardMultiplier *
    chemistRpMultiplier *
    researchContractRpMultiplier *
    (1 + eraResearchRateBonusRate)
  const eventPenaltyMultiplier =
    workshopPenaltyMultiplier *
    Math.pow(BONUS_BALANCE.safetyOfficerPenaltyRate, safetyOfficerCount) *
    (hasSaferOperations ? BONUS_BALANCE.saferOperationsPenaltyRate : 1)
  const researchSellPriceBonus = hasPremiumFuel
    ? BONUS_BALANCE.premiumFuelSellPriceBonus
    : 0
  // Global product sell multiplier — Sales Agents (now %), quality perks, and the
  // current tech era. Applies to EVERY product, not just gasoline, so the player's
  // sell-side investments lift their whole catalogue consistently.
  const productSellMultiplier =
    1 +
    salesAgentCount * BONUS_BALANCE.salesAgentSellPriceBonusRate +
    perkSellPriceBonusRate +
    eraSellPriceBonusRate
  const fuelSpecialistSellPriceMultiplier =
    1 + fuelSpecialistCount * BONUS_BALANCE.fuelSpecialistSellPriceBonusRate
  // Gasoline-specific: base × combo/research × fuelSpecialist × global multiplier
  // × demand multiplier (Energy Transition shift), plus the flat premium-fuel
  // research bonus.
  // Strategic Differentiation #4: gasoline demand cycles through a "season"
  // each business year (sine wave, derived from tickCount/yearStartTick) --
  // a short-term planning layer on top of the long-term Energy Transition
  // shift above.
  const seasonalGasolineMultiplier = getSeasonalGasolineMultiplier(
    game.tickCount,
    game.yearStartTick,
  )
  const sellPrice =
    Math.round(
      ECONOMY_BALANCE.gasolinePrice *
        sellPriceMultiplier *
        fuelSpecialistSellPriceMultiplier *
        productSellMultiplier *
        game.gasolineDemandMultiplier *
        seasonalGasolineMultiplier,
    ) +
    researchSellPriceBonus
  const upgradeCost = getUpgradeCost(game.refineryLevel)
  const availableSpace = game.grid.filter((cell) => cell === null).length
  // Hidden Event 'contract' rewards are appended to game.hiddenContracts
  // when claimed (see claimHiddenEvent in useGameLoop.ts) -- merged in
  // here so they show up and behave exactly like normal contracts
  // (completable, same reward-multiplier scaling) without duplicating
  // this mapping logic.
  const activeContracts = [...CONTRACTS, ...game.hiddenContracts].map((contract) => ({
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
    progress: getMilestoneProgress(game, milestone.key),
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
    esgContractRewardMultiplier,
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
    productSellMultiplier,
    workerStorageBonus,
    perkProductionBonusRate,
    perkStorageBonusRate,
    perkSellPriceBonusRate,
    currentEra,
    nextEra,
    eraSellPriceBonusRate,
    eraResearchRateBonusRate,
    maxFeedstockStorage,
    maxWasteStorage,
    maxLubricantsStorage,
    maxJetFuelStorage,
    maxPetrochemicalsStorage,
    maxRecycledMaterialStorage,
    maxPlasticPelletsStorage,
    maxElectricityStorage,
    electricityDemandPerCycle,
    feedstockPerDistillationCycle,
    productionMultiplier,
    productionRate,
    progressPercent,
    sellPrice,
    seasonalGasolineMultiplier,
    gameClock: getGameClock(game.tickCount),
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

// Numeric progress toward a milestone's requirement, for the "next goal"
// widget and Achievements screen progress bars. Returns null for
// milestones whose condition isn't a single count threshold (e.g. "build a
// Jet Fuel Plant", "complete a Tier 3 contract").
export function getMilestoneProgress(game: GameState, key: MilestoneKey): MilestoneProgress | null {
  switch (key) {
    case 'firstFuel':
      return { current: Math.min(game.totalGasolineProduced, 50), target: 50 }
    case 'smallSupplier':
      return { current: Math.min(game.completedContractCount, 2), target: 2 }
    case 'growingRefinery':
      return { current: Math.min(game.totalWorkersHired, 3), target: 3 }
    case 'researchBeginner':
      return { current: Math.min(game.unlockedResearchIds.length, 1), target: 1 }
    case 'reputedSupplier':
      return { current: Math.min(game.reputation, 50), target: 50 }
    case 'industrialProducer':
      return { current: Math.min(game.totalGasolineProduced, 500), target: 500 }
    case 'refineryLevel5':
      return { current: Math.min(game.refineryLevel, 5), target: 5 }
    case 'researchAdvanced':
      return { current: Math.min(game.unlockedResearchIds.length, 3), target: 3 }
    case 'contractVeteran':
      return { current: Math.min(game.completedContractCount, 10), target: 10 }
    case 'fullWorkforce': {
      const hiredTypes = Object.values(game.workerCounts).filter((count) => count > 0).length
      const totalTypes = Object.keys(game.workerCounts).length
      return { current: hiredTypes, target: totalTypes }
    }
    // upgradeBuilder, tierThreeContractor, jetFuelPioneer, aviationPartner,
    // petrochemicalPioneer, productMogul: not single-count thresholds.
    default:
      return null
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

// --- System 1: Staff XP accrual & training ---
// Called once per production tick. "Concentrated training": each type's
// total XP budget (count * xpPerWorkerPerTick — UNCHANGED rate, no balance
// shift in aggregate speed) goes to that type's lowest-level employee, who
// levels up alone when they cross the threshold. Returns the updated
// employees array plus an optional level-up log message.
export function applyStaffXp(game: GameState): {
  employees: Employee[]
  levelUpLog: string | null
} {
  let employees = game.employees
  let levelUpLog: string | null = null

  for (const worker of WORKERS) {
    const type = worker.key
    const count = game.workerCounts[type] ?? 0
    if (count <= 0) continue

    const target = getTrainingTarget(employees, type)
    if (!target) continue // all employees of this type are at maxLevel

    const xpGain = count * STAFF_LEVEL_BALANCE.xpPerWorkerPerTick
    const threshold = STAFF_LEVEL_BALANCE.xpToNextLevel[target.level] ?? Infinity
    const newXp = target.xp + xpGain

    let updated: Employee
    if (newXp >= threshold) {
      updated = { ...target, level: target.level + 1, xp: newXp - threshold }
      // Only surface the most recent level-up in the log to avoid spam.
      levelUpLog = serializeBilingualText(
        text.logs.staffLevelUp(target.name, worker.name, updated.level),
      )
    } else {
      updated = { ...target, xp: newXp }
    }

    employees = employees.map((employee) => (employee.id === target.id ? updated : employee))
  }

  return { employees, levelUpLog }
}

// Cost to instantly train an employee to their next level.
export function getTrainingCost(currentLevel: number): { money: number; rp: number } {
  return {
    money:
      STAFF_LEVEL_BALANCE.trainBaseCost +
      currentLevel * STAFF_LEVEL_BALANCE.trainCostPerLevel,
    rp: STAFF_LEVEL_BALANCE.trainRpCost,
  }
}

// --- System 4: Annual Awards ---

// Total wages owed for one business year, summed per employee (their own
// level drives their own wage factor).
export function getYearlyPayroll(game: GameState): number {
  let total = 0
  for (const employee of game.employees) {
    const wage = WAGE_BALANCE.perWorker[employee.type] ?? 0
    const levelFactor = 1 + (employee.level - 1) * WAGE_BALANCE.levelWageRate
    total += wage * levelFactor
  }
  return Math.round(total)
}

// Award score uses NET profit (revenue − payroll) for the money component, so
// over-hiring directly lowers the grade. gasoline & contracts are unaffected.
export function getAwardScore(stats: YearStats, payroll = 0): number {
  const netMoney = Math.max(0, stats.moneyEarned - payroll)
  return Math.round(
    stats.gasolineProduced * AWARDS_BALANCE.weights.perGasoline +
      (netMoney / 1000) * AWARDS_BALANCE.weights.perThousandMoney +
      stats.contractsCompleted * AWARDS_BALANCE.weights.perContract,
  )
}

export function getAwardGrade(score: number): AwardGrade {
  if (score >= AWARDS_BALANCE.gradeThresholds.S) return 'S'
  if (score >= AWARDS_BALANCE.gradeThresholds.A) return 'A'
  if (score >= AWARDS_BALANCE.gradeThresholds.B) return 'B'
  return 'C'
}

// Generates this year's results for the 3 rival refineries (Annual Ranking).
// Each rival's baseline grows with its own personality (see rivals.ts), then
// a random swing is applied. Computed once at year-close and stored on the
// AwardRecord so the ranking shown in the ceremony doesn't change on reload.
export function getRivalResults(year: number): RivalResult[] {
  return RIVAL_REFINERIES.map((rival) => {
    const baseline = getRivalBaselineScore(rival, year)
    const swing = 1 + (Math.random() * 2 - 1) * rival.varianceFactor
    const score = Math.max(0, Math.round(baseline * swing))
    return {
      key: rival.key,
      name: rival.name,
      score,
      grade: getAwardGrade(score),
    }
  })
}

// Player's 1-indexed rank among the player + rivals (1 = best). Ties favor
// the player (a rival needs to strictly beat the player's score).
export function getPlayerRank(playerScore: number, rivals: RivalResult[]): number {
  return 1 + rivals.filter((rival) => rival.score > playerScore).length
}

// Evaluates the just-finished business year, grants rewards, records the result,
// and resets the per-year counters for the next year. Returns the updated game
// plus the AwardRecord so the UI can show a ceremony modal.
export function closeBusinessYear(game: GameState): {
  game: GameState
  record: AwardRecord
} {
  const stats = game.yearStats
  const payroll = getYearlyPayroll(game)
  const netProfit = stats.moneyEarned - payroll
  const score = getAwardScore(stats, payroll)
  const grade = getAwardGrade(score)
  const cashReward = AWARDS_BALANCE.cashByGrade[grade]
  const reputationReward = AWARDS_BALANCE.reputationByGrade[grade]

  // Pay wages out of cash. If short, pay what's available and take a small
  // reputation hit (no hard bankruptcy in this prototype).
  const moneyAfterPayroll = game.money - payroll
  const couldNotAfford = moneyAfterPayroll < 0
  const moneyAfterWages = Math.max(0, moneyAfterPayroll)
  const reputationAfter =
    game.reputation +
    reputationReward -
    (couldNotAfford ? WAGE_BALANCE.unpaidReputationPenalty : 0)

  const rivals = getRivalResults(game.businessYear)
  const playerRank = getPlayerRank(score, rivals)

  const record: AwardRecord = {
    year: game.businessYear,
    grade,
    score,
    cashReward,
    payroll,
    netProfit,
    couldNotAfford,
    rivals,
    playerRank,
    gasolineProduced: stats.gasolineProduced,
    moneyEarned: stats.moneyEarned,
    contractsCompleted: stats.contractsCompleted,
  }

  const message = serializeBilingualText(
    text.logs.annualAward(game.businessYear, grade, cashReward),
  )

  return {
    game: {
      ...game,
      money: moneyAfterWages + cashReward,
      reputation: Math.max(0, reputationAfter),
      businessYear: game.businessYear + 1,
      yearStartTick: game.tickCount,
      yearStats: { gasolineProduced: 0, moneyEarned: 0, contractsCompleted: 0 },
      awardHistory: [record, ...game.awardHistory].slice(0, 12),
      activityLog: addLog(game.activityLog, message),
    },
    record,
  }
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

  if (event.key === 'distillationHiccup') {
    const feedstockLoss = Math.floor(
      EVENT_BALANCE.distillationHiccupFeedstockLoss * stats.eventPenaltyMultiplier,
    )
    return {
      ...game,
      feedstock: Math.max(0, game.feedstock - feedstockLoss),
      lastEventMessage: event.message,
      activityLog: addLog(game.activityLog, event.message),
    }
  }

  if (event.key === 'feedstockSurplus') {
    const converted = Math.min(game.feedstock, EVENT_BALANCE.feedstockSurplusConvertAmount)
    return {
      ...game,
      feedstock: game.feedstock - converted,
      money: game.money + converted * EVENT_BALANCE.feedstockSurplusCashPerUnit,
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
        employees: [...game.employees, createNewEmployee(game.employees, 'operator')],
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
      employees: [...game.employees, createNewEmployee(game.employees, 'mechanic')],
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
