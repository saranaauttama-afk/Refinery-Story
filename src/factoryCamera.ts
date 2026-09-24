export const FACTORY_MIN_SCALE = 0.58
export const FACTORY_MAX_SCALE = 2.4
export const FACTORY_INITIAL_SCALE = 0.74

// The backdrop is deliberately larger than the viewport even at minimum zoom.
// This lets the camera move without ever revealing the View behind the world.
export const FACTORY_WORLD_BLEED = 96

// A player may explore the painted yard, but the playable grid can never be
// moved completely offscreen. This is the minimum visible strip on each axis.
export const FACTORY_PLAYABLE_VISIBLE = 64

export type CameraAxisBounds = { min: number; max: number }

export function clampCameraValue(value: number, min: number, max: number) {
  'worklet'
  return Math.min(max, Math.max(min, value))
}

export function getMinimumWorldExtent(viewportSize: number) {
  return viewportSize / FACTORY_MIN_SCALE + FACTORY_WORLD_BLEED * 2
}

/** Free-exploration bounds. The world may move on both axes until its outer
 * edge reaches the viewport, without forcing the refinery grid to stay visible. */
export function getWorldCameraAxisBounds(
  viewportSize: number,
  worldSize: number,
  scale: number,
): CameraAxisBounds {
  'worklet'
  const scaledWorld = worldSize * scale
  if (scaledWorld <= viewportSize) {
    const centered = (viewportSize - scaledWorld) / 2
    return { min: centered, max: centered }
  }
  return { min: viewportSize - scaledWorld, max: 0 }
}

/**
 * Returns camera translation limits for one axis.
 *
 * Two invariants are enforced together:
 * 1. The transformed backdrop always covers the viewport.
 * 2. At least FACTORY_PLAYABLE_VISIBLE px of the playable grid remains visible.
 */
export function getCameraAxisBounds(
  viewportSize: number,
  worldSize: number,
  scale: number,
  playableStart: number,
  playableEnd: number,
): CameraAxisBounds {
  'worklet'
  const scaledWorld = worldSize * scale

  if (scaledWorld <= viewportSize) {
    const centered = (viewportSize - scaledWorld) / 2
    return { min: centered, max: centered }
  }

  const coverMin = viewportSize - scaledWorld
  const coverMax = 0
  const playableMin = FACTORY_PLAYABLE_VISIBLE - playableEnd * scale
  const playableMax = viewportSize - FACTORY_PLAYABLE_VISIBLE - playableStart * scale
  const min = Math.max(coverMin, playableMin)
  const max = Math.min(coverMax, playableMax)

  if (min <= max) return { min, max }

  // This is only possible on an unusually small viewport or an extremely
  // small playable region. Prefer a deterministic centered grid while still
  // keeping the backdrop inside its coverage bounds.
  const playableCenter = ((playableStart + playableEnd) / 2) * scale
  const centered = clampCameraValue(viewportSize / 2 - playableCenter, coverMin, coverMax)
  return { min: centered, max: centered }
}

export function screenPointToWorld(
  screenX: number,
  screenY: number,
  translateX: number,
  translateY: number,
  scale: number,
) {
  return {
    x: (screenX - translateX) / scale,
    y: (screenY - translateY) / scale,
  }
}
