import type { BuildingType } from './game/types'
import { colors } from './theme'

// Placeholder colors for the grid until the new art pass lands -- chosen to
// preserve the intended per-building palette mapping for future assets.
export const BUILDING_COLORS: Record<BuildingType, string> = {
  crudeTank: colors.steelMid,
  distillationUnit: colors.steelDark,
  productTank: colors.green,
  laboratory: colors.teal,
  maintenanceWorkshop: colors.orange,
  salesOffice: colors.gold,
  lubricantPlant: colors.goldDark,
  jetFuelPlant: colors.blue,
  petrochemicalPlant: colors.purple,
  powerPlant: colors.red,
  wasteTreatmentPlant: colors.greenDark,
  polymerPlant: colors.teal,
  lubricantTank: colors.goldDark,
  jetFuelTank: colors.blue,
  petrochemicalTank: colors.purple,
  recyclingBunker: colors.greenDark,
  pelletSilo: colors.teal,
}
