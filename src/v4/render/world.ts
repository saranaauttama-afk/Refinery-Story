// The coastal world around the yard, assembled from PixelLab tiles and sprites (worldAtlas).
// Presentation only: nothing here reads or changes game rules; owned parcels stay the
// source of the buildable yard, which yardGround still draws on top.
import {
  Skia,
  FilterMode,
  MipmapMode,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia'
import { atlas } from './worldAtlas'
import { toScreen } from './iso'
import { YARD, SALES } from '../data/balance'

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

/** Draw one atlas sprite with its anchor at (x, y). */
export function sprite(
  c: SkCanvas,
  img: SkImage,
  name: string,
  x: number,
  y: number,
  scale = 1,
  alpha = 1,
) {
  const r = atlas[name]
  if (!r) return
  const [sx, sy, w, h, ax, ay] = r
  const p = paint()
  if (alpha < 1) p.setAlphaf(alpha)
  c.drawImageRectOptions(
    img,
    Skia.XYWHRect(sx, sy, w, h),
    Skia.XYWHRect(x - ax * scale, y - ay * scale, w * scale, h * scale),
    FilterMode.Nearest,
    MipmapMode.None,
    p,
  )
}

// Land covers every buyable parcel plus a margin for the public road, with a wobbly coast.
const L0 = -9,
  L1 = YARD.maxSize + 3,
  C = (L0 + L1) / 2,
  HALF = (L1 - L0) / 2
/** 0 sea, 1 sand, 2 grass, at tile corners. */
export function terrainAt(x: number, y: number) {
  const a = Math.atan2(y - C, x - C)
  const wob = 1.6 * Math.sin(3 * a + 1.3) + 0.9 * Math.sin(5 * a + 0.4) + 0.5 * Math.sin(9 * a + 2)
  const d = Math.max(Math.abs(x - C), Math.abs(y - C)) * 0.8 + Math.hypot(x - C, y - C) * 0.2
  return d < HALF + wob ? 2 : d < HALF + wob + 1.7 ? 1 : 0
}
const coastDistance = (x: number, y: number) => {
  const d = Math.max(Math.abs(x - C), Math.abs(y - C)) * 0.8 + Math.hypot(x - C, y - C) * 0.2
  return d - HALF
}

/** Road tiles: the gate approach plus a highway along the land, perpendicular to it. */
export function roadTiles(gate?: Pt) {
  const roads = new Set<string>()
  const along = !gate || gate.x === 0 // approach runs along -x when the gate is on the x = 0 edge
  const gy = gate?.y ?? 6
  const gx = gate?.x ?? 0
  for (let i = 1; i <= SALES.approachTiles; i++) roads.add(along ? `${-i},${gy}` : `${gx},${-i}`)
  const k = -(SALES.approachTiles + 1)
  for (let t = L0 - 4; t <= L1 + 4; t++) {
    const [x, y] = along ? [k, t] : [t, k]
    if (
      [terrainAt(x, y), terrainAt(x + 1, y), terrainAt(x, y + 1), terrainAt(x + 1, y + 1)].every(
        v => v === 2,
      )
    )
      roads.add(`${x},${y}`)
  }
  return { roads, highway: { along, k } }
}

const diamondPath = (x: number, y: number) => {
  const b = Skia.PathBuilder.Make()
  b.moveTo(x, y - 0.5)
  b.lineTo(x + 16.5, y + 8)
  b.lineTo(x, y + 16.5)
  b.lineTo(x - 16.5, y + 8)
  b.close()
  return b.detach()
}

/** Static world: sea edge, beaches, grass, locked land, roads and scenery. */
export function drawWorld(c: SkCanvas, img: SkImage, parcels: string[], gate?: Pt) {
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
  const { roads } = roadTiles(gate)
  const linked = new Set(roads)
  if (gate) linked.add(`${gate.x},${gate.y}`)
  const roadNear = (x: number, y: number) =>
    [-1, 0, 1].some(dx => [-1, 0, 1].some(dy => roads.has(`${x + dx},${y + dy}`)))
  const decor: { depth: number; draw: () => void }[] = []
  const under = paint()
  under.setColor(Skia.Color('#60932F'))
  const lo = L0 - 14,
    hi = L1 + 14
  for (let s = lo * 2; s <= hi * 2; s++)
    for (let x = lo; x <= hi; x++) {
      const y = s - x
      if (y < lo || y > hi) continue
      const p = toScreen(x, y),
        left = p.x - 16
      // Corners in the order the transition masks use: S, W, E, N.
      const cs = [
        terrainAt(x + 1, y + 1),
        terrainAt(x, y + 1),
        terrainAt(x + 1, y),
        terrainAt(x, y),
      ]
      const min = Math.min(...cs),
        max = Math.max(...cs)
      if (max === 0) {
        if (coastDistance(x, y) < 12) sprite(c, img, 'sw0', left, p.y, 1)
        else continue
        if (hash(x, y, 7) < 0.012 && coastDistance(x, y) > 2.5)
          decor.push({
            depth: x + y,
            draw: () => sprite(c, img, `islet${Math.floor(hash(x, y, 8) * 4)}`, p.x, p.y + 8, 0.7),
          })
        continue
      }
      if (min === 0) {
        sprite(c, img, `sw${cs.reduce((m, v, i) => m | (v >= 1 ? 1 << i : 0), 0)}`, left, p.y)
        if (hash(x, y, 3) < 0.08)
          decor.push({
            depth: x + y + 0.5,
            draw: () => sprite(c, img, `rocks${Math.floor(hash(x, y, 4) * 4)}`, p.x, p.y + 10, 0.5),
          })
        continue
      }
      if (min === 1) {
        const mask = cs.reduce((m, v, i) => m | (v === 2 ? 1 << i : 0), 0)
        sprite(c, img, `gs${mask}`, left, p.y)
        if (cs.filter(v => v === 2).length <= 2 && hash(x, y, 5) < 0.18)
          decor.push({
            depth: x + y + 1,
            draw: () => sprite(c, img, `palm${Math.floor(hash(x, y, 6) * 5)}`, p.x, p.y + 10, 0.62),
          })
        continue
      }
      const key = `${x},${y}`
      // Solid underlay so the 1px seams between pixel diamonds never show the sea.
      c.drawPath(diamondPath(p.x, p.y), under)
      if (roads.has(key)) {
        const m =
          (linked.has(`${x},${y - 1}`) ? 1 : 0) |
          (linked.has(`${x + 1},${y}`) ? 2 : 0) |
          (linked.has(`${x},${y + 1}`) ? 4 : 0) |
          (linked.has(`${x - 1},${y}`) ? 8 : 0)
        sprite(c, img, `road${m}`, left, p.y, 0.5)
        continue
      }
      const buyable = x >= 0 && y >= 0 && x < YARD.maxSize && y < YARD.maxSize
      const tile = owned.has(key)
        ? 'grass0'
        : buyable && !near(x, y, 1)
          ? `locked${hash(x, y, 1) < 0.5 ? 0 : 1}`
          : hash(x, y, 2) < 0.12
            ? 'flower0'
            : `grass${hash(x, y, 1) < 0.5 ? 0 : 1}`
      sprite(c, img, tile, left, p.y)
      if (owned.has(key) || near(x, y, 2) || roadNear(x, y)) continue
      const r = hash(x, y, 9),
        density = buyable ? 0.025 : 0.14
      if (r < density)
        decor.push({
          depth: x + y + 1,
          draw: () => sprite(c, img, `tree${Math.floor(hash(x, y, 10) * 7)}`, p.x, p.y + 12, 0.6),
        })
      else if (r < density * 1.7)
        decor.push({
          depth: x + y + 1,
          draw: () => sprite(c, img, `bush${Math.floor(hash(x, y, 11) * 4)}`, p.x, p.y + 10, 0.5),
        })
    }
  // Two far mountain islands give the sea a horizon.
  for (const [mx, my, i] of [
    [L1 + 11, L0 + 4, 0],
    [L0 + 2, L1 + 12, 1],
  ] as const) {
    const p = toScreen(mx, my)
    decor.push({ depth: mx + my, draw: () => sprite(c, img, `mountain${i}`, p.x, p.y, 1.1) })
  }
  decor.sort((a, b) => a.depth - b.depth).forEach(d => d.draw())
}

// ---------- Ambient life (drawn every frame, skipped when motion is reduced) ----------
const glints = (() => {
  const out: Pt[] = []
  for (let x = L0 - 7; x <= L1 + 7; x++)
    for (let y = L0 - 7; y <= L1 + 7; y++) {
      const d = coastDistance(x, y)
      if (d > 2.3 && d < 4.4 && hash(x, y, 21) < 0.08) out.push(toScreen(x + 0.5, y + 0.5))
    }
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
      c.drawRect(
        Skia.XYWHRect(Math.round(g.x + (i % 5) - 2), Math.round(g.y + (i % 3)), 3, 1),
        white,
      )
    }
  })
  // Tanker ship on a slow lane past the front coast.
  const f = cycle(t, 140),
    going = f < 0.5,
    sx = L0 - 6 + (L1 - L0 + 12) * pingPong(f)
  const ship = toScreen(sx, L1 + 7.5)
  sprite(c, img, going ? 'ship_se' : 'ship_nw', ship.x, ship.y + Math.sin(t * 1.3) * 0.6, 0.55)
  // Fishing boat drifting in a small loop off the left shore.
  const a = t * 0.12,
    boat = toScreen(L0 - 4 + Math.cos(a) * 2.2, C + Math.sin(a) * 3)
  sprite(
    c,
    img,
    Math.cos(a) > 0 ? 'fishboat_sw' : 'fishboat_ne',
    boat.x,
    boat.y + Math.sin(t * 2) * 0.6,
    0.5,
  )
  // A fish leaps now and then near the coast.
  const jf = cycle(t, 7)
  if (jf < 0.16 && glints.length) {
    const g = glints[Math.floor(t / 7) % glints.length],
      k = jf / 0.16
    sprite(c, img, 'fish0', g.x + k * 8, g.y - Math.sin(k * Math.PI) * 9, 0.32)
  }
  if (jf >= 0.16 && jf < 0.26 && glints.length) {
    const g = glints[Math.floor(t / 7) % glints.length]
    white.setAlphaf(1 - (jf - 0.16) / 0.1)
    white.setStyle(1)
    c.drawOval(Skia.XYWHRect(g.x + 3, g.y - 1, 10 + (jf - 0.16) * 60, 3 + (jf - 0.16) * 20), white)
    white.setStyle(0)
  }
}

/** Cars on the highway (drawn with the static world, under buildings). */
export function drawTraffic(c: SkCanvas, img: SkImage, t: number, gate?: Pt) {
  const { along, k } = roadTiles(gate).highway
  for (const [i, speed] of [
    [0, 26],
    [1, 37],
  ] as const) {
    const f = cycle(t + i * 9, speed),
      fwd = f < 0.5,
      u = L0 - 2 + (L1 - L0 + 4) * pingPong(f)
    const lane = fwd ? 0.32 : 0.68
    const p = along ? toScreen(k + lane, u) : toScreen(u, k + lane)
    const dir = along ? (fwd ? 'sw' : 'ne') : fwd ? 'se' : 'nw'
    sprite(c, img, `car_${dir}`, p.x, p.y, 0.32)
  }
}

/** Clouds with their ground shadows, and a gull flock now and then (over everything). */
export function drawSky(c: SkCanvas, img: SkImage, t: number) {
  const shadow = paint()
  shadow.setColor(Skia.Color('#123B4A'))
  shadow.setAlphaf(0.1)
  const span = (L1 - L0 + 30) * 32
  for (let i = 0; i < 3; i++) {
    const x = ((t * (6 + i * 2) + i * span * 0.37) % span) - span / 2,
      y = -40 + i * 170 + ((L1 - L0) * 8) / 2 - 120
    c.drawOval(Skia.XYWHRect(x - 30, y + 90, 64, 18), shadow)
    sprite(c, img, `cloud${i % 5}`, x, y, 1, 0.88)
  }
  const f = cycle(t, 26)
  if (f < 0.35) {
    const k = f / 0.35,
      base = toScreen(L0 + (L1 - L0 + 10) * k - 5, C - 12 + k * 4)
    for (let i = 0; i < 3; i++)
      sprite(
        c,
        img,
        `gull${Math.floor(t * 4 + i) % 2}`,
        base.x - i * 14,
        base.y - 60 + i * 9 + Math.sin(t * 3 + i) * 2,
        0.5,
      )
  }
}

/** Animated smoke from a stack; anchor is the stack top. */
export function drawSmoke(c: SkCanvas, img: SkImage, t: number, x: number, y: number) {
  sprite(c, img, `smoke${Math.floor(t * 10) % 16}`, x, y, 0.6, 0.9)
}
/** Level-up sparkle burst; f runs 0 → 1 over its life. */
export function drawSparkle(c: SkCanvas, img: SkImage, f: number, x: number, y: number) {
  sprite(c, img, `spark${Math.min(7, Math.floor(f * 8))}`, x, y, 0.9)
}
/** Truck sprite for a direction of travel in tile space. */
export function truckName(kind: string, dx: number, dy: number) {
  const v = kind === 'crude' ? 'crude' : 'product'
  const dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'se' : 'nw') : dy >= 0 ? 'sw' : 'ne'
  return `${v}_${dir}`
}
