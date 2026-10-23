import { rect, type Command } from './buildings/shapes'
// Stone caps, quay shadow, short chain railings and operational paint, all native pixel geometry.
export function portDetailCommands(): Command[] {
  const out: Command[] = []
  const R = (x: number, y: number, w: number, h: number, c: string) => out.push(rect(x, y, w, h, c))
  const edge = (x: number, y: number, length: number, vertical = false) => {
    const r = (a: number, b: number, w: number, h: number, c: string) =>
      vertical ? R(x + b, y + a, h, w, c) : R(x + a, y + b, w, h, c)
    r(0, -2, length, 2, '#264C58')
    r(0, 0, length, 2, '#929B91')
    r(0, 2, length, 1.5, '#F5E6BE')
    for (let a = 0; a < length; a += 16) {
      r(a, 0, 0.5, 3.5, '#6D7E79')
    }
    // Chains sag in short pixel steps between capped steel posts.
    for (let a = 5; a < length - 6; a += 24) {
      r(a - 1, 1, 3, 4, '#55686A')
      r(a, -6, 1.5, 9, '#304952')
      r(a - 1, -7, 3.5, 1.5, '#E8D8AC')
      if (a + 24 < length - 6)
        for (let k = 2; k < 24; k += 2)
          r(a + k, -4 + Math.round(Math.sin((k / 24) * Math.PI) * 3), 2, 0.5, '#354D53')
    }
  }
  for (const [x, w] of [
    [5, 3],
    [11, 12],
    [26, 4],
    [34, 1],
  ])
    edge(x * 32, -256, w * 32)
  // Park/quay material joins have a defined stone-and-chain boundary as well.
  edge(5 * 32, -256, 128, true)
  edge(35 * 32 - 3, -256, 128, true)
  for (const x of [8, 23]) {
    edge(x * 32, -352, 96)
    edge(x * 32, -352, 96, true)
    edge((x + 3) * 32 - 3, -352, 96, true)
    // Keep the central vehicle/handling aisle clear and mark safe working edges.
    for (let y = -10.5; y < -8; y += 0.5) {
      R(x * 32 + 6, y * 32, 1, 8, '#EDC85E')
      R((x + 3) * 32 - 8, y * 32, 1, 8, '#EDC85E')
    }
  }
  edge(30 * 32, -320, 128)
  edge(30 * 32, -320, 64, true)
  edge(34 * 32 - 3, -320, 64, true)
  // Quay service lane and loading aprons make the port read as a working district.
  for (let x = 5; x < 35; x++) {
    R(x * 32, -137, 32, 1, '#AA956D')
    R(x * 32, -136, 32, 0.5, '#EEE0B9')
    if (x % 2 === 0) R(x * 32 + 6, -155, 14, 1, '#F8E3A2')
  }
  for (const [x, w] of [
    [5, 3],
    [13, 3],
    [17, 3],
    [26, 3],
  ]) {
    R(x * 32, -198, w * 32, 1, '#F4D16B')
    R(x * 32, -198, 1, 60, '#F4D16B')
    R((x + w) * 32 - 1, -198, 1, 60, '#F4D16B')
  }
  return out
}
