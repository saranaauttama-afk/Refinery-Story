import type { ImageSourcePropType } from 'react-native'
import type { BuildingType } from '../../game/types'
import groundAnchors from '../../../assets/plants/yard-v2/anchors.json'

// One art set for yard, build/info sheets and production pipeline.
const PLANT_ART: Partial<Record<BuildingType, Record<1 | 2 | 3, ImageSourcePropType>>> = {
  distillationUnit: { 1: require('../../../assets/plants/yard-v2/distillation_unit_lv1.png'), 2: require('../../../assets/plants/yard-v2/distillation_unit_lv2.png'), 3: require('../../../assets/plants/yard-v2/distillation_unit_lv3.png') },
  crudeTank: { 1: require('../../../assets/plants/yard-v2/crude_tank_lv1.png'), 2: require('../../../assets/plants/yard-v2/crude_tank_lv2.png'), 3: require('../../../assets/plants/yard-v2/crude_tank_lv3.png') },
  gasolineTank: { 1: require('../../../assets/plants/yard-v2/gasoline_tank_lv1.png'), 2: require('../../../assets/plants/yard-v2/gasoline_tank_lv2.png'), 3: require('../../../assets/plants/yard-v2/gasoline_tank_lv3.png') },
  lubricantPlant: { 1: require('../../../assets/plants/yard-v2/lubricant_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/lubricant_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/lubricant_plant_lv3.png') },
  lubricantTank: { 1: require('../../../assets/plants/yard-v2/lubricant_tank_lv1.png'), 2: require('../../../assets/plants/yard-v2/lubricant_tank_lv2.png'), 3: require('../../../assets/plants/yard-v2/lubricant_tank_lv3.png') },
  jetFuelPlant: { 1: require('../../../assets/plants/yard-v2/jet_fuel_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/jet_fuel_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/jet_fuel_plant_lv3.png') },
  jetFuelTank: { 1: require('../../../assets/plants/yard-v2/jet_fuel_tank_lv1.png'), 2: require('../../../assets/plants/yard-v2/jet_fuel_tank_lv2.png'), 3: require('../../../assets/plants/yard-v2/jet_fuel_tank_lv3.png') },
  petrochemicalPlant: { 1: require('../../../assets/plants/yard-v2/petrochemical_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/petrochemical_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/petrochemical_plant_lv3.png') },
  petrochemicalTank: { 1: require('../../../assets/plants/yard-v2/petrochemical_tank_lv1.png'), 2: require('../../../assets/plants/yard-v2/petrochemical_tank_lv2.png'), 3: require('../../../assets/plants/yard-v2/petrochemical_tank_lv3.png') },
  polymerPlant: { 1: require('../../../assets/plants/yard-v2/polymer_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/polymer_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/polymer_plant_lv3.png') },
  pelletSilo: { 1: require('../../../assets/plants/yard-v2/pellet_silo_lv1.png'), 2: require('../../../assets/plants/yard-v2/pellet_silo_lv2.png'), 3: require('../../../assets/plants/yard-v2/pellet_silo_lv3.png') },
  powerPlant: { 1: require('../../../assets/plants/yard-v2/power_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/power_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/power_plant_lv3.png') },
  laboratory: { 1: require('../../../assets/plants/yard-v2/laboratory_lv1.png'), 2: require('../../../assets/plants/yard-v2/laboratory_lv2.png'), 3: require('../../../assets/plants/yard-v2/laboratory_lv3.png') },
  maintenanceWorkshop: { 1: require('../../../assets/plants/yard-v2/maintenance_workshop_lv1.png'), 2: require('../../../assets/plants/yard-v2/maintenance_workshop_lv2.png'), 3: require('../../../assets/plants/yard-v2/maintenance_workshop_lv3.png') },
  wasteTreatmentPlant: { 1: require('../../../assets/plants/yard-v2/waste_treatment_plant_lv1.png'), 2: require('../../../assets/plants/yard-v2/waste_treatment_plant_lv2.png'), 3: require('../../../assets/plants/yard-v2/waste_treatment_plant_lv3.png') },
  recyclingBunker: { 1: require('../../../assets/plants/yard-v2/recycling_bunker_lv1.png'), 2: require('../../../assets/plants/yard-v2/recycling_bunker_lv2.png'), 3: require('../../../assets/plants/yard-v2/recycling_bunker_lv3.png') },
  salesOffice: { 1: require('../../../assets/plants/yard-v2/sales_office_lv1.png'), 2: require('../../../assets/plants/yard-v2/sales_office_lv2.png'), 3: require('../../../assets/plants/yard-v2/sales_office_lv3.png') },
}
const ART_NAMES: Partial<Record<BuildingType, string>> = {
  distillationUnit: 'distillation_unit',
  crudeTank: 'crude_tank',
  gasolineTank: 'gasoline_tank',
  lubricantPlant: 'lubricant_plant',
  lubricantTank: 'lubricant_tank',
  jetFuelPlant: 'jet_fuel_plant',
  jetFuelTank: 'jet_fuel_tank',
  petrochemicalPlant: 'petrochemical_plant',
  petrochemicalTank: 'petrochemical_tank',
  polymerPlant: 'polymer_plant',
  pelletSilo: 'pellet_silo',
  powerPlant: 'power_plant',
  laboratory: 'laboratory',
  maintenanceWorkshop: 'maintenance_workshop',
  wasteTreatmentPlant: 'waste_treatment_plant',
  recyclingBunker: 'recycling_bunker',
  salesOffice: 'sales_office',
}
export function getV3BuildingArt(type: BuildingType, level: number): ImageSourcePropType | null {
  return PLANT_ART[type]?.[Math.min(3, Math.max(1, level)) as 1 | 2 | 3] ?? null
}

// Measure actual bottom pad tips; non-square bases are asymmetric.
export function getV3BuildingAnchor(type: BuildingType, level: number): number {
  const name = ART_NAMES[type]
  const anchors: Record<string, number[]> = groundAnchors
  return name ? anchors[name]?.[Math.min(3, Math.max(1, level)) - 1] ?? 0.5 : 0.5
}
