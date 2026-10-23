// Scene layout is in tiles, independent of ownership. No baked map or hidden scale.
import { streetDetailCommands } from './roads'
import { portDetailCommands } from './portDetails'
import { GRAPHICS } from './graphics'
import { ownedTiles, parcelEdges } from './parcelEdges'
import { rect, type Command } from './buildings/shapes'
import { topdownArt } from './topdownArt'
import { naturalCoast, onPier, sceneryPatches } from './environmentLayout'
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
      const vertical = ((x >= -3 && x < -1) || (x >= 33 && x < 35)) && y >= -1
      const sidewalk = y === -4 || y === 27 || ((x === -4 || x === 35) && y >= -1)
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
      const apron =
        ((x === -1 || x === 32) && y >= -1 && y <= 24) ||
        ((y === -1 || y === 24) && x >= -1 && x <= 32)
      if (apron) c = '#C8C8BA'
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
  out.push(...streetDetailCommands(), ...portDetailCommands())
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
  const inside = parcelEdges(parcels, gates).filter(
    e =>
      !(
        (e.side === 'n' && e.y === 0) ||
        (e.side === 'w' && e.x === 0) ||
        (e.side === 'e' && e.x === 31) ||
        (e.side === 's' && e.y === 23)
      ),
  )
  const edges = [
    ...inside,
    ...Array.from({ length: 34 }, (_, i) => ({ x: i - 1, y: -1, side: 'n' as const })).filter(
      e => !gates.some(g => g.y === 0 && e.x === g.x),
    ),
    ...Array.from({ length: 34 }, (_, i) => ({ x: i - 1, y: 24, side: 's' as const })),
    ...Array.from({ length: 26 }, (_, i) => ({ x: -1, y: i - 1, side: 'w' as const })).filter(
      e => !gates.some(g => g.x === 0 && e.y >= g.y && e.y < g.y + 2),
    ),
    ...Array.from({ length: 26 }, (_, i) => ({ x: 32, y: i - 1, side: 'e' as const })),
  ]
  return edges.map(e => {
    const x = (e.x + (e.side === 'e' ? 1 : 0)) * 32,
      y = (e.y + (e.side === 's' ? 1 : 0)) * 32,
      out: Command[] = []
    const R = (px: number, py: number, w: number, h: number, c: string) =>
      out.push(rect(px, py, w, h, c))
    if (e.side === 'n' || e.side === 's') {
      R(x, y - 6, 32, 7, '#55646A')
      R(x, y - 6, 32, 4, '#CBC7B0')
      R(x, y - 7, 32, 1, '#F0E7CD')
      R(x, y - 13, 32, 1.5, '#364D55')
      R(x, y - 10, 32, 1, '#6A7E7D')
      for (let k = 0; k < 32; k += 8) R(x + k, y - 13, 1, 7, '#364D55')
      R(x, y - 16, 4, 17, '#677575')
      R(x, y - 16, 3, 14, '#DED4BB')
      R(x - 0.5, y - 17, 5, 2, '#F2E8CC')
    } else {
      R(x - 2, y, 4, 32, '#53656B')
      R(x - 1, y, 2, 32, '#C7C3AB')
      for (let k = 0; k < 32; k += 8) {
        R(x - 0.5, y + k - 10, 1.5, 12, '#364D55')
        R(x - 2, y + k - 2, 4, 3, '#E1D7BC')
      }
    }
    return { depth: e.y + (e.side === 'n' ? 0 : 1), commands: out }
  })
}
// These stay separate, sorted scene objects, sharing the building sprite vocabulary.
export function scenicCommands(id: string, level: number) {
  return topdownArt(id, level)
}
