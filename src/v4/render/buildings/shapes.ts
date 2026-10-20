export type Command =
  | { kind: 'polygon'; points: number[][]; color: string }
  | { kind: 'rect' | 'ellipse'; x: number; y: number; w: number; h: number; color: string }
  | { kind: 'circle'; x: number; y: number; r: number; color: string }
export const ink = '#14110F'
export const poly = (points: number[][], color: string): Command => ({
  kind: 'polygon',
  points,
  color,
})
export const rect = (x: number, y: number, w: number, h: number, color: string): Command => ({
  kind: 'rect',
  x,
  y,
  w,
  h,
  color,
})
export const ellipse = (x: number, y: number, w: number, h: number, color: string): Command => ({
  kind: 'ellipse',
  x,
  y,
  w,
  h,
  color,
})
export const circle = (x: number, y: number, r: number, color: string): Command => ({
  kind: 'circle',
  x,
  y,
  r,
  color,
})
export function box(
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  top = '#C9D3DC',
  left = '#9EABB8',
  right = '#73818F',
): Command[] {
  return [
    poly(
      [
        [x, y - h],
        [x + w, y + w / 2 - h],
        [x + w - d, y + (w + d) / 2 - h],
        [x - d, y + d / 2 - h],
      ],
      top,
    ),
    poly(
      [
        [x - d, y + d / 2 - h],
        [x + w - d, y + (w + d) / 2 - h],
        [x + w - d, y + (w + d) / 2],
        [x - d, y + d / 2],
      ],
      left,
    ),
    poly(
      [
        [x + w, y + w / 2 - h],
        [x + w - d, y + (w + d) / 2 - h],
        [x + w - d, y + (w + d) / 2],
        [x + w, y + w / 2],
      ],
      right,
    ),
  ]
}
// Stepped octagons keep cylinders readable as large pixel clusters.
export function tank(x: number, y: number, r: number, h: number, accent: string): Command[] {
  const cap = (cy: number, color: string) =>
    poly(
      [
        [x - r + 3, cy - r / 2],
        [x + r - 3, cy - r / 2],
        [x + r, cy - 1],
        [x + r, cy + 1],
        [x + r - 3, cy + r / 2],
        [x - r + 3, cy + r / 2],
        [x - r, cy + 1],
        [x - r, cy - 1],
      ],
      color,
    )
  return [
    cap(y, '#73818F'),
    rect(x - r, y - h, r * 2, h, '#9EABB8'),
    rect(x + r - 4, y - h, 4, h, '#73818F'),
    rect(x - r, y - h / 2, r * 2, 3, accent),
    cap(y - h, '#DFE8E8'),
  ]
}
// Upgrade marks stay inside even a one-tile footprint.
export function detail(level: number, accent: string): Command[] {
  return [
    ...(level >= 2 ? [rect(-5, 0, 3, 2, '#FFF6E3')] : []),
    ...(level >= 3 ? [rect(-6, -3, 12, 2, '#F2C230')] : []),
    ...(level >= 4 ? [rect(5, -9, 2, 7, ink)] : []),
    ...(level >= 5 ? [rect(5, -15, 1, 8, ink), rect(6, -15, 6, 4, accent)] : []),
  ]
}
