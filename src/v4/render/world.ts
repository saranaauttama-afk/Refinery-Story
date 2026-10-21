// The coastal world around the yard, top-down 3/4 on a square grid (one tile = 32 px).
// Presentation only: nothing here reads or changes game rules. Owned parcels stay the
// source of the buildable yard; the yard's top-left corner (tile 0,0) never moves, so
// the sea, quay and highway sit above it and a side road runs down its left edge.
import {
  Skia,
  FilterMode,
  MipmapMode,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia'
import { tdAtlas } from './tdAtlas'
import { TILE } from './iso'
import { YARD } from '../data/balance'
import { drawCommands } from './draw'

type Pt = { x: number; y: number }
const paint = () => {
  const p = Skia.Paint()
  p.setAntiAlias(false)
  return p
}
const hash = (x: number, y: number, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Rows above the yard (tile y): sea … | quay | quay | road | road | yard (y ≥ 0).
export const SEA_EDGE = -4 // first quay row
export const ROAD = [-2, -1] // top highway rows; also the side road columns x = -2, -1
export const LANE = -1 // the lane trucks use (row y = -1 / column x = -1)
const X0 = -14,
  X1 = YARD.maxSize + 14,
  Y0 = -14,
  Y1 = YARD.maxSize + 14
export const PIER = { x: 12, w: 2, len: 4 } // tiles x..x+w-1, from y = SEA_EDGE-1 up len rows

/** Draw one atlas sprite with its anchor at (x, y). */
export function sprite(
  c: SkCanvas,
  img: SkImage,
  name: string,
  x: number,
  y: number,
  scale = 1,
  alpha = 1,
  shadow = false,
) {
  const r = tdAtlas[name]
  if (!r) return
  const [sx, sy, w, h, ax, ay, k] = r
  const s = k * scale
  if (shadow) {
    const sp = paint()
    sp.setColor(Skia.Color('#0B2A33'))
    sp.setAlphaf(0.2 * alpha)
    const sw = w * s * 0.75
    c.drawOval(Skia.XYWHRect(x - sw / 2 + sw * 0.15, y - sw * 0.12, sw, sw * 0.3), sp)
  }
  const p = paint()
  if (alpha < 1) p.setAlphaf(alpha)
  c.drawImageRectOptions(
    img,
    Skia.XYWHRect(sx, sy, w, h),
    Skia.XYWHRect(x - ax * s, y - ay * s, w * s, h * s),
    FilterMode.Nearest,
    MipmapMode.None,
    p,
  )
}
/** One ground tile from a seamless 2×2 texture set. */
function tex(c: SkCanvas, img: SkImage, name: string, x: number, y: number) {
  const ix = ((x % 2) + 2) % 2,
    iy = ((y % 2) + 2) % 2
  sprite(c, img, `tex_${name}${ix}${iy}`, x * TILE, y * TILE)
}

const isSideRoad = (x: number, y: number) => ROAD.includes(x) && y >= ROAD[0]
const isTopRoad = (x: number, y: number) => ROAD.includes(y) && x >= ROAD[0]
export const isRoad = (x: number, y: number) => isSideRoad(x, y) || isTopRoad(x, y)

/** Trucks: the sim's straight approach is drawn along the highway into the gate. */
export function approachTile(p: Pt, _gate?: Pt): Pt {
  void _gate
  if (p.x >= 0 && p.y >= 0) return p
  if (p.y < 0) {
    // Gate on the top edge: the sim approaches from (gate.x, -i); drive in along the lane.
    const i = -p.y
    return { x: p.x - (i - 1), y: LANE }
  }
  const i = -p.x
  return { x: LANE, y: p.y - (i - 1) }
}

/** Static world: sea, quay, pier, highway, grass, locked land and trees. */
export function drawWorld(c: SkCanvas, img: SkImage, parcels: string[], _gate?: Pt) {
  void _gate
  const owned = new Set<string>()
  for (const parcel of parcels) {
    const [px, py] = parcel.split(',').map(Number)
    for (let x = px * YARD.parcel; x < (px + 1) * YARD.parcel; x++)
      for (let y = py * YARD.parcel; y < (py + 1) * YARD.parcel; y++) owned.add(`${x},${y}`)
  }
  const near = (x: number, y: number, r: number) => {
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) if (owned.has(`${x + dx},${y + dy}`)) return true
    return false
  }
  const ink = paint(),
    stripe = paint(),
    lane = paint(),
    foam = paint()
  ink.setColor(Skia.Color('#2A2A2E'))
  stripe.setColor(Skia.Color('#F2C230'))
  lane.setColor(Skia.Color('#F4EBD0'))
  foam.setColor(Skia.Color('#E8FBFF'))
  const decor: { depth: number; draw: () => void }[] = []
  const pier = (x: number, y: number) =>
    x >= PIER.x && x < PIER.x + PIER.w && y < SEA_EDGE && y >= SEA_EDGE - PIER.len
  for (let y = Y0; y <= Y1; y++)
    for (let x = X0; x <= X1; x++) {
      const px = x * TILE,
        py = y * TILE
      if (y < SEA_EDGE) {
        tex(c, img, 'water', x, y)
        if (pier(x, y)) {
          tex(c, img, 'quay', x, y)
          // A dark lip round the deck and yellow bollards along both sides.
          if (y === SEA_EDGE - PIER.len) c.drawRect(Skia.XYWHRect(px, py, TILE, 2), ink)
          if (x === PIER.x) c.drawRect(Skia.XYWHRect(px, py, 2, TILE), ink)
          if (x === PIER.x + PIER.w - 1) c.drawRect(Skia.XYWHRect(px + TILE - 2, py, 2, TILE), ink)
          if (y % 2 === 0) {
            if (x === PIER.x) c.drawRect(Skia.XYWHRect(px + 4, py + 12, 5, 6), stripe)
            if (x === PIER.x + PIER.w - 1)
              c.drawRect(Skia.XYWHRect(px + TILE - 9, py + 12, 5, 6), stripe)
          }
        }
        continue
      }
      if (y < ROAD[0]) {
        // Quay: paving, a dark lip and foam at the sea, bollards along the edge.
        tex(c, img, 'quay', x, y)
        if (y === SEA_EDGE && !(x >= PIER.x && x < PIER.x + PIER.w)) {
          c.drawRect(Skia.XYWHRect(px, py, TILE, 3), ink)
          c.drawRect(Skia.XYWHRect(px, py - 2, TILE, 2), foam)
          if (x % 2 === 0) c.drawRect(Skia.XYWHRect(px + 13, py + 5, 6, 6), stripe)
        }
        if (y === ROAD[0] - 1 && x % 5 === 0)
          decor.push({ depth: y + 0.9, draw: () => drawLamp(c, px + 16, py + 26) })
        continue
      }
      if (isRoad(x, y)) {
        tex(c, img, 'asphalt', x, y)
        // Yellow-black kerbs on the outside edges, a dashed line between the lanes.
        if (y === ROAD[0] && x >= ROAD[0])
          for (let k = 0; k < 4; k++)
            c.drawRect(Skia.XYWHRect(px + k * 8, py, 8, 3), k % 2 ? ink : stripe)
        if (x === ROAD[0] && y >= ROAD[0])
          for (let k = 0; k < 4; k++)
            c.drawRect(Skia.XYWHRect(px, py + k * 8, 3, 8), k % 2 ? ink : stripe)
        if (y === ROAD[1] && x > ROAD[1] && x % 2 === 0)
          c.drawRect(Skia.XYWHRect(px + 6, py, 18, 2), lane)
        if (x === ROAD[1] && y > ROAD[1] && y % 2 === 0)
          c.drawRect(Skia.XYWHRect(px, py + 6, 2, 18), lane)
        continue
      }
      const buyable = x >= 0 && y >= 0 && x < YARD.maxSize && y < YARD.maxSize
      if (owned.has(`${x},${y}`)) {
        tex(c, img, 'concrete', x, y)
        continue
      }
      tex(c, img, buyable ? 'locked' : 'grass', x, y)
      if (near(x, y, 1) || (x >= ROAD[0] - 1 && x <= 0) || (y >= ROAD[0] - 1 && y <= 0)) continue
      const r = hash(x, y, 9),
        density = buyable ? 0.03 : 0.2
      const ox = (hash(x, y, 13) - 0.5) * 14,
        oy = (hash(x, y, 14) - 0.5) * 10
      if (r < density)
        decor.push({
          depth: y + 0.8,
          draw: () =>
            sprite(
              c,
              img,
              `tree${Math.floor(hash(x, y, 10) * 7)}`,
              px + 16 + ox,
              py + 26 + oy,
              1.25,
              1,
              true,
            ),
        })
      else if (r < density * 1.6)
        decor.push({
          depth: y + 0.7,
          draw: () =>
            sprite(
              c,
              img,
              `bush${Math.floor(hash(x, y, 11) * 4)}`,
              px + 16 + ox,
              py + 24 + oy,
              0.9,
              1,
              true,
            ),
        })
      else if (!buyable && r < density * 1.9)
        decor.push({
          depth: y + 0.8,
          draw: () =>
            sprite(
              c,
              img,
              `palm${Math.floor(hash(x, y, 12) * 5)}`,
              px + 16 + ox,
              py + 28 + oy,
              1.2,
              1,
              true,
            ),
        })
    }
  decor.sort((a, b) => a.depth - b.depth).forEach(d => d.draw())
}
function drawLamp(c: SkCanvas, x: number, y: number) {
  drawCommands(c, [
    { kind: 'rect', x: x - 1, y: y - 22, w: 3, h: 22, color: '#5B6470' },
    { kind: 'rect', x: x - 1, y: y - 24, w: 9, h: 3, color: '#5B6470' },
    { kind: 'rect', x: x + 5, y: y - 22, w: 4, h: 2, color: '#FFE38A' },
    { kind: 'rect', x: x - 3, y: y - 1, w: 7, h: 3, color: '#73818F' },
  ])
}

// ---------- Ambient life (drawn every frame, skipped when motion is reduced) ----------
const glints = (() => {
  const out: Pt[] = []
  for (let x = X0; x <= X1; x++)
    for (let y = Y0; y < SEA_EDGE - 1; y++)
      if (hash(x, y, 21) < 0.05) out.push({ x: x * TILE + 8, y: y * TILE + 14 })
  return out
})()
const cycle = (t: number, period: number) => (t % period) / period
const pingPong = (f: number) => (f < 0.5 ? f * 2 : 2 - f * 2)

/** Things on or over the sea, drawn under the yard's buildings. */
export function drawSeaLife(c: SkCanvas, img: SkImage, t: number) {
  const white = paint()
  white.setColor(Skia.Color('#FFFFFF'))
  glints.forEach((g, i) => {
    const a = Math.sin(t * 1.7 + i * 2.3)
    if (a > 0.55) {
      white.setAlphaf((a - 0.55) * 1.8)
      c.drawRect(Skia.XYWHRect(Math.round(g.x + (i % 5)), Math.round(g.y), 6, 2), white)
    }
  })
  // Tanker sails in from the left, berths beside the pier, then leaves to the right.
  const berth = { x: (PIER.x + PIER.w + 2.2) * TILE, y: (SEA_EDGE - 1.6) * TILE }
  const f = cycle(t, 150)
  let sx = berth.x
  if (f < 0.3) sx = X0 * TILE + (berth.x - X0 * TILE) * (1 - (1 - f / 0.3) ** 2)
  else if (f > 0.7) sx = berth.x + (X1 * TILE - berth.x) * ((f - 0.7) / 0.3) ** 2
  sprite(c, img, 'ship_east', sx, berth.y + Math.sin(t * 1.3), 1.6)
  // Fishing boat drifting back and forth further out.
  const b = pingPong(cycle(t, 60))
  sprite(
    c,
    img,
    cycle(t, 60) < 0.5 ? 'fishboat_east' : 'fishboat_west',
    (X0 + 6 + b * 20) * TILE,
    (SEA_EDGE - 6.5) * TILE + Math.sin(t * 2),
    1.1,
  )
  // A fish leaps now and then.
  const jf = cycle(t, 7)
  if (jf < 0.16 && glints.length) {
    const g = glints[Math.floor(t / 7) % glints.length],
      k = jf / 0.16
    sprite(c, img, 'fish0', g.x + k * 14, g.y - Math.sin(k * Math.PI) * 16, 0.7)
  }
}

/** Cars on the highway (top road both ways, then down the side road). */
export function drawTraffic(c: SkCanvas, img: SkImage, t: number, _gate?: Pt) {
  void _gate
  const span = (X1 - X0) * TILE
  const east = cycle(t, 34),
    west = cycle(t + 13, 41)
  sprite(c, img, 'car_east', X0 * TILE + east * span, (ROAD[1] + 0.7) * TILE, 0.75)
  sprite(c, img, 'car_west', X1 * TILE - west * span, (ROAD[0] + 0.7) * TILE, 0.75)
  const down = cycle(t + 5, 38),
    vspan = (Y1 - ROAD[0]) * TILE
  sprite(c, img, 'car_south', (ROAD[0] + 0.5) * TILE, ROAD[0] * TILE + down * vspan, 0.75)
}

/** Clouds with their ground shadows, and a gull flock now and then (over everything). */
export function drawSky(c: SkCanvas, img: SkImage, t: number) {
  const shadow = paint()
  shadow.setColor(Skia.Color('#123B4A'))
  shadow.setAlphaf(0.1)
  const span = (X1 - X0) * TILE
  for (let i = 0; i < 3; i++) {
    const x = X0 * TILE + ((t * (8 + i * 3) + i * span * 0.37) % span),
      y = (-8 + i * 14) * TILE
    c.drawOval(Skia.XYWHRect(x - 40, y + 120, 90, 26), shadow)
    sprite(c, img, `cloud${i % 5}`, x, y, 1.6, 0.85)
  }
  const f = cycle(t, 26)
  if (f < 0.35) {
    const k = f / 0.35,
      bx = X0 * TILE + span * k,
      by = (SEA_EDGE - 3) * TILE + k * 60
    for (let i = 0; i < 3; i++)
      sprite(
        c,
        img,
        `gull${Math.floor(t * 4 + i) % 2}`,
        bx - i * 22,
        by + i * 12 + Math.sin(t * 3 + i) * 3,
        0.9,
      )
  }
}

/** Animated smoke from a stack; anchor is the stack top. */
export function drawSmoke(c: SkCanvas, img: SkImage, t: number, x: number, y: number) {
  sprite(c, img, `smoke${Math.floor(t * 10) % 16}`, x, y, 1.1, 0.9)
}
/** Level-up sparkle burst; f runs 0 → 1 over its life. */
export function drawSparkle(c: SkCanvas, img: SkImage, f: number, x: number, y: number) {
  sprite(c, img, `spark${Math.min(7, Math.floor(f * 8))}`, x, y, 1.4)
}
/** Truck sprite for a direction of travel in tile space. */
export function truckName(kind: string, dx: number, dy: number) {
  const v = kind === 'crude' ? 'crude' : 'product'
  const dir =
    Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : dy >= 0 ? 'south' : 'north'
  return `${v}_${dir}`
}
