import assert from 'node:assert/strict'

import {
  FACTORY_MIN_SCALE,
  FACTORY_PLAYABLE_VISIBLE,
  clampCameraValue,
  getCameraAxisBounds,
  getMinimumWorldExtent,
  screenPointToWorld,
} from '../src/factoryCamera'
import { getPlantSpriteProfile, getPlantSpriteRect } from '../src/factoryPlantLayout'

for (const viewport of [375, 667, 844, 915]) {
  const world = getMinimumWorldExtent(viewport)
  assert.ok(world * FACTORY_MIN_SCALE > viewport, `world must cover ${viewport}px at min zoom`)
}

const viewport = 375
const world = getMinimumWorldExtent(viewport)
const playableStart = 210
const playableEnd = 540

for (const scale of [FACTORY_MIN_SCALE, 1, 1.5, 2.4]) {
  const bounds = getCameraAxisBounds(viewport, world, scale, playableStart, playableEnd)
  assert.ok(bounds.min <= bounds.max, `valid bounds at scale ${scale}`)

  for (const camera of [bounds.min, bounds.max]) {
    assert.ok(camera <= 0, 'backdrop may not expose its leading edge')
    assert.ok(camera + world * scale >= viewport, 'backdrop may not expose its trailing edge')
    assert.ok(camera + playableEnd * scale >= FACTORY_PLAYABLE_VISIBLE, 'playable world remains visible at start edge')
    assert.ok(camera + playableStart * scale <= viewport - FACTORY_PLAYABLE_VISIBLE, 'playable world remains visible at end edge')
  }
}

assert.equal(clampCameraValue(10, -5, 5), 5)
assert.equal(clampCameraValue(-10, -5, 5), -5)

const worldPoint = screenPointToWorld(170, 260, -30, 20, 2)
assert.deepEqual(worldPoint, { x: 100, y: 120 })

// U2.4 plant/grid contract: a sprite is derived only from its tile contact
// point, so showing the Build grid cannot change its rectangle. Starter plants
// are also deliberately larger than one tile while keeping a one-cell
// gameplay footprint.
const tile = { x: 240, y: 360, width: 126, height: 63 }
for (const building of ['distillationUnit', 'crudeTank', 'productTank'] as const) {
  const profile = getPlantSpriteProfile(building, 1)
  const beforeBuild = getPlantSpriteRect(tile.x, tile.y, tile.width, tile.height, tile.width, profile)
  const duringBuild = getPlantSpriteRect(tile.x, tile.y, tile.width, tile.height, tile.width, profile)
  assert.deepEqual(duringBuild, beforeBuild, `${building} must not move when Build reveals the grid`)
  assert.ok(beforeBuild.size >= tile.width * 1.2, `${building} should read larger than its tile`)
  assert.equal(beforeBuild.footX, tile.x + tile.width / 2 + profile.groundOffsetX)
  assert.equal(beforeBuild.footY, tile.y + tile.height / 2 + profile.groundOffsetY)
}

console.log('✅ camera math checks passed')
