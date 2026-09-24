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

// U2.4 starter art uses newer v3 canvases with different transparent padding.
// Keep the tuning here instead of scattering one-off offsets through each
// renderer. Higher levels use the shared default until their art is calibrated
// from device screenshots.
const STARTER_LEVEL_ONE_PROFILES: Partial<Record<BuildingType, PlantSpriteProfile>> = {
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
  productTank: {
    scale: 1.2,
    anchorX: 0.5,
    anchorY: 0.88,
    groundOffsetX: 2,
    groundOffsetY: 9,
  },
}

export function getPlantSpriteProfile(cell: BuildingType, level: number): PlantSpriteProfile {
  if (level === 1) return STARTER_LEVEL_ONE_PROFILES[cell] ?? DEFAULT_PROFILE
  return DEFAULT_PROFILE
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
