import { marketNames } from '../../i18nLabels'
import { events } from '../../data/events'
import { B, MONTH, YEAR, PROGRESSION as P } from '../../data/balance'
import { random } from '../rng'
import { hasStimulus, hasShelter } from './investments'
import { getModifiers } from './combos'
import { staffStats } from './staff'
import type { GameState } from '../types'
export function eventSystem(s: GameState): GameState {
  let next = s
  if (s.tick === s.market.nextChangeTick - MONTH) {
    const phase =
      s.market.phase === 'normal' ? 'boom' : s.market.phase === 'boom' ? 'bust' : 'normal'
    next = {
      ...next,
      notices: [
        ...next.notices,
        {
          uid: `market${s.tick}`,
          kind: 'market',
          en: `Market ${marketNames[phase].en} in one month`,
          th: `ตลาดจะเปลี่ยนเป็น ${marketNames[phase].th} ในอีก 1 เดือน`,
        },
      ],
    }
  }
  if (s.tick >= s.market.nextChangeTick) {
    const [r, rng] = random(s.rng),
      phase = s.market.phase === 'normal' ? 'boom' : s.market.phase === 'boom' ? 'bust' : 'normal'
    next = {
      ...next,
      rng,
      market: {
        phase,
        nextChangeTick: s.tick + Math.round((P.marketMinYears + r * P.marketExtraYears) * YEAR),
      },
    }
  }
  if (s.tick % (MONTH / P.eventsPerMonth) !== 0 || !s.yard.buildings.some(b => b.defId === 'cdu'))
    return next
  const [r, rng] = random(next.rng)
  next = { ...next, rng }
  const event = events[Math.floor(r * events.length)],
    safe = staffStats(next).eco + getModifiers(next).eco
  next = { ...next, log: [...next.log, { tick: s.tick, ...event.name }].slice(-B.logLimit) }
  if (event.id === 'merchant') return { ...next, merchantUntil: s.tick + MONTH }
  if (event.id === 'celebrity') return { ...next, fame: next.fame + P.celebrityFame }
  if (event.id === 'inspector' && safe >= P.safeThreshold)
    return {
      ...next,
      money: next.money + P.inspectorMoney,
      fame: next.fame + P.inspectorFame,
      year: { ...next.year, income: next.year.income + P.inspectorMoney },
      monthProfit: next.monthProfit + P.inspectorMoney,
    }
  if (event.id === 'storm')
    return {
      ...next,
      stormUntil:
        s.tick + Math.round(P.stormWeeks * B.ticksPerWeek * (hasShelter(s) ? P.shelter : 1)),
    }
  if (event.id === 'spill' && safe < P.safeThreshold) {
    const [risk, rng] = random(next.rng)
    next = { ...next, rng }
    if (risk < P.incidentChance * (1 + getModifiers(s).incident)) {
      const loss = P.spillMoney * (hasStimulus(s) ? P.stimulus : 1)
      return {
        ...next,
        money: next.money - loss,
        fame: Math.max(0, next.fame - P.spillFame),
        year: {
          ...next.year,
          incidents: next.year.incidents + 1,
          expenses: next.year.expenses + loss,
        },
        monthProfit: next.monthProfit - loss,
      }
    }
  }
  return next
}
