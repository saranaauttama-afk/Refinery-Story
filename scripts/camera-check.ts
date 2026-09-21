import assert from 'node:assert/strict'

import {
  FACTORY_MIN_SCALE,
  FACTORY_PLAYABLE_VISIBLE,
  clampCameraValue,
  getCameraAxisBounds,
  getMinimumWorldExtent,
  screenPointToWorld,
} from '../src/factoryCamera'

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

console.log('✅ camera math checks passed')

