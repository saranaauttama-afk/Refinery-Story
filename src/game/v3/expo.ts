import { getV3Fame } from './fame'
import { consumeV3ProtectedInventory, getV3StockAllocations, recordV3Ledger } from './productInventory'
import { V3_RIVALS } from './rivals'
import type { V3ExpoEntry, V3GameState } from './types'
import { getV3Calendar } from './yardView'

/**
 * V3-21d Annual Refinery Expo. Held every in-game September. The player may
 * enter ONE developed recipe per year by sending sample units; judging is
 * immediate and deterministic against rival entries whose quality rises each
 * year. Prizes are fame plus a grant (never recognized operating profit).
 * V3-A hypotheses; tuned in V3-18.
 */
export const V3_EXPO_MONTH = 9
export const V3_EXPO_SAMPLE_QUANTITY = 10
export const V3_EXPO_MIN_FAME = 2
export const V3_EXPO_PRIZES = [
  { rank: 1, cashCents: 150_000, reputation: 10 },
  { rank: 2, cashCents: 80_000, reputation: 5 },
  { rank: 3, cashCents: 30_000, reputation: 2 },
] as const
export const V3_EXPO_PARTICIPATION_REPUTATION = 1

export type V3ExpoBlocker = 'not_expo_month' | 'fame_locked' | 'already_entered' | 'invalid_recipe' | 'insufficient_samples'

// V3-18 calibration: rival entries start strong (~86–92) and climb to 96. A
// Q75 recipe with top fame and a full portfolio can win in the early years;
// later only a Q80 flagship (rank2 + lead) beats the field.
export const V3_EXPO_RIVAL_CAP = 96
export const V3_EXPO_PORTFOLIO_MAX = 8

export function getV3RivalExpoScore(rivalIndex: number, year: number): number {
  return Math.min(V3_EXPO_RIVAL_CAP, Math.round(84 + 0.7 * year + rivalIndex * 1.5 + ((year * 7 + rivalIndex * 3) % 4)))
}

/** Entry score: recipe Q + fame showmanship (2 per level above 1) + portfolio (1 per developed recipe, max 8). */
export function getV3ExpoScore(state: V3GameState, quality: number): number {
  const portfolio = Object.values(state.productBlueprints).filter((blueprint) => blueprint.provenance === 'developed').length
  return quality + (getV3Fame(state).level - 1) * 2 + Math.min(V3_EXPO_PORTFOLIO_MAX, portfolio)
}

export function validateV3ExpoEntry(state: V3GameState, blueprintId: string): { blocker: V3ExpoBlocker; params?: Record<string, number> } | null {
  const calendar = getV3Calendar(state.world.tickCount)
  if (calendar.month !== V3_EXPO_MONTH) return { blocker: 'not_expo_month', params: { month: V3_EXPO_MONTH } }
  if (getV3Fame(state).level < V3_EXPO_MIN_FAME) return { blocker: 'fame_locked', params: { level: V3_EXPO_MIN_FAME } }
  if (state.expoResults.some((entry) => entry.year === calendar.year)) return { blocker: 'already_entered' }
  const blueprint = state.productBlueprints[blueprintId]
  if (!blueprint || blueprint.provenance !== 'developed') return { blocker: 'invalid_recipe' }
  const free = getV3StockAllocations(state, blueprint.family).find((entry) => entry.blueprintId === blueprintId)?.free ?? 0
  if (free + 1e-8 < V3_EXPO_SAMPLE_QUANTITY) return { blocker: 'insufficient_samples', params: { quantity: V3_EXPO_SAMPLE_QUANTITY } }
  return null
}

export function enterV3Expo(state: V3GameState, blueprintId: string): { state: V3GameState; entry: V3ExpoEntry } {
  const calendar = getV3Calendar(state.world.tickCount)
  const blueprint = state.productBlueprints[blueprintId]
  const consumed = consumeV3ProtectedInventory(state, blueprint.family, V3_EXPO_SAMPLE_QUANTITY, { blueprintId, purpose: 'sample' })
  const score = getV3ExpoScore(state, blueprint.quality)
  const rivals = V3_RIVALS.map((_, index) => getV3RivalExpoScore(index, calendar.year))
  // Ties go to the rival: the entry must beat a score to pass it.
  const rank = 1 + rivals.filter((rival) => rival >= score).length
  const prize = V3_EXPO_PRIZES.find((entry) => entry.rank === rank)
  const cashCents = prize?.cashCents ?? 0
  const reputation = prize?.reputation ?? V3_EXPO_PARTICIPATION_REPUTATION
  const entry: V3ExpoEntry = { year: calendar.year, blueprintId, family: blueprint.family, quality: blueprint.quality, score, rank, rivalScores: rivals, cashCents, reputation }
  let next: V3GameState = {
    ...consumed.state,
    world: { ...consumed.state.world, moneyCents: consumed.state.world.moneyCents + cashCents, reputation: consumed.state.world.reputation + reputation },
    expoResults: [...consumed.state.expoResults, entry],
    operatingLedger: { ...consumed.state.operatingLedger, grantsCents: consumed.state.operatingLedger.grantsCents + cashCents },
  }
  // Samples are an expense (COGS at basis); the prize is a grant, never recognized profit.
  next = recordV3Ledger(next, { receiptsCents: cashCents, unrecognizedCents: cashCents, cogsCents: consumed.costBasisCents })
  return { state: next, entry }
}
