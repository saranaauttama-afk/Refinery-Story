import type { ComponentType } from 'react'
import {
  Atom,
  BriefcaseBusiness,
  Cylinder,
  Database,
  DatabaseZap,
  Droplets,
  Drum,
  Factory,
  FlaskConical,
  Fuel,
  Package,
  Package2,
  Plane,
  PlaneTakeoff,
  Recycle,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react-native'

import { PLANT_PRODUCTION, POLYMER_PLANT_BALANCE, POWER_PLANT_BALANCE } from './game/data/balance'
import type { BuildingType, DerivedStats, GameState, ProductKey, WorkerType } from './game/types'
import { getEmployeeAssignedToCell } from './game/utils/gameCalculations'
import { colors } from './theme'

type TileIconComponent = ComponentType<{
  size?: number | string
  color?: string
  strokeWidth?: number
}>

export type BuildingCategory = 'storage' | 'production' | 'research' | 'support' | 'power' | 'waste'

export type TileStatusBadge = {
  label: string
  tone: 'warning' | 'blocked' | 'idle'
}

const PRODUCT_BUILDING_TO_KEY: Partial<Record<BuildingType, ProductKey>> = {
  lubricantPlant: 'lubricants',
  jetFuelPlant: 'jetFuel',
  petrochemicalPlant: 'petrochemicals',
  wasteTreatmentPlant: 'recycledMaterial',
  polymerPlant: 'plasticPellets',
  lubricantTank: 'lubricants',
  jetFuelTank: 'jetFuel',
  petrochemicalTank: 'petrochemicals',
  recyclingBunker: 'recycledMaterial',
  pelletSilo: 'plasticPellets',
}

const STAFF_BADGE_BY_TYPE: Partial<Record<WorkerType, string>> = {
  operator: '👷',
  mechanic: '🔧',
  chemist: '🧪',
  aviationSpecialist: '✈',
  chemicalEngineer: '🧪',
  polymerEngineer: '⚙',
}

export const BUILDING_CATEGORY_BY_TYPE: Record<BuildingType, BuildingCategory> = {
  crudeTank: 'storage',
  distillationUnit: 'production',
  productTank: 'storage',
  laboratory: 'research',
  maintenanceWorkshop: 'support',
  salesOffice: 'support',
  lubricantPlant: 'production',
  jetFuelPlant: 'production',
  petrochemicalPlant: 'production',
  powerPlant: 'power',
  wasteTreatmentPlant: 'waste',
  polymerPlant: 'production',
  lubricantTank: 'storage',
  jetFuelTank: 'storage',
  petrochemicalTank: 'storage',
  recyclingBunker: 'waste',
  pelletSilo: 'storage',
}

export const BUILDING_CATEGORY_ACCENT: Record<BuildingCategory, string> = {
  storage: colors.blue,
  production: colors.orange,
  research: colors.purple,
  support: colors.green,
  power: colors.goldDark,
  waste: colors.teal,
}

export const BUILDING_CATEGORY_SURFACE: Record<BuildingCategory, string> = {
  storage: '#EAF2FA',
  production: '#F9EFE2',
  research: '#F1ECFA',
  support: '#EBF4EA',
  power: '#FBF2D7',
  waste: '#E6F6F3',
}

export const BUILDING_TILE_ICONS: Record<BuildingType, TileIconComponent> = {
  crudeTank: Cylinder,
  distillationUnit: Factory,
  productTank: Fuel,
  laboratory: FlaskConical,
  maintenanceWorkshop: Wrench,
  salesOffice: BriefcaseBusiness,
  lubricantPlant: Droplets,
  jetFuelPlant: PlaneTakeoff,
  petrochemicalPlant: Atom,
  powerPlant: Zap,
  wasteTreatmentPlant: Recycle,
  polymerPlant: Package2,
  lubricantTank: Database,
  jetFuelTank: Warehouse,
  petrochemicalTank: Drum,
  recyclingBunker: Package,
  pelletSilo: DatabaseZap,
}

function getProductMaxStorage(derived: DerivedStats, productKey: ProductKey): number {
  switch (productKey) {
    case 'gasoline':
      return derived.maxGasolineStorage
    case 'asphalt':
      return 0
    case 'lubricants':
      return derived.maxLubricantsStorage
    case 'jetFuel':
      return derived.maxJetFuelStorage
    case 'petrochemicals':
      return derived.maxPetrochemicalsStorage
    case 'recycledMaterial':
      return derived.maxRecycledMaterialStorage
    case 'plasticPellets':
      return derived.maxPlasticPelletsStorage
  }
}

function getFeedstockSupplyPerCycle(derived: DerivedStats): number {
  return derived.feedstockPerDistillationCycle * 5
}

function getFeedstockDemandPerCycle(derived: DerivedStats): number {
  return PLANT_PRODUCTION.reduce(
    (sum, plant) => sum + derived.buildingCounts[plant.buildingKey] * plant.feedstockPerCycle,
    0,
  )
}

function getElectricitySupplyPerCycle(derived: DerivedStats): number {
  return derived.buildingCounts.powerPlant * POWER_PLANT_BALANCE.electricityPerCycle
}

function getStorageStatus(
  productKey: ProductKey | null,
  game: GameState,
  derived: DerivedStats,
): TileStatusBadge | null {
  if (!productKey) return null
  const current = productKey === 'gasoline' ? game.gasoline : game.productInventory[productKey]
  const max = getProductMaxStorage(derived, productKey)
  if (max > 0 && current >= max) {
    return { label: 'FULL', tone: 'warning' }
  }
  return null
}

export function getTileStaffBadge(game: GameState, cellIndex: number): string | null {
  const employee = getEmployeeAssignedToCell(game, cellIndex)
  if (!employee) return null
  return STAFF_BADGE_BY_TYPE[employee.type] ?? '👷'
}

export function getTileStatusBadge(
  type: BuildingType,
  cellIndex: number,
  game: GameState,
  derived: DerivedStats,
): TileStatusBadge | null {
  const powerShortage =
    derived.buildingCounts.powerPlant > 0 &&
    derived.electricityDemandPerCycle > getElectricitySupplyPerCycle(derived)
  const feedstockShortage =
    getFeedstockDemandPerCycle(derived) > getFeedstockSupplyPerCycle(derived)
  const productKey = PRODUCT_BUILDING_TO_KEY[type] ?? null
  const storageStatus = getStorageStatus(productKey, game, derived)

  switch (type) {
    case 'crudeTank':
      return game.crudeOil <= 0 ? { label: 'OIL', tone: 'blocked' } : null
    case 'productTank':
      return getStorageStatus('gasoline', game, derived)
    case 'distillationUnit':
      if (game.crudeOil <= 0) return { label: 'OIL', tone: 'blocked' }
      if (game.feedstock >= derived.maxFeedstockStorage) return { label: 'FULL', tone: 'warning' }
      return null
    case 'lubricantPlant':
    case 'jetFuelPlant':
    case 'petrochemicalPlant': {
      if ((game.feedstockPriority[type] ?? 1) <= 0) return { label: 'IDLE', tone: 'idle' }
      if (storageStatus) return storageStatus
      if (game.feedstock <= 0) return { label: 'FEED', tone: 'blocked' }
      if (powerShortage) return { label: 'PWR', tone: 'warning' }
      if (feedstockShortage) return { label: 'FEED', tone: 'warning' }
      return null
    }
    case 'powerPlant':
      if (game.crudeOil < POWER_PLANT_BALANCE.crudePerCycle) return { label: 'OIL', tone: 'blocked' }
      if (game.electricity >= derived.maxElectricityStorage) return { label: 'FULL', tone: 'warning' }
      return null
    case 'wasteTreatmentPlant':
      if (storageStatus) return storageStatus
      if (game.waste <= 0) return { label: 'IDLE', tone: 'idle' }
      return null
    case 'polymerPlant':
      if (storageStatus) return storageStatus
      if (game.productInventory.petrochemicals < POLYMER_PLANT_BALANCE.petrochemicalsPerCycle) {
        return { label: 'CHEM', tone: 'blocked' }
      }
      if (powerShortage) return { label: 'PWR', tone: 'warning' }
      return null
    case 'lubricantTank':
    case 'jetFuelTank':
    case 'petrochemicalTank':
    case 'recyclingBunker':
    case 'pelletSilo':
      return storageStatus
    case 'laboratory':
    case 'maintenanceWorkshop':
    case 'salesOffice':
      return null
  }
}
