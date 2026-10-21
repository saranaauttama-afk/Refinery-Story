// Top-down 3/4 projection on a square grid: one tile is TILE x TILE world pixels.
// (File name kept from the isometric era so imports stay stable.)
export const TILE = 32
export const toScreen = (x: number, y: number) => ({ x: x * TILE, y: y * TILE })
export const toTile = (x: number, y: number) => ({
  x: Math.floor(x / TILE),
  y: Math.floor(y / TILE),
})
