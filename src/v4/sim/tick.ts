import { economy } from './systems/economy'
import { production } from './systems/production'
import { blending } from './systems/blending'
import { customerSystem } from './systems/customers'
import { contractSystem } from './systems/contracts'
import { staffSystem } from './systems/staff'
import { progression } from './systems/progression'
import { eventSystem } from './systems/events'
import { awards } from './systems/awards'
import { PRODUCTION } from '../data/balance'
import type { GameState } from './types'
export function tick(s: GameState): GameState {
  let next = {
    ...s,
    tick: s.tick + 1,
    popups: s.popups.filter(p => s.tick - p.tick < PRODUCTION.popupTicks),
  }
  next = economy(next)
  next = contractSystem(next)
  next = eventSystem(next)
  next = staffSystem(next)
  next = production(next)
  next = blending(next)
  next = customerSystem(next)
  next = awards(next)
  return progression(next)
}
