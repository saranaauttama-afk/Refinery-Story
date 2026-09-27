import type { ImageSourcePropType } from 'react-native'

import type { BuildingType } from '../../game/types'
import { STARTER_PLANT_ART_BY_LEVEL } from '../../starterPlantArt'

type ArtByLevel = Record<1 | 2 | 3, ImageSourcePropType>

/** Existing isometric pixel art, reused for the V3 yard (no new art in V3-20). */
const PLANT_ART: Partial<Record<BuildingType, ArtByLevel>> = {
  laboratory: { 1: require('../../../assets/plants/laboratory_lv1.png'), 2: require('../../../assets/plants/laboratory_lv2.png'), 3: require('../../../assets/plants/laboratory_lv3.png') },
  maintenanceWorkshop: { 1: require('../../../assets/plants/maintenance_workshop_lv1.png'), 2: require('../../../assets/plants/maintenance_workshop_lv2.png'), 3: require('../../../assets/plants/maintenance_workshop_lv3.png') },
  salesOffice: { 1: require('../../../assets/plants/sales_office_lv1.png'), 2: require('../../../assets/plants/sales_office_lv2.png'), 3: require('../../../assets/plants/sales_office_lv3.png') },
  lubricantPlant: { 1: require('../../../assets/plants/lubricant_plant_lv1.png'), 2: require('../../../assets/plants/lubricant_plant_lv2.png'), 3: require('../../../assets/plants/lubricant_plant_lv3.png') },
  jetFuelPlant: { 1: require('../../../assets/plants/jet_fuel_plant_lv1.png'), 2: require('../../../assets/plants/jet_fuel_plant_lv2.png'), 3: require('../../../assets/plants/jet_fuel_plant_lv3.png') },
  petrochemicalPlant: { 1: require('../../../assets/plants/petrochemical_plant_lv1.png'), 2: require('../../../assets/plants/petrochemical_plant_lv2.png'), 3: require('../../../assets/plants/petrochemical_plant_lv3.png') },
  powerPlant: { 1: require('../../../assets/plants/power_plant_lv1.png'), 2: require('../../../assets/plants/power_plant_lv2.png'), 3: require('../../../assets/plants/power_plant_lv3.png') },
  wasteTreatmentPlant: { 1: require('../../../assets/plants/waste_treatment_plant_lv1.png'), 2: require('../../../assets/plants/waste_treatment_plant_lv2.png'), 3: require('../../../assets/plants/waste_treatment_plant_lv3.png') },
  polymerPlant: { 1: require('../../../assets/plants/polymer_plant_lv1.png'), 2: require('../../../assets/plants/polymer_plant_lv2.png'), 3: require('../../../assets/plants/polymer_plant_lv3.png') },
  lubricantTank: { 1: require('../../../assets/plants/lubricant_tank_lv1.png'), 2: require('../../../assets/plants/lubricant_tank_lv2.png'), 3: require('../../../assets/plants/lubricant_tank_lv3.png') },
  jetFuelTank: { 1: require('../../../assets/plants/jet_fuel_tank_lv1.png'), 2: require('../../../assets/plants/jet_fuel_tank_lv2.png'), 3: require('../../../assets/plants/jet_fuel_tank_lv3.png') },
  petrochemicalTank: { 1: require('../../../assets/plants/petrochemical_tank_lv1.png'), 2: require('../../../assets/plants/petrochemical_tank_lv2.png'), 3: require('../../../assets/plants/petrochemical_tank_lv3.png') },
  recyclingBunker: { 1: require('../../../assets/plants/recycling_bunker_lv1.png'), 2: require('../../../assets/plants/recycling_bunker_lv2.png'), 3: require('../../../assets/plants/recycling_bunker_lv3.png') },
  pelletSilo: { 1: require('../../../assets/plants/pellet_silo_lv1.png'), 2: require('../../../assets/plants/pellet_silo_lv2.png'), 3: require('../../../assets/plants/pellet_silo_lv3.png') },
}

export function getV3BuildingArt(type: BuildingType, level: number): ImageSourcePropType | null {
  const clamped = Math.min(3, Math.max(1, level)) as 1 | 2 | 3
  return (STARTER_PLANT_ART_BY_LEVEL[type]?.[clamped] as ImageSourcePropType | undefined) ?? PLANT_ART[type]?.[clamped] ?? null
}
