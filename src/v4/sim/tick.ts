import { staffSystem } from './systems/staff'
import { customerSystem } from './systems/customers'
import { contractSystem } from './systems/contracts'
import { production } from './systems/production'
import { blending } from './systems/blending'
import { PRODUCTION } from '../data/balance'
import { economy } from './systems/economy'
import type { GameState } from './types'
export const tick = (s: GameState): GameState => customerSystem(blending(production(staffSystem(contractSystem(economy({ ...s, tick: s.tick + 1, popups:s.popups.filter(p=>s.tick-p.tick<PRODUCTION.popupTicks) }))))))
