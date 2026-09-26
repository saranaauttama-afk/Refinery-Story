import { V3_AWARD_REPUTATION, V3_BUILDINGS, V3_PLANT_BY_FAMILY } from './data'
import type { V3AwardGrade, V3AwardPeriod, V3GameState, V3ProductFamily } from './types'

export const V3_AWARD_PERIOD_TICKS = 3_600
const GRADE_RP: Record<V3AwardGrade, number> = { S: 15, A: 10, B: 5, '-': 0 }

/** Families whose production route is open at the current chapter (frozen at period start). */
export function getV3UnlockedFamilyCount(state: V3GameState): number {
  return (Object.entries(V3_PLANT_BY_FAMILY) as Array<[V3ProductFamily, keyof typeof V3_BUILDINGS]>)
    .filter(([, plant]) => V3_BUILDINGS[plant].buildChapter <= state.campaignProgress.chapter).length
}

export function startV3AwardPeriod(state: V3GameState, startTick: number): V3AwardPeriod {
  const familyCount = Math.max(1, getV3UnlockedFamilyCount(state))
  return {
    startTick,
    familyCount,
    deliveryTarget: Math.min(300, Math.max(60, 60 * familyCount)),
    varietyTarget: Math.min(familyCount, 3),
    startRecognizedProfitCents: state.operatingLedger.lifetimeRecognizedProfitCents,
    qualifiedUnits: 0,
    qualifiedFamilies: [],
  }
}

export function scoreV3AwardPeriod(state: V3GameState, period: V3AwardPeriod): { score: number; grade: V3AwardGrade; profitCents: number } {
  const profitCents = state.operatingLedger.lifetimeRecognizedProfitCents - period.startRecognizedProfitCents
  const score = (profitCents > 0 ? 30 : 0) +
    40 * Math.min(period.qualifiedUnits / period.deliveryTarget, 1) +
    30 * Math.min(period.qualifiedFamilies.length / period.varietyTarget, 1)
  const grade: V3AwardGrade = score >= 90 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : '-'
  return { score, grade, profitCents }
}

/**
 * Closes finished 12-minute periods. Targets were frozen at period start. Grade RP
 * pays only the increase above the best grade already paid this run (cap 15);
 * low grades cost nothing.
 */
export function advanceV3Awards(state: V3GameState): V3GameState {
  let next = state
  while (next.world.tickCount >= next.awards.current.startTick + V3_AWARD_PERIOD_TICKS) {
    const period = next.awards.current
    const { score, grade, profitCents } = scoreV3AwardPeriod(next, period)
    const rpAwarded = Math.max(0, GRADE_RP[grade] - next.awards.paidGradeRp)
    next = {
      ...next,
      world: {
        ...next.world,
        researchPoints: next.world.researchPoints + rpAwarded,
        // Fame grows every period by grade (uncapped, no money).
        reputation: next.world.reputation + V3_AWARD_REPUTATION[grade],
      },
      awards: {
        current: startV3AwardPeriod(next, period.startTick + V3_AWARD_PERIOD_TICKS),
        history: [...next.awards.history, { startTick: period.startTick, score, grade, profitCents, rpAwarded }].slice(-50),
        paidGradeRp: next.awards.paidGradeRp + rpAwarded,
      },
    }
  }
  return next
}
