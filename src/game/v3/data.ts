import type { BuildingType, ProductKey, WorkerType } from '../types'

export type V3BuildingCapability = {
  buildCostDollars: number
  buildChapter: 0 | 1 | 2 | 3 | 4
  upgradeCostDollars: readonly [number, number] | null
  upgradeChapter: readonly [0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4] | null
}

const tankUpgrade = (buildCost: number): readonly [number, number] => [
  Math.max(750, buildCost * 0.75),
  Math.max(1_500, buildCost * 1.5),
]

export const V3_BUILDINGS: Record<BuildingType, V3BuildingCapability> = {
  crudeTank: { buildCostDollars: 150, buildChapter: 0, upgradeCostDollars: [250, 600], upgradeChapter: [2, 3] },
  gasolineTank: { buildCostDollars: 150, buildChapter: 0, upgradeCostDollars: [250, 600], upgradeChapter: [2, 3] },
  distillationUnit: { buildCostDollars: 1_800, buildChapter: 0, upgradeCostDollars: [2_000, 5_000], upgradeChapter: [2, 3] },
  laboratory: { buildCostDollars: 400, buildChapter: 1, upgradeCostDollars: [1_800, 5_000], upgradeChapter: [2, 4] },
  maintenanceWorkshop: { buildCostDollars: 1_500, buildChapter: 2, upgradeCostDollars: [1_500, 3_000], upgradeChapter: [2, 3] },
  salesOffice: { buildCostDollars: 2_000, buildChapter: 3, upgradeCostDollars: [2_000, 4_000], upgradeChapter: [3, 3] },
  lubricantPlant: { buildCostDollars: 5_000, buildChapter: 2, upgradeCostDollars: [4_000, 9_000], upgradeChapter: [2, 3] },
  jetFuelPlant: { buildCostDollars: 12_000, buildChapter: 3, upgradeCostDollars: [10_000, 20_000], upgradeChapter: [3, 3] },
  petrochemicalPlant: { buildCostDollars: 18_000, buildChapter: 4, upgradeCostDollars: [14_000, 26_000], upgradeChapter: [4, 4] },
  polymerPlant: { buildCostDollars: 24_000, buildChapter: 4, upgradeCostDollars: [18_000, 32_000], upgradeChapter: [4, 4] },
  powerPlant: { buildCostDollars: 4_000, buildChapter: 2, upgradeCostDollars: [6_000, 12_000], upgradeChapter: [2, 3] },
  wasteTreatmentPlant: { buildCostDollars: 2_000, buildChapter: 2, upgradeCostDollars: [2_000, 4_000], upgradeChapter: [2, 3] },
  lubricantTank: { buildCostDollars: 750, buildChapter: 2, upgradeCostDollars: tankUpgrade(750), upgradeChapter: [2, 3] },
  jetFuelTank: { buildCostDollars: 1_500, buildChapter: 3, upgradeCostDollars: tankUpgrade(1_500), upgradeChapter: [3, 3] },
  petrochemicalTank: { buildCostDollars: 2_000, buildChapter: 4, upgradeCostDollars: tankUpgrade(2_000), upgradeChapter: [4, 4] },
  recyclingBunker: { buildCostDollars: 1_000, buildChapter: 4, upgradeCostDollars: tankUpgrade(1_000), upgradeChapter: [4, 4] },
  pelletSilo: { buildCostDollars: 3_000, buildChapter: 4, upgradeCostDollars: tankUpgrade(3_000), upgradeChapter: [4, 4] },
}

export const V3_STORAGE = {
  baseCrude: 10,
  baseByProduct: {
    gasoline: 20,
    lubricants: 200,
    jetFuel: 200,
    petrochemicals: 200,
    plasticPellets: 200,
    recycledMaterial: 150,
    asphalt: 150,
  } satisfies Record<ProductKey, number>,
  crudeTankByLevel: [0, 50, 125, 300],
  gasolineTankByLevel: [0, 50, 125, 300],
  lubricantTankByLevel: [0, 75, 190, 375],
  jetFuelTankByLevel: [0, 60, 150, 300],
  petrochemicalTankByLevel: [0, 50, 125, 250],
  recyclingBunkerByLevel: [0, 100, 250, 500],
  pelletSiloByLevel: [0, 40, 100, 200],
} as const

export const V3_SPOT_PRICE_CENTS: Record<ProductKey, number> = {
  gasoline: 1_800,
  lubricants: 3_000,
  jetFuel: 5_000,
  petrochemicals: 6_500,
  plasticPellets: 12_000,
  asphalt: 1_200,
  recycledMaterial: 1_200,
}

export const V3_CRUDE_PRICE_CENTS = 1_000

export const V3_PROFILE_MULTIPLIERS = {
  volume: { work: 1.25, input: 1.1, energy: 1.1 },
  standard: { work: 1, input: 1, energy: 1 },
  precision: { work: 0.8, input: 1.1, energy: 1.25 },
} as const

export const V3_MODULE_MULTIPLIERS = {
  none: { work: 1, input: 1, energy: 1 },
  throughput: { work: 1.15, input: 1, energy: 1.15 },
  economy: { work: 0.9, input: 0.9, energy: 0.75 },
  precision: { work: 0.9, input: 1, energy: 1.1 },
} as const

export const V3_LEVEL_RATE = [0, 1, 1.4, 1.9] as const
export const V3_TICKS_PER_CYCLE = 25
export const V3_DISTILLATION = {
  crudePerWork: 6,
  gasolinePerWork: 5,
  feedstockPerWork: 3,
  wastePerWork: 0.5,
  feedstockBaseCapacity: 40,
  feedstockCapacityPerCell: 60,
  wasteCapacity: 200,
} as const

export type V3ProcessBuilding =
  | 'distillationUnit'
  | 'lubricantPlant'
  | 'jetFuelPlant'
  | 'petrochemicalPlant'
  | 'polymerPlant'
  | 'wasteTreatmentPlant'
export type V3ProcessInput = 'crude' | 'feedstock' | 'petro' | 'waste'

export type V3ProcessUnit = {
  /** Product written by the line: a blueprint family, or recycled commodity. */
  family: 'gasoline' | 'lubricants' | 'jetFuel' | 'petrochemicals' | 'plasticPellets' | 'recycledMaterial'
  input: V3ProcessInput
  inputPerWork: number
  outputPerWork: number
  energyPerWork: number
  wastePerWork: number
  chapter: 0 | 2 | 3 | 4
}

// Systems S3 dataset V3-A. Only families listed here have a ported V3 route;
// Petrochemical/Polymer/Waste Treatment remain unavailable until V3-14.
export const V3_PROCESS_UNITS: Record<V3ProcessBuilding, V3ProcessUnit> = {
  distillationUnit: { family: 'gasoline', input: 'crude', inputPerWork: 6, outputPerWork: 5, energyPerWork: 0, wastePerWork: 0.5, chapter: 0 },
  lubricantPlant: { family: 'lubricants', input: 'feedstock', inputPerWork: 6, outputPerWork: 5, energyPerWork: 3, wastePerWork: 1, chapter: 2 },
  jetFuelPlant: { family: 'jetFuel', input: 'feedstock', inputPerWork: 8, outputPerWork: 5, energyPerWork: 4, wastePerWork: 1, chapter: 3 },
  petrochemicalPlant: { family: 'petrochemicals', input: 'feedstock', inputPerWork: 10, outputPerWork: 5, energyPerWork: 5, wastePerWork: 1, chapter: 4 },
  // Polymer uses unreserved, unkept Petro of any Q; pellets do not inherit that Q.
  polymerPlant: { family: 'plasticPellets', input: 'petro', inputPerWork: 6, outputPerWork: 5, energyPerWork: 6, wastePerWork: 1, chapter: 4 },
  wasteTreatmentPlant: { family: 'recycledMaterial', input: 'waste', inputPerWork: 4, outputPerWork: 2, energyPerWork: 1, wastePerWork: 0, chapter: 2 },
}

/** Program key for lines that write a commodity instead of a blueprint variant. */
export const V3_COMMODITY_ID = {
  recycledMaterial: 'commodity:recycledMaterial',
  asphalt: 'commodity:asphalt',
} as const

/** Manual side conversion (Systems S3): crude → asphalt 1:1, goods only. */
export const V3_ASPHALT_CONVERSION = { crudePerUnit: 1, chapter: 1 } as const

export const V3_PLANT_BY_FAMILY: Partial<Record<ProductKey, V3ProcessBuilding>> = {
  gasoline: 'distillationUnit',
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
  petrochemicals: 'petrochemicalPlant',
  plasticPellets: 'polymerPlant',
}

const PROCESS_BUILDINGS: ReadonlySet<string> = new Set([
  'distillationUnit', 'lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant', 'polymerPlant', 'wasteTreatmentPlant',
])

export function isV3ProcessBuilding(building: BuildingType | null | undefined): building is V3ProcessBuilding {
  return typeof building === 'string' && PROCESS_BUILDINGS.has(building)
}

// Energy per full 5s cycle, crude per full cycle and battery contribution.
export const V3_SITE_POWER = { energyPerCycle: 4, battery: 20 } as const
export const V3_GENERATOR_BY_LEVEL = [
  { energyPerCycle: 0, crudePerCycle: 0, battery: 0 },
  { energyPerCycle: 12, crudePerCycle: 1, battery: 60 },
  { energyPerCycle: 24, crudePerCycle: 2, battery: 120 },
  { energyPerCycle: 42, crudePerCycle: 3, battery: 210 },
] as const

export const V3_FEEDSTOCK_REFERENCE_CENTS = 800

export const V3_MODULE_QUALITY: Record<'none' | 'throughput' | 'economy' | 'precision', number> = {
  none: 0,
  throughput: -5,
  economy: 0,
  precision: 10,
}
export const V3_PROFILE_QUALITY = { volume: -5, standard: 0, precision: 15 } as const

export const V3_DEVELOPMENT_BY_FAMILY = {
  gasoline: { feeCents: 5_000, ticks: 100, chapter: 1 },
  lubricants: { feeCents: 10_000, ticks: 125, chapter: 2 },
  jetFuel: { feeCents: 20_000, ticks: 150, chapter: 3 },
  petrochemicals: { feeCents: 30_000, ticks: 175, chapter: 4 },
  plasticPellets: { feeCents: 40_000, ticks: 200, chapter: 4 },
} as const

export const V3_DEVELOPMENT_SAMPLE_QUANTITY = 10

// ---- Expandable yard (V3-15.5) — supersedes the fixed 3×3→6×6 grid ----
export const V3_WORLD_SIZE = 100

export type V3Footprint = { w: number; h: number }
const fp = (w: number, h: number): V3Footprint => ({ w, h })

/** Single source of footprint truth per type × level (index 1..3), used by rules and UI. */
export const V3_FOOTPRINTS: Partial<Record<BuildingType, [V3Footprint, V3Footprint, V3Footprint]>> = {
  distillationUnit: [fp(1, 1), fp(2, 2), fp(2, 3)],
  crudeTank: [fp(1, 1), fp(2, 1), fp(2, 2)],
  gasolineTank: [fp(1, 1), fp(2, 1), fp(2, 2)],
  lubricantTank: [fp(1, 1), fp(2, 1), fp(2, 2)],
  jetFuelTank: [fp(1, 1), fp(2, 1), fp(2, 2)],
  petrochemicalTank: [fp(1, 1), fp(2, 1), fp(2, 2)],
  pelletSilo: [fp(1, 1), fp(2, 1), fp(2, 2)],
  recyclingBunker: [fp(1, 1), fp(2, 1), fp(2, 2)],
  laboratory: [fp(1, 1), fp(2, 2), fp(2, 2)],
  powerPlant: [fp(2, 2), fp(2, 2), fp(3, 2)],
  lubricantPlant: [fp(2, 2), fp(2, 2), fp(3, 2)],
  jetFuelPlant: [fp(2, 2), fp(3, 2), fp(3, 3)],
  petrochemicalPlant: [fp(2, 2), fp(3, 2), fp(3, 3)],
  polymerPlant: [fp(2, 2), fp(3, 2), fp(3, 3)],
  wasteTreatmentPlant: [fp(1, 1), fp(2, 1), fp(2, 2)],
  maintenanceWorkshop: [fp(1, 1), fp(2, 1), fp(2, 2)],
  salesOffice: [fp(1, 1), fp(1, 1), fp(2, 1)],
}

export type V3LandParcel = {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** V3-A hypotheses; tuned by the V3-18 simulator, not by guesswork here. */
  costDollars: number
  chapter: 0 | 1 | 2 | 3 | 4 | 5
  requires: string | null
}

const CENTER = 50
function ring(ring: number, inner: number, outer: number, costDollars: number, chapter: V3LandParcel['chapter']): V3LandParcel[] {
  const a = inner / 2
  const b = outer / 2
  const lo = CENTER - b
  const previous = (side: string) => (ring === 1 ? 'core' : `ring${ring - 1}:${side}`)
  return [
    { id: `ring${ring}:north`, x: lo, y: lo, w: outer, h: b - a, costDollars, chapter, requires: previous('north') },
    { id: `ring${ring}:south`, x: lo, y: CENTER + a, w: outer, h: b - a, costDollars, chapter, requires: previous('south') },
    { id: `ring${ring}:west`, x: lo, y: CENTER - a, w: b - a, h: inner, costDollars, chapter, requires: previous('west') },
    { id: `ring${ring}:east`, x: CENTER + a, y: CENTER - a, w: b - a, h: inner, costDollars, chapter, requires: previous('east') },
  ]
}

/**
 * Start 10×10, then rings to 14×14 (C2), 20×20 (C4) and 28×28 (after clear).
 * Ring totals mirror the old 4×4/5×5/6×6 prices; the engine supports 100×100.
 */
export const V3_LAND_PARCELS: V3LandParcel[] = [
  { id: 'core', x: 45, y: 45, w: 10, h: 10, costDollars: 0, chapter: 0, requires: null },
  ...ring(1, 10, 14, 1_500, 2),
  ...ring(2, 14, 20, 6_250, 4),
  ...ring(3, 20, 28, 25_000, 5),
]

/** Specific building caps by chapter (index = chapter); absent types are uncapped. */
export const V3_BUILDING_LIMITS: Partial<Record<BuildingType, readonly number[]>> = {
  distillationUnit: [1, 1, 2, 2, 3, 3],
  laboratory: [1, 1, 1, 1, 1, 1],
  salesOffice: [1, 1, 1, 1, 1, 1],
  maintenanceWorkshop: [1, 1, 1, 1, 1, 1],
  powerPlant: [1, 1, 1, 2, 3, 3],
}

// Systems S2 module table: fit cost is 20% of the plant's base build cost.
export const V3_MODULE_FIT_COST_RATE = 0.2
export const V3_MODULE_MIN_PLANT_LEVEL = 2
export const V3_MODULE_CHAPTER = 2

// Systems S4 research candidates. `effect` is the only V3 consequence; IDs
// without a V3 effect
// are intentionally absent so they cannot be bought as a no-op.
export type V3ResearchEffect =
  | { kind: 'knowledgeRank'; rank: 1 | 2 }
  | { kind: 'globalRate'; value: number }
  | { kind: 'coreStorage'; value: number }
  | { kind: 'storagePercent'; value: number }
  | { kind: 'trade'; value: number }
  | { kind: 'jobRp'; value: number }
  | { kind: 'upkeep'; value: number }

type V3ResearchRule = {
  rp: number
  chapter: 0 | 1 | 2 | 3 | 4
  labLevel: number
  prerequisite: string | null
  effect: V3ResearchEffect
}

export const V3_RESEARCH = {
  betterPumps: { rp: 10, chapter: 1, labLevel: 0, prerequisite: null, effect: { kind: 'globalRate', value: 0.05 } },
  biggerTanks: { rp: 15, chapter: 1, labLevel: 0, prerequisite: null, effect: { kind: 'coreStorage', value: 20 } },
  premiumFuel: { rp: 20, chapter: 2, labLevel: 2, prerequisite: null, effect: { kind: 'knowledgeRank', rank: 1 } },
  saferOperations: { rp: 20, chapter: 2, labLevel: 0, prerequisite: null, effect: { kind: 'upkeep', value: 0.1 } },
  advancedDistillation: { rp: 40, chapter: 2, labLevel: 0, prerequisite: 'betterPumps', effect: { kind: 'globalRate', value: 0.1 } },
  industrialStorage: { rp: 40, chapter: 2, labLevel: 0, prerequisite: 'biggerTanks', effect: { kind: 'storagePercent', value: 0.15 } },
  premiumContracts: { rp: 40, chapter: 3, labLevel: 0, prerequisite: 'premiumFuel', effect: { kind: 'trade', value: 0.05 } },
  contractAnalytics: { rp: 40, chapter: 3, labLevel: 0, prerequisite: 'premiumContracts', effect: { kind: 'jobRp', value: 0.2 } },
  advancedProcessing: { rp: 60, chapter: 4, labLevel: 3, prerequisite: 'premiumFuel', effect: { kind: 'knowledgeRank', rank: 2 } },
  storageOptimization: { rp: 60, chapter: 4, labLevel: 0, prerequisite: 'industrialStorage', effect: { kind: 'storagePercent', value: 0.25 } },
} as const satisfies Record<string, V3ResearchRule>
export type V3SupportedResearch = keyof typeof V3_RESEARCH

// ---- Workforce (Master §6, Systems S4) ----
export type V3SupportEffect = 'storageFlat' | 'storagePercent' | 'trade' | 'rp' | 'upkeep' | null

export type V3RoleRule = {
  lineBuildings: readonly V3ProcessBuilding[]
  matchedBuildings: readonly V3ProcessBuilding[]
  leadFamilies: readonly string[]
  support: V3SupportEffect
  supportValue: number
  hireChapter: 0 | 1 | 2 | 3 | 4
  hireCostDollars: number
  /** False while the role has no working V3 duty (hire stays locked, truthfully). */
  hireable: boolean
}

export const V3_ROLES: Record<WorkerType, V3RoleRule> = {
  operator: { lineBuildings: ['distillationUnit', 'lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant', 'polymerPlant'], matchedBuildings: [], leadFamilies: ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets'], support: null, supportValue: 0, hireChapter: 0, hireCostDollars: 500, hireable: true },
  fuelSpecialist: { lineBuildings: ['distillationUnit', 'lubricantPlant'], matchedBuildings: ['distillationUnit', 'lubricantPlant'], leadFamilies: ['gasoline', 'lubricants'], support: null, supportValue: 0, hireChapter: 2, hireCostDollars: 1_500, hireable: true },
  aviationSpecialist: { lineBuildings: ['jetFuelPlant'], matchedBuildings: ['jetFuelPlant'], leadFamilies: ['jetFuel'], support: null, supportValue: 0, hireChapter: 3, hireCostDollars: 3_000, hireable: true },
  chemicalEngineer: { lineBuildings: ['petrochemicalPlant'], matchedBuildings: ['petrochemicalPlant'], leadFamilies: ['petrochemicals'], support: null, supportValue: 0, hireChapter: 4, hireCostDollars: 5_000, hireable: true },
  polymerEngineer: { lineBuildings: ['polymerPlant'], matchedBuildings: ['polymerPlant'], leadFamilies: ['plasticPellets'], support: null, supportValue: 0, hireChapter: 4, hireCostDollars: 8_000, hireable: true },
  chemist: { lineBuildings: [], matchedBuildings: [], leadFamilies: ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets'], support: 'rp', supportValue: 0.1, hireChapter: 1, hireCostDollars: 1_500, hireable: true },
  mechanic: { lineBuildings: [], matchedBuildings: [], leadFamilies: [], support: 'storageFlat', supportValue: 25, hireChapter: 1, hireCostDollars: 800, hireable: true },
  salesAgent: { lineBuildings: [], matchedBuildings: [], leadFamilies: [], support: 'trade', supportValue: 0.04, hireChapter: 3, hireCostDollars: 1_000, hireable: true },
  logisticsCoordinator: { lineBuildings: [], matchedBuildings: [], leadFamilies: [], support: 'storagePercent', supportValue: 0.1, hireChapter: 2, hireCostDollars: 2_000, hireable: true },
  safetyOfficer: { lineBuildings: [], matchedBuildings: [], leadFamilies: [], support: 'upkeep', supportValue: 0.05, hireChapter: 2, hireCostDollars: 1_200, hireable: true },
}

export const V3_CAPS = {
  localCrewRate: 0.3,
  globalRate: 0.2,
  storagePercent: 0.5,
  trade: 0.15,
  rp: 0.5,
  /** All upkeep reductions combined (workshop, research, support, local skills). */
  upkeep: 0.25,
  /** Mechanics' flat storage counts at most three staff-equivalents. */
  mechanicEffectiveStaff: 3,
  /** Chemists' RP bonus counts at most three staff-equivalents. */
  chemistEffectiveStaff: 3,
} as const

export const V3_STAFF_LEVELS = {
  maxLevel: 5,
  xpToNextLevel: [0, 1_200, 3_000, 6_000, 12_000],
  /** Legacy productive-duty rate retained: 1 XP per active tick of actual work. */
  xpPerWorkTick: 1,
  bonusPerLevelRate: 0.15,
  trainBaseDollars: 600,
  trainDollarsPerLevel: 500,
  trainRp: 5,
} as const

/** Total staff cap per chapter (V3-A hypothesis; Master targets 6–12 at the end). */
export const V3_STAFF_CAP_BY_CHAPTER = [4, 6, 8, 10, 12, 12] as const

export const V3_SALES_OFFICE_TRADE_BY_LEVEL = [0, 0.05, 0.08, 0.1] as const

export const V3_SPECIALIZATION = {
  green: { rate: 0.95, energy: 0.9, waste: 0.8 },
  industrial: { rate: 1.1, energy: 1.2, waste: 1 },
} as const
export const V3_SPECIALIZATION_CHAPTER = 3

// ---- Maintenance (Systems S3) ----
/** Per 5s cycle: 0.002 × base build cost / 12, scaled by level. */
export const V3_MAINTENANCE = {
  rateOfBuildCostPerCycle: 0.002 / 12,
  processingLevelRate: [0, 1, 1.4, 1.9],
  supportLevelRate: [0, 1, 1.25, 1.5],
  pausedRate: 0.5,
  /** Starter Distillation and core tanks are free until this chapter. */
  starterFreeUntilChapter: 2,
  workshopCutByLevel: [0, 0.05, 0.08, 0.1],
} as const
