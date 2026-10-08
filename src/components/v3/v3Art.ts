import type { ImageSourcePropType } from 'react-native'
import type { BuildingType } from '../../game/types'
import groundAnchors from '../../../assets/plants/yard-v2/anchors.json'
import { getV3Footprint } from '../../game/v3/yard'
import codeArtEffects from '../../../assets/plants/starter/effects.json'

export type V3ArtEmitter = { kind: 'smoke' | 'lamp'; x: number; y: number }

/**
 * Code-drawn art (tools/artkit) — exact to Doc/ART_ASSET_LIST_V3.md §2, so the
 * pad's bottom tip is always at w/(w+h) of the width. Types listed here win over
 * the yard-v2 set; the rest keep yard-v2 art until artkit versions land.
 */
const CODE_ART: Partial<Record<BuildingType, Record<1 | 2 | 3, ImageSourcePropType>>> = {
  distillationUnit: { 1: require('../../../assets/plants/starter/distillation_unit_lv1.png'), 2: require('../../../assets/plants/starter/distillation_unit_lv2.png'), 3: require('../../../assets/plants/starter/distillation_unit_lv3.png') },
  crudeTank: { 1: require('../../../assets/plants/starter/crude_tank_lv1.png'), 2: require('../../../assets/plants/starter/crude_tank_lv2.png'), 3: require('../../../assets/plants/starter/crude_tank_lv3.png') },
  gasolineTank: { 1: require('../../../assets/plants/starter/gasoline_tank_lv1.png'), 2: require('../../../assets/plants/starter/gasoline_tank_lv2.png'), 3: require('../../../assets/plants/starter/gasoline_tank_lv3.png') },
}

/** Animated effect anchors for code-drawn art, as fractions of the sprite (exported by tools/artkit/build.py). */
export function getV3BuildingEffects(type: BuildingType, level: number): V3ArtEmitter[] {
  if (!isV3CodeArt(type)) return []
  const name = ART_NAMES[type]
  const entry = name ? (codeArtEffects as Record<string, { emitters: V3ArtEmitter[] }>)[`${name}_lv${Math.min(3, Math.max(1, level))}`] : undefined
  return entry?.emitters ?? []
}

export function isV3CodeArt(type: BuildingType): boolean {
  return CODE_ART[type] !== undefined
}

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
  const clamped = Math.min(3, Math.max(1, level)) as 1 | 2 | 3
  return CODE_ART[type]?.[clamped] ?? PLANT_ART[type]?.[clamped] ?? null
}

// Measure actual bottom pad tips; non-square bases are asymmetric.
export function getV3BuildingAnchor(type: BuildingType, level: number): number {
  if (isV3CodeArt(type)) {
    const footprint = getV3Footprint(type, level)
    return footprint ? footprint.w / (footprint.w + footprint.h) : 0.5
  }
  const name = ART_NAMES[type]
  const anchors: Record<string, number[]> = groundAnchors
  return name ? anchors[name]?.[Math.min(3, Math.max(1, level)) - 1] ?? 0.5 : 0.5
}
