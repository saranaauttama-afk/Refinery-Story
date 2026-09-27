import { V3_CRUDE_PRICE_CENTS, V3_FAME_LEVELS, type V3FameLevel } from './data'
import type { V3GameState } from './types'

export type V3Fame = V3FameLevel & { reputation: number; next: V3FameLevel | null; progress: number }

/** Fame is derived from reputation only; it is never stored, so it cannot drift. */
export function getV3Fame(state: V3GameState): V3Fame {
  const reputation = state.world.reputation
  const current = [...V3_FAME_LEVELS].reverse().find((entry) => reputation >= entry.threshold) ?? V3_FAME_LEVELS[0]
  const next = V3_FAME_LEVELS.find((entry) => entry.level === current.level + 1) ?? null
  const progress = next ? (reputation - current.threshold) / (next.threshold - current.threshold) : 1
  return { ...current, reputation, next, progress: Math.max(0, Math.min(1, progress)) }
}

/** Unit crude price after the fame supplier discount (whole cents). */
export function getV3CrudeUnitPriceCents(state: V3GameState): number {
  return Math.round(V3_CRUDE_PRICE_CENTS * (1 - getV3Fame(state).crudeDiscount))
}
