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

// The nine starter sprites are one matched 256x256 set with a built-in base.
// Keep one profile per building across Lv1-Lv3 so upgrading changes the plant,
// never its tile contact point or footprint.
const STARTER_PLANT_PROFILES: Partial<Record<BuildingType, PlantSpriteProfile>> = {
  distillationUnit: {
    scale: 1.3,
    anchorX: 0.5,
    anchorY: 0.88,
    groundOffsetX: 0,
    groundOffsetY: 9,
  },
  crudeTank: {
    scale: 1.2,
    anchorX: 0.5,
    anchorY: 0.88,
    groundOffsetX: -2,
    groundOffsetY: 9,
  },
  gasolineTank: {
    scale: 1.2,
    anchorX: 0.5,
    anchorY: 0.88,
    groundOffsetX: 2,
    groundOffsetY: 9,
  },
}

export function getPlantSpriteProfile(cell: BuildingType, _level: number): PlantSpriteProfile {
  return STARTER_PLANT_PROFILES[cell] ?? DEFAULT_PROFILE
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
