import { starterLayout } from '../../data/starter'
import { place } from './yard'
import type { GameState } from '../types'
export function buildStarter(s: GameState): GameState {
  if (s.yard.buildings.length) return s

  return starterLayout.reduce((s, [id, x, y]) => place(s, id, x, y), s)
}
