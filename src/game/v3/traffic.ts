/**
 * Yard truck traffic — VISUAL ONLY. Trucks never change game state; they show
 * crude deliveries and product pickups that already happened in the economy.
 * Pure and RN-free (checked by scripts/truck-traffic-check.ts); the sampler is
 * marked 'worklet' so the yard can animate it on the UI thread.
 */
import type { BuildingType, ProductKey } from '../types'
import type { V3GameState } from './types'
import { getV3Footprint, isV3LandUnlocked, listV3Buildings } from './yard'
import { getV3DecorCells, type V3DecorKind } from './decorData'
import { getV3ProductQuantity } from './productInventory'
import type { V3RoadNode } from './yardView'

export type V3TruckLine = 'crude' | 'gasoline' | 'lubricant' | 'jet' | 'petrochemical' | 'polymer'
/** Sprite facing: se = +x, sw = +y, nw = −x, ne = −y (tile axes). Index order matters for the sampler. */
export const V3_TRUCK_DIRS = ['se', 'sw', 'nw', 'ne'] as const
export type V3TruckDir = (typeof V3_TRUCK_DIRS)[number]

export type V3TruckRequest = { id: string; line: V3TruckLine; buildingId: string; kind: 'delivery' | 'pickup' }

/** A round trip along tile-grid lines: drive in, dwell at the building, drive back out. */
export type V3TruckTrip = {
  id: string
  line: V3TruckLine
  xs: number[]
  ys: number[]
  /** cumulative distance (tiles) at each point */
  cum: number[]
  length: number
  /** total duration in simulated ms at 1× speed */
  durationMs: number
  dwellMs: number
  driveMs: number
  /** true when the whole trip runs on player-placed road tiles */
  onRoad: boolean
}

export const V3_TRUCK_SPEED_TILES_PER_S = 4
/** Trucks on player-built roads drive faster — a visible reward for laying roads. */
export const V3_TRUCK_ROAD_SPEED_TILES_PER_S = 6
/** Decoration kinds a truck may drive on. */
export const V3_DRIVABLE_DECOR: ReadonlySet<V3DecorKind> = new Set<V3DecorKind>(['road', 'parkingLot'])
export const V3_TRUCK_DWELL_MS = 1_800
export const V3_TRUCK_LEAD_IN = 5

const PRODUCT_LINES: Array<{ product: ProductKey; line: V3TruckLine; storage: BuildingType }> = [
  { product: 'gasoline', line: 'gasoline', storage: 'gasolineTank' },
  { product: 'lubricants', line: 'lubricant', storage: 'lubricantTank' },
  { product: 'jetFuel', line: 'jet', storage: 'jetFuelTank' },
  { product: 'petrochemicals', line: 'petrochemical', storage: 'petrochemicalTank' },
  { product: 'plasticPellets', line: 'polymer', storage: 'pelletSilo' },
]

function firstBuildingOf(state: V3GameState, type: BuildingType): string | null {
  return listV3Buildings(state).find((building) => building.type === type)?.id ?? null
}

/**
 * What moved between two states that a truck should show: crude bought → a
 * delivery to a crude tank; product stock down while money went up → a pickup
 * at that product's storage. Production alone never spawns a truck.
 */
export function detectV3TruckRequests(before: V3GameState, after: V3GameState): Array<Omit<V3TruckRequest, 'id'>> {
  const out: Array<Omit<V3TruckRequest, 'id'>> = []
  if (after.world.crudeOil - before.world.crudeOil >= 1) {
    const tank = firstBuildingOf(after, 'crudeTank')
    if (tank) out.push({ line: 'crude', buildingId: tank, kind: 'delivery' })
  }
  if (after.world.moneyCents > before.world.moneyCents) {
    for (const entry of PRODUCT_LINES) {
      if (getV3ProductQuantity(before, entry.product) - getV3ProductQuantity(after, entry.product) < 1) continue
      const storage = firstBuildingOf(after, entry.storage)
      if (storage) out.push({ line: entry.line, buildingId: storage, kind: 'pickup' })
    }
  }
  return out
}

const key = (x: number, y: number) => `${x},${y}`

/** Shortest path over the road graph (BFS, grid-line nodes). */
export function findV3RoadRoute(roads: V3RoadNode[], from: { x: number; y: number }, to: { x: number; y: number }): Array<{ x: number; y: number }> | null {
  const byKey = new Map(roads.map((node) => [key(node.x, node.y), node]))
  if (!byKey.has(key(from.x, from.y)) || !byKey.has(key(to.x, to.y))) return null
  const prev = new Map<string, string | null>([[key(from.x, from.y), null]])
  const queue = [from]
  while (queue.length) {
    const at = queue.shift()!
    if (at.x === to.x && at.y === to.y) break
    const node = byKey.get(key(at.x, at.y))!
    const next = [
      node.links.n && { x: at.x, y: at.y - 1 },
      node.links.s && { x: at.x, y: at.y + 1 },
      node.links.e && { x: at.x + 1, y: at.y },
      node.links.w && { x: at.x - 1, y: at.y },
    ].filter(Boolean) as Array<{ x: number; y: number }>
    for (const step of next) {
      const k = key(step.x, step.y)
      if (prev.has(k)) continue
      prev.set(k, key(at.x, at.y))
      queue.push(step)
    }
  }
  if (!prev.has(key(to.x, to.y))) return null
  const path: Array<{ x: number; y: number }> = []
  for (let k: string | null = key(to.x, to.y); k; k = prev.get(k) ?? null) {
    const [x, y] = k.split(',').map(Number)
    path.unshift({ x, y })
  }
  return path
}

/**
 * Which way is "off the land" from an outline node: the side whose two tiles
 * are both unowned. Screen-front sides first so trucks mostly arrive from below.
 */
export function getV3OutwardDir(state: V3GameState, node: { x: number; y: number }): { dx: number; dy: number } | null {
  const free = (x: number, y: number) => !isV3LandUnlocked(state, x, y)
  const { x, y } = node
  if (free(x - 1, y) && free(x, y)) return { dx: 0, dy: 1 }
  if (free(x, y - 1) && free(x, y)) return { dx: 1, dy: 0 }
  if (free(x - 1, y - 1) && free(x - 1, y)) return { dx: -1, dy: 0 }
  if (free(x - 1, y - 1) && free(x, y - 1)) return { dx: 0, dy: -1 }
  return null
}

/** Remove repeated points and merge straight runs so each segment has one facing. */
function simplify(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  for (const point of points) {
    const last = out[out.length - 1]
    if (last && last.x === point.x && last.y === point.y) continue
    if (out.length >= 2) {
      const a = out[out.length - 2]
      if ((a.x === last.x && last.x === point.x) || (a.y === last.y && last.y === point.y)) { out[out.length - 1] = point; continue }
    }
    out.push(point)
  }
  return out
}

/**
 * Round-trip route for a request: off-map lead-in → gate → roads → nearest road
 * node to the building's front corner → short spur to that corner. Null when the
 * building or the road network is missing.
 */
export function planV3TruckTrip(state: V3GameState, roads: V3RoadNode[], request: V3TruckRequest): V3TruckTrip | null {
  const byRoad = planV3RoadTrip(state, request)
  if (byRoad) return byRoad
  const building = state.world.buildingsById[request.buildingId]
  if (!building) return null
  const footprint = getV3Footprint(building.type, building.level) ?? { w: 1, h: 1 }
  const front = { x: building.x + footprint.w, y: building.y + footprint.h }
  // Enter at the outline node nearest the building's front corner, from outside the land.
  let gate: V3RoadNode | null = null
  let outward: { dx: number; dy: number } | null = null
  for (const node of roads) {
    const dir = getV3OutwardDir(state, node)
    if (!dir) continue
    const distance = Math.abs(node.x - front.x) + Math.abs(node.y - front.y)
    if (!gate || distance < Math.abs(gate.x - front.x) + Math.abs(gate.y - front.y)) { gate = node; outward = dir }
  }
  if (!gate || !outward) return null
  const lead = { x: gate.x + outward.dx * V3_TRUCK_LEAD_IN, y: gate.y + outward.dy * V3_TRUCK_LEAD_IN }
  // Spur into the yard along grid lines: across the edge first, then along it.
  const spur = outward.dx !== 0 ? [{ x: front.x, y: gate.y }, front] : [{ x: gate.x, y: front.y }, front]
  return tripFromPoints(request, simplify([lead, { x: gate.x, y: gate.y }, ...spur]), V3_TRUCK_SPEED_TILES_PER_S, false)
}

function tripFromPoints(request: V3TruckRequest, points: Array<{ x: number; y: number }>, speed: number, onRoad: boolean): V3TruckTrip {
  const cum = [0]
  for (let index = 1; index < points.length; index++) {
    cum.push(cum[index - 1] + Math.abs(points[index].x - points[index - 1].x) + Math.abs(points[index].y - points[index - 1].y))
  }
  const length = cum[cum.length - 1]
  const driveMs = (length / speed) * 1000
  return {
    id: request.id,
    line: request.line,
    xs: points.map((point) => point.x),
    ys: points.map((point) => point.y),
    cum,
    length,
    driveMs,
    dwellMs: V3_TRUCK_DWELL_MS,
    durationMs: driveMs * 2 + V3_TRUCK_DWELL_MS,
    onRoad,
  }
}

const NEIGHBOURS = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }] as const

/** Tiles covered by drivable decorations (roads, parking). */
export function getV3DrivableCells(state: V3GameState): Set<string> {
  const cells = new Set<string>()
  for (const decoration of Object.values(state.world.decorations ?? {})) {
    if (!V3_DRIVABLE_DECOR.has(decoration.kind)) continue
    for (const cell of getV3DecorCells(decoration.kind, decoration.rotated, decoration.x, decoration.y)) cells.add(key(cell.x, cell.y))
  }
  return cells
}

/**
 * Trip along player-built road tiles (tile centres): from outside the land,
 * through a road tile on the land edge, over connected road tiles to one that
 * touches the building. Null when no such connected road exists.
 */
export function planV3RoadTrip(state: V3GameState, request: V3TruckRequest): V3TruckTrip | null {
  const building = state.world.buildingsById[request.buildingId]
  if (!building) return null
  const drivable = getV3DrivableCells(state)
  if (drivable.size === 0) return null
  const footprint = getV3Footprint(building.type, building.level) ?? { w: 1, h: 1 }
  const inBuilding = (x: number, y: number) => x >= building.x && x < building.x + footprint.w && y >= building.y && y < building.y + footprint.h
  // Multi-source BFS from every edge road tile (a tile with an off-land neighbour).
  const prev = new Map<string, string | null>()
  const exitOf = new Map<string, { dx: number; dy: number }>()
  const queue: Array<{ x: number; y: number }> = []
  for (const cell of drivable) {
    const [x, y] = cell.split(',').map(Number)
    const out = NEIGHBOURS.find(({ dx, dy }) => !isV3LandUnlocked(state, x + dx, y + dy))
    if (!out) continue
    prev.set(cell, null); exitOf.set(cell, out); queue.push({ x, y })
  }
  let goal: string | null = null
  while (queue.length && !goal) {
    const at = queue.shift()!
    if (NEIGHBOURS.some(({ dx, dy }) => inBuilding(at.x + dx, at.y + dy))) { goal = key(at.x, at.y); break }
    for (const { dx, dy } of NEIGHBOURS) {
      const next = key(at.x + dx, at.y + dy)
      if (!drivable.has(next) || prev.has(next)) continue
      prev.set(next, key(at.x, at.y))
      queue.push({ x: at.x + dx, y: at.y + dy })
    }
  }
  if (!goal) return null
  const cells: Array<{ x: number; y: number }> = []
  let edge = goal
  for (let k: string | null = goal; k; k = prev.get(k) ?? null) {
    const [x, y] = k.split(',').map(Number)
    cells.unshift({ x, y })
    edge = k
  }
  const out = exitOf.get(edge)!
  const start = cells[0]
  const lead = { x: start.x + 0.5 + out.dx * V3_TRUCK_LEAD_IN, y: start.y + 0.5 + out.dy * V3_TRUCK_LEAD_IN }
  const points = simplify([lead, ...cells.map((cell) => ({ x: cell.x + 0.5, y: cell.y + 0.5 }))])
  if (points.length < 2) return null
  return tripFromPoints(request, points, V3_TRUCK_ROAD_SPEED_TILES_PER_S, true)
}

/**
 * Position (tile coords) and facing index into V3_TRUCK_DIRS at `elapsedMs`
 * since the trip started. `done` once it has driven back out.
 */
export function sampleV3TruckTrip(
  xs: number[], ys: number[], cum: number[], driveMs: number, dwellMs: number, elapsedMs: number,
): { x: number; y: number; dir: number; done: boolean } {
  'worklet'
  const length = cum[cum.length - 1]
  if (length <= 0) return { x: xs[0] ?? 0, y: ys[0] ?? 0, dir: 0, done: true }
  let distance: number
  let returning = false
  if (elapsedMs <= driveMs) distance = (elapsedMs / driveMs) * length
  else if (elapsedMs <= driveMs + dwellMs) distance = length
  else { returning = true; distance = Math.max(0, length - ((elapsedMs - driveMs - dwellMs) / driveMs) * length) }
  let segment = 1
  while (segment < cum.length - 1 && cum[segment] < distance) segment++
  const span = cum[segment] - cum[segment - 1]
  const f = span > 0 ? (distance - cum[segment - 1]) / span : 0
  const dx = xs[segment] - xs[segment - 1]
  const dy = ys[segment] - ys[segment - 1]
  const sx = returning ? -Math.sign(dx) : Math.sign(dx)
  const sy = returning ? -Math.sign(dy) : Math.sign(dy)
  const dir = sx > 0 ? 0 : sy > 0 ? 1 : sx < 0 ? 2 : 3
  return {
    x: xs[segment - 1] + dx * f,
    y: ys[segment - 1] + dy * f,
    dir,
    done: returning && elapsedMs >= driveMs * 2 + dwellMs,
  }
}
