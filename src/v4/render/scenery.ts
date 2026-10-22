// Scene layout is in tiles, independent of ownership. No baked map or hidden scale.
import { GRAPHICS } from './graphics'
import { ownedTiles, parcelEdges } from './parcelEdges'
import { rect, type Command } from './buildings/shapes'
import { topdownArt } from './topdownArt'
import { naturalCoast, onPier, sceneryPatches, crossingTiles } from './environmentLayout'
export const LANES = {
  top: [-2.5, -1.5],
  left: [-2.5, -1.5],
  right: [34.5, 33.5],
  bottom: [26.5, 25.5],
} as const
export { environmentProps as scenicProps } from './environmentLayout'
export const seaTiles = Array.from({ length: 36 }, (_, i) => ({
  x: -7 + ((i * 7) % 46),
  y: -15 + ((i * 3) % 3),
}))
const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0
export function groundCommands(
  parcels: readonly string[],
  gates: readonly { x: number; y: number }[],
): Command[] {
  const owned = ownedTiles(parcels),
    out: Command[] = []
  const R = (x: number, y: number, w: number, h: number, c: string) =>
    out.push(
      rect(
        Math.round(x * 2) / 2,
        Math.round(y * 2) / 2,
        Math.round(w * 2) / 2,
        Math.round(h * 2) / 2,
        c,
      ),
    )
  for (let y = -16; y < 32; y++)
    for (let x = -8; x < 40; x++) {
      const px = x * 32,
        py = y * 32,
        n = hash(x, y),
        inYard = x >= 0 && x < 32 && y >= 0 && y < 24
      const pier = onPier(x, y)
      const water = y < -8 && !pier,
        quay = (y >= -8 && y < -4) || pier
      const horizontal = (y >= -3 && y < -1) || (y >= 25 && y < 27)
      const vertical = ((x >= -3 && x < -1) || (x >= 33 && x < 35)) && y >= -4
      const sidewalk = y === -4 || y === 27 || ((x === -4 || x === 35) && y >= -4)
      let c = naturalCoast(x, y)
        ? '#9EBE71'
        : water
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
      if (naturalCoast(x, y)) continue
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
      if (y === -9 && !pier && !naturalCoast(x, y)) {
        R(px, py + 29, 32, 3, '#91CBD0')
        R(px + 3, py + 27, 14, 2, '#B6DECC')
      }
      if (y === -8 && !naturalCoast(x, y)) {
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
  for (const patch of sceneryPatches) {
    for (let yy = 0; yy < patch.h; yy++)
      for (let xx = 0; xx < patch.w; xx++)
        R(
          (patch.x + xx) * 32,
          (patch.y + yy) * 32,
          Math.min(1, patch.w - xx) * 32,
          Math.min(1, patch.h - yy) * 32,
          patch.color,
        )
  }
  for (const crossing of crossingTiles)
    for (let i = 0; i < 6; i++) {
      if (crossing.x === -3) R(-96, (crossing.y + i / 6) * 32, 64, 2, '#EEE9D2')
      else R((crossing.x + i / 6) * 32, crossing.y * 32, 2, 64, '#EEE9D2')
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
