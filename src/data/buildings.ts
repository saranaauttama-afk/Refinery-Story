import type { BuildingConfig, BuildingType } from '../types'
import { text } from '../translations'

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
  },
  maintenanceWorkshop: {
    name: text.data.buildings.maintenanceWorkshop.name,
    shortName: 'MW',
    cost: 2500,
    description: text.data.buildings.maintenanceWorkshop.description,
  },
  salesOffice: {
    name: text.data.buildings.salesOffice.name,
    shortName: 'SO',
    cost: 3000,
    description: text.data.buildings.salesOffice.description,
  },
}
