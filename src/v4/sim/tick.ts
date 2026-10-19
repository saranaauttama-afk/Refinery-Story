import { economy } from './systems/economy'
import type { GameState } from './types'
export const tick = (s: GameState): GameState => economy({ ...s, tick: s.tick + 1 })
