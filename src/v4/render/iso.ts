import { YARD } from '../data/balance'
export const toScreen = (x: number, y: number) => ({
  x: ((x - y) * YARD.tileW) / 2,
  y: ((x + y) * YARD.tileH) / 2,
})
export const toTile = (x: number, y: number) => ({
  x: Math.floor(x / YARD.tileW + y / YARD.tileH),
  y: Math.floor(y / YARD.tileH - x / YARD.tileW),
})
