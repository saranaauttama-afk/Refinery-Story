import type { V3GameState } from './types'
import { V3_TICKS_PER_MONTH } from './yardView'

/**
 * V3-21c rival refineries and the industry ranking. Rivals follow fixed,
 * deterministic growth curves (no hidden state), so the ranking is identical
 * in play, saves and simulations. The player's score is built only from real
 * ledger/progress data. V3-A hypotheses; tuned in V3-18.
 */
export type V3Rival = { id: string; name: { en: string; th: string }; base: number; growth: number; color: string }

export const V3_RIVALS: readonly V3Rival[] = [
  { id: 'harbor', name: { en: 'Harbor Oil Co.', th: 'ฮาร์เบอร์ออยล์' }, base: 40, growth: 0.45, color: '#6FA8DC' },
  { id: 'delta', name: { en: 'Delta Petro', th: 'เดลต้าปิโตร' }, base: 80, growth: 0.7, color: '#E69138' },
  { id: 'summit', name: { en: 'Summit Refining', th: 'ซัมมิทรีไฟน์นิ่ง' }, base: 140, growth: 0.95, color: '#93C47D' },
  { id: 'titan', name: { en: 'Titan Energy', th: 'ไททันเอนเนอร์ยี' }, base: 220, growth: 1.2, color: '#CC4125' },
]

export function getV3RivalScore(rival: V3Rival, tickCount: number): number {
  const months = tickCount / V3_TICKS_PER_MONTH
  return Math.round(rival.base + rival.growth * Math.pow(months, 1.3))
}

/** Player industry score: fame, recognized business and certified recipes. */
export function getV3IndustryScore(state: V3GameState): { total: number; fame: number; business: number; recipes: number } {
  const fame = state.world.reputation * 10
  const business = Math.max(0, Math.round(state.operatingLedger.lifetimeReceiptsCents / 100_000))
  const recipes = Object.values(state.productBlueprints).filter((blueprint) => blueprint.provenance === 'developed').length * 20
  return { total: fame + business + recipes, fame, business, recipes }
}

export type V3RankingEntry = { id: string; name: { en: string; th: string }; score: number; player: boolean }

export function getV3Rankings(state: V3GameState): V3RankingEntry[] {
  const entries: V3RankingEntry[] = [
    { id: 'player', name: { en: 'Your refinery', th: 'โรงกลั่นของคุณ' }, score: getV3IndustryScore(state).total, player: true },
    ...V3_RIVALS.map((rival) => ({ id: rival.id, name: rival.name, score: getV3RivalScore(rival, state.world.tickCount), player: false })),
  ]
  // Ties go to the rival: the player must actually overtake.
  return entries.sort((a, b) => b.score - a.score || Number(a.player) - Number(b.player))
}

export function getV3PlayerRank(state: V3GameState): number {
  return getV3Rankings(state).findIndex((entry) => entry.player) + 1
}

/** One-time reputation for first reaching a rank at a year-end ranking. */
export const V3_RANK_REWARDS: Record<number, number> = { 3: 3, 2: 5, 1: 10 }
