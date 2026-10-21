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
  shadow = false,
) {
  const r = atlas[name]
  if (!r) return
  const [sx, sy, w, h, ax, ay] = r
  // Soft contact shadow, cast to the lower right (light from the top-left).
  if (shadow) {
    const sp = paint()
    sp.setColor(Skia.Color('#0B2A33'))
    sp.setAlphaf(0.22 * alpha)
    const sw = w * scale * 0.8
    c.drawOval(Skia.XYWHRect(x - sw / 2 + sw * 0.18, y - sw * 0.14, sw, sw * 0.32), sp)
  }
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

// The yard's top corner (tile 0,0) never moves: parcels only grow towards +x / +y.
// So the two top sides face the sea as a port quay with a highway, and the far
// sides end in a wobbly beach.
export const HW = -1 // highway row/column
export const QUAY = [-3, -2] // quay rows/columns between highway and sea
const L0 = -3,
  L1 = YARD.maxSize + 3,
  C = (L0 + L1) / 2
const wobble = (u: number) => 1.4 * Math.sin(u * 0.21 + 1.3) + 0.8 * Math.sin(u * 0.47 + 0.4)
/** Far-side terrain at tile corners: 0 sea, 1 sand, 2 grass. */
export function terrainAt(x: number, y: number) {
  const m = Math.max(x, y) - L1 - wobble(x - y)
  return m < 0 ? 2 : m < 1.7 ? 1 : 0
}
/** Rough distance from land (negative on land), for sea effects. */
const coastDistance = (x: number, y: number) =>
  Math.max(Math.max(x, y) - L1 - wobble(x - y), L0 - Math.min(x, y))
export const PIER = { x: -7, y: 9 }

/** Highway: an L along both top sides; the gate links to it with a T. */
export function roadTiles(_gate?: Pt) {
  void _gate
  const roads = new Set<string>()
  for (let t = HW; t <= L1 + 4; t++) {
    if (terrainAt(HW, t) === 2 && terrainAt(HW + 1, t + 1) === 2) roads.add(`${HW},${t}`)
    if (terrainAt(t, HW) === 2 && terrainAt(t + 1, HW + 1) === 2) roads.add(`${t},${HW}`)
  }
  return { roads }
}
/** The highway as one polyline (tile centres), for cars. */
const highwayLine = (() => {
  let end = HW
  while (terrainAt(HW, end + 1) === 2 && terrainAt(HW + 1, end + 2) === 2) end++
  return { end }
})()

/** Trucks: the sim's straight approach becomes a drive along the highway into the gate. */
export function approachTile(p: Pt, gate?: Pt): Pt {
  if (!gate || (p.x >= 0 && p.y >= 0)) return p
  if (gate.x === 0) {
    const i = -p.x
    const dir = gate.y - 5 >= 0 ? -1 : 1
    return { x: HW, y: gate.y + dir * (i - 1) }
  }
  const i = -p.y
  const dir = gate.x - 5 >= 0 ? -1 : 1
  return { x: gate.x + dir * (i - 1), y: HW }
}

/** A GPT texture tile; 2x2 variants tile seamlessly across the map. */
function tex(
  c: SkCanvas,
  img: SkImage,
  name: string,
  x: number,
  y: number,
  left: number,
  top: number,
) {
  sprite(c, img, `tex_${name}${((x % 2) + 2) % 2}${((y % 2) + 2) % 2}`, left, top)
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
  const lo = L0 - 30,
    hi = L1 + 30
  const stripe = paint(),
    dark = paint(),
    quayPaint = paint(),
    foam = paint()
  stripe.setColor(Skia.Color('#F2C230'))
  dark.setColor(Skia.Color('#2A2A2E'))
  quayPaint.setColor(Skia.Color('#CBB89A'))
  foam.setColor(Skia.Color('#E8FBFF'))
  const lane = paint()
  lane.setColor(Skia.Color('#F2E3B0'))
  for (let s = lo * 2; s <= hi * 2; s++)
    for (let x = lo; x <= hi; x++) {
      const y = s - x
      if (y < lo || y > hi) continue
      const p = toScreen(x, y),
        left = p.x - 16
      const top = x < QUAY[0] || y < QUAY[0]
      // Corners in the order the transition masks use: S, W, E, N.
      const cs = [
        terrainAt(x + 1, y + 1),
        terrainAt(x, y + 1),
        terrainAt(x + 1, y),
        terrainAt(x, y),
      ]
      const min = Math.min(...cs),
        max = Math.max(...cs)
      if (top || max === 0) {
        if (coastDistance(x, y) < 30) tex(c, img, 'water', x, y, left, p.y)
        else continue
        if (hash(x, y, 7) < 0.012 && coastDistance(x, y) > 3)
          decor.push({
            depth: x + y,
            draw: () =>
              hash(x, y, 12) < 0.5
                ? sprite(c, img, `greenislet${Math.floor(hash(x, y, 8) * 3)}`, p.x, p.y + 8, 0.75)
                : sprite(c, img, `islet${Math.floor(hash(x, y, 8) * 4)}`, p.x, p.y + 8, 0.7),
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
      if (QUAY.includes(x) || QUAY.includes(y)) {
        tex(c, img, 'quay', x, y, left, p.y)
        // Sea edge: foam and bollards; lamps along the highway side.
        if (x === QUAY[0] || y === QUAY[0]) {
          // Thin foam along the sea-facing diamond edge (top-left for x, top-right for y).
          for (let k = 0; k < 8; k++) {
            if (x === QUAY[0]) c.drawRect(Skia.XYWHRect(p.x - 2 - k * 2, p.y + k, 2, 1), foam)
            if (y === QUAY[0]) c.drawRect(Skia.XYWHRect(p.x + k * 2, p.y + k, 2, 1), foam)
          }
          if ((x + y) % 2 === 0)
            decor.push({
              depth: x + y + 0.5,
              draw: () => sprite(c, img, 'g_bollard', p.x, p.y + 5, 1),
            })
        }
        if ((x === QUAY[1] || y === QUAY[1]) && (x + y) % 5 === 0)
          decor.push({
            depth: x + y + 1,
            draw: () => sprite(c, img, 'g_lamp', p.x, p.y + 12, 1, 1, true),
          })
        continue
      }
      if (roads.has(key)) {
        const m =
          (linked.has(`${x},${y - 1}`) ? 1 : 0) |
          (linked.has(`${x + 1},${y}`) ? 2 : 0) |
          (linked.has(`${x},${y + 1}`) ? 4 : 0) |
          (linked.has(`${x - 1},${y}`) ? 8 : 0)
        void m
        tex(c, img, 'asphalt', x, y, left, p.y)
        // Dashed centre line along the highway leg.
        if ((x === HW) !== (y === HW) && (x + y) % 2 === 0) {
          if (x === HW) c.drawRect(Skia.XYWHRect(p.x - 3, p.y + 7, 6, 1), lane)
          else c.drawRect(Skia.XYWHRect(p.x - 3, p.y + 8, 6, 1), lane)
        }
        // Yellow-black kerb on the quay side.
        for (let k = 0; k < 4; k++) {
          const paintK = k % 2 ? dark : stripe
          if (x === HW) c.drawRect(Skia.XYWHRect(p.x - 16 + k * 4, p.y + 7 - k * 2, 4, 2), paintK)
          if (y === HW) c.drawRect(Skia.XYWHRect(p.x + k * 4, p.y + 1 + k * 2, 4, 2), paintK)
        }
        continue
      }
      const buyable = x >= 0 && y >= 0 && x < YARD.maxSize && y < YARD.maxSize
      tex(
        c,
        img,
        owned.has(key) ? 'concrete' : buyable && !near(x, y, 1) ? 'locked' : 'grass',
        x,
        y,
        left,
        p.y,
      )
      if (owned.has(key) || near(x, y, 2) || roadNear(x, y)) continue
      const r = hash(x, y, 9),
        density = buyable ? 0.025 : 0.14
      if (r < density)
        decor.push({
          depth: x + y + 1,
          draw: () =>
            sprite(c, img, `tree${Math.floor(hash(x, y, 10) * 7)}`, p.x, p.y + 12, 0.6, 1, true),
        })
      else if (r < density * 1.7)
        decor.push({
          depth: x + y + 1,
          draw: () => sprite(c, img, `bush${Math.floor(hash(x, y, 11) * 4)}`, p.x, p.y + 10, 0.5),
        })
    }
  // Port: cranes and container stacks by the pier, warehouses and pipe racks on the far land.
  const prop = (name: string, x: number, y: number, scale: number, shadow = true) => {
    const p = toScreen(x, y)
    decor.push({
      depth: x + y + 1,
      draw: () => sprite(c, img, name, p.x, p.y + 8, scale, 1, shadow),
    })
  }
  // GPT port set: an L-shaped fuel jetty where the tanker berths, a long pier, a ramp.
  prop('g_pier_l', PIER.x, PIER.y, 1, false)
  prop('g_pier_long', 22, -7.5, 1, false)
  prop('g_ramp', 7, -4.6, 1, false)
  prop('g_gantry', 15.5, QUAY[0] + 0.7, 1)
  prop('g_crane', QUAY[0] + 0.6, PIER.y - 3.2, 1)
  prop('g_stack3', QUAY[0] + 0.5, PIER.y + 3.6, 1)
  prop('g_stack2', QUAY[0] + 0.5, PIER.y + 5.2, 1)
  prop('g_cont_red', QUAY[0] + 0.6, PIER.y + 7, 1)
  prop('g_cont_blue', 18.5, QUAY[0] + 0.6, 1)
  prop('g_stack3', 25, QUAY[0] + 0.5, 1)
  prop('g_crates', 3.5, QUAY[0] + 0.6, 1)
  prop('g_drums', QUAY[0] + 0.6, 3.5, 1)
  prop('g_barrier', 11, QUAY[0] + 0.7, 1)
  prop('g_cones', QUAY[0] + 0.7, 17, 1)
  // Outskirts beyond the buyable land.
  const M = YARD.maxSize + 1.7
  prop('g_warehouse_blue', M, 3, 1)
  prop('g_tankpipe', M, 8, 1)
  prop('g_piperack', M, 12.5, 1)
  prop('g_watertower', M, 17, 1)
  prop('g_office', 3, M, 1)
  prop('g_warehouse_long', 8.5, M, 1)
  prop('g_substation', 14, M, 1)
  prop('g_chimney', 18, M, 1)
  prop('g_gasstation', M, 24, 1)
  // Two far mountain islands give the sea a horizon.
  for (const [mx, my, i] of [
    [L0 - 12, 18, 0],
    [24, L0 - 13, 1],
  ] as const) {
    const p = toScreen(mx, my)
    decor.push({ depth: mx + my, draw: () => sprite(c, img, `mountain${i}`, p.x, p.y, 1.1) })
  }
  decor.sort((a, b) => a.depth - b.depth).forEach(d => d.draw())
}

// ---------- Ambient life (drawn every frame, skipped when motion is reduced) ----------
const glints = (() => {
  const out: Pt[] = []
  for (let x = L0 - 9; x <= L1 + 7; x++)
    for (let y = L0 - 9; y <= L1 + 7; y++) {
      const d = coastDistance(x, y)
      if (d > 1.5 && d < 7 && hash(x, y, 21) < 0.06) out.push(toScreen(x + 0.5, y + 0.5))
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
  // Tanker ship sails in, berths along the pier, then leaves.
  const dock = { x: PIER.x + 0.2, y: PIER.y + 3.4 },
    far = { x: L0 - 22, y: PIER.y + 18 }
  const f = cycle(t, 150)
  let pos = dock,
    dir = 'ship_ne'
  if (f < 0.3) {
    const k = 1 - (1 - f / 0.3) ** 2
    pos = { x: far.x + (dock.x - far.x) * k, y: far.y + (dock.y - far.y) * k }
    dir = 'ship_ne'
  } else if (f > 0.7) {
    const k = ((f - 0.7) / 0.3) ** 2
    pos = { x: dock.x + (far.x - dock.x) * k, y: dock.y + (far.y - dock.y) * k }
    dir = 'ship_sw'
  }
  const ship = toScreen(pos.x, pos.y)
  sprite(c, img, dir, ship.x, ship.y + Math.sin(t * 1.3) * 0.6, 0.6)
  // Fishing boat drifting in a small loop off the left shore.
  const a = t * 0.12,
    boat = toScreen(L0 - 8 + Math.cos(a) * 3, C * 0.5 + Math.sin(a) * 4)
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

/** Cars driving the L-shaped highway (corner at the yard's top). */
export function drawTraffic(c: SkCanvas, img: SkImage, t: number, _gate?: Pt) {
  const len = highwayLine.end - HW
  for (const [i, speed] of [
    [0, 30],
    [1, 41],
  ] as const) {
    const f = cycle(t + i * 11, speed),
      fwd = f < 0.5,
      u = (pingPong(f) * 2 - 1) * len // negative: leg along y; positive: leg along x
    const lane = fwd ? 0.35 : 0.65
    const leg = u < 0 ? 'y' : 'x',
      d = Math.abs(u)
    const p = leg === 'y' ? toScreen(HW + lane, HW + d + 0.5) : toScreen(HW + d + 0.5, HW + lane)
    // Forward runs from the far end of the y leg, round the corner, to the end of the x leg.
    const dir = leg === 'y' ? (fwd ? 'ne' : 'sw') : fwd ? 'se' : 'nw'
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
