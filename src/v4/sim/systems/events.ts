import { marketNames } from '../../i18nLabels'
import { events } from '../../data/events'
import { B, MONTH, YEAR, PROGRESSION as P, WEAR, STAFF } from '../../data/balance'
import { brokenPlants } from './plant'
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
  // Every event logs what actually happened, so the log explains itself.
  const say = (en: string, th: string) => ({
    ...next,
    log: [...next.log, { tick: s.tick, en, th }].slice(-B.logLimit),
  })
  if (event.id === 'merchant')
    return {
      ...say(
        `Travelling merchant: career manuals for sale this month ($${(STAFF.manualCost / 1000).toFixed(0)}k)`,
        `พ่อค้าเร่มาขายคู่มืออาชีพเดือนนี้ ($${(STAFF.manualCost / 1000).toFixed(0)}k)`,
      ),
      merchantUntil: s.tick + MONTH,
    }
  if (event.id === 'celebrity')
    return {
      ...say(
        `Celebrity visit: +${P.celebrityFame} Fame`,
        `คนดังมาเยี่ยมชม +${P.celebrityFame} ชื่อเสียง`,
      ),
      fame: next.fame + P.celebrityFame,
    }
  if (event.id === 'inspector')
    return safe >= P.safeThreshold
      ? {
          ...say(
            `Inspector impressed: +$${P.inspectorMoney.toLocaleString()} +${P.inspectorFame} Fame`,
            `ผู้ตรวจพอใจ +$${P.inspectorMoney.toLocaleString()} +${P.inspectorFame} ชื่อเสียง`,
          ),
          money: next.money + P.inspectorMoney,
          fame: next.fame + P.inspectorFame,
          year: { ...next.year, income: next.year.income + P.inspectorMoney },
          monthProfit: next.monthProfit + P.inspectorMoney,
        }
      : say(
          `Inspector visited: safety ${Math.round(safe)}/${P.safeThreshold}, no reward`,
          `ผู้ตรวจมาเยือน ความปลอดภัย ${Math.round(safe)}/${P.safeThreshold} ยังไม่ได้รางวัล`,
        )
  if (event.id === 'storm') {
    const weeks = P.stormWeeks * (hasShelter(s) ? P.shelter : 1)
    return {
      ...say(`Storm: production stops for ${weeks} week(s)`, `พายุเข้า หยุดผลิต ${weeks} สัปดาห์`),
      stormUntil: s.tick + Math.round(weeks * B.ticksPerWeek),
    }
  }
  if (event.id === 'spill') {
    const odds =
      P.incidentChance *
      (1 + getModifiers(s).incident) *
      (1 + WEAR.incidentPerBroken * brokenPlants(s))
    const [risk, rng2] = random(next.rng)
    next = { ...next, rng: rng2 }
    if (safe >= P.safeThreshold || risk >= odds)
      return say(
        'Oil spill scare: the safety team handled it',
        'เกือบน้ำมันรั่ว ทีมความปลอดภัยจัดการได้',
      )
    // The fine grows with the refinery, so it still stings late.
    const value = s.yard.buildings.reduce((n, b) => n + b.cost, 0)
    const loss = Math.round(
      Math.max(P.spillMoney, value * P.spillShare) * (hasStimulus(s) ? P.stimulus : 1),
    )
    return {
      ...say(
        `Oil spill! −$${loss.toLocaleString()} −${P.spillFame} Fame`,
        `น้ำมันรั่ว! เสีย $${loss.toLocaleString()} ชื่อเสียง −${P.spillFame}`,
      ),
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
  return next
}
