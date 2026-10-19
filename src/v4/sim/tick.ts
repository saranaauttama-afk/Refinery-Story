import { production } from './systems/production'
import { blending } from './systems/blending'
import { PRODUCTION } from '../data/balance'
import { economy } from './systems/economy'
import type { GameState } from './types'
export const tick = (s: GameState): GameState => blending(production(economy({ ...s, tick: s.tick + 1, popups:s.popups.filter(p=>s.tick-p.tick<PRODUCTION.popupTicks) })))
