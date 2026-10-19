import { getModifiers } from './combos'
import { B } from '../../data/balance'
import { isMonthStart } from '../time'
import type { GameState } from '../types'
export function economy(s: GameState): GameState {
  if (!isMonthStart(s.tick)) return s
  const amount = -(
    s.yard.buildings.reduce((n, b) => n + b.cost * B.upkeepRate, 0) +
    s.staff.reduce((n, p) => n + p.salary, 0)
  )
  return {
    ...s,
    money: s.money + amount,
    fame: s.fame + getModifiers(s).monthlyFame,
    year: { ...s.year, expenses: s.year.expenses - amount },
    monthProfit: s.monthProfit + amount,
    ledger: [...s.ledger, { tick: s.tick, amount, reason: 'upkeep' }].slice(-B.logLimit),
  }
}
