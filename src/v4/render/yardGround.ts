import { YARD } from '../data/balance'
import { TILE } from './iso'
import { rect, type Command } from './buildings/shapes'

// Presentation only: the owned parcels remain the sole source of the yard boundary.
// The concrete texture comes from the world layer; this adds the grid and the curb.
export const yardColors = {
  backdrop: '#119BF1',
  concrete: '#C9C7C0',
  joint: '#00000014',
  grid: '#14110F38',
  curb: '#EEF0E5',
  edge: '#7E8C88',
}

export function yardGround(parcels: string[], placement: boolean, textured = false): Command[] {
  const tiles = new Set<string>()
  for (const parcel of parcels) {
    const [px, py] = parcel.split(',').map(Number)
    for (let x = px * YARD.parcel; x < (px + 1) * YARD.parcel; x++)
      for (let y = py * YARD.parcel; y < (py + 1) * YARD.parcel; y++) tiles.add(`${x},${y}`)
  }
  const has = (x: number, y: number) => tiles.has(`${x},${y}`)
  const out: Command[] = []
  for (const tile of tiles) {
    const [x, y] = tile.split(',').map(Number)
    const px = x * TILE,
      py = y * TILE
    if (!textured) out.push(rect(px, py, TILE, TILE, yardColors.concrete))
    // The exact one-tile grid while placing; quiet two-tile joints otherwise.
    if (placement) {
      out.push(rect(px, py, TILE, 1, yardColors.grid), rect(px, py, 1, TILE, yardColors.grid))
    } else {
      if (y % 2 === 0) out.push(rect(px, py, TILE, 1, yardColors.joint))
      if (x % 2 === 0) out.push(rect(px, py, 1, TILE, yardColors.joint))
    }
    // Light curb on the outside edges; a darker lip on the bottom and right.
    if (!has(x, y - 1)) out.push(rect(px, py, TILE, 2, yardColors.curb))
    if (!has(x - 1, y)) out.push(rect(px, py, 2, TILE, yardColors.curb))
    if (!has(x, y + 1)) out.push(rect(px, py + TILE - 3, TILE, 3, yardColors.edge))
    if (!has(x + 1, y)) out.push(rect(px + TILE - 3, py, 3, TILE, yardColors.edge))
  }
  return out
}
