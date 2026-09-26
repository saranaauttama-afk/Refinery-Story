import type { V3SimulationSpeed } from './pause'

/** One simulation tick = 200 ms of play at speed 1 (25 ticks = one 5 s cycle). */
export const V3_TICK_MS = 200
/** Autosave cadence while playing; actions and backgrounding also save. */
export const V3_AUTOSAVE_MS = 5_000
/** A frame hiccup never grants more than 5 s of catch-up (no offline progress). */
const MAX_ELAPSED_MS = 5_000

export type V3Clock = { carryMs: number }

/**
 * Converts real elapsed time into whole simulation ticks for the chosen speed.
 * Pure and deterministic; paused (speed 0) accumulates nothing, so a closed or
 * paused game never advances Rush deadlines or production.
 */
export function stepV3Clock(clock: V3Clock, elapsedMs: number, speed: V3SimulationSpeed): { clock: V3Clock; ticks: number } {
  if (speed === 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return { clock: { carryMs: 0 }, ticks: 0 }
  const total = clock.carryMs + Math.min(elapsedMs, MAX_ELAPSED_MS) * speed
  const ticks = Math.floor(total / V3_TICK_MS)
  return { clock: { carryMs: total - ticks * V3_TICK_MS }, ticks }
}
