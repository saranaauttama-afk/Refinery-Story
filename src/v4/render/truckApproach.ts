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
