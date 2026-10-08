import type { ImageSourcePropType } from 'react-native'
import type { BuildingType } from '../../game/types'
import { getV3Footprint } from '../../game/v3/yard'
import codeArtEffects from '../../../assets/plants/artkit/effects.json'

export type V3ArtEmitter = { kind: 'smoke' | 'lamp'; x: number; y: number }

/**
 * Every building is code-drawn (tools/artkit, `python3 build_all.py`) — exact to
 * Doc/ART_ASSET_LIST_V3.md §2, so the pad's bottom tip is always at w/(w+h) of the
 * width. One art set for yard, build/info sheets and the production pipeline.
 */
const CODE_ART: Partial<Record<BuildingType, Record<1 | 2 | 3, ImageSourcePropType>>> = {
  distillationUnit: { 1: require('../../../assets/plants/artkit/distillation_unit_lv1.png'), 2: require('../../../assets/plants/artkit/distillation_unit_lv2.png'), 3: require('../../../assets/plants/artkit/distillation_unit_lv3.png') },
  crudeTank: { 1: require('../../../assets/plants/artkit/crude_tank_lv1.png'), 2: require('../../../assets/plants/artkit/crude_tank_lv2.png'), 3: require('../../../assets/plants/artkit/crude_tank_lv3.png') },
  gasolineTank: { 1: require('../../../assets/plants/artkit/gasoline_tank_lv1.png'), 2: require('../../../assets/plants/artkit/gasoline_tank_lv2.png'), 3: require('../../../assets/plants/artkit/gasoline_tank_lv3.png') },
  lubricantPlant: { 1: require('../../../assets/plants/artkit/lubricant_plant_lv1.png'), 2: require('../../../assets/plants/artkit/lubricant_plant_lv2.png'), 3: require('../../../assets/plants/artkit/lubricant_plant_lv3.png') },
  lubricantTank: { 1: require('../../../assets/plants/artkit/lubricant_tank_lv1.png'), 2: require('../../../assets/plants/artkit/lubricant_tank_lv2.png'), 3: require('../../../assets/plants/artkit/lubricant_tank_lv3.png') },
  jetFuelPlant: { 1: require('../../../assets/plants/artkit/jet_fuel_plant_lv1.png'), 2: require('../../../assets/plants/artkit/jet_fuel_plant_lv2.png'), 3: require('../../../assets/plants/artkit/jet_fuel_plant_lv3.png') },
  jetFuelTank: { 1: require('../../../assets/plants/artkit/jet_fuel_tank_lv1.png'), 2: require('../../../assets/plants/artkit/jet_fuel_tank_lv2.png'), 3: require('../../../assets/plants/artkit/jet_fuel_tank_lv3.png') },
  petrochemicalPlant: { 1: require('../../../assets/plants/artkit/petrochemical_plant_lv1.png'), 2: require('../../../assets/plants/artkit/petrochemical_plant_lv2.png'), 3: require('../../../assets/plants/artkit/petrochemical_plant_lv3.png') },
  petrochemicalTank: { 1: require('../../../assets/plants/artkit/petrochemical_tank_lv1.png'), 2: require('../../../assets/plants/artkit/petrochemical_tank_lv2.png'), 3: require('../../../assets/plants/artkit/petrochemical_tank_lv3.png') },
  polymerPlant: { 1: require('../../../assets/plants/artkit/polymer_plant_lv1.png'), 2: require('../../../assets/plants/artkit/polymer_plant_lv2.png'), 3: require('../../../assets/plants/artkit/polymer_plant_lv3.png') },
  pelletSilo: { 1: require('../../../assets/plants/artkit/pellet_silo_lv1.png'), 2: require('../../../assets/plants/artkit/pellet_silo_lv2.png'), 3: require('../../../assets/plants/artkit/pellet_silo_lv3.png') },
  powerPlant: { 1: require('../../../assets/plants/artkit/power_plant_lv1.png'), 2: require('../../../assets/plants/artkit/power_plant_lv2.png'), 3: require('../../../assets/plants/artkit/power_plant_lv3.png') },
  laboratory: { 1: require('../../../assets/plants/artkit/laboratory_lv1.png'), 2: require('../../../assets/plants/artkit/laboratory_lv2.png'), 3: require('../../../assets/plants/artkit/laboratory_lv3.png') },
  maintenanceWorkshop: { 1: require('../../../assets/plants/artkit/maintenance_workshop_lv1.png'), 2: require('../../../assets/plants/artkit/maintenance_workshop_lv2.png'), 3: require('../../../assets/plants/artkit/maintenance_workshop_lv3.png') },
  wasteTreatmentPlant: { 1: require('../../../assets/plants/artkit/waste_treatment_plant_lv1.png'), 2: require('../../../assets/plants/artkit/waste_treatment_plant_lv2.png'), 3: require('../../../assets/plants/artkit/waste_treatment_plant_lv3.png') },
  recyclingBunker: { 1: require('../../../assets/plants/artkit/recycling_bunker_lv1.png'), 2: require('../../../assets/plants/artkit/recycling_bunker_lv2.png'), 3: require('../../../assets/plants/artkit/recycling_bunker_lv3.png') },
  salesOffice: { 1: require('../../../assets/plants/artkit/sales_office_lv1.png'), 2: require('../../../assets/plants/artkit/sales_office_lv2.png'), 3: require('../../../assets/plants/artkit/sales_office_lv3.png') },
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

const clampLevel = (level: number) => Math.min(3, Math.max(1, level)) as 1 | 2 | 3

/** Animated effect anchors for code-drawn art, as fractions of the sprite (exported by tools/artkit/build.py). */
export function getV3BuildingEffects(type: BuildingType, level: number): V3ArtEmitter[] {
  const name = ART_NAMES[type]
  const entry = name ? (codeArtEffects as Record<string, { emitters: V3ArtEmitter[] }>)[`${name}_lv${clampLevel(level)}`] : undefined
  return entry?.emitters ?? []
}

export function isV3CodeArt(type: BuildingType): boolean {
  return CODE_ART[type] !== undefined
}

export function getV3BuildingArt(type: BuildingType, level: number): ImageSourcePropType | null {
  return CODE_ART[type]?.[clampLevel(level)] ?? null
}

/** Horizontal position of the pad's bottom tip, as a fraction of the sprite width. */
export function getV3BuildingAnchor(type: BuildingType, level: number): number {
  const footprint = getV3Footprint(type, level)
  return footprint ? footprint.w / (footprint.w + footprint.h) : 0.5
}
