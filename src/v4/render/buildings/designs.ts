import { box, tank, rect, poly, detail, ink, type Command } from './shapes'
export type Sprite = (level: number, accent: string, t: number) => Command[]
const steel = '#DFE8E8',
  blue = '#4FA3D9',
  yellow = '#F2C230',
  cream = '#FFF6E3'
// Local origin is always the projected centre of the unchanged footprint.
const pad = (w: number, d: number) =>
  box((d - w) * 8, -(w + d) * 4, w * 16 - 3, d * 16 - 3, 2, '#E5D9BB', '#BEAF91', '#9F947E')
const hut = (w: number, d: number, h: number, roof: string) =>
  box((d - w) / 2, -(w + d) / 4, w, d, h, roof, cream, '#B6C8CB')
export const gate: Sprite = (l, a, t) => [
  ...pad(1, 2),
  ...hut(10, 10, 12, blue),
  rect(-7, -9, 5, 4, '#264554'),
  ...(t > 0
    ? [rect(5, -25, 3, 20, yellow), rect(5, -20, 3, 3, ink), rect(5, -12, 3, 3, ink)]
    : [rect(5, -5, 17, 3, yellow), rect(10, -5, 3, 3, ink), rect(17, -5, 3, 3, ink)]),
  rect(20, -2, 3, 7, '#73818F'),
  ...detail(l, a),
]
export const loading: Sprite = (l, a) => [
  ...pad(2, 2),
  rect(-22, -17, 3, 26, '#73818F'),
  rect(19, -17, 3, 26, '#73818F'),
  ...box(-2, -22, 24, 22, 4, a, '#C36D29', '#8B613F'),
  rect(-16, 5, 30, 3, yellow),
  rect(-10, -4, 3, 10, ink),
  rect(9, -4, 3, 10, ink),
  ...detail(l, a),
]
export const crudeTank: Sprite = (l, a) => [
  ...pad(2, 2),
  ...tank(0, 6, 20, 21, a),
  rect(-17, -4, 34, 4, a),
  rect(13, -17, 3, 23, yellow),
  rect(-3, -22, 6, 4, '#73818F'),
  ...detail(l, a),
]
export const productTank: Sprite = (l, a) => [
  ...pad(1, 1),
  ...tank(0, 3, 11, 18, a),
  rect(-8, -8, 16, 4, a),
  rect(-2, -20, 4, 3, steel),
  ...detail(l, a),
]
export const cdu: Sprite = (l, a) => [
  ...pad(2, 2),
  ...box(-7, 0, 14, 12, 14, '#F08A24', '#C3773B', '#845C49'),
  ...tank(8, 2, 8, 36, '#F08A24'),
  rect(0, -28, 16, 3, yellow),
  rect(0, -16, 16, 3, yellow),
  rect(-14, -5, 7, 5, ink),
  rect(12, -32, 2, 32, ink),
  ...detail(l, a),
]
export const hydro: Sprite = (l, a) => [
  ...pad(2, 2),
  ...tank(-10, -1, 8, 25, a),
  ...tank(10, 7, 8, 25, a),
  rect(-10, -14, 20, 3, yellow),
  ...box(-3, 7, 11, 9, 7, steel),
  ...detail(l, a),
]
export const reformer: Sprite = (l, a) => [
  ...pad(2, 3),
  ...tank(-19, 1, 6, 21, a),
  ...tank(-3, 7, 6, 25, a),
  ...tank(13, 13, 6, 21, a),
  rect(-19, -8, 33, 3, yellow),
  ...box(-9, 5, 11, 10, 10, '#F08A24'),
  ...detail(l, a),
]
export const cracker: Sprite = (l, a) => [
  ...pad(3, 3),
  ...tank(13, 9, 15, 27, a),
  ...tank(-15, 0, 9, 42, a),
  rect(-7, -32, 18, 4, yellow),
  ...box(-12, 16, 20, 15, 10, steel),
  rect(-20, -31, 3, 28, '#B5653A'),
  ...detail(l, a),
]
export const blend: Sprite = (l, a) => [
  ...pad(2, 2),
  ...tank(-12, 0, 8, 13, a),
  ...tank(10, 0, 8, 13, blue),
  ...tank(0, 12, 8, 13, '#2FB38E'),
  rect(-14, -16, 28, 3, yellow),
  rect(-2, -23, 4, 10, ink),
  rect(-7, -24, 14, 4, cream),
  ...detail(l, a),
]
export const pipe: Sprite = (l, a) => [
  rect(-12, -11, 3, 16, '#73818F'),
  rect(9, -11, 3, 16, '#73818F'),
  ...['#E2483D', '#F08A24', blue].map((c, i) =>
    poly(
      [
        [-13, -14 + i * 3],
        [0, -8 + i * 3],
        [13, -14 + i * 3],
        [13, -11 + i * 3],
        [0, -5 + i * 3],
        [-13, -11 + i * 3],
      ],
      c,
    ),
  ),
  ...detail(l, a),
]
export const lab: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(12, 12, 13, a),
  rect(-9, -5, 5, 5, '#264554'),
  rect(-1, -21, 4, 8, cream),
  rect(-4, -16, 10, 5, '#2FB38E'),
  ...detail(l, a),
]
export const control: Sprite = (l, a) => [
  ...pad(2, 1),
  ...hut(25, 12, 13, a),
  rect(-16, -6, 19, 5, '#264554'),
  rect(-14, -5, 4, 2, '#2FB38E'),
  rect(-7, -5, 4, 2, yellow),
  rect(7, -24, 2, 12, ink),
  ...detail(l, a),
]
export const canteen: Sprite = (l, a) => [
  ...pad(2, 1),
  ...hut(24, 12, 11, a),
  poly(
    [
      [-18, -12],
      [-7, -23],
      [18, -10],
      [7, 1],
    ],
    '#D47B43',
  ),
  rect(-12, -7, 5, 8, blue),
  rect(7, -20, 4, 8, steel),
  ...detail(l, a),
]
export const flare: Sprite = (l, a, t) => [
  ...pad(1, 1),
  rect(-3, -30, 6, 35, '#73818F'),
  rect(-5, -22, 2, 25, '#B5653A'),
  poly(
    [
      [-5, -30],
      [-5, -36],
      [-2, -36],
      [-2, -42 - Math.floor(Math.abs(Math.sin(t)) * 3)],
      [2, -39],
      [6, -33],
      [3, -29],
    ],
    a,
  ),
  rect(-1, -36, 3, 6, yellow),
  ...detail(l, a),
]
export const tree: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-2, -9, 4, 14, '#B5653A'),
  poly(
    [
      [-12, -5],
      [-12, -15],
      [-7, -15],
      [-7, -23],
      [5, -23],
      [5, -19],
      [11, -19],
      [11, -6],
      [5, -6],
      [5, -2],
      [-6, -2],
      [-6, -5],
    ],
    a,
  ),
  rect(-7, -17, 6, 6, '#8DBF5A'),
  ...detail(l, a),
]
export const lamp: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-2, -22, 4, 26, '#73818F'),
  rect(-7, -25, 14, 7, a),
  rect(-8, -27, 16, 3, ink),
  ...detail(l, a),
]
export const sign: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-8, -10, 3, 16, '#73818F'),
  rect(6, -10, 3, 16, '#73818F'),
  rect(-13, -22, 26, 15, a),
  rect(-9, -18, 18, 3, cream),
  rect(-9, -12, 11, 2, cream),
  ...detail(l, a),
]
export const tower: Sprite = (l, a) => [
  ...pad(3, 3),
  ...hut(30, 28, 29, a),
  ...hut(20, 18, 48, '#C9D3DC'),
  rect(-15, -30, 21, 4, blue),
  rect(-15, -42, 21, 4, blue),
  rect(-2, -60, 4, 13, yellow),
  ...detail(l, a),
]
export const road: Sprite = () => [
  poly(
    [
      [0, -8],
      [16, 0],
      [0, 8],
      [-16, 0],
    ],
    '#59636A',
  ),
  poly(
    [
      [-5, -3],
      [-1, -5],
      [6, -1],
      [2, 1],
    ],
    cream,
  ),
]
export const trophy: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(9, 8, 5, '#73818F'),
  rect(-2, -13, 4, 12, a),
  poly(
    [
      [-8, -23],
      [8, -23],
      [8, -14],
      [4, -10],
      [-4, -10],
      [-8, -14],
    ],
    a,
  ),
  rect(-11, -21, 3, 9, yellow),
  rect(8, -21, 3, 9, yellow),
  ...detail(l, a),
]
export const flag: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-3, -29, 3, 35, steel),
  poly(
    [
      [0, -29],
      [13, -26],
      [10, -20],
      [0, -23],
    ],
    a,
  ),
  ...detail(l, a),
]
export const goldTree: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-2, -12, 4, 17, '#B5653A'),
  poly(
    [
      [-12, -10],
      [0, -28],
      [12, -10],
      [6, -10],
      [12, -3],
      [-12, -3],
      [-6, -10],
    ],
    a,
  ),
  rect(-5, -16, 4, 4, cream),
  ...detail(l, a),
]
export const goldSign: Sprite = (l, a) => [
  ...pad(1, 1),
  rect(-2, -14, 4, 20, steel),
  poly(
    [
      [-14, -26],
      [10, -26],
      [14, -19],
      [10, -12],
      [-14, -12],
      [-10, -19],
    ],
    a,
  ),
  rect(-7, -21, 14, 3, cream),
  ...detail(l, a),
]
export const legend: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(12, 10, 6, '#73818F'),
  rect(-5, -19, 10, 14, a),
  rect(-4, -27, 8, 8, steel),
  rect(-7, -29, 14, 3, yellow),
  rect(-10, -18, 5, 3, a),
  ...detail(l, a),
]
export const awardProduct: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(10, 9, 6, a),
  poly(
    [
      [0, -28],
      [8, -17],
      [8, -11],
      [3, -7],
      [-3, -7],
      [-8, -11],
      [-8, -17],
    ],
    '#E2483D',
  ),
  rect(-3, -16, 3, 5, cream),
  ...detail(l, a),
]
export const awardSafety: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(10, 9, 6, a),
  poly(
    [
      [-10, -26],
      [10, -26],
      [10, -14],
      [0, -6],
      [-10, -14],
    ],
    '#2FB38E',
  ),
  rect(-2, -23, 4, 11, cream),
  rect(-5, -20, 10, 4, cream),
  ...detail(l, a),
]
export const awardEco: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(12, 10, 6, a),
  rect(-2, -20, 4, 17, '#B5653A'),
  poly(
    [
      [-12, -19],
      [-9, -26],
      [0, -22],
      [2, -28],
      [12, -26],
      [10, -16],
      [0, -14],
    ],
    '#5E8C3A',
  ),
  ...detail(l, a),
]
export const awardRefinery: Sprite = (l, a) => [
  ...pad(1, 1),
  ...hut(12, 10, 6, a),
  ...tank(-6, -8, 4, 17, steel),
  ...tank(5, -5, 4, 27, steel),
  rect(-7, -17, 13, 3, yellow),
  ...detail(l, a),
]
