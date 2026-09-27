import type { BuildingType } from '../types'
import { BUILDING_UPGRADE_BALANCE, TANK_FARM_BALANCE } from './balance'

export const BUILDING_UPGRADE_COSTS: Partial<Record<BuildingType, readonly [number, number]>> = {
  crudeTank: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  gasolineTank: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  distillationUnit: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  lubricantPlant: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  jetFuelPlant: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  petrochemicalPlant: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  polymerPlant: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  laboratory: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  maintenanceWorkshop: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  salesOffice: [BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost, BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost],
  powerPlant: [6_000, 12_000],
  lubricantTank: [Math.max(750, TANK_FARM_BALANCE.lubricantTank.cost * 0.75), Math.max(1_500, TANK_FARM_BALANCE.lubricantTank.cost * 1.5)],
  jetFuelTank: [Math.max(750, TANK_FARM_BALANCE.jetFuelTank.cost * 0.75), Math.max(1_500, TANK_FARM_BALANCE.jetFuelTank.cost * 1.5)],
  petrochemicalTank: [Math.max(750, TANK_FARM_BALANCE.petrochemicalTank.cost * 0.75), Math.max(1_500, TANK_FARM_BALANCE.petrochemicalTank.cost * 1.5)],
  recyclingBunker: [Math.max(750, TANK_FARM_BALANCE.recyclingBunker.cost * 0.75), Math.max(1_500, TANK_FARM_BALANCE.recyclingBunker.cost * 1.5)],
  pelletSilo: [Math.max(750, TANK_FARM_BALANCE.pelletSilo.cost * 0.75), Math.max(1_500, TANK_FARM_BALANCE.pelletSilo.cost * 1.5)],
}

export const UPGRADEABLE_BUILDINGS = Object.freeze(
  Object.keys(BUILDING_UPGRADE_COSTS) as BuildingType[],
)

export function isBuildingUpgradeable(building: BuildingType): boolean {
  return BUILDING_UPGRADE_COSTS[building] !== undefined
}

export function getBuildingUpgradeCost(building: BuildingType, currentLevel: number): number | null {
  const costs = BUILDING_UPGRADE_COSTS[building]
  if (!costs || currentLevel < 1 || currentLevel >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel) return null
  return costs[currentLevel - 1] ?? null
}
