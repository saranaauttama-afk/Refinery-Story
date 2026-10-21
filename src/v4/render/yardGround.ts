import { YARD } from '../data/balance'
import { toScreen } from './iso'
import { poly, type Command } from './buildings/shapes'

// Presentation only: the owned parcels remain the sole source of the yard boundary.
// One continuous floor, with no slab edges between tiles or adjacent parcels.
export const yardColors = {
  backdrop: '#118EC8',
  grass: '#B0C39D',
  grassLight: '#B6C9A3',
  concrete: '#E5E3D7',
  joint: '#D4D4C7',
  grid: '#ACB8B2',
  curb: '#EEF0E5',
  edge: '#8C9D98',
  edgeDark: '#728780',
}

export function yardGround(parcels: string[], placement: boolean, coastal = false): Command[] {
  const tiles = new Set<string>()
  for (const parcel of parcels) {
    const [px, py] = parcel.split(',').map(Number)
    for (let x = px * YARD.parcel; x < (px + 1) * YARD.parcel; x++)
      for (let y = py * YARD.parcel; y < (py + 1) * YARD.parcel; y++) tiles.add(`${x},${y}`)
  }
  const has = (x: number, y: number) => tiles.has(`${x},${y}`)
  const diamond = (x: number, y: number, color: string) => {
    const p = toScreen(x, y)
    return poly(
      [
        [p.x, p.y],
        [p.x + 16, p.y + 8],
        [p.x, p.y + 16],
        [p.x - 16, p.y + 8],
      ],
      color,
    )
  }
  const surround = new Set<string>()
  for (const tile of tiles) {
    const [x, y] = tile.split(',').map(Number)
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++) if (!has(x + dx, y + dy)) surround.add(`${x + dx},${y + dy}`)
  }
  const commands: Command[] = []
  for (const tile of coastal ? [] : surround) {
    const [x, y] = tile.split(',').map(Number)
    commands.push(
      diamond(x, y, (x * 3 + y * 7) % 5 === 0 ? yardColors.grassLight : yardColors.grass),
    )
  }
  // Only exposed near edges have thickness; newly bought parcels join seamlessly.
  for (const tile of tiles) {
    const [x, y] = tile.split(',').map(Number)
    const p = toScreen(x, y)
    if (!has(x, y + 1))
      commands.push(
        poly(
          [
            [p.x - 16, p.y + 8],
            [p.x, p.y + 16],
            [p.x, p.y + 19],
            [p.x - 16, p.y + 11],
          ],
          yardColors.edge,
        ),
      )
    if (!has(x + 1, y))
      commands.push(
        poly(
          [
            [p.x + 16, p.y + 8],
            [p.x, p.y + 16],
            [p.x, p.y + 19],
            [p.x + 16, p.y + 11],
          ],
          yardColors.edgeDark,
        ),
      )
  }
  for (const tile of tiles) {
    const [x, y] = tile.split(',').map(Number)
    const p = toScreen(x, y)
    commands.push(diamond(x, y, yardColors.concrete))
    // Quiet two-tile expansion joints normally; the exact one-tile grid while placing.
    const line = placement ? yardColors.grid : yardColors.joint
    if (placement || x % 2 === 0)
      commands.push(
        poly(
          [
            [p.x, p.y],
            [p.x - 16, p.y + 8],
            [p.x - 16, p.y + 8.5],
            [p.x, p.y + 0.5],
          ],
          line,
        ),
      )
    if (placement || y % 2 === 0)
      commands.push(
        poly(
          [
            [p.x, p.y],
            [p.x + 16, p.y + 8],
            [p.x + 16, p.y + 8.5],
            [p.x, p.y + 0.5],
          ],
          line,
        ),
      )
    // Flush light edging is decorative: it never changes movement or buildable tiles.
    if (!has(x - 1, y))
      commands.push(
        poly(
          [
            [p.x, p.y],
            [p.x - 16, p.y + 8],
            [p.x - 14, p.y + 8],
            [p.x, p.y + 1],
          ],
          yardColors.curb,
        ),
      )
    if (!has(x, y - 1))
      commands.push(
        poly(
          [
            [p.x, p.y],
            [p.x + 16, p.y + 8],
            [p.x + 14, p.y + 8],
            [p.x, p.y + 1],
          ],
          yardColors.curb,
        ),
      )
    if (!has(x, y + 1))
      commands.push(
        poly(
          [
            [p.x - 16, p.y + 8],
            [p.x, p.y + 16],
            [p.x, p.y + 15],
            [p.x - 14, p.y + 8],
          ],
          yardColors.curb,
        ),
      )
    if (!has(x + 1, y))
      commands.push(
        poly(
          [
            [p.x + 16, p.y + 8],
            [p.x, p.y + 16],
            [p.x, p.y + 15],
            [p.x + 14, p.y + 8],
          ],
          yardColors.curb,
        ),
      )
  }
  return commands
}
