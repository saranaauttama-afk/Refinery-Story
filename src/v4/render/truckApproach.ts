import { SALES } from '../data/balance'
type Pt = { x: number; y: number }
// Logical lead tiles keep their original duration. Map their visual ends outside the scene,
// then follow an axis-aligned public lane and turn only at the actual north/west gate.
export function approachTile(p: Pt, gate?: Pt, outbound = false): Pt {
  if (p.x >= 0 && p.y >= 0) return p
  const north = p.y < 0,
    g = gate ?? (north ? { x: p.x, y: 0 } : { x: 0, y: p.y }),
    i = north ? -p.y : -p.x
  if (i === 1) return north ? { x: g.x, y: -1 } : { x: -1, y: g.y }
  const steps = SALES.approachTiles
  if (north) {
    const lane = outbound ? -2 : -3
    const x =
      i >= steps ? -10 : i === steps - 1 ? -8 : -8 + ((g.x + 8) * (steps - 1 - i)) / (steps - 3)
    return { x, y: lane }
  }
  const lane = outbound ? -2 : -3
  const y =
    i >= steps ? 34 : i === steps - 1 ? 32 : 32 + ((g.y - 32) * (steps - 1 - i)) / (steps - 3)
  return { x: lane, y }
}

const off = (p: Pt) => p.x < 0 || p.y < 0
/**
 * Where to draw a truck (tile coordinates) and which way it faces. `f` is how far it is through
 * the move from path[step] to path[step + 1] (0–1). The off-map approach is one smooth drive at a
 * constant speed along its lane; inside the yard trucks go tile to tile.
 */
export function truckPose(
  path: Pt[],
  step: number,
  f: number,
  gate?: Pt,
  outbound = false,
): { x: number; y: number; dx: number; dy: number } {
  const last = path.length - 1
  const i = Math.max(0, Math.min(step, last))
  const v = path.map(p => approachTile(p, gate, outbound))
  if (i >= last) return { ...v[last], dx: 0, dy: 0 }
  const lead = (k: number) => off(path[k]) || off(path[k + 1])
  if (!lead(i)) {
    const a = v[i],
      b = v[i + 1]
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: b.x - a.x, dy: b.y - a.y }
  }
  // The run of off-map moves this step belongs to, and how far through it the truck is.
  let s0 = i,
    s1 = i + 1
  while (s0 > 0 && lead(s0 - 1)) s0--
  while (s1 < last && lead(s1)) s1++
  const u = (i - s0 + f) / (s1 - s0)
  const lengths: number[] = []
  for (let k = s0; k < s1; k++)
    lengths.push(Math.abs(v[k + 1].x - v[k].x) + Math.abs(v[k + 1].y - v[k].y))
  const total = lengths.reduce((n, l) => n + l, 0)
  let d = u * total
  for (let k = s0; k < s1; k++) {
    const l = lengths[k - s0]
    if (d <= l || k === s1 - 1) {
      const t = l ? Math.min(1, d / l) : 1,
        a = v[k],
        b = v[k + 1]
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y }
    }
    d -= l
  }
  return { ...v[s1], dx: 0, dy: 0 }
}
