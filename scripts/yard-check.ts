import assert from 'node:assert/strict'

import { V3_FOOTPRINTS, V3_LAND_PARCELS, V3_WORLD_SIZE } from '../src/game/v3/data'
import { runV3ProductionTick } from '../src/game/v3/production'
import { V3_STARTER_BUILDINGS, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'
import {
  getV3BuildingAt,
  getV3Footprint,
  getV3FootprintCells,
  getV3Occupancy,
  getV3UnlockedArea,
  validateV3Placement,
} from '../src/game/v3/yard'
import {
  V3_TILE_PX,
  deriveV3RoadNetwork,
  getV3BuildingViews,
  getV3ParcelViews,
  getV3PlacementPreview,
  getV3UpgradePreview,
  getV3VisibleTileRange,
  getV3YardBounds,
  getV3Calendar,
  getV3SpritePlacements,
  v3IsoPoint,
  v3IsoToTile,
} from '../src/game/v3/yardView'
import { act, assertBlocked, attempt, buildAnywhere } from './v3-check-helpers'

const DISTILL = V3_STARTER_BUILDINGS.distillationUnit.id

/** Labelled fixture: chapter/cash set directly to isolate one yard rule. */
function at(chapter: 0 | 1 | 2 | 3 | 4 | 5, moneyCents = 100_000_000): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter }, world: { ...base.world, moneyCents } }
}

// ---- Data: one footprint table, parcels inside the 100×100 world ----
assert.equal(V3_WORLD_SIZE, 100)
for (const [type, levels] of Object.entries(V3_FOOTPRINTS)) {
  assert.equal(levels!.length, 3, `${type} has Lv1..3 footprints`)
  for (let index = 1; index < 3; index++) {
    assert.ok(levels![index].w >= levels![index - 1].w && levels![index].h >= levels![index - 1].h, `${type} never shrinks`)
  }
}
for (const parcel of V3_LAND_PARCELS) {
  assert.ok(parcel.x >= 0 && parcel.y >= 0 && parcel.x + parcel.w <= V3_WORLD_SIZE && parcel.y + parcel.h <= V3_WORLD_SIZE)
}
const areaAfter = (ring: number) => V3_LAND_PARCELS.filter((parcel) => parcel.id === 'core' || Number(parcel.id.slice(4, 5)) <= ring)
  .reduce((sum, parcel) => sum + parcel.w * parcel.h, 0)
assert.deepEqual([0, 1, 2, 3].map(areaAfter), [100, 196, 400, 784], '10×10 → 14×14 → 20×20 → 28×28')
// Parcels never overlap each other.
const covered = new Set<string>()
for (const parcel of V3_LAND_PARCELS) {
  for (let x = parcel.x; x < parcel.x + parcel.w; x++) for (let y = parcel.y; y < parcel.y + parcel.h; y++) {
    assert.ok(!covered.has(`${x},${y}`), `parcel overlap at ${x},${y}`)
    covered.add(`${x},${y}`)
  }
}

// ---- Placement: multi-cell footprint, overlap, bounds, locked land, atomic failure ----
let state = at(2)
assert.equal(getV3UnlockedArea(state), 100)
state = act(state, { type: 'build', x: 45, y: 45, building: 'powerPlant' })
const power = getV3BuildingAt(state, 46, 46)!
assert.equal(power.type, 'powerPlant', '2×2 footprint occupies all four cells')
assert.equal(getV3Occupancy(state).get('46,46'), power.id)
state = assertBlocked(state, { type: 'build', x: 46, y: 46, building: 'crudeTank' }, 'v3.place.overlap')
state = assertBlocked(state, { type: 'build', x: 44, y: 45, building: 'crudeTank' }, 'v3.place.locked_land')
state = assertBlocked(state, { type: 'build', x: 54, y: 54, building: 'lubricantPlant' }, 'v3.place.locked_land')
state = assertBlocked(state, { type: 'build', x: 99, y: 99, building: 'lubricantPlant' }, 'v3.place.out_of_bounds')
state = assertBlocked(state, { type: 'build', x: -1, y: 50, building: 'crudeTank' }, 'v3.place.out_of_bounds')
state = assertBlocked(state, { type: 'build', x: 45.5, y: 50, building: 'crudeTank' }, 'v3.place.out_of_bounds')
state = assertBlocked(state, { type: 'build', x: 45, y: 53, building: 'jetFuelPlant' }, 'v3.build.locked')

// ---- Land unlock: cost, chapter, ring order, idempotence ----
let land = at(1)
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'ring1:north' }, 'v3.land.locked')
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'nowhere' }, 'v3.land.unknown')
land = at(2, 100_000)
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'ring1:north' }, 'v3.land.insufficient_cash')
land = at(2)
land = act(land, { type: 'unlock_land_parcel', parcelId: 'ring1:north' })
assert.equal(getV3UnlockedArea(land), 100 + 14 * 2)
assert.equal(100_000_000 - land.world.moneyCents, 150_000)
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'ring1:north' }, 'v3.land.owned')
land = act(land, { type: 'build', x: 43, y: 43, building: 'crudeTank' })

// ---- Upgrade: footprint grows right/down; collision or locked land costs nothing ----
let upgrade = at(2)
upgrade = act(upgrade, { type: 'build', x: 45, y: 45, building: 'laboratory' })
const lab = getV3BuildingAt(upgrade, 45, 45)!.id
upgrade = act(upgrade, { type: 'build', x: 46, y: 45, building: 'crudeTank' })
const cash = upgrade.world.moneyCents
upgrade = assertBlocked(upgrade, { type: 'upgrade', buildingId: lab }, 'v3.place.overlap')
assert.equal(upgrade.world.moneyCents, cash, 'blocked upgrade charges nothing')
assert.equal(upgrade.world.buildingsById[lab].level, 1)
const crude = getV3BuildingAt(upgrade, 46, 45)!.id
upgrade = act(upgrade, { type: 'move_building', buildingId: crude, x: 45, y: 52 })
upgrade = act(upgrade, { type: 'upgrade', buildingId: lab })
assert.equal(upgrade.world.buildingsById[lab].level, 2)
assert.equal(getV3BuildingAt(upgrade, 46, 46)!.id, lab, 'Lv2 lab covers 2×2')
// Edge of unlocked land blocks growth.
let edge = at(2)
edge = act(edge, { type: 'build', x: 54, y: 45, building: 'crudeTank' })
const edgeTank = getV3BuildingAt(edge, 54, 45)!.id
assertBlocked(edge, { type: 'upgrade', buildingId: edgeTank }, 'v3.place.locked_land')
// Upgrade makes the level real in production.
let distill = at(2)
const workBefore = runV3ProductionTick({ ...distill, world: { ...distill.world, crudeOil: 60 } }, 25).lines[0].requestedWork
distill = act(distill, { type: 'upgrade', buildingId: DISTILL })
const workAfter = runV3ProductionTick({ ...distill, world: { ...distill.world, crudeOil: 60 } }, 25).lines[0].requestedWork
assert.ok(workAfter > workBefore, 'Lv2 rate applies')
assert.deepEqual(getV3Footprint('distillationUnit', 2), { w: 2, h: 2 })

// ---- Move: whole footprint validated; state keyed by ID survives ----
let move = at(2)
const niran = move.world.employees[0].id
move = act(move, { type: 'set_program', buildingId: DISTILL, blueprintId: Object.keys(move.productBlueprints)[0] })
const beforeMove = move
move = assertBlocked(move, { type: 'move_building', buildingId: DISTILL, x: 45, y: 48 }, 'v3.place.overlap')
move = assertBlocked(move, { type: 'move_building', buildingId: DISTILL, x: 60, y: 60 }, 'v3.place.locked_land')
move = assertBlocked(move, { type: 'move_building', buildingId: 'building:none', x: 46, y: 46 }, 'v3.building.missing')
move = act(move, { type: 'move_building', buildingId: DISTILL, x: 46, y: 51 })
assert.deepEqual(move.plantPrograms[DISTILL], beforeMove.plantPrograms[DISTILL])
assert.deepEqual(move.employeeDuties[niran], { kind: 'line', buildingId: DISTILL })
assert.equal(move.world.moneyCents, beforeMove.world.moneyCents)
assert.deepEqual(move.variantInventory, beforeMove.variantInventory)
assert.equal(getV3BuildingAt(move, 48, 48), null, 'old cell is free')

// ---- Demolish safeguards ----
let demolish = at(2)
demolish = act(demolish, { type: 'build', x: 45, y: 45, building: 'laboratory' })
const labId = getV3BuildingAt(demolish, 45, 45)!.id
demolish = assertBlocked(demolish, { type: 'demolish', buildingId: labId, expectedBuilding: 'crudeTank' }, 'v3.demolish.building_changed')
demolish = { ...demolish, world: { ...demolish.world, crudeOil: 55 } }
demolish = assertBlocked(demolish, { type: 'demolish', buildingId: V3_STARTER_BUILDINGS.crudeTank.id, expectedBuilding: 'crudeTank' }, 'v3.demolish.stock_overflow')
demolish = { ...demolish, world: { ...demolish.world, feedstock: 65 } }
demolish = assertBlocked(demolish, { type: 'demolish', buildingId: DISTILL, expectedBuilding: 'distillationUnit' }, 'v3.demolish.stock_overflow')

// ---- Building-type caps (shared validator) ----
let caps = at(0)
caps = assertBlocked(caps, { type: 'build', x: 45, y: 45, building: 'distillationUnit' }, 'v3.place.building_limit')
caps = at(2)
caps = buildAnywhere(caps, 'distillationUnit').state
assertBlocked(caps, { type: 'build', x: 45, y: 45, building: 'distillationUnit' }, 'v3.place.building_limit')
caps = buildAnywhere(caps, 'laboratory').state
assertBlocked(caps, { type: 'build', x: 45, y: 53, building: 'laboratory' }, 'v3.place.building_limit')
caps = buildAnywhere(caps, 'powerPlant').state
assertBlocked(caps, { type: 'build', x: 52, y: 52, building: 'powerPlant' }, 'v3.place.building_limit')
let tanks = at(2)
for (let index = 0; index < 4; index++) tanks = buildAnywhere(tanks, 'crudeTank').state
assert.equal(Object.values(tanks.world.buildingsById).filter((building) => building.type === 'crudeTank').length, 5, 'tanks are uncapped')

// ---- Renderer-independent occupancy consistency after many actions ----
function assertConsistent(target: V3GameState) {
  const occupancy = getV3Occupancy(target)
  let cells = 0
  for (const building of Object.values(target.world.buildingsById)) {
    const footprint = getV3FootprintCells(building.type, building.level, building.x, building.y)
    cells += footprint.length
    for (const cell of footprint) assert.equal(occupancy.get(`${cell.x},${cell.y}`), building.id)
    assert.equal(validateV3Placement(target, building.type, building.level, building.x, building.y, building.id), null)
  }
  assert.equal(occupancy.size, cells, 'no two buildings share a cell')
}
for (const sample of [state, land, upgrade, edge, move, caps, tanks]) assertConsistent(sample)

// ---- Reload/reset round-trip; tampered saves are rejected ----
const saved = JSON.parse(JSON.stringify(upgrade))
const reloaded = parseV3GameState(saved)
assert.equal(reloaded.status, 'loaded')
assert.deepEqual(reloaded.state, upgrade)
const overlapping = JSON.parse(JSON.stringify(upgrade))
overlapping.world.buildingsById[crude].x = 46
overlapping.world.buildingsById[crude].y = 46
assert.equal(parseV3GameState(overlapping).status, 'invalid', 'overlap in a save is rejected')
const offLand = JSON.parse(JSON.stringify(upgrade))
offLand.world.buildingsById[crude].x = 20
assert.equal(parseV3GameState(offLand).status, 'invalid', 'building on locked land is rejected')
const skippedRing = JSON.parse(JSON.stringify(land))
skippedRing.world.unlockedParcelIds.push('ring2:west')
assert.equal(parseV3GameState(skippedRing).status, 'invalid', 'parcel without its prerequisite is rejected')
const reset = createInitialV3GameState()
assert.deepEqual(reset.world.unlockedParcelIds, ['core'])
assert.equal(Object.keys(reset.world.buildingsById).length, 3)
// ---- Renderer model: only owned + adjacent parcels, culling, previews, roads ----
const fresh = createInitialV3GameState()
const views = getV3ParcelViews(fresh)
assert.deepEqual(views.map((view) => view.id).sort(), ['core', 'ring1:east', 'ring1:north', 'ring1:south', 'ring1:west'])
assert.ok(views.filter((view) => view.id !== 'core').every((view) => view.state === 'locked'), 'C0: ring1 shown as locked with a reason')
assert.deepEqual(getV3YardBounds(fresh), { x: 43, y: 43, w: 14, h: 14 }, 'camera bounds cover drawn land, not 100×100')
const visible = getV3VisibleTileRange({ width: 240, height: 240 }, { tx: -43 * V3_TILE_PX, ty: -43 * V3_TILE_PX, scale: 1 })
assert.deepEqual([visible.x, visible.y, visible.w, visible.h], [43, 43, 11, 11])
const preview = getV3PlacementPreview(fresh, 'powerPlant', 1, 54, 54)
assert.equal(preview.status, 'locked_land')
assert.equal(preview.cells.length, 4)
assert.equal(getV3PlacementPreview(fresh, 'powerPlant', 1, 45, 45).status, 'valid')
const distillPreview = getV3UpgradePreview(fresh, DISTILL)!
assert.equal(distillPreview.growth.length, 3, 'Lv1 1×1 → Lv2 2×2 adds three tiles')
assert.equal(distillPreview.status, 'valid')
const crowded = act(at(2), { type: 'build', x: 49, y: 48, building: 'crudeTank' })
assert.equal(getV3UpgradePreview(crowded, DISTILL)!.status, 'overlap', 'preview shows the blocker before paying')
const roads = deriveV3RoadNetwork(fresh)
assert.equal(roads.length, 40, 'core outline has 40 grid nodes')
assert.equal(roads.filter((node) => node.kind === 'corner').length, 4)
assert.ok(roads.every((node) => node.kind === 'corner' || node.kind === 'straight'))
const joined = act(at(2), { type: 'unlock_land_parcel', parcelId: 'ring1:north' })
assert.ok(deriveV3RoadNetwork(joined).some((node) => node.kind === 'tee'), 'parcel seams create junctions')
assert.deepEqual(getV3BuildingViews(fresh).map((view) => [view.type, view.w, view.h]).sort(), [['crudeTank', 1, 1], ['distillationUnit', 1, 1], ['gasolineTank', 1, 1]])
// ---- V3-20 isometric projection, sprite order and calendar ----
for (const [x, y] of [[45, 45], [50, 49], [0, 0], [99, 3]]) {
  const point = v3IsoPoint(x + 0.5, y + 0.5)
  assert.deepEqual(v3IsoToTile(point.sx, point.sy), { x, y }, 'tap on a tile centre maps back to that tile')
}
const placements = getV3SpritePlacements(crowded)
for (let index = 1; index < placements.length; index++) assert.ok(placements[index - 1].depth <= placements[index].depth, 'sprites drawn back to front')
assert.deepEqual(getV3Calendar(0), { year: 1, month: 1, week: 1 })
assert.deepEqual(getV3Calendar(299), { year: 1, month: 1, week: 4 })
assert.deepEqual(getV3Calendar(3_600), { year: 2, month: 1, week: 1 }, 'one in-game year = one award period')
void attempt

console.log('PASS: V3-15.5 yard: footprints, parcels 10→28, multi-cell placement, overlap/bounds/locked land, atomic upgrade growth, move, demolish guards, caps, occupancy, reload/reset, renderer model (culling, previews, roads, iso projection, calendar)')
