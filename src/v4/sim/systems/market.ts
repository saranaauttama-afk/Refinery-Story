import { DEMAND as D, B, MONTH, ADS } from '../../data/balance'
import { bases, type BaseId } from '../../data/bases'
import { baseAvailable } from './investments'
import { random } from '../rng'
import type { GameState } from '../types'

export const demandOf = (s: GameState, base: string) => s.demand[base] ?? 1
export const trending = (s: GameState, base: string) =>
  s.trend.base === base && s.tick < s.trend.until
/** Price multiplier from how much buyers want this product right now. */
export const advertised = (s: GameState, base: string) => (s.ads[base] ?? 0) > s.tick
export const demandFactor = (s: GameState, base: string) =>
  demandOf(s, base) * (trending(s, base) ? D.trendBoost : 1) * (advertised(s, base) ? ADS.boost : 1)
/** A campaign costs half a month's recent profit (at least the minimum). */
export const adCost = (s: GameState) => {
  const recent = s.history.profits.slice(-3)
  const avg = recent.length ? recent.reduce((n, p) => n + p.profit, 0) / recent.length : 0
  return Math.max(ADS.minCost, Math.round(avg * ADS.profitShare))
}
export function advertise(s: GameState, base: BaseId): GameState {
  const cost = adCost(s)
  if (!s.opened || !baseAvailable(s, base) || advertised(s, base) || s.money < cost) return s
  const name = bases.find(b => b.id === base)!.name
  return {
    ...s,
    money: s.money - cost,
    year: { ...s.year, expenses: s.year.expenses + cost },
    monthProfit: s.monthProfit - cost,
    demand: { ...s.demand, [base]: D.max },
    ads: { ...s.ads, [base]: s.tick + MONTH },
    log: [
      ...s.log,
      {
        tick: s.tick,
        en: `Ad campaign for ${name.en}: demand reset, ×${ADS.boost} for a month`,
        th: `โฆษณา${name.th}: ตลาดกลับมาเต็ม และ ×${ADS.boost} 1 เดือน`,
      },
    ].slice(-B.logLimit),
  }
}
/** One truck of this product sold: buyers want a little less of it. */
export const cooled = (s: GameState, base: string): GameState => ({
  ...s,
  demand: { ...s.demand, [base]: Math.max(D.min, demandOf(s, base) - D.perSale) },
})

export function marketSystem(s: GameState): GameState {
  let next = s
  if (s.tick % B.ticksPerWeek === 0 && s.tick > 0) {
    const demand: Record<string, number> = {}
    for (const b of bases) demand[b.id] = Math.min(D.max, demandOf(s, b.id) + D.recoverPerWeek)
    next = { ...next, demand }
  }
  if (s.opened && s.tick % MONTH === 0 && s.tick > 0) {
    const pool = bases.filter(b => baseAvailable(s, b.id)).map(b => b.id as BaseId)
    if (pool.length) {
      const [r, rng] = random(next.rng)
      const base = pool[Math.floor(r * pool.length)]
      const name = bases.find(b => b.id === base)!.name
      next = {
        ...next,
        rng,
        trend: { base, until: s.tick + MONTH },
        log: [
          ...next.log,
          {
            tick: s.tick,
            en: `Trend this month: ${name.en} sells ×${D.trendBoost}`,
            th: `กระแสเดือนนี้: ${name.th} ราคา ×${D.trendBoost}`,
          },
        ].slice(-B.logLimit),
      }
    }
  }
  return next
}
