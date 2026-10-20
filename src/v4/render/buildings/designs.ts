import { box, tank, rect, circle, ellipse, poly, detail, ink, type Command } from './shapes'
export type Sprite = (level: number, accent: string, t: number) => Command[]
export const gate: Sprite = (l, a, t) => [
  ...box(-7, 0, 8, 8, 12, '#FFF6E3'),
  rect(0, -6, 22, 2, ink),
  rect(1, -7 - (Math.sin(t) > 0 ? 8 : 0), 18, 2, a),
  rect(5, -8, 2, 3, ink),
  rect(11, -8, 2, 3, ink),
  ...detail(l, a),
]
export const loading: Sprite = (l, a) => [
  rect(-18, -20, 2, 30, '#73818F'),
  rect(16, -4, 2, 22, '#73818F'),
  ...box(-4, -16, 24, 24, 4, a, '#B5653A', '#948C7E'),
  rect(-14, 2, 28, 2, '#F2C230'),
  rect(-10, -7, 3, 10, ink),
  rect(8, 1, 3, 10, ink),
  ...detail(l, a),
]
export const crudeTank: Sprite = (l, a) => [
  ...box(-13, 8, 27, 25, 3, '#D8D2C4', '#B9B2A3', '#948C7E'),
  ...tank(0, 3, 15, 19, a),
  rect(-14, -9, 28, 3, '#F2C230'),
  rect(11, -17, 2, 21, '#14110F'),
  rect(0, -23, 4, 3, '#B5653A'),
  ...(l >= 3 ? [rect(-12, -18, 7, 3, '#F08A24')] : []),
  ...detail(l, a),
]
export const productTank: Sprite = (l, a) => [
  ...tank(0, 3, 10, 20, a),
  rect(-8, -9, 16, 3, a),
  rect(0, -24, 3, 4, '#B5653A'),
  ...detail(l, a),
]
export const cdu: Sprite = (l, a) => [
  ...box(-15, 7, 29, 24, 4, '#D8D2C4', '#B9B2A3', '#948C7E'),
  ...box(-14, -1, 15, 11, 14, '#F08A24', '#B5653A', '#73818F'),
  ...tank(7, 0, 7, 38, '#F08A24'),
  rect(0, -30, 14, 3, '#F2C230'),
  rect(0, -17, 14, 3, '#F2C230'),
  rect(12, -36, 2, 39, ink),
  rect(-15, -17, 7, 3, ink),
  ...(l >= 3 ? [...tank(-9, -5, 4, 20, '#73818F')] : []),
  ...detail(l, a),
]
export const hydro: Sprite = (l, a) => [
  ...box(-14, 9, 28, 22, 4, '#D8D2C4', '#B9B2A3', '#948C7E'),
  ...tank(-8, 0, 7, 24, a),
  ...tank(9, 7, 7, 24, a),
  rect(-13, -9, 26, 3, '#F2C230'),
  rect(-12, -21, 3, 24, ink),
  rect(13, -15, 3, 24, ink),
  ...box(-3, 10, 10, 8, 7, '#C9D3DC'),
  ...detail(l, a),
]
export const reformer: Sprite = (l, a) => [
  ...box(-14, 8, 16, 20, 9, a),
  ...tank(-10, -3, 5, 27, a),
  ...tank(0, 2, 5, 30, a),
  ...tank(10, 7, 5, 27, a),
  rect(-15, -15, 31, 2, '#B5653A'),
  ...detail(l, a),
]
export const cracker: Sprite = (l, a) => [
  ...box(-14, 5, 20, 20, 14, a),
  ...tank(-10, -2, 8, 43, a),
  ...tank(12, 8, 11, 34, a),
  rect(3, -40, 4, 44, '#73818F'),
  rect(-18, -26, 32, 2, '#F2C230'),
  rect(-16, -25, 2, 20, '#B5653A'),
  ...detail(l, a),
]
export const blend: Sprite = (l, a, t) => [
  ...box(-14, 10, 28, 24, 4, '#D8D2C4', '#B9B2A3', '#948C7E'),
  ...tank(-9, 0, 6, 14, a),
  ...tank(9, 0, 6, 14, a),
  ...tank(0, 8, 6, 14, '#3D8FE0'),
  rect(-14, -14, 28, 3, '#F2C230'),
  rect(-1, -22, 3, 12, ink),
  rect(-5, -21, 11, 3, a),
  ...detail(l, a),
]
export const pipe: Sprite = (l, a) => [
  rect(-10, -15, 3, 20, '#73818F'),
  rect(8, -6, 3, 20, '#73818F'),
  ...['#E2483D', '#F08A24', '#3D8FE0'].map((color, i) =>
    poly(
      [
        [-12, -16 + i * 3],
        [0, -10 + i * 3],
        [12, -16 + i * 3],
        [12, -14 + i * 3],
        [0, -8 + i * 3],
        [-12, -14 + i * 3],
      ],
      color,
    ),
  ),
  ...detail(l, a),
]
export const lab: Sprite = (l, a) => [
  ...box(-5, 0, 14, 12, 16, a, '#FFF6E3', '#D8D2C4'),
  rect(-12, -7, 6, 5, '#4FA3D9'),
  rect(-2, -18, 6, 8, '#FFF6E3'),
  rect(0, -17, 2, 4, a),
  circle(1, -12, 3, a),
  ...detail(l, a),
]
export const control: Sprite = (l, a, t) => [
  ...box(-10, 1, 24, 12, 15, a, '#FFF6E3', '#D8D2C4'),
  rect(-17, -5, 21, 5, '#3D8FE0'),
  rect(-14, -4, 3, 2, '#2FB38E'),
  rect(-8, -4, 3, 2, '#F2C230'),
  ...detail(l, a),
]
export const canteen: Sprite = (l, a) => [
  ...box(-10, 0, 24, 12, 13, '#B5653A', '#FFF6E3', '#D8D2C4'),
  poly(
    [
      [-22, -6],
      [-12, -19],
      [12, -7],
      [2, 6],
    ],
    '#B5653A',
  ),
  rect(-13, -8, 4, 8, '#4FA3D9'),
  ...box(10, 10, 8, 5, 5, '#B5653A'),
  rect(-2, -25, 4, 12, '#73818F'),
  ...detail(l, a),
]
export const flare: Sprite = (l, a, t) => [
  ...box(-4, 2, 9, 9, 5),
  rect(-2, -46, 4, 50, '#73818F'),
  rect(-4, -35, 2, 34, '#B5653A'),
  poly(
    [
      [-3, -46],
      [0, -56 - Math.floor(Math.abs(Math.sin(t)) * 3)],
      [4, -46],
    ],
    '#F08A24',
  ),
  poly(
    [
      [-1, -46],
      [1, -51],
      [2, -46],
    ],
    '#F2C230',
  ),
  ...detail(l, a),
]
export const tree: Sprite = (l, a) => [
  rect(-2, -10, 4, 17, '#B5653A'),
  poly(
    [
      [-12, -7],
      [-8, -23],
      [0, -29],
      [9, -21],
      [12, -4],
      [0, 2],
    ],
    a,
  ),
  rect(-7, -19, 4, 4, '#8DBF5A'),
  ...(l >= 3 ? [circle(-8, -10, 5, '#5E8C3A'), circle(8, -12, 6, '#8DBF5A')] : []),
  ...(l >= 5 ? [circle(-6, -22, 6, '#8DBF5A'), circle(6, -26, 6, '#7AAA4C')] : []),
]
export const lamp: Sprite = (l, a) => [
  rect(-1, -25, 2, 30, '#73818F'),
  rect(-5, -27, 10, 5, a),
  rect(-6, -29, 12, 2, ink),
  ...(l >= 3 ? [rect(-10, -22, 20, 2, ink), rect(-12, -22, 5, 5, a), rect(8, -22, 5, 5, a)] : []),
  ...(l >= 5 ? [rect(-1, -38, 2, 10, ink), rect(-6, -41, 12, 5, a)] : []),
]
export const sign: Sprite = (l, a) => [
  rect(-8, -15, 2, 22, '#73818F'),
  rect(8, -6, 2, 22, '#73818F'),
  ...box(-8, -14, 22, 3, 10, a),
  rect(-7, -20, 12, 2, '#FFF6E3'),
  ...(l >= 3 ? [rect(-7, -16, 12, 2, '#F2C230')] : []),
  ...(l >= 5 ? [rect(0, -35, 1, 12, ink), rect(1, -35, 8, 5, a)] : []),
]
export const tower: Sprite = (l, a) => [
  ...box(-8, 0, 24, 22, 58, a),
  rect(-18, -28, 26, 3, '#F2C230'),
  rect(-18, -43, 26, 3, '#4FA3D9'),
  rect(-18, -13, 26, 3, '#4FA3D9'),
  rect(1, -66, 2, 16, ink),
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
    '#4A4E57',
  ),
  rect(-1, -2, 3, 2, '#F2C230'),
]
export const trophy: Sprite = (l, a) => [
  ...box(-3, 3, 8, 8, 5, a),
  rect(-1, -17, 3, 20, a),
  ellipse(-8, -24, 16, 12, a),
  rect(-9, -26, 18, 2, ink),
  ...(l >= 3 ? [circle(-8, -19, 3, '#F2C230'), circle(8, -19, 3, '#F2C230')] : []),
  ...(l >= 5
    ? [
        poly(
          [
            [-7, -29],
            [-3, -34],
            [0, -29],
            [3, -34],
            [7, -29],
          ],
          '#F2C230',
        ),
      ]
    : []),
]
