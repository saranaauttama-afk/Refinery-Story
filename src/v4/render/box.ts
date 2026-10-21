// Temporary top-down 3/4 stand-in for buildings that have no art yet: a concrete slab
// and a simple block in the building's accent colour. Origin = the slab's bottom centre.
import type { Command } from './buildings/shapes'
import { buildingDef } from '../data/buildings'
import { TILE } from './iso'

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v =>
    Math.max(0, Math.min(255, Math.round(v * f))),
  )
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`
}
export function boxCommands(id: string, level = 1): Command[] {
  const d = buildingDef(id)
  const W = d.w * TILE,
    D = d.h * TILE
  const deco = d.category === 'deco'
  const hgt = deco ? 14 + level * 2 : Math.min(18 + d.height * 0.35 + level * 3, D + 20)
  const x0 = -W / 2 + 5,
    x1 = W / 2 - 5,
    y0 = -D + 5,
    y1 = -5
  const out: Command[] = []
  if (!deco)
    out.push({ kind: 'rect', x: -W / 2 + 1, y: -D + 1, w: W - 2, h: D - 2, color: '#C9C7C0' })
  if (deco) {
    out.push({ kind: 'ellipse', x: -8, y: -6, w: 16, h: 6, color: '#3E5A2A' })
    out.push({ kind: 'rect', x: -5, y: -hgt, w: 10, h: hgt - 2, color: d.accent })
    out.push({ kind: 'rect', x: -5, y: -hgt, w: 10, h: 4, color: shade(d.accent, 1.3) })
    return out
  }
  out.push({
    kind: 'rect',
    x: x0,
    y: y0 - hgt,
    w: x1 - x0,
    h: y1 - y0,
    color: shade(d.accent, 1.25),
  })
  out.push({ kind: 'rect', x: x0, y: y1 - hgt, w: x1 - x0, h: hgt, color: d.accent })
  out.push({ kind: 'rect', x: x0, y: y1 - 4, w: x1 - x0, h: 4, color: shade(d.accent, 0.7) })
  // Windows / bands so it reads as a building, not a plain box.
  for (let i = 0; i < Math.max(1, d.w * 2 - 1); i++)
    out.push({ kind: 'rect', x: x0 + 6 + i * 14, y: y1 - hgt + 6, w: 7, h: 6, color: '#DCEBF5' })
  return out
}
