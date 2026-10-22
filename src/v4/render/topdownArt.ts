// Editable, deterministic pixel artwork. All geometry uses the same 32 px tile.
// No ground/slab is baked into these sprites; the yard draws exact foundations.
import { buildingDef } from '../data/buildings'
import { rect, poly, type Command } from './buildings/shapes'
import { scenicSizes } from './graphics'
export const artDefinition = (id: string) => scenicSizes[id] ?? buildingDef(id)
export const artPalette = {
  ink: '#22313D',
  steel: '#B4CDD0',
  light: '#E3ECE3',
  shade: '#6F929A',
  dark: '#34515D',
  yellow: '#D9A541',
  orange: '#E88239',
  red: '#D35348',
  blue: '#478CB8',
  glass: '#91D6DA',
  green: '#8DB957',
  greenShade: '#55844F',
  cream: '#F3E5BE',
  gold: '#FFC94A',
}
export function topdownArt(id: string, level = 1, westGate = false): Command[] {
  const d = artDefinition(id),
    W = d.w * 32,
    D = d.h * 32,
    p = artPalette,
    out: Command[] = []
  const R = (x: number, y: number, w: number, h: number, c: string) => out.push(rect(x, y, w, h, c))
  const box = (x: number, y: number, w: number, h: number, c: string) => {
    R(x, y, w, h, p.ink)
    R(x + 1, y + 1, w - 2, h - 2, c)
  }
  const cap = (x: number, y: number, r: number, c: string) =>
    out.push(
      poly(
        [
          [x - r + 3, y - r / 2],
          [x + r - 3, y - r / 2],
          [x + r, y - 1],
          [x + r, y + 2],
          [x + r - 3, y + r / 2],
          [x - r + 3, y + r / 2],
          [x - r, y + 2],
          [x - r, y - 1],
        ].map(a => a.map(Math.round)),
        c,
      ),
    )
  const ladder = (x: number, base: number, h: number) => {
    R(x, base - h, 2, h, p.yellow)
    R(x + 7, base - h, 2, h, p.yellow)
    for (let y = base - h + 2; y < base; y += 5) R(x, y, 9, 1, p.yellow)
  }
  const cylinder = (x: number, y: number, r: number, h: number, accent: string) => {
    cap(x, y, r, p.ink)
    R(x - r, y - h, 2 * r, h, p.ink)
    R(x - r + 1, y - h, 2 * r - 2, h, p.steel)
    R(x + r - 4, y - h, 3, h, p.shade)
    R(x - r + 1, y - h + 5, 3, Math.max(2, h - 9), p.light)
    R(x - r + 1, y - Math.round(h * 0.45), r * 2 - 2, 4, accent)
    cap(x, y - h, r, p.ink)
    cap(x, y - h, r - 1, p.light)
    R(x - 1, y - h - 3, 3, 3, p.shade)
    if (level >= 2) ladder(x + r - 3, y + 2, h + 1)
    if (level >= 4) {
      R(x - r - 2, y - 3, 3, 5, p.orange)
      R(x - r - 2, y - 3, 7, 2, p.yellow)
    }
  }
  const pipe = (x: number, y: number, w: number, h: number, c = p.yellow) => {
    R(x - 1, y - 1, w + 2, 4, p.ink)
    R(x, y, w, 2, c)
    R(x + w - 2, y, 4, h, p.ink)
    R(x + w - 1, y + 1, 2, h - 2, c)
  }
  const house = (x: number, y: number, w: number, depth: number, roof: string) => {
    box(x, y - 10, w, depth, roof)
    R(x + 2, y - 8, w - 4, 2, p.light)
    for (let xx = x + 6; xx < x + w - 3; xx += 7) R(xx, y - 5, 1, depth - 8, p.shade)
    box(x, y + depth - 10, w, 11, p.cream)
    for (let xx = x + 4; xx < x + w - 8; xx += 11) {
      box(xx, y + depth - 7, 7, 5, p.blue)
      R(xx + 1, y + depth - 6, 3, 2, p.glass)
    }
    box(x + w - 12, y + depth - 7, 7, 8, p.dark)
    if (level >= 2) {
      box(x + 4, y - 8, 9, 5, p.steel)
      R(x + 6, y - 7, 5, 1, p.shade)
    }
    if (level >= 3 && w >= 24) {
      box(x + w - 18, y - 7, 12, 6, p.blue)
      R(x + w - 16, y - 5, 8, 1, p.glass)
    }
    if (level >= 4) {
      R(x + 2, y + depth - 11, w - 4, 3, p.orange)
      R(x + 4, y + depth + 1, w - 8, 2, p.shade)
    }
  }
  if (id === 'warehouse') {
    house(3, 8, 90, 39, p.blue)
    for (let x = 10; x < 80; x += 25) {
      box(x, 43, 18, 15, p.dark)
      for (let y = 46; y < 57; y += 3) R(x + 1, y, 16, 1, p.shade)
    }
    R(5, 60, 86, 2, p.yellow)
  } else if (id === 'house' || id === 'office') {
    house(
      5,
      id === 'office' ? -4 : 6,
      54,
      id === 'office' ? 53 : 43,
      id === 'office' ? p.blue : p.orange,
    )
    if (id === 'office')
      for (let x = 11; x < 53; x += 13) {
        box(x, 28, 8, 8, p.dark)
        R(x + 1, 29, 6, 3, p.glass)
      }
  } else if (id === 'containers') {
    box(3, 4, 57, 25, p.orange)
    R(5, 6, 53, 2, p.gold)
    for (let x = 8; x < 57; x += 6) R(x, 10, 1, 17, p.red)
    R(57, 8, 1, 18, p.steel)
  } else if (id === 'utility') {
    box(4, 12, 55, 17, p.shade)
    box(7, 3, 17, 19, p.steel)
    box(31, 3, 20, 19, p.steel)
    for (let x = 10; x < 50; x += 9) {
      R(x, -4, 3, 9, p.dark)
      R(x - 1, -1, 5, 2, p.blue)
    }
  } else if (id === 'rocks') {
    cap(14, 20, 13, p.dark)
    cap(14, 16, 12, p.shade)
    cap(12, 10, 7, p.steel)
    cap(23, 24, 6, p.dark)
  } else if (id === 'crane') {
    box(11, -42, 6, 100, p.yellow)
    R(12, -40, 2, 96, p.gold)
    for (let y = -35; y < 51; y += 12) {
      R(11, y, 6, 2, p.orange)
    }
    box(9, -44, 46, 5, p.yellow)
    R(50, -39, 1, 50, p.dark)
    R(47, 10, 7, 2, p.orange)
    box(4, 53, 22, 7, p.shade)
    box(14, -26, 18, 16, p.blue)
    R(16, -24, 14, 5, p.glass)
  } else if (id === 'road') {
    R(0, 0, W, D, '#51575A')
    R(1, 0, 1, D, p.cream)
    R(W - 2, 0, 1, D, p.cream)
    R(W / 2 - 1, 3, 2, 8, p.yellow)
    R(W / 2 - 1, 21, 2, 8, p.yellow)
  } else if (id === 'tank') cylinder(15, 24, 10, 26, p.red)
  else if (id === 'crudeTank') {
    cylinder(30, 46, 24, 32, p.dark)
    cap(30, 14, 21, p.yellow)
    cap(30, 14, 19, p.light)
    R(29, 11, 2, 6, p.shade)
    R(22, 14, 15, 1, p.shade)
    box(8, 49, 15, 9, p.blue)
    pipe(43, 49, 12, 9, p.orange)
    if (level >= 3) box(28, 50, 11, 8, p.steel)
  } else if (id === 'cdu') {
    pipe(10, 16, 43, 34)
    cylinder(13, 45, 8, 30, p.orange)
    cylinder(50, 45, 8, 30, p.orange)
    cylinder(31, 41, 9, 62, p.orange)
    box(23, 45, 19, 14, p.blue)
    box(27, 48, 10, 8, p.orange)
    R(30, 49, 3, 5, p.gold)
    if (level >= 3) cylinder(45, 18, 4, 24, p.yellow)
    if (level >= 4) {
      box(3, 50, 13, 8, p.steel)
      pipe(6, 46, 12, 11)
    }
  } else if (id === 'pipe') {
    for (let x = 5; x < 29; x += 7) {
      box(x, 6, 3, 23, p.shade)
      R(x, 5, 3, 3, p.yellow)
    }
    R(2, 11, 28, 3, p.ink)
    R(2, 12, 28, 1, p.orange)
    R(2, 18, 28, 3, p.ink)
    R(2, 19, 28, 1, p.yellow)
    if (level >= 3) {
      R(2, 24, 28, 3, p.ink)
      R(2, 25, 28, 1, p.steel)
    }
  } else if (id === 'lab') {
    house(3, 6, 26, 17, p.blue)
    box(12, 1, 8, 7, p.light)
    R(15, 2, 2, 5, p.red)
    R(13, 3, 6, 2, p.red)
  } else if (id === 'control' || id === 'canteen') {
    house(3, 4, 58, 18, id === 'control' ? p.blue : p.orange)
    if (id === 'control') {
      box(41, -5, 11, 6, p.dark)
      R(45, -12, 2, 8, p.shade)
      R(41, -12, 10, 2, p.steel)
    } else {
      R(7, 24, 17, 2, p.shade)
      R(9, 26, 2, 3, p.dark)
      R(20, 26, 2, 3, p.dark)
    }
  } else if (id === 'blend') {
    pipe(10, 15, 43, 30, p.blue)
    cylinder(17, 35, 12, 25, p.blue)
    cylinder(45, 35, 12, 25, p.orange)
    box(22, 43, 20, 14, p.dark)
    box(26, 46, 12, 6, p.glass)
    if (level >= 3) cylinder(11, 54, 5, 15, p.red)
    if (level >= 4) cylinder(53, 54, 5, 15, p.blue)
  } else if (id === 'loading') {
    house(5, 10, 53, 25, p.blue)
    for (let x = 10; x < 55; x += 18) {
      box(x, 36, 11, 18, p.dark)
      R(x + 1, 37, 9, 2, p.steel)
      R(x + 1, 45, 9, 1, p.shade)
    }
    R(6, 57, 50, 2, p.yellow)
    if (level >= 3) box(5, 43, 6, 10, p.orange)
  } else if (id === 'hydro') {
    box(7, 12, 48, 14, p.steel)
    R(9, 14, 44, 3, p.light)
    R(9, 23, 44, 2, p.shade)
    for (let x = 10; x < 55; x += 14) {
      R(x, 11, 3, 16, p.blue)
      R(x, 27, 3, 9, p.dark)
    }
    cylinder(47, 49, 10, 45, p.blue)
    pipe(9, 35, 26, 17, p.steel)
    box(7, 48, 20, 10, p.orange)
    if (level >= 3) cylinder(13, 37, 6, 22, p.yellow)
  } else if (id === 'reformer') {
    for (let y = 22; y < 87; y += 24) {
      box(7, y, 35, 14, p.orange)
      R(10, y + 3, 29, 2, p.gold)
      box(11, y + 7, 8, 6, p.dark)
      box(24, y + 7, 8, 6, p.dark)
    }
    cylinder(49, 70, 8, 72, p.orange)
    pipe(10, 8, 39, 77, p.steel)
    if (level >= 3) ladder(32, 87, 62)
    if (level >= 4) box(5, 79, 21, 10, p.blue)
  } else if (id === 'cracker') {
    pipe(13, 18, 67, 63, p.orange)
    cylinder(28, 60, 15, 78, p.yellow)
    cylinder(67, 59, 12, 54, p.orange)
    box(7, 71, 43, 16, p.orange)
    box(12, 75, 13, 9, p.dark)
    box(31, 75, 13, 9, p.dark)
    box(56, 70, 30, 17, p.blue)
    R(61, 73, 20, 3, p.glass)
    if (level >= 3) cylinder(83, 30, 5, 30, p.yellow)
  } else if (id === 'tower') {
    cylinder(47, 72, 17, 116, p.orange)
    cylinder(18, 65, 9, 58, p.blue)
    cylinder(78, 66, 9, 72, p.yellow)
    for (let y = -24; y < 61; y += 24) {
      R(26, y, 43, 3, p.yellow)
      R(26, y - 5, 2, 6, p.yellow)
      R(67, y - 5, 2, 6, p.yellow)
    }
    box(24, 78, 46, 10, p.blue)
    R(29, 81, 36, 3, p.glass)
    if (level >= 3) ladder(55, 74, 109)
    if (level >= 4) pipe(9, 70, 76, 17, p.orange)
  } else if (id === 'flare') {
    box(6, 25, 21, 4, p.shade)
    box(10, -43, 12, 68, p.steel)
    R(17, -42, 3, 65, p.shade)
    R(11, -43, 10, 5, p.dark)
    for (let y = -34; y < 24; y += 12) {
      R(9, y, 14, 2, p.orange)
    }
    ladder(5, 27, 64)
    if (level >= 3) {
      R(2, 8, 3, 20, p.dark)
      R(25, 8, 3, 20, p.dark)
    }
  } else if (id === 'gate') {
    R(1, 0, 30, 64, '#AEB8AD')
    R(4, 0, 2, 64, p.cream)
    R(26, 0, 2, 64, p.cream)
    house(westGate ? 18 : 3, westGate ? 42 : 46, 11, 10, p.blue)
    if (level >= 3) {
      box(3, 4, 6, 6, p.glass)
      box(23, 4, 6, 6, p.glass)
    }
  } else if (id === 'tree' || id === 'goldTree') {
    R(14, 12, 5, 16, '#805D42')
    R(10, 25, 14, 3, '#805D42')
    cap(16, 0, 14, p.ink)
    cap(16, -1, 13, id === 'goldTree' ? p.yellow : p.greenShade)
    cap(13, -9, 10, id === 'goldTree' ? p.gold : p.green)
    R(8, -9, 6, 3, id === 'goldTree' ? p.cream : '#B4D976')
    if (level >= 3) R(22, 20, 4, 4, p.yellow)
  } else if (id === 'lamp') {
    box(12, 25, 8, 4, p.dark)
    R(15, -17, 3, 44, p.dark)
    box(9, -23, 16, 8, p.yellow)
    R(11, -21, 12, 3, p.cream)
  } else if (id === 'flag') {
    box(10, 24, 13, 5, p.shade)
    R(13, -25, 2, 50, p.steel)
    box(15, -24, 15, 12, p.red)
    R(17, -22, 10, 3, p.orange)
  } else if (id === 'sign' || id === 'goldSign') {
    R(8, 10, 3, 17, p.dark)
    R(23, 10, 3, 17, p.dark)
    box(3, -5, 27, 18, id === 'goldSign' ? p.yellow : p.blue)
    R(7, 0, 18, 3, p.cream)
    R(10, 6, 12, 2, p.glass)
  } else if (id === 'flowerbed') {
    box(2, 9, 28, 20, '#805D42')
    R(4, 11, 24, 15, p.greenShade)
    for (let x = 6; x < 28; x += 7) {
      R(x, 14, 3, 3, p.red)
      R(x + 2, 21, 3, 3, p.gold)
    }
  } else {
    // Existing award and legend decorations retain distinct emblems and colours.
    box(7, 22, 19, 7, p.shade)
    box(10, 14, 13, 9, p.light)
    const colour =
      id === 'awardeco'
        ? p.green
        : id === 'awardsafety'
          ? p.orange
          : id === 'legend'
            ? p.blue
            : p.gold
    box(11, -3, 12, 17, colour)
    R(8, -5, 18, 5, colour)
    R(6, -1, 3, 8, colour)
    R(25, -1, 3, 8, colour)
    R(13, 4, 8, 3, p.cream)
  }
  // Compact, cumulative additions inside the unchanged pad for every L1–L5 family.
  if (id !== 'road') {
    if (level >= 2) {
      box(W - 8, D - 10, 4, 6, p.blue)
      R(W - 7, D - 9, 2, 2, p.glass)
    }
    if (level >= 3) {
      R(3, D - 5, W - 6, 2, p.yellow)
      for (let x = 3; x < W - 3; x += 10) R(x, D - 8, 1, 4, p.yellow)
    }
    if (level >= 4) {
      box(4, D - 12, 7, 5, p.steel)
      R(5, D - 11, 5, 1, p.light)
    }
    if (level >= 5) {
      R(W - 14, D - 10, 4, 7, p.gold)
      box(W - 13, D - 17, 3, 5, p.red)
    }
  }
  // Shift from footprint top-left to the slab's bottom-centre anchor.
  return out.map(c =>
    c.kind === 'polygon'
      ? { ...c, points: c.points.map(([x, y]) => [x - W / 2, y - D]) }
      : { ...c, x: c.x - W / 2, y: c.y - D },
  )
}
