import { LOAN } from '../../data/balance'
import type { GameState } from '../types'

// One loan at a time, only while short of cash.
export const canBorrow = (s: GameState, need: number) => s.loan === 0 && s.money < need

export function takeLoan(s: GameState): GameState {
  if (s.loan > 0) return s
  return {
    ...s,
    money: s.money + LOAN.amount,
    loan: LOAN.repay,
    log: [...s.log, { tick: s.tick, en: 'Bank loan $10,000', th: 'กู้ธนาคาร $10,000' }].slice(-50),
  }
}
