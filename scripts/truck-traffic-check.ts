import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState } from '../src/game/v3/state'
import { getV3Footprint, isV3LandUnlocked } from '../src/game/v3/yard'
import { deriveV3RoadNetwork } from '../src/game/v3/yardView'
import {
  V3_TRUCK_LEAD_IN,
  detectV3TruckRequests,
  findV3RoadRoute,
  getV3OutwardDir,
  planV3TruckTrip,
  sampleV3TruckTrip,
} from '../src/game/v3/traffic'

const state = createInitialV3GameState()
const roads = deriveV3RoadNetwork(state)
assert.ok(roads.length > 0, 'starter land has a road outline')

// ---- Road graph is connected; every outline node has an outward side ----
for (const node of roads) assert.ok(findV3RoadRoute(roads, roads[0], node), `road node ${node.x},${node.y} reachable`)
for (const node of roads) assert.ok(getV3OutwardDir(state, node), `outline node ${node.x},${node.y} faces off-land`)

// ---- Every starter building gets a clean round trip ----
const buildings = Object.values(state.world.buildingsById)
assert.ok(buildings.length > 0)
for (const building of buildings) {
  const trip = planV3TruckTrip(state, roads, { id: building.id, line: 'crude', buildingId: building.id, kind: 'delivery' })
  assert.ok(trip, `${building.type} is routable`)
  const { xs, ys, cum } = trip
  // starts off the land, exactly V3_TRUCK_LEAD_IN tiles out from an outline node, then enters at that node
  // (a straight run in may merge the lead-in with the spur, so look for the gate along the first leg)
  const firstDx = Math.sign(xs[1] - xs[0]); const firstDy = Math.sign(ys[1] - ys[0])
  const gateX = xs[0] + firstDx * V3_TRUCK_LEAD_IN; const gateY = ys[0] + firstDy * V3_TRUCK_LEAD_IN
  assert.ok(Math.abs(xs[1] - xs[0]) + Math.abs(ys[1] - ys[0]) >= V3_TRUCK_LEAD_IN)
  assert.ok(roads.some((node) => node.x === gateX && node.y === gateY), 'enters at an outline node')
  assert.ok(!isV3LandUnlocked(state, Math.floor(xs[0]), Math.floor(ys[0])) && !isV3LandUnlocked(state, Math.ceil(xs[0]) - 1, Math.ceil(ys[0]) - 1), 'lead-in starts off the land')
  // ends at the building's front corner
  const footprint = getV3Footprint(building.type, building.level)!
  assert.deepEqual([xs.at(-1), ys.at(-1)], [building.x + footprint.w, building.y + footprint.h], `${building.type} dock`)
  // grid-aligned segments only (one facing per segment), no zero-length legs
  for (let index = 1; index < xs.length; index++) {
    const dx = xs[index] - xs[index - 1]
    const dy = ys[index] - ys[index - 1]
    assert.ok((dx === 0) !== (dy === 0), `segment ${index} is axis-aligned and non-empty`)
  }
  assert.equal(cum.at(-1), trip.length)
  assert.equal(trip.durationMs, trip.driveMs * 2 + trip.dwellMs)

  // sampler: continuous, dwell at the dock, back at the start when done
  let last = sampleV3TruckTrip(xs, ys, cum, trip.driveMs, trip.dwellMs, 0)
  assert.deepEqual([last.x, last.y, last.done], [xs[0], ys[0], false])
  const stepMs = 50
  for (let t = stepMs; t <= trip.durationMs + stepMs; t += stepMs) {
    const now = sampleV3TruckTrip(xs, ys, cum, trip.driveMs, trip.dwellMs, t)
    const moved = Math.abs(now.x - last.x) + Math.abs(now.y - last.y)
    assert.ok(moved <= (trip.length / trip.driveMs) * stepMs + 1e-6, `no teleport at ${t}ms`)
    assert.ok(now.dir >= 0 && now.dir <= 3)
    last = now
  }
  assert.ok(last.done)
  assert.deepEqual([last.x, last.y], [xs[0], ys[0]])
  const dwell = sampleV3TruckTrip(xs, ys, cum, trip.driveMs, trip.dwellMs, trip.driveMs + trip.dwellMs / 2)
  assert.deepEqual([dwell.x, dwell.y], [xs.at(-1), ys.at(-1)])
  // facing flips on the way back
  const out = sampleV3TruckTrip(xs, ys, cum, trip.driveMs, trip.dwellMs, trip.driveMs * 0.01)
  const back = sampleV3TruckTrip(xs, ys, cum, trip.driveMs, trip.dwellMs, trip.durationMs - trip.driveMs * 0.01)
  assert.equal((out.dir + 2) % 4, back.dir, 'return leg faces the opposite way')
}

// ---- Detection: buying crude → delivery; production alone → nothing ----
const crudeTank = buildings.find((building) => building.type === 'crudeTank')
const poorer = { ...state, world: { ...state.world, crudeOil: 0 } }
const bought = reduceV3Action(poorer, { type: 'trade', sequence: poorer.nextActionSequence, direction: 'buy', product: 'crude', quantity: 10 })
if (crudeTank && bought.changed && bought.state.world.crudeOil > 0) {
  assert.deepEqual(detectV3TruckRequests(poorer, bought.state), [{ line: 'crude', buildingId: crudeTank.id, kind: 'delivery' }])
}
assert.deepEqual(detectV3TruckRequests(state, state), [])
const spent = { ...state, world: { ...state.world, crudeOil: Math.max(0, state.world.crudeOil - 5) } }
assert.deepEqual(detectV3TruckRequests(state, spent), [], 'crude used by production is not a delivery')

// selling stock that was produced → pickup at that product's storage
let stocked = state
for (let index = 0; index < 40; index++) stocked = runV3ProductionTick(stocked, 25).state
const sold = reduceV3Action(stocked, { type: 'trade', sequence: stocked.nextActionSequence, direction: 'sell', product: 'gasoline', quantity: 5 })
const gasolineTank = buildings.find((building) => building.type === 'gasolineTank')
if (gasolineTank && sold.changed) {
  assert.deepEqual(detectV3TruckRequests(stocked, sold.state), [{ line: 'gasoline', buildingId: gasolineTank.id, kind: 'pickup' }])
}
assert.deepEqual(detectV3TruckRequests(state, stocked), [], 'production alone spawns no trucks')

console.log(`truck traffic check ok — ${buildings.length} buildings routed, ${roads.length} road nodes`)
