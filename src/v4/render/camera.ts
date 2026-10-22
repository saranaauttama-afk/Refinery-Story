import { GRAPHICS } from './graphics'
import { YARD } from '../data/balance'
export interface Camera {
  x: number
  y: number
  zoom: number
}
export interface Viewport {
  w: number
  h: number
}
export function clampCamera(c: Camera, v: Viewport): Camera {
  const b = GRAPHICS.world
  const fit = (p: number, view: number, start: number, len: number, offset: number) => {
    const lo = view - offset - (start + len) * c.zoom,
      hi = -offset - start * c.zoom
    return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, p))
  }
  return { ...c, x: fit(c.x, v.w, b.x, b.width, v.w / 2), y: fit(c.y, v.h, b.y, b.height, 0) }
}
export function focusCamera(c: Camera, tileX: number, tileY: number, v: Viewport): Camera {
  return clampCamera({ x: -tileX * 32 * c.zoom, y: v.h / 2 - tileY * 32 * c.zoom, zoom: c.zoom }, v)
}
export function playCamera(v: Viewport, buildings: readonly { x: number; y: number }[]): Camera {
  // Keep the entry and first operating cluster visible, rather than framing empty land.
  const xs = buildings.map(b => b.x + 1),
    ys = buildings.map(b => b.y + 1)
  const x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 4
  const y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 3
  return focusCamera({ x: 0, y: 0, zoom: GRAPHICS.defaultZoom }, x, y, v)
}
export function overviewCamera(v: Viewport, parcels: readonly string[], extraTop = 0): Camera {
  const points = parcels.map(p => p.split(',').map(Number))
  const left = Math.min(...points.map(p => p[0])) * YARD.parcel * 32 - 32
  const right = (Math.max(...points.map(p => p[0])) + 1) * YARD.parcel * 32 + 32
  const top = Math.min(-32, extraTop)
  const bottom = (Math.max(...points.map(p => p[1])) + 1) * YARD.parcel * 32 + 32
  const zoom = Math.min((v.w - 24) / (right - left), (v.h - 24) / (bottom - top), 1)
  return clampCamera(
    { x: (-(left + right) / 2) * zoom, y: v.h / 2 - ((top + bottom) / 2) * zoom, zoom },
    v,
  )
}
// Change scale about a screen point; zooming must not jump to a different tile.
export function zoomAt(c: Camera, zoom: number, px: number, py: number, v: Viewport): Camera {
  const wx = (px - v.w / 2 - c.x) / c.zoom,
    wy = (py - c.y) / c.zoom
  return clampCamera({ x: px - v.w / 2 - wx * zoom, y: py - wy * zoom, zoom }, v)
}
export function pinchAt(
  c: Camera,
  zoom: number,
  start: { x: number; y: number },
  current: { x: number; y: number },
  v: Viewport,
): Camera {
  const wx = (start.x - v.w / 2 - c.x) / c.zoom,
    wy = (start.y - c.y) / c.zoom
  return clampCamera({ x: current.x - v.w / 2 - wx * zoom, y: current.y - wy * zoom, zoom }, v)
}
export function validCamera(value: unknown): value is Camera {
  if (!value || typeof value !== 'object') return false
  const c = value as Camera
  return [c.x, c.y, c.zoom].every(Number.isFinite) && c.zoom >= 1 && c.zoom <= 2
}
