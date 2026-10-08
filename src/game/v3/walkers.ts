/**
 * Staff walking around the yard — VISUAL ONLY, like the trucks (traffic.ts).
 * Each employee loops between their workplace and a second building along free
 * tiles, pausing at each end. Pure and RN-free; the sampler is a worklet so
 * the yard animates it on the UI thread from simulated time.
 */
import type { BuildingType, WorkerType } from '../types'
import type { V3GameState } from './types'
import { V3_DRIVABLE_DECOR } from './traffic'
import { getV3DecorCells } from './decorData'
import { getV3Footprint, getV3Occupancy, isV3LandUnlocked, listV3Buildings } from './yard'

export type V3Walker = {
  id: string
  role: WorkerType
  xs: number[]
  ys: number[]
  cum: number[]
  walkMs: number
  dwellMs: number
  /** offset into the loop so a crew does not move in lockstep */
  phaseMs: number
}

export const V3_WALK_TILES_PER_S = 1.3
export const V3_WALK_DWELL_MS = 2_600
export const V3_MAX_WALKERS = 12
const MAX_SEARCH = 2_500

const key = (x: number, y: number) => `${x},${y}`

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Where each role likes to go when it is not at its own post. */
const ERRAND: Partial<Record<WorkerType, BuildingType[]>> = {
  operator: ['crudeTank', 'gasolineTank', 'distillationUnit'],
  mechanic: ['maintenanceWorkshop', 'powerPlant', 'distillationUnit'],
  salesAgent: ['salesOffice', 'gasolineTank'],
  chemist: ['laboratory'],
  logisticsCoordinator: ['salesOffice', 'crudeTank'],
  safetyOfficer: ['powerPlant', 'distillationUnit'],
}

function walkableCells(state: V3GameState): (x: number, y: number) => boolean {
  const occupancy = getV3Occupancy(state)
  const drivable = new Set<string>()
  for (const decoration of Object.values(state.world.decorations ?? {})) {
    if (!V3_DRIVABLE_DECOR.has(decoration.kind)) continue
    for (const cell of getV3DecorCells(decoration.kind, decoration.rotated, decoration.x, decoration.y)) drivable.add(key(cell.x, cell.y))
  }
  return (x, y) => isV3LandUnlocked(state, x, y) && (!occupancy.has(key(x, y)) || drivable.has(key(x, y)))
}

/** A free tile touching the building, front (camera-facing) sides first. */
function doorstep(state: V3GameState, buildingId: string, free: (x: number, y: number) => boolean, salt: number): { x: number; y: number } | null {
  const building = state.world.buildingsById[buildingId]
  if (!building) return null
  const { w, h } = getV3Footprint(building.type, building.level) ?? { w: 1, h: 1 }
  const front: Array<{ x: number; y: number }> = []
  for (let i = 0; i < w; i++) front.push({ x: building.x + i, y: building.y + h })
  for (let j = 0; j < h; j++) front.push({ x: building.x + w, y: building.y + j })
  const back: Array<{ x: number; y: number }> = []
  for (let i = 0; i < w; i++) back.push({ x: building.x + i, y: building.y - 1 })
  for (let j = 0; j < h; j++) back.push({ x: building.x - 1, y: building.y + j })
  const options = front.filter((cell) => free(cell.x, cell.y))
  const pool = options.length ? options : back.filter((cell) => free(cell.x, cell.y))
  return pool.length ? pool[salt % pool.length] : null
}

function bfs(from: { x: number; y: number }, to: { x: number; y: number }, free: (x: number, y: number) => boolean): Array<{ x: number; y: number }> | null {
  const prev = new Map<string, string | null>([[key(from.x, from.y), null]])
  const queue = [from]
  for (let head = 0; head < queue.length && head < MAX_SEARCH; head++) {
    const cell = queue[head]
    if (cell.x === to.x && cell.y === to.y) {
      const path: Array<{ x: number; y: number }> = []
      for (let k: string | null = key(cell.x, cell.y); k; k = prev.get(k) ?? null) {
        const [x, y] = k.split(',').map(Number)
        path.unshift({ x, y })
      }
      return path
    }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy }
      const k = key(next.x, next.y)
      if (prev.has(k) || !free(next.x, next.y)) continue
      prev.set(k, key(cell.x, cell.y))
      queue.push(next)
    }
  }
  return null
}

/** Keep only the corners of a tile path, at tile centres. */
function corners(path: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const out = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1]; const b = path[i]; const c = path[i + 1]
    if (b.x - a.x !== c.x - b.x || b.y - a.y !== c.y - b.y) out.push(b)
  }
  if (path.length > 1) out.push(path[path.length - 1])
  return out.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }))
}

function workplace(state: V3GameState, employeeId: string): string | null {
  const duty = state.employeeDuties[employeeId]
  if (duty?.kind === 'line') return duty.buildingId
  const buildings = listV3Buildings(state)
  const find = (type: BuildingType) => buildings.find((building) => building.type === type)?.id ?? null
  if (duty?.kind === 'development') return duty.returnBuildingId ?? find('laboratory')
  return find('maintenanceWorkshop') ?? find('salesOffice') ?? buildings[0]?.id ?? null
}

export function planV3Walkers(state: V3GameState): V3Walker[] {
  const free = walkableCells(state)
  const buildings = listV3Buildings(state)
  const walkers: V3Walker[] = []
  for (const employee of state.world.employees.slice(0, V3_MAX_WALKERS)) {
    const salt = hash(employee.id)
    const home = workplace(state, employee.id)
    if (!home) continue
    const wanted = ERRAND[employee.type] ?? []
    const candidates = buildings.filter((building) => building.id !== home)
    const preferred = candidates.filter((building) => wanted.includes(building.type))
    const pool = preferred.length ? preferred : candidates
    if (!pool.length) continue
    const away = pool[salt % pool.length].id
    const a = doorstep(state, home, free, salt)
    const b = doorstep(state, away, free, salt >>> 3)
    if (!a || !b) continue
    const path = bfs(a, b, free)
    if (!path || path.length < 2) continue
    const points = corners(path)
    const cum = [0]
    for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y))
    const walkMs = (cum[cum.length - 1] / V3_WALK_TILES_PER_S) * 1000
    walkers.push({
      id: employee.id,
      role: employee.type,
      xs: points.map((p) => p.x),
      ys: points.map((p) => p.y),
      cum,
      walkMs,
      dwellMs: V3_WALK_DWELL_MS,
      phaseMs: salt % Math.max(1, Math.round(walkMs * 2 + V3_WALK_DWELL_MS * 2)),
    })
  }
  return walkers
}

/**
 * Position on the endless there-and-back loop: walk, dwell, walk back, dwell.
 * `step` flips every half stride so the renderer can swing the legs.
 */
export function sampleV3Walker(
  xs: number[], ys: number[], cum: number[], walkMs: number, dwellMs: number, elapsedMs: number,
): { x: number; y: number; dir: number; moving: boolean; step: number } {
  'worklet'
  const length = cum[cum.length - 1]
  const period = walkMs * 2 + dwellMs * 2
  if (length <= 0 || period <= 0) return { x: xs[0] ?? 0, y: ys[0] ?? 0, dir: 0, moving: false, step: 0 }
  const t = ((elapsedMs % period) + period) % period
  let distance: number
  let returning = false
  let moving = true
  if (t < walkMs) distance = (t / walkMs) * length
  else if (t < walkMs + dwellMs) { distance = length; moving = false }
  else if (t < walkMs * 2 + dwellMs) { returning = true; distance = length - ((t - walkMs - dwellMs) / walkMs) * length }
  else { distance = 0; moving = false }
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
    moving,
    step: moving ? Math.floor(t / 180) % 2 : 0,
  }
}
