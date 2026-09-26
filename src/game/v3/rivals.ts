import type { V3GameState } from './types'
import { V3_TICKS_PER_MONTH } from './yardView'

/**
 * V3-21c rival refineries and the industry ranking. Rivals follow fixed,
 * deterministic growth curves (no hidden state), so the ranking is identical
 * in play, saves and simulations. The player's score is built only from real
 * ledger/progress data. V3-A hypotheses; tuned in V3-18.
 */
export type V3Rival = { id: string; name: { en: string; th: string }; base: number; growth: number; color: string }

// V3-18 calibration (legal bot trajectory: ~3,400 points at 60 min then
// ~27/min with reinvestment). Rivals are linear per in-game month; the bot
// passes Harbor ~25 min, Delta ~60, Summit ~80 and Titan ~280 simulated
// minutes (human play: roughly 5–8 hours for #1).
export const V3_RIVALS: readonly V3Rival[] = [
  { id: 'harbor', name: { en: 'Harbor Oil Co.', th: 'ฮาร์เบอร์ออยล์' }, base: 900, growth: 6, color: '#6FA8DC' },
  { id: 'delta', name: { en: 'Delta Petro', th: 'เดลต้าปิโตร' }, base: 1_800, growth: 9, color: '#E69138' },
  { id: 'summit', name: { en: 'Summit Refining', th: 'ซัมมิทรีไฟน์นิ่ง' }, base: 3_000, growth: 12, color: '#93C47D' },
  { id: 'titan', name: { en: 'Titan Energy', th: 'ไททันเอนเนอร์ยี' }, base: 5_200, growth: 15, color: '#CC4125' },
]

export function getV3RivalScore(rival: V3Rival, tickCount: number): number {
  const months = tickCount / V3_TICKS_PER_MONTH
  return Math.round(rival.base + rival.growth * months)
}

/**
 * Player industry score: fame, business (lifetime receipts, 1 point per $1,000),
 * factory (invested capital: land, buildings, upgrades, people; 1 point per
 * $2,000) and certified recipes. Growing the factory moves the ranking.
 */
export function getV3IndustryScore(state: V3GameState): { total: number; fame: number; business: number; factory: number; recipes: number } {
  const fame = state.world.reputation * 10
  const business = Math.max(0, Math.round(state.operatingLedger.lifetimeReceiptsCents / 100_000))
  const factory = Math.max(0, Math.round(state.operatingLedger.capexCents / 200_000))
  const recipes = Object.values(state.productBlueprints).filter((blueprint) => blueprint.provenance === 'developed').length * 20
  return { total: fame + business + factory + recipes, fame, business, factory, recipes }
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
