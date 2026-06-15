import type { BuildingType } from './game/types'
import { colors } from './theme'

// Placeholder colors for the grid until real icons are wired in -- chosen to
// roughly track the isometric icon set's per-building palette (assets/icons)
// so swapping in real icons later won't feel like a different game.
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
}
