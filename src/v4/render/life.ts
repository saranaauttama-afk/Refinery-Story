import { box, rect, circle, ellipse, type Command } from './buildings/shapes'
export const jobColors: Record<string, string> = {
  operator: '#F08A24',
  chemist: '#9C5BD6',
  engineer: '#3D8FE0',
  safety: '#2FB38E',
  manager: '#E2483D',
  director: '#F2C230',
}
export function truckSprite(kind: string, accent: string, t: number): Command[] {
  const wobble = Math.floor(t * 5) % 2
  return [
    ...box(-6, -1, 15, 7, 6, kind === 'crude' ? '#3C3C46' : accent),
    ...box(9, 2, 6, 7, 8, '#FFF6E3'),
    rect(10, -2, 3, 3, '#4FA3D9'),
    rect(-8, -8, 17, 6, kind === 'crude' ? '#73818F' : accent),
    rect(-5, 8 + wobble, 5, 4, '#14110F'),
    rect(10, 13 + wobble, 5, 4, '#14110F'),
  ]
}
export function workerSprite(job: string, t: number): Command[] {
  const step = Math.floor(t * 4) % 2
  return [
    rect(-3, -6, 6, 6, jobColors[job] ?? '#F08A24'),
    rect(-1, -5, 2, 3, '#F2C230'),
    rect(-2, 0, 1, 3 + step, '#14110F'),
    rect(1, 0, 1, 4 - step, '#14110F'),
    rect(-2, -9, 4, 3, '#D8B78A'),
    rect(-2, -12, 4, 2, '#F2C230'),
    rect(-3, -10, 6, 2, '#F2C230'),
  ]
}
