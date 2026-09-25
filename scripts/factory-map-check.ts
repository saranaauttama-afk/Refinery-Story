import assert from 'node:assert/strict'

import {
  FACTORY_MAP_SLOTS,
  FACTORY_MAX_GRID_SIZE,
  FACTORY_PLANNED_GRID_SIZE,
  FACTORY_WORLD_HEIGHT,
  FACTORY_WORLD_WIDTH,
  FACTORY_YARD_TILE_SIZE,
  getActiveGridIndex,
  getFactoryTerrainTiles,
  pointIsInsideFactorySlot,
} from '../src/factoryMap'
import { getPlantSpriteProfile, getPlantSpriteRect } from '../src/factoryPlantLayout'

assert.equal(FACTORY_PLANNED_GRID_SIZE, 5)
assert.equal(FACTORY_MAX_GRID_SIZE, 6)
assert.equal(FACTORY_YARD_TILE_SIZE, 19)
assert.equal(FACTORY_MAP_SLOTS.length, 36)
assert.equal(new Set(FACTORY_MAP_SLOTS.map((slot) => slot.id)).size, 36)

const plannedTerrain = getFactoryTerrainTiles(5)
assert.equal(plannedTerrain.length, 16 * 16)
const roadTiles = plannedTerrain.filter((tile) => tile.kind === 'road')
const lotTiles = plannedTerrain.filter((tile) => tile.kind === 'lot')
assert.equal(roadTiles.length, 156)
assert.equal(lotTiles.length, 25 * 4)
assert.equal(roadTiles.filter((tile) => tile.roadAlongRow && tile.roadAlongCol).length, 36)
assert.equal(roadTiles.filter((tile) => tile.roadAlongRow && !tile.roadAlongCol).length, 60)
assert.equal(roadTiles.filter((tile) => !tile.roadAlongRow && tile.roadAlongCol).length, 60)
assert.ok(lotTiles.every((tile) => !tile.roadAlongRow && !tile.roadAlongCol))

for (const size of [3, 4, 5, 6]) {
  const active = FACTORY_MAP_SLOTS
    .map((slot) => getActiveGridIndex(slot, size))
    .filter((index): index is number => index !== null)
  assert.equal(active.length, size * size)
  assert.equal(new Set(active).size, size * size)
  assert.equal(Math.min(...active), 0)
  assert.equal(Math.max(...active), size * size - 1)
}

for (const slot of FACTORY_MAP_SLOTS) {
  assert.ok(slot.topX >= 0 && slot.topX <= FACTORY_WORLD_WIDTH)
  assert.ok(slot.topY >= 0 && slot.topY + slot.height <= FACTORY_WORLD_HEIGHT)
  assert.ok(pointIsInsideFactorySlot(slot.centerX, slot.centerY, slot))
  assert.ok(!pointIsInsideFactorySlot(slot.centerX + slot.width, slot.centerY, slot))
}

const starterTypes = ['crudeTank', 'distillationUnit', 'gasolineTank'] as const
for (const type of starterTypes) {
  const rects = [1, 2, 3].map((level) =>
    getPlantSpriteRect(0, 0, 128, 64, 128, getPlantSpriteProfile(type, level)),
  )
  assert.ok(rects[0].size < rects[1].size && rects[1].size < rects[2].size)
  assert.equal(new Set(rects.map((rect) => rect.footX)).size, 1)
  assert.equal(new Set(rects.map((rect) => rect.footY)).size, 1)
  assert.ok(rects.every((rect) => rect.size < 152))
}

console.log('✅ factory map checks passed')
