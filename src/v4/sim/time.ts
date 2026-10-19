import { B, MONTH, YEAR } from '../data/balance'
export const dateAt = (tick: number) => ({
  year: Math.floor(tick / YEAR) + 1,
  month: Math.floor((tick % YEAR) / MONTH) + 1,
  week: Math.floor((tick % MONTH) / B.ticksPerWeek) + 1,
})
export const isMonthStart = (tick: number) => (tick - 1) % MONTH === 0
