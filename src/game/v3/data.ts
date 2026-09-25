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
