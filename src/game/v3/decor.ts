import {
  V3_APPEAL_MAX_BONUS,
  V3_APPEAL_SCALE,
  V3_DECOR,
  V3_DECOR_CAP,
  V3_DECOR_KINDS,
  V3_DECOR_REPEAT_FACTOR,
  getV3DecorCells,
  type V3DecorKind,
  type V3Decoration,
} from './decorData'
import { V3_WORLD_SIZE } from './data'
import type { V3GameState } from './types'
import { getV3Occupancy, isV3LandUnlocked, type V3PlacementBlocker } from './yard'

export type V3DecorBlocker = 'unknown' | 'locked' | 'expo_required' | 'cap' | V3PlacementBlocker | 'insufficient_cash'

export function listV3Decorations(state: V3GameState): V3Decoration[] {
  return Object.values(state.world.decorations ?? {}).sort((a, b) => a.id.localeCompare(b.id))
}

export function isV3DecorKind(kind: unknown): kind is V3DecorKind {
  return typeof kind === 'string' && (V3_DECOR_KINDS as string[]).includes(kind)
}

/** Unlock only (chapter + extra requirement); used by the catalog UI. */
export function getV3DecorLock(state: V3GameState, kind: V3DecorKind): { blocker: 'locked'; chapter: number } | { blocker: 'expo_required' } | null {
  const spec = V3_DECOR[kind]
  if (state.campaignProgress.chapter < spec.chapter) return { blocker: 'locked', chapter: spec.chapter }
  if (spec.requires === 'expoWin' && !state.expoResults.some((entry) => entry.rank === 1)) return { blocker: 'expo_required' }
  return null
}

/** Grid-only check (land, bounds, overlap), shared by previews and the reducer. */
export function validateV3DecorCells(state: V3GameState, kind: V3DecorKind, rotated: boolean, x: number, y: number, ignoreId: string | null = null): V3PlacementBlocker | null {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'out_of_bounds'
  const cells = getV3DecorCells(kind, rotated, x, y)
  if (cells.some((cell) => cell.x < 0 || cell.y < 0 || cell.x >= V3_WORLD_SIZE || cell.y >= V3_WORLD_SIZE)) return 'out_of_bounds'
  if (cells.some((cell) => !isV3LandUnlocked(state, cell.x, cell.y))) return 'locked_land'
  const occupancy = getV3Occupancy(state, ignoreId)
  if (cells.some((cell) => occupancy.has(`${cell.x},${cell.y}`))) return 'overlap'
  return null
}

export function validateV3DecorPlacement(state: V3GameState, kind: V3DecorKind, rotated: boolean, x: number, y: number): { blocker: V3DecorBlocker; params?: Record<string, number> } | null {
  if (!isV3DecorKind(kind)) return { blocker: 'unknown' }
  const lock = getV3DecorLock(state, kind)
  if (lock) return lock.blocker === 'locked' ? { blocker: 'locked', params: { chapter: lock.chapter } } : { blocker: 'expo_required' }
  if (listV3Decorations(state).length >= V3_DECOR_CAP) return { blocker: 'cap', params: { cap: V3_DECOR_CAP } }
  const grid = validateV3DecorCells(state, kind, rotated, x, y)
  if (grid) return { blocker: grid }
  const costCents = V3_DECOR[kind].costDollars * 100
  if (state.world.moneyCents < costCents) return { blocker: 'insufficient_cash', params: { costCents } }
  return null
}

/**
 * Appeal: each kind's first item is worth its full appeal, every repeat ×0.85,
 * so a varied yard beats spamming one item. The fame-gain bonus approaches
 * +10% with diminishing returns and never exceeds it.
 */
export function getV3Appeal(state: V3GameState): { points: number; bonus: number } {
  const counts: Partial<Record<V3DecorKind, number>> = {}
  for (const decoration of listV3Decorations(state)) counts[decoration.kind] = (counts[decoration.kind] ?? 0) + 1
  let points = 0
  for (const [kind, count] of Object.entries(counts) as Array<[V3DecorKind, number]>) {
    const first = V3_DECOR[kind].appeal
    points += first * (1 - V3_DECOR_REPEAT_FACTOR ** count) / (1 - V3_DECOR_REPEAT_FACTOR)
  }
  const bonus = V3_APPEAL_MAX_BONUS * (1 - Math.exp(-points / V3_APPEAL_SCALE))
  return { points, bonus }
}

/** Reputation actually granted after the appeal bonus (used by jobs, awards, expo). */
export function boostV3Reputation(state: V3GameState, amount: number): number {
  if (amount <= 0) return amount
  return amount * (1 + getV3Appeal(state).bonus)
}

export function getV3DecorAt(state: V3GameState, x: number, y: number): V3Decoration | null {
  const id = getV3Occupancy(state).get(`${x},${y}`)
  return id ? state.world.decorations?.[id] ?? null : null
}
