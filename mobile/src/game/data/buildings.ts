import type { BuildingConfig, BuildingType } from '../types'
import { text } from '../translations'
import { LUBRICANT_PLANT_BALANCE, JET_FUEL_PLANT_BALANCE, PETROCHEMICAL_PLANT_BALANCE, POWER_PLANT_BALANCE, WASTE_TREATMENT_PLANT_BALANCE, POLYMER_PLANT_BALANCE } from './balance'

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  crudeTank: {
    name: text.data.buildings.crudeTank.name,
    shortName: 'CT',
    cost: 30,
    description: text.data.buildings.crudeTank.description,
  },
  distillationUnit: {
    name: text.data.buildings.distillationUnit.name,
    shortName: 'DU',
    cost: 45,
    description: text.data.buildings.distillationUnit.description,
  },
  productTank: {
    name: text.data.buildings.productTank.name,
    shortName: 'PT',
    cost: 30,
    description: text.data.buildings.productTank.description,
  },
  laboratory: {
    name: text.data.buildings.laboratory.name,
    shortName: 'LB',
    cost: 2000,
    description: text.data.buildings.laboratory.description,
    unlockLevel: 4,
  },
  maintenanceWorkshop: {
    name: text.data.buildings.maintenanceWorkshop.name,
    shortName: 'MW',
    cost: 2500,
    description: text.data.buildings.maintenanceWorkshop.description,
    unlockLevel: 6,
  },
  salesOffice: {
    name: text.data.buildings.salesOffice.name,
    shortName: 'SO',
    cost: 3000,
    description: text.data.buildings.salesOffice.description,
    unlockLevel: 7,
  },
  lubricantPlant: {
    name: text.data.buildings.lubricantPlant.name,
    shortName: 'LP',
    cost: LUBRICANT_PLANT_BALANCE.cost,
    description: text.data.buildings.lubricantPlant.description,
    unlockLevel: LUBRICANT_PLANT_BALANCE.unlockLevel,
  },
  jetFuelPlant: {
    name: text.data.buildings.jetFuelPlant.name,
    shortName: 'JF',
    cost: JET_FUEL_PLANT_BALANCE.cost,
    description: text.data.buildings.jetFuelPlant.description,
    unlockLevel: JET_FUEL_PLANT_BALANCE.unlockLevel,
  },
  petrochemicalPlant: {
    name: text.data.buildings.petrochemicalPlant.name,
    shortName: 'PC',
    cost: PETROCHEMICAL_PLANT_BALANCE.cost,
    description: text.data.buildings.petrochemicalPlant.description,
    unlockLevel: PETROCHEMICAL_PLANT_BALANCE.unlockLevel,
  },
  powerPlant: {
    name: text.data.buildings.powerPlant.name,
    shortName: 'PW',
    cost: POWER_PLANT_BALANCE.cost,
    description: text.data.buildings.powerPlant.description,
    unlockLevel: POWER_PLANT_BALANCE.unlockLevel,
  },
  wasteTreatmentPlant: {
    name: text.data.buildings.wasteTreatmentPlant.name,
    shortName: 'WT',
    cost: WASTE_TREATMENT_PLANT_BALANCE.cost,
    description: text.data.buildings.wasteTreatmentPlant.description,
    unlockLevel: WASTE_TREATMENT_PLANT_BALANCE.unlockLevel,
  },
  polymerPlant: {
    name: text.data.buildings.polymerPlant.name,
    shortName: 'PL',
    cost: POLYMER_PLANT_BALANCE.cost,
    description: text.data.buildings.polymerPlant.description,
    unlockLevel: POLYMER_PLANT_BALANCE.unlockLevel,
  },
}
