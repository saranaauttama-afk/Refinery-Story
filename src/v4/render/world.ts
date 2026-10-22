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
import { logicalAtlas, ATLAS_DENSITY } from './logicalAtlas'
import { LANES, seaTiles } from './scenery'
import { TILE } from './iso'
import { coastalShoreY } from './environmentLayout'

type Pt = { x: number; y: number }
const paint = () => {
  const p = Skia.Paint()
  p.setAntiAlias(false)
  return p
}

// Roads round the yard on the map, in tiles from the yard's top-left corner.
// Lanes are the middle of each carriageway: [outer, inner] (inner is nearer the yard).
const TOP = LANES.top,
  LEFT = LANES.left,
  RIGHT = LANES.right,
  BOTTOM = LANES.bottom
export const LANE = -2 // approachTile returns tile coordinates; callers add the tile centre.
const X0 = -8,
  X1 = 40,
  Y0 = -16
const BERTH = { x: 16, y: -10 }

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
  const r = logicalAtlas[name]
  if (!r) return
  const [sx, sy, w, h, ax, ay] = r
  const s = scale / ATLAS_DENSITY
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

// Water paths use the same fixed scene layout as the terrain.
const glints: Pt[] = seaTiles.map(({ x, y }) => ({ x: x * TILE + 8, y: y * TILE + 14 }))
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
  // A tanker crosses the open sea, slows off the harbour mouth, then sails on;
  // a tug keeps it company. Every other trip the blue tanker comes the other way.
  const trip = Math.floor(t / 150),
    f = cycle(t, 150),
    eastbound = trip % 2 === 0
  const left = X0 * TILE - 200,
    right = X1 * TILE + 200,
    stop = BERTH.x * TILE
  const ease = (k: number) => 1 - (1 - k) ** 2
  let sx = stop
  if (f < 0.35)
    sx = (eastbound ? left : right) + (stop - (eastbound ? left : right)) * ease(f / 0.35)
  else if (f > 0.65) sx = stop + ((eastbound ? right : left) - stop) * ((f - 0.65) / 0.35) ** 2
  const dir = eastbound ? 'east' : 'west',
    ship = eastbound ? 'tanker' : 'tanker2',
    sy = (Y0 + 4) * TILE + Math.sin(t * 1.3) * 1.5
  sprite(c, img, `tug_${dir}`, sx + (eastbound ? 170 : -170), sy + 26 + Math.sin(t * 2.1), 1)
  sprite(c, img, `${ship}_${dir}`, sx, sy, 1)
  // Fishing boat drifting back and forth on the open sea.
  const b = pingPong(cycle(t, 60))
  sprite(
    c,
    img,
    cycle(t, 60) < 0.5 ? 'fishboat_east' : 'fishboat_west',
    (-6 + b * 16) * TILE,
    (Y0 + 3) * TILE + Math.sin(t * 2),
    1,
  )
  // A fish leaps now and then.
  const jf = cycle(t, 7)
  if (jf < 0.16 && glints.length) {
    const g = glints[Math.floor(t / 7) % glints.length],
      k = jf / 0.16
    sprite(c, img, 'fish0', g.x + k * 14, g.y - Math.sin(k * Math.PI) * 16, 0.7)
  }
}

/** Small shore foam accents; residents are depth-sorted by the yard renderer. */
export function drawNeighbourhood(c: SkCanvas, _img: SkImage, t: number) {
  const foam = paint()
  foam.setColor(Skia.Color('#EBFFF5'))
  for (let i = 0; i < 18; i++) {
    const x = i < 13 ? -7.8 + i * 0.95 : 35.5 + (i - 13) * 0.8
    const phase = Math.sin(t * 1.6 + i * 2.4)
    foam.setAlphaf(Math.max(0, phase) * 0.4)
    c.drawRect(
      Skia.XYWHRect(
        Math.round(x * TILE),
        Math.round((coastalShoreY(x) - 0.15) * TILE),
        3 + (i % 4),
        0.5,
      ),
      foam,
    )
  }
  foam.dispose()
}

/** A closed loop of lane points (tiles); returns the position and heading at distance d. */
function along(pts: Pt[], d: number) {
  const seg = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length]
    return Math.abs(q.x - p.x) + Math.abs(q.y - p.y)
  })
  const total = seg.reduce((a, b) => a + b, 0)
  let r = ((d % total) + total) % total
  for (let i = 0; i < pts.length; i++) {
    if (r <= seg[i]) {
      const p = pts[i],
        q = pts[(i + 1) % pts.length],
        k = seg[i] ? r / seg[i] : 0
      const dx = q.x - p.x,
        dy = q.y - p.y
      const dir =
        Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : dy >= 0 ? 'south' : 'north'
      return { x: p.x + dx * k, y: p.y + dy * k, dir }
    }
    r -= seg[i]
  }
  return { x: pts[0].x, y: pts[0].y, dir: 'east' }
}
// Clockwise on the inner lanes, anticlockwise on the outer ones.
const inner = [
  { x: LEFT[1], y: TOP[1] },
  { x: RIGHT[1], y: TOP[1] },
  { x: RIGHT[1], y: BOTTOM[1] },
  { x: LEFT[1], y: BOTTOM[1] },
]
const outer = [
  { x: LEFT[0], y: TOP[0] },
  { x: LEFT[0], y: BOTTOM[0] },
  { x: RIGHT[0], y: BOTTOM[0] },
  { x: RIGHT[0], y: TOP[0] },
]

/** Cars driving round the ring road and along the road below the yard. */
export function drawTraffic(c: SkCanvas, img: SkImage, t: number) {
  const car = (kind: string, p: { x: number; y: number; dir: string }) =>
    sprite(c, img, `${kind}_${p.dir}`, p.x * TILE, p.y * TILE + 4)
  car('car', along(inner, t * 2.2))
  car('pickup', along(inner, t * 2.2 + 60))
  car('car2', along(outer, t * 1.9 + 20))
  const span = X1 - X0
  car('car', { x: X1 - ((t * 2.5) % span), y: BOTTOM[1], dir: 'west' })
  car('car2', { x: X0 + ((t * 2.1 + 30) % span), y: BOTTOM[0], dir: 'east' })
}

/** Clouds with their ground shadows, and a gull flock now and then (over everything). */
export function drawSky(c: SkCanvas, img: SkImage, t: number) {
  const shadow = paint()
  shadow.setColor(Skia.Color('#123B4A'))
  shadow.setAlphaf(0.1)
  const span = (X1 - X0) * TILE
  for (let i = 0; i < 2; i++) {
    const x = X0 * TILE + ((t * (8 + i * 3) + i * span * 0.37) % span),
      y = (i === 0 ? -14 : 30) * TILE
    c.drawOval(Skia.XYWHRect(x - 40, y + 120, 90, 26), shadow)
    sprite(c, img, `cloud${i % 5}`, x, y, 1, 0.7)
  }
  const f = cycle(t, 26)
  if (f < 0.35) {
    const k = f / 0.35,
      bx = X0 * TILE + span * k,
      by = (Y0 + 10) * TILE + k * 60
    for (let i = 0; i < 3; i++)
      sprite(
        c,
        img,
        `gull${Math.floor(t * 4 + i) % 3}`,
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
