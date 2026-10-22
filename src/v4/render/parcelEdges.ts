import { YARD } from '../data/balance'
export type Edge = { x: number; y: number; side: 'n' | 'e' | 's' | 'w' }
export function ownedTiles(parcels: readonly string[]): Set<string> {
  const tiles = new Set<string>()
  for (const key of parcels) {
    const [px, py] = key.split(',').map(Number)
    for (let y = py * YARD.parcel; y < (py + 1) * YARD.parcel; y++)
      for (let x = px * YARD.parcel; x < (px + 1) * YARD.parcel; x++) tiles.add(`${x},${y}`)
  }
  return tiles
}
export function parcelEdges(
  parcels: readonly string[],
  gates: readonly { x: number; y: number }[] = [],
): Edge[] {
  const tiles = ownedTiles(parcels),
    out: Edge[] = []
  for (const key of tiles) {
    const [x, y] = key.split(',').map(Number)
    for (const [dx, dy, side] of [
      [0, -1, 'n'],
      [1, 0, 'e'],
      [0, 1, 's'],
      [-1, 0, 'w'],
    ] as const) {
      if (tiles.has(`${x + dx},${y + dy}`)) continue
      if (
        gates.some(
          g =>
            (side === 'n' && g.y === 0 && y === 0 && x === g.x) ||
            (side === 'w' && g.x === 0 && x === 0 && y >= g.y && y < g.y + 2),
        )
      )
        continue
      out.push({ x, y, side })
    }
  }
  return out
}
