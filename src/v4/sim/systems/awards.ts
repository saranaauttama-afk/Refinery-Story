import { awardNames } from '../../i18nLabels'
import { B, YEAR, MONTH, POLISH, PROGRESSION as P, RIVALS as RV } from '../../data/balance'
import { dateAt } from '../time'
import { emptyYear } from '../state'
import { getModifiers } from './combos'
import type { GameState } from '../types'
export function awards(s: GameState): GameState {
  let next = s
  if (s.tick % MONTH === 0)
    next = {
      ...next,
      history: {
        ...next.history,
        profits: [...next.history.profits, { tick: s.tick, profit: s.monthProfit }],
      },
      monthProfit: 0,
    }
  if (s.tick % YEAR === YEAR - B.ticksPerWeek) {
    const year = dateAt(s.tick).year
    const rivals = Array.from({ length: 4 }, (_, i) => ({
      name: `Refinery ${i + 1}`,
      // Spread the four rivals around a typical player's curve: −15% … +15%.
      product: Math.round(
        RV.scoreBase * RV.scoreGrowth ** (year - 1) * (1 + RV.spread * (i / 1.5 - 1)),
      ),
      eco: P.rivalEcoBase + year * P.rivalEcoYear + i * P.rivalEcoGap,
      profit: Math.round(
        RV.profitBase * RV.profitGrowth ** (year - 1) * (1 + RV.spread * (i / 1.5 - 1)),
      ),
      safety: Math.max(0, 100 - year - i),
    }))
    const wins: string[] = []
    if (s.year.bestScore > Math.max(...rivals.map(r => r.product))) wins.push('product')
    if (s.year.incidents === 0) wins.push('safety')
    if (s.year.ecoTotal / Math.max(1, s.year.lots) > Math.max(...rivals.map(r => r.eco)))
      wins.push('eco')
    if (s.year.income - s.year.expenses > Math.max(...rivals.map(r => r.profit)))
      wins.push('refinery')
    const fame = wins.length * Math.min(P.awardMax, P.awardMin + (year - 1) * P.awardYearStep)
    const you = {
      product: s.year.bestScore,
      eco: Math.round(s.year.ecoTotal / Math.max(1, s.year.lots)),
      profit: s.year.income - s.year.expenses,
    }
    const result = { year, wins, fame, rivals, you }
    next = {
      ...next,
      fame: next.fame + fame + getModifiers(s).yearlyFame,
      decos: [...new Set([...next.decos, ...wins.map(w => `award${w}`)])],
      history: { ...next.history, awards: [...next.history.awards, result] },
      notices: [
        ...next.notices,
        {
          uid: `awards${year}`,
          kind: 'awards',
          en: `Year ${year}: ${wins.map(w => awardNames[w].en).join(', ') || 'No awards'} +${fame} Fame`,
          th: `รางวัลปี ${year}: ${wins.map(w => awardNames[w].th).join(', ') || 'ยังไม่ได้รางวัล'} +${fame} ชื่อเสียง`,
        },
      ],
    }
  }
  if (s.tick % YEAR === 0) {
    next = { ...next, year: emptyYear() }
    if (dateAt(s.tick).year === P.finalYear + 1 && next.evaluation === null) {
      const score = Math.round(s.fame + s.money / POLISH.rdScoreDivisor + s.rd)
      next = {
        ...next,
        evaluation: score,
        notices: [
          ...next.notices,
          {
            uid: 'ending',
            kind: 'ending',
            en: `Year 15 evaluation: ${score}`,
            th: `ผลประเมินครบ 15 ปี: ${score}`,
          },
        ],
      }
    }
  }
  return next
}
