import type { BuildingType } from './game/types'

export const DEFAULT_PLANT_IMAGE_SCALE = 1.1

export type PlantSpriteProfile = {
  scale: number
  anchorX: number
  anchorY: number
  groundOffsetX: number
  groundOffsetY: number
}

export type PlantSpriteRect = {
  x: number
  y: number
  size: number
  footX: number
  footY: number
}

const DEFAULT_PROFILE: PlantSpriteProfile = {
  scale: DEFAULT_PLANT_IMAGE_SCALE,
  anchorX: 0.5,
  anchorY: 0.94,
  groundOffsetX: 0,
  // The generated square PNGs include transparent space below the visible
  // base. Move the visual contact point slightly into the lower half of the
  // diamond so the plant reads as standing on the tile, not hovering above it.
  groundOffsetY: 8,
}

// Gameplay footprint and ground contact never change, but visual mass must
// still progress Lv1 < Lv2 < Lv3. A single fixed image frame can make a denser
// upgrade feel squeezed, so the matched starter set gets a small, deliberate
// per-level scale increase. The increase is capped so service roads remain
// visible around a full yard.
const starterProfile = (scale: number): PlantSpriteProfile => ({
  scale,
  anchorX: 0.5,
  anchorY: 0.88,
  groundOffsetX: 0,
  groundOffsetY: 9,
})

const STARTER_PLANT_PROFILES: Partial<Record<BuildingType, Record<number, PlantSpriteProfile>>> = {
  crudeTank: {
    1: starterProfile(1.06),
    2: starterProfile(1.10),
    3: starterProfile(1.14),
  },
  distillationUnit: {
    1: starterProfile(1.10),
    2: starterProfile(1.14),
    3: starterProfile(1.18),
  },
  gasolineTank: {
    1: starterProfile(1.06),
    2: starterProfile(1.10),
    3: starterProfile(1.14),
  },
}

export function getPlantSpriteProfile(cell: BuildingType, level: number): PlantSpriteProfile {
  const starterLevels = STARTER_PLANT_PROFILES[cell]
  return starterLevels?.[Math.max(1, Math.min(3, level))] ?? DEFAULT_PROFILE
}

/**
 * Places a square sprite from a single ground-contact point. Grid visibility is
 * deliberately not an input: toggling Build may reveal the diamond, but cannot
 * move or resize the plant that belongs to it.
 */
export function getPlantSpriteRect(
  tileX: number,
  tileY: number,
  tileWidth: number,
  tileHeight: number,
  baseImageWidth: number,
  profile: PlantSpriteProfile,
): PlantSpriteRect {
  const size = baseImageWidth * profile.scale
  const footX = tileX + tileWidth / 2 + profile.groundOffsetX
  const footY = tileY + tileHeight / 2 + profile.groundOffsetY
  return {
    x: footX - size * profile.anchorX,
    y: footY - size * profile.anchorY,
    size,
    footX,
    footY,
  }
}
