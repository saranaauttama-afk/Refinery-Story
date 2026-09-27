import type { ImageSourcePropType } from 'react-native'

import type { BuildingType } from './game/types'

// One native PNG source for every starter-plant surface. Keeping the mapping
// here prevents the Factory canvas, build picker, info sheet, Operations flow,
// and navigation glyph from silently drifting back to different art sets.
export const STARTER_PLANT_ART_BY_LEVEL: Partial<
  Record<BuildingType, Record<number, ImageSourcePropType>>
> = {
  crudeTank: {
    1: require('../assets/plants/starter/crude_tank_lv1.png'),
    2: require('../assets/plants/starter/crude_tank_lv2.png'),
    3: require('../assets/plants/starter/crude_tank_lv3.png'),
  },
  distillationUnit: {
    1: require('../assets/plants/starter/distillation_unit_lv1.png'),
    2: require('../assets/plants/starter/distillation_unit_lv2.png'),
    3: require('../assets/plants/starter/distillation_unit_lv3.png'),
  },
  gasolineTank: {
    1: require('../assets/plants/starter/gasoline_tank_lv1.png'),
    2: require('../assets/plants/starter/gasoline_tank_lv2.png'),
    3: require('../assets/plants/starter/gasoline_tank_lv3.png'),
  },
}

export function getStarterPlantArt(
  building: BuildingType,
  level = 1,
): ImageSourcePropType | undefined {
  const levels = STARTER_PLANT_ART_BY_LEVEL[building]
  return levels?.[level] ?? levels?.[1]
}
