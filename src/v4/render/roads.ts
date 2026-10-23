// Exact pixel road markings share the 32-unit grid; artwork textures remain 64 px/tile.
import { rect, type Command } from './buildings/shapes'
import { buildingDef } from '../data/buildings'
type Placed = { x: number; y: number; defId: string; uid?: string }
export const ROAD = { n: 1, e: 2, s: 4, w: 8 } as const
export function roadMask(x: number, y: number, buildings: readonly Placed[]) {
  const joins = (xx: number, yy: number) =>
    buildings.some(b => {
      if (!['road', 'gate', 'loading'].includes(b.defId)) return false
      const d = buildingDef(b.defId)
      return xx >= b.x && yy >= b.y && xx < b.x + d.w && yy < b.y + d.h
    })
  return (
    (joins(x, y - 1) ? 1 : 0) |
    (joins(x + 1, y) ? 2 : 0) |
    (joins(x, y + 1) ? 4 : 0) |
    (joins(x - 1, y) ? 8 : 0)
  )
}
export function yardRoadCommands(x: number, y: number, mask = 5): Command[] {
  const out: Command[] = [],
    X = x * 32,
    Y = y * 32
  const R = (a: number, b: number, w: number, h: number, c: string) =>
    out.push(rect(X + a, Y + b, w, h, c))
  R(0, 0, 32, 32, '#51575A')
  // A quiet asphalt grain. Closed edges have a light curb; connected edges stay open.
  for (let i = 0; i < 9; i++)
    R((i * 11 + 3) % 30, (i * 7 + 5) % 30, 1, 0.5, i % 2 ? '#61666A' : '#484F55')
  const count = [1, 2, 4, 8].filter(n => mask & n).length
  const connections = mask || 5
  if (!(connections & 1)) {
    R(0, 0, 32, 1, '#B9C0BC')
    R(0, 1, 32, 0.5, '#373E46')
  }
  if (!(connections & 4)) {
    R(0, 30.5, 32, 1.5, '#BAC1BD')
    R(0, 30, 32, 0.5, '#353D43')
  }
  if (!(connections & 8)) {
    R(0, 0, 1.5, 32, '#BAC1BD')
    R(1.5, 0, 0.5, 32, '#353D43')
  }
  if (!(connections & 2)) {
    R(30.5, 0, 1.5, 32, '#BAC1BD')
    R(30, 0, 0.5, 32, '#353D43')
  }
  const yellow = '#E9CD78'
  // Junctions have a clear centre and short approach markings, never crossing stripes.
  for (const bit of [1, 2, 4, 8])
    if (connections & bit) {
      if (bit === 1) R(15.5, 0, 1, count >= 3 ? 6 : 16, yellow)
      if (bit === 4) R(15.5, count >= 3 ? 26 : 16, 1, count >= 3 ? 6 : 16, yellow)
      if (bit === 8) R(0, 15.5, count >= 3 ? 6 : 16, 1, yellow)
      if (bit === 2) R(count >= 3 ? 26 : 16, 15.5, count >= 3 ? 6 : 16, 1, yellow)
    }
  if (connections === 5) R(15.5, 11, 1, 10, '#51575A')
  if (connections === 10) R(11, 15.5, 10, 1, '#51575A')
  if (count >= 3) {
    if (mask & 1) R(18, 7, 10, 1, '#F6EDD7')
    if (mask & 4) R(4, 24, 10, 1, '#F6EDD7')
    if (mask & 8) R(7, 4, 1, 10, '#F6EDD7')
    if (mask & 2) R(24, 18, 1, 10, '#F6EDD7')
  }
  return out
}
export const junctions = [
  { x: -2, y: -2, top: true },
  { x: 34, y: -2, top: true },
  { x: -2, y: 26, top: false },
  { x: 34, y: 26, top: false },
]
export function signalPhase(t: number) {
  const p = ((t % 18) + 18) % 18
  return p < 7
    ? 'horizontal'
    : p < 8
      ? 'amberH'
      : p < 9
        ? 'allRed'
        : p < 16
          ? 'vertical'
          : p < 17
            ? 'amberV'
            : 'allRed'
}
export function streetDetailCommands(): Command[] {
  const out: Command[] = []
  const R = (x: number, y: number, w: number, h: number, c: string) => out.push(rect(x, y, w, h, c))
  // Paved outer footpaths: warm blocks, curb, paving joints and drain grates.
  const pave = (x: number, y: number, w: number, h: number) => {
    R(x * 32, y * 32, w * 32, h * 32, '#D9D2B8')
    for (let yy = y * 32; yy < (y + h) * 32; yy += 8)
      for (let xx = x * 32; xx < (x + w) * 32; xx += 16) {
        R(xx, yy, 16, 0.5, '#B9B29B')
        R(xx + (yy % 16 ? 8 : 0), yy, 0.5, 8, '#B9B29B')
      }
  }
  pave(-8, -4, 48, 1)
  pave(-4, -1, 1, 26)
  pave(35, -1, 1, 26)
  pave(-4, 27, 1, 5)
  pave(35, 27, 1, 5)
  pave(-8, 27, 5, 1)
  pave(-1, 27, 34, 1)
  pave(35, 27, 5, 1)
  R(-256, -97, 1536, 1, '#EDE8D5')
  R(-256, -96, 1536, 0.5, '#333E45')
  for (const xx of [-3, 35]) {
    R(xx * 32, -32, 1, 832, '#ECE7D2')
    R(xx * 32 + 1, -32, 0.5, 832, '#333E45')
  }
  R(-256, 864, 1536, 1, '#EEE9D6')
  // Lane lines end before a junction, with edge lines, arrows, stop bars and zebra crossings.
  for (const y of [-2, 26])
    for (let x = -8; x < 40; x++)
      if (Math.abs(x + 2) > 2 && Math.abs(x - 34) > 2) {
        R(x * 32 + 4, y * 32 - 1, 16, 0.5, '#F0CF79')
        R(x * 32 + 4, y * 32 + 1, 16, 0.5, '#F0CF79')
        R(x * 32, (y - 1) * 32 + 3, 32, 0.5, '#E6E2CE')
        R(x * 32, (y + 1) * 32 - 3, 32, 0.5, '#E6E2CE')
      }
  for (const x of [-2, 34])
    for (let y = 0; y < 32; y++)
      if (Math.abs(y - 26) > 2) {
        R(x * 32 - 1, y * 32 + 4, 0.5, 16, '#F0CF79')
        R(x * 32 + 1, y * 32 + 4, 0.5, 16, '#F0CF79')
        R((x - 1) * 32 + 3, y * 32, 0.5, 32, '#E6E2CE')
        R((x + 1) * 32 - 3, y * 32, 0.5, 32, '#E6E2CE')
      }
  for (const j of junctions) {
    const X = j.x * 32,
      Y = j.y * 32
    for (let k = 0; k < 6; k++) {
      R(X - 63, Y - 29 + k * 10, 7, 5, '#F7EFDB')
      R(X + 56, Y - 29 + k * 10, 7, 5, '#F7EFDB')
      R(X - 29 + k * 10, Y + 56, 5, 7, '#F7EFDB')
      if (!j.top) R(X - 29 + k * 10, Y - 63, 5, 7, '#F7EFDB')
    }
    R(X - 68, Y + 3, 1.5, 26, '#FFF4D7')
    R(X + 67, Y - 29, 1.5, 26, '#FFF4D7')
    R(X - 29, Y + 67, 26, 1.5, '#FFF4D7')
    if (!j.top) R(X + 3, Y - 68, 26, 1.5, '#FFF4D7')
    const arrow = (cx: number, cy: number, dx: number, dy: number) => {
      const A = (a: number, b: number, w: number, h: number) =>
        dx
          ? R(cx + a * dx - (dx < 0 ? w : 0), cy + b, w, h, '#F1EBD5')
          : R(cx + b, cy + a * dy - (dy < 0 ? h : 0), h, w, '#F1EBD5')
      A(-6, -0.5, 10, 1)
      for (let k = 0; k < 4; k++) {
        A(3 - k, -k, 1, 1)
        A(3 - k, k, 1, 1)
      }
    }
    arrow(X - 112, Y - 16, 1, 0)
    arrow(X + 112, Y + 16, -1, 0)
    arrow(X - 16, Y + 112, 0, -1)
    if (!j.top) arrow(X + 16, Y - 112, 0, 1)
    // Dark drains beside the crossing, inside the paving.
    for (const side of [-1, 1]) {
      R(X + side * 37 - 4, Y + 33, 8, 3, '#5B6461')
      for (let k = 0; k < 4; k++) R(X + side * 37 - 3 + k * 2, Y + 33, 0.5, 3, '#B6B4A1')
    }
  }
  return out
}
export function signalCommands(t: number): Command[] {
  const out: Command[] = [],
    phase = signalPhase(t)
  const R = (x: number, y: number, w: number, h: number, c: string) => out.push(rect(x, y, w, h, c))
  for (const j of junctions)
    for (const [dx, dy, axis] of [
      [-37, -36, 'horizontal'],
      [37, 36, 'horizontal'],
      [-37, 36, 'vertical'],
      ...(!j.top ? [[37, -36, 'vertical']] : []),
    ] as [number, number, string][]) {
      const x = j.x * 32 + dx,
        y = j.y * 32 + dy
      R(x - 2, y - 1, 5, 2, '#5A625E')
      R(x, y - 25, 1.5, 25, '#394A4C')
      R(x - 3, y - 37, 7, 15, '#172B34')
      R(x - 2.5, y - 36.5, 6, 14, '#455258')
      const green = phase === axis,
        amber = phase === (axis === 'horizontal' ? 'amberH' : 'amberV')
      for (let k = 0; k < 3; k++)
        R(
          x - 1,
          y - 35 + k * 4,
          3,
          3,
          k === 0 && !green && !amber
            ? '#F25C43'
            : k === 1 && amber
              ? '#FFD365'
              : k === 2 && green
                ? '#75D77A'
                : '#213B3E',
        )
    }
  return out
}
