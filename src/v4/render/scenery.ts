// Scene layout is in tiles, independent of ownership. No baked map or hidden scale.
import { GRAPHICS } from './graphics'
import { ownedTiles, parcelEdges } from './parcelEdges'
import { rect, type Command } from './buildings/shapes'
import { topdownArt } from './topdownArt'
export const LANES = {
  top: [-2.5, -1.5],
  left: [-2.5, -1.5],
  right: [34.5, 33.5],
  bottom: [26.5, 25.5],
} as const
export const seaTiles = Array.from({ length: 45 }, (_, i) => ({
  x: -7 + ((i * 7) % 46),
  y: -15 + ((i * 3) % 6),
}))
export const scenicProps = [
  { id: 'warehouse', x: 4, y: -6, level: 1 },
  { id: 'warehouse', x: 15, y: -6, level: 1 },
  { id: 'containers', x: 27, y: -5, level: 1 },
  { id: 'crudeTank', x: 32, y: -5, level: 2 },
  ...[-1, 4, 9, 14, 19, 25].map((y, i) => ({
    id: i % 2 ? 'house' : 'office',
    x: -7,
    y,
    level: 2,
  })),
  ...[1, 6, 11, 17, 22].flatMap((y, i) => [
    { id: 'tree', x: -5, y, level: 1 },
    { id: 'tree', x: 38, y: y + 1, level: 1 },
    { id: 'lamp', x: 36, y, level: 1 },
  ]),
  ...[2, 9, 16, 23, 30].flatMap(x => [
    { id: 'tree', x, y: 30, level: 1 },
    { id: 'lamp', x, y: -5, level: 1 },
  ]),
  { id: 'utility', x: 37, y: 10, level: 1 },
  { id: 'utility', x: 36, y: 17, level: 1 },
  { id: 'crane', x: 8, y: -8, level: 1 },
  { id: 'rocks', x: -5, y: -9, level: 1 },
  { id: 'rocks', x: -4, y: -10, level: 1 },
  { id: 'flowerbed', x: -6, y: 7, level: 1 },
  { id: 'flowerbed', x: 37, y: 4, level: 1 },
]
const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0
export function groundCommands(
  parcels: readonly string[],
  gates: readonly { x: number; y: number }[],
): Command[] {
  const owned = ownedTiles(parcels),
    out: Command[] = []
  const R = (x: number, y: number, w: number, h: number, c: string) => out.push(rect(x, y, w, h, c))
  for (let y = -16; y < 32; y++)
    for (let x = -8; x < 40; x++) {
      const px = x * 32,
        py = y * 32,
        n = hash(x, y),
        inYard = x >= 0 && x < 32 && y >= 0 && y < 24
      const pier = ((x >= 8 && x < 10) || (x >= 23 && x < 25)) && y >= -11 && y < -4
      const water = y < -8 && !pier,
        quay = (y >= -8 && y < -4) || pier
      const horizontal = (y >= -3 && y < -1) || (y >= 25 && y < 27)
      const vertical = ((x >= -3 && x < -1) || (x >= 33 && x < 35)) && y >= -4
      const sidewalk = y === -4 || y === 27 || ((x === -4 || x === 35) && y >= -4)
      let c = water
        ? GRAPHICS.sea
        : quay
          ? '#D8C7A1'
          : horizontal || vertical
            ? '#51575A'
            : sidewalk
              ? '#D0CDB9'
              : inYard
                ? owned.has(`${x},${y}`)
                  ? '#C8C8BA'
                  : '#B0BD88'
                : '#8DB957'
      R(px, py, 32, 32, c)
      if (water) {
        if (n % 3 === 0) R(px + 5, py + 13, 12, 1, '#62ADB9')
        if (n % 5 === 0) R(px + 19, py + 24, 8, 1, '#337E9D')
      } else if (quay || sidewalk || (inYard && owned.has(`${x},${y}`))) {
        R(px, py, 32, 1, quay ? '#C6B68F' : '#BABDAE')
        if (n % 3 === 0) R(px + 20, py + 19, 3, 1, '#B8BCAB')
      } else if (!horizontal && !vertical) {
        R(px + 3 + (n % 11), py + 5 + (n % 17), 3, 1, inYard ? '#91A473' : '#78A34F')
        if (n % 2 === 0) R(px + 19, py + 22, 2, 2, inYard ? '#C3C999' : '#A6CA6B')
      }
      if (horizontal && !vertical) {
        if (y === -2 || y === 26) R(px + 6, py, 14, 1, '#E3D8AE')
        if (y === -3 || y === 25) R(px, py, 32, 1, '#B8BFA9')
      }
      if (vertical && !horizontal) {
        if (x === -2 || x === 34) R(px, py + 6, 1, 14, '#E3D8AE')
        if (x === -3 || x === 33) R(px, py, 1, 32, '#B8BFA9')
      }
      // The shoreline is an assembled edge, not a strip of water attached to a prop.
      if (y === -9 && !pier) {
        R(px, py + 29, 32, 3, '#91CBD0')
        R(px + 3, py + 27, 14, 2, '#B6DECC')
      }
      if (y === -8) {
        R(px, py, 32, 2, '#F3E5BE')
        if (x % 2 === 0) R(px + 8, py + 3, 4, 3, '#D9A541')
      }
      if (pier && (x === 8 || x === 23)) {
        R(px, py, 2, 32, '#F3E5BE')
        R(px + 4, py + 5, 3, 3, '#D9A541')
      }
      if (pier && (x === 9 || x === 24)) R(px + 30, py, 2, 32, '#A6A88D')
      // Future land remains a real landscape. Survey posts mark only parcel corners.
      if (inYard && !owned.has(`${x},${y}`) && x % 8 === 0 && y % 8 === 0) {
        R(px + 2, py + 1, 2, 6, '#7B8562')
        R(px + 1, py, 4, 2, '#E5DDBB')
      }
    }
  for (const g of gates) {
    if (g.y === 0) R(g.x * 32, -32, 32, 32, '#C8C8BA')
    else if (g.x === 0) R(-32, g.y * 32, 32, 64, '#C8C8BA')
  }
  return out
}
export function fenceSections(
  parcels: readonly string[],
  gates: readonly { x: number; y: number }[],
) {
  return parcelEdges(parcels, gates).map(e => {
    const x = e.x * 32,
      y = e.y * 32,
      out: Command[] = []
    const R = (px: number, py: number, w: number, h: number, c: string) =>
      out.push(rect(px, py, w, h, c))
    const horizontal = e.side === 'n' || e.side === 's',
      xx = x + (e.side === 'e' ? 32 : 0),
      yy = y + (e.side === 's' ? 32 : 0)
    if (horizontal) {
      R(xx, yy - 7, 32, 2, '#7B8980')
      R(xx, yy - 3, 32, 1, '#8FA08A')
      R(xx, yy - 9, 2, 10, '#34515D')
      R(xx, yy - 9, 2, 2, '#E3ECE3')
    } else {
      R(xx, yy - 7, 2, 32, '#8FA08A')
      for (let k = 0; k <= 24; k += 8) {
        R(xx - 1, yy + k - 7, 3, 8, '#34515D')
        R(xx - 1, yy + k - 7, 3, 2, '#E3ECE3')
      }
    }
    return { depth: e.y + (e.side === 'n' ? 0 : 1), commands: out }
  })
}
// These stay separate, sorted scene objects, sharing the building sprite vocabulary.
export function scenicCommands(id: string, level: number) {
  return topdownArt(id, level)
}
