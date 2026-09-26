import type { V3GameState, V3ProductFamily } from './types'
import { V3_TICKS_PER_MONTH } from './yardView'

/**
 * V3-21b seasonal market (spot sales only; job quotes stay locked and stable).
 * Deterministic from the in-game calendar so saves, sims and forecasts agree:
 * each family follows its own yearly season, and one "product of the year"
 * rotates through the families each year. V3-A hypotheses for V3-18.
 */
const FAMILIES: V3ProductFamily[] = ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets']
const SEASON_PEAK_MONTH: Record<V3ProductFamily, number> = {
  gasoline: 7, // summer driving
  lubricants: 10, // harvest/fleet service
  jetFuel: 12, // holiday travel
  petrochemicals: 4,
  plasticPellets: 2,
}
export const V3_MARKET_SEASON_AMPLITUDE = 0.2
export const V3_MARKET_HOT_BONUS = 0.1

export function getV3HotFamily(year: number): V3ProductFamily {
  return FAMILIES[(year - 1) % FAMILIES.length]
}

/** Spot price multiplier for a family in a given calendar month index (0-based months since start). */
export function getV3MarketMultiplierAt(family: V3ProductFamily, monthIndex: number): number {
  const month = (monthIndex % 12) + 1
  const year = Math.floor(monthIndex / 12) + 1
  const season = Math.cos(2 * Math.PI * (month - SEASON_PEAK_MONTH[family]) / 12)
  const hot = getV3HotFamily(year) === family ? V3_MARKET_HOT_BONUS : 0
  return Math.round((1 + V3_MARKET_SEASON_AMPLITUDE * season + hot) * 100) / 100
}

export function getV3MarketMultiplier(state: V3GameState, family: V3ProductFamily): number {
  return getV3MarketMultiplierAt(family, Math.floor(state.world.tickCount / V3_TICKS_PER_MONTH))
}

/** This month plus the next `months` for the forecast board. */
export function getV3MarketForecast(state: V3GameState, family: V3ProductFamily, months = 3): number[] {
  const now = Math.floor(state.world.tickCount / V3_TICKS_PER_MONTH)
  return Array.from({ length: months + 1 }, (_, offset) => getV3MarketMultiplierAt(family, now + offset))
}
