import type { GameState } from './types'
export const serialize = (s: GameState): string => JSON.stringify(s)
export function deserialize(raw: string): GameState {
  const s = JSON.parse(raw)
  if (s?.version !== 4 || !Number.isInteger(s.tick) || s.tick < 0 || !Number.isFinite(s.money) || ![0,1,2,4].includes(s.speed) || !Array.isArray(s.yard?.buildings) || !Array.isArray(s.staff) || !Number.isInteger(s.rng)) throw new Error('Invalid v4 save')
  return s as GameState
}
