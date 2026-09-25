import type { BuildingType, ProductKey } from '../types'

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

export type V3ProcessBuilding = 'distillationUnit' | 'lubricantPlant' | 'jetFuelPlant'
export type V3ProcessInput = 'crude' | 'feedstock'

export type V3ProcessUnit = {
  family: 'gasoline' | 'lubricants' | 'jetFuel'
  input: V3ProcessInput
  inputPerWork: number
  outputPerWork: number
  energyPerWork: number
  wastePerWork: number
  chapter: 0 | 2 | 3
}

// Systems S3 dataset V3-A. Only families listed here have a ported V3 route;
// Petrochemical/Polymer/Waste Treatment remain unavailable until V3-14.
export const V3_PROCESS_UNITS: Record<V3ProcessBuilding, V3ProcessUnit> = {
  distillationUnit: { family: 'gasoline', input: 'crude', inputPerWork: 6, outputPerWork: 5, energyPerWork: 0, wastePerWork: 0.5, chapter: 0 },
  lubricantPlant: { family: 'lubricants', input: 'feedstock', inputPerWork: 6, outputPerWork: 5, energyPerWork: 3, wastePerWork: 1, chapter: 2 },
  jetFuelPlant: { family: 'jetFuel', input: 'feedstock', inputPerWork: 8, outputPerWork: 5, energyPerWork: 4, wastePerWork: 1, chapter: 3 },
}

export const V3_PLANT_BY_FAMILY: Partial<Record<ProductKey, V3ProcessBuilding>> = {
  gasoline: 'distillationUnit',
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
}

export function isV3ProcessBuilding(building: BuildingType | null | undefined): building is V3ProcessBuilding {
  return building === 'distillationUnit' || building === 'lubricantPlant' || building === 'jetFuelPlant'
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

// Anchored square expansion: 3x3 -> 4x4 at C2, 4x4 -> 5x5 at C4 (V3-14).
export const V3_GRID_EXPANSIONS = [
  { fromSize: 3, toSize: 4, costDollars: 6_000, chapter: 2 },
] as const
