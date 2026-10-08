import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

import { reduceV3Action } from '../src/game/v3/actions'
import { createInitialV3GameState } from '../src/game/v3/state'
import { getV3UnlockedArea } from '../src/game/v3/yard'
import {
  V3_GROUND_PARKING,
  V3_GROUND_ROAD_BASE,
  V3_GROUND_SIDEWALK,
  getV3DecorGroundTiles,
  getV3GrassCell,
  getV3GroundModel,
} from '../src/game/v3/groundView'

assert.ok(existsSync('assets/ground/ground_atlas.png'), 'atlas built (tools/artkit/build_ground.py)')

let state = createInitialV3GameState()
// chapter 2 unlocks parking lots (decorData); cash so every placement succeeds
state = { ...state, campaignProgress: { ...state.campaignProgress, chapter: 2 }, world: { ...state.world, moneyCents: 10_000_000 } }
const model = getV3GroundModel(state)
// every owned tile is drawn exactly once
const keys = new Set(model.land.map((tile) => `${tile.x},${tile.y}`))
assert.equal(keys.size, model.land.length, 'no duplicate land tiles')
assert.ok(model.land.length >= getV3UnlockedArea(state), 'owned land fully covered')
assert.ok(model.land.every((tile) => tile.cell >= 0 && tile.cell <= 3), 'land uses grass cells')
assert.equal(getV3GrassCell(5, 9), getV3GrassCell(5, 9), 'grass pattern is stable')
// edges: only on the front sides, one per boundary tile
assert.ok(model.edges.south.length > 0 && model.edges.east.length > 0)
for (const tile of model.edges.south) assert.ok(!keys.has(`${tile.x},${tile.y + 1}`))
for (const tile of model.edges.east) assert.ok(!keys.has(`${tile.x + 1},${tile.y}`))

// roads auto-connect: an L of three tiles + parking + sidewalk
const place = (kind: 'road' | 'parkingLot' | 'sidewalk', x: number, y: number) => {
  const result = reduceV3Action(state, { type: 'place_decoration', sequence: state.nextActionSequence, kind, x, y, rotated: false })
  assert.ok(Object.values(result.state.world.decorations).length > Object.values(state.world.decorations).length, `${kind} at ${x},${y} placed`)
  state = result.state
}
const b = Object.values(state.world.buildingsById)[0]
const x0 = b.x
const y0 = b.y + 4
place('road', x0, y0); place('road', x0 + 1, y0); place('road', x0 + 1, y0 + 1)
place('sidewalk', x0 + 3, y0 + 3)
place('parkingLot', x0 - 2, y0)
const tiles = new Map(getV3DecorGroundTiles(state).map((tile) => [`${tile.x},${tile.y}`, tile.cell]))
assert.equal(tiles.get(`${x0},${y0}`), V3_GROUND_ROAD_BASE + 2 + 8, 'west end joins parking (W) and road (E)')
assert.equal(tiles.get(`${x0 + 1},${y0}`), V3_GROUND_ROAD_BASE + 8 + 4, 'bend: W + S')
assert.equal(tiles.get(`${x0 + 1},${y0 + 1}`), V3_GROUND_ROAD_BASE + 1, 'end: N only')
assert.equal(tiles.get(`${x0 + 3},${y0 + 3}`), V3_GROUND_SIDEWALK)
assert.equal(tiles.get(`${x0 - 2},${y0}`), V3_GROUND_PARKING)
assert.equal(tiles.size, 3 + 1 + 4, 'parking lot is 2x2')

console.log(`ground view check ok — ${model.land.length} land tiles, ${model.edges.south.length + model.edges.east.length} edge faces`)
