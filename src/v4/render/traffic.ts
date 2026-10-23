import { signalPhase } from './roads'
type Pt = { x: number; y: number }
type Segment = { from: Pt; to: Pt; start: number; end: number; dir: string }
const heading = (a: Pt, b: Pt) =>
  Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
    ? b.x > a.x
      ? 'east'
      : 'west'
    : b.y > a.y
      ? 'south'
      : 'north'
const towards = (a: Pt, b: Pt, d: number) => {
  const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
  return { x: b.x - ((b.x - a.x) / len) * d, y: b.y - ((b.y - a.y) / len) * d }
}
function plan(corners: Pt[], speed: number) {
  const first = towards(corners[3], corners[0], 3),
    incoming = heading(first, corners[0]),
    axis = (dir: string) => (['east', 'west'].includes(dir) ? 'horizontal' : 'vertical')
  const base = axis(incoming) === 'horizontal' ? 0 : 9,
    segments: Segment[] = []
  let time = base,
    point = first
  const travel = (to: Pt, dir = heading(point, to)) => {
    const duration = (Math.abs(to.x - point.x) + Math.abs(to.y - point.y)) / speed
    segments.push({ from: point, to, start: time, end: time + duration, dir })
    time += duration
    point = to
  }
  const wait = (until: number, dir: string) => {
    if (until > time) segments.push({ from: point, to: point, start: time, end: until, dir })
    time = until
  }
  for (let i = 0; i < 4; i++) {
    const corner = corners[i],
      next = corners[(i + 1) % 4],
      dir = heading(point, corner),
      need = axis(dir)
    if (i) {
      let open = time
      while (signalPhase(open) !== need || signalPhase(open + 1.4) !== need) open += 0.05
      wait(open, dir)
    }
    travel(corner, dir)
    travel(towards(corner, next, 3))
  }
  const duration = Math.ceil((time - base) / 18) * 18
  wait(base + duration, incoming)
  return (t: number) => {
    const now = base + ((((t - base) % duration) + duration) % duration)
    const s = segments.find(s => now >= s.start && now < s.end) ?? segments[segments.length - 1],
      k = (now - s.start) / (s.end - s.start || 1)
    return {
      x: s.from.x + (s.to.x - s.from.x) * k,
      y: s.from.y + (s.to.y - s.from.y) * k,
      dir: s.dir,
    }
  }
}
// Two continuous loops. Vehicles wait at approach lines, turn on the road and never respawn at a junction.
const clockwise = plan(
  [
    { x: -2.5, y: -2.5 },
    { x: 34.5, y: -2.5 },
    { x: 34.5, y: 26.5 },
    { x: -2.5, y: 26.5 },
  ],
  2.2,
)
const anticlockwise = plan(
  [
    { x: -1.5, y: -1.5 },
    { x: -1.5, y: 25.5 },
    { x: 33.5, y: 25.5 },
    { x: 33.5, y: -1.5 },
  ],
  1.9,
)
export const trafficPositions = (t: number) => [
  { kind: 'car', ...clockwise(t) },
  { kind: 'pickup', ...clockwise(t + 18) },
  { kind: 'car2', ...anticlockwise(t) },
  { kind: 'car', ...anticlockwise(t + 36) },
]
