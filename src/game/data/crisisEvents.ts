import type { ActiveCrisis, CrisisKey, GameState } from '../types'
import { TICK_MS } from '../utils/gameCalculations'

const CRISIS_DURATION_TICKS = {
  low: Math.round((24 * 60 * 60 * 1000) / TICK_MS),    // ~1 game day
  medium: Math.round((12 * 60 * 60 * 1000) / TICK_MS), // ~12 hours
  high: Math.round((6 * 60 * 60 * 1000) / TICK_MS),    // ~6 hours
}

// How long an ignored crisis keeps hurting after it expires — the throttle
// window. Kept in "game days" so it reads at the same scale as the durations
// above; ~1 in-game day ≈ 6 real minutes at CALENDAR_BALANCE.dayLengthTicks.
const GAME_DAY_TICKS = Math.round((24 * 60 * 60 * 1000) / TICK_MS)

// Knock a random built tile (level > 1) down one level. Real, visible damage
// for the power-surge crisis rather than a cosmetic line. Returns the new
// gridLevels array, or the same reference if nothing was eligible.
function downgradeRandomBuilding(game: GameState): number[] {
  const eligible: number[] = []
  for (let i = 0; i < game.grid.length; i++) {
    if (game.grid[i] !== null && (game.gridLevels[i] ?? 1) > 1) eligible.push(i)
  }
  if (eligible.length === 0) return game.gridLevels
  const target = eligible[Math.floor(Math.random() * eligible.length)]
  const next = [...game.gridLevels]
  next[target] = Math.max(1, (next[target] ?? 1) - 1)
  return next
}

type CrisisTemplate = {
  key: CrisisKey
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  fixCostBase: number
  penaltyDescription: string
  minLevel: number
  // Penalty applied when the crisis is IGNORED (expires or dismissed). Runs
  // against the current state + tick so it can set a time-boxed production
  // throttle (productionPenalty) that keeps biting until the window passes.
  applyPenalty: (game: GameState, currentTick: number) => Partial<GameState>
}

export const CRISIS_TEMPLATES: CrisisTemplate[] = [
  {
    key: 'equipmentFailure',
    title: '⚙️ Equipment Failure',
    description: 'A key distillation unit component is failing. Fix now or production halts.',
    urgency: 'high',
    fixCostBase: 800,
    penaltyDescription: 'Production runs at 30% for ~2 business days',
    minLevel: 2,
    applyPenalty: (game, currentTick) => ({
      money: game.money - 200,
      productionPenalty: { multiplier: 0.3, untilTick: currentTick + 2 * GAME_DAY_TICKS },
    }),
  },
  {
    key: 'pipeLeak',
    title: '🔧 Pipe Leak Detected',
    description: 'A crude oil pipe is leaking. Repair soon to prevent environmental penalties.',
    urgency: 'medium',
    fixCostBase: 400,
    penaltyDescription: 'ESG score -10 and minor fine',
    minLevel: 3,
    applyPenalty: (game) => ({
      esgScore: Math.max(0, game.esgScore - 10),
      money: game.money - 300,
    }),
  },
  {
    key: 'powerSurge',
    title: '⚡ Power Surge Warning',
    description: 'Unstable power readings in the plant. Shut down or risk equipment damage.',
    urgency: 'high',
    fixCostBase: 1200,
    penaltyDescription: 'A random building loses 1 level',
    minLevel: 5,
    applyPenalty: (game) => ({
      money: game.money - 500,
      esgScore: Math.max(0, game.esgScore - 5),
      gridLevels: downgradeRandomBuilding(game),
    }),
  },
  {
    key: 'supplyShortfall',
    title: '🛢 Crude Supply Shortfall',
    description: 'Your crude supplier is cutting delivery. Pay premium or face shortage.',
    urgency: 'low',
    fixCostBase: 600,
    penaltyDescription: 'Half your crude stock is lost to the shortfall',
    minLevel: 4,
    applyPenalty: (game) => ({
      crudeOil: Math.floor(game.crudeOil * 0.5),
    }),
  },
  {
    key: 'workerStrike',
    title: '👷 Worker Grievance',
    description: 'Staff morale is low. Address now or face a work slowdown.',
    urgency: 'medium',
    fixCostBase: 500,
    penaltyDescription: 'Production efficiency -20% for ~3 business days',
    minLevel: 6,
    applyPenalty: (game, currentTick) => ({
      reputation: Math.max(0, game.reputation - 15),
      productionPenalty: { multiplier: 0.8, untilTick: currentTick + 3 * GAME_DAY_TICKS },
    }),
  },
]

const CRISIS_COOLDOWN_TICKS = 3600 * 8 // minimum 8 auto-refresh cycles between crises

export function shouldSpawnCrisis(game: GameState, currentTick: number): boolean {
  if (game.activeCrisis !== null) return false
  if (game.refineryLevel < 2) return false
  if (currentTick - (game.lastCrisisTick ?? 0) < CRISIS_COOLDOWN_TICKS) return false
  // ~1% chance per check (checked every ~30 ticks = ~6s)
  return Math.random() < 0.01
}

export function spawnCrisis(game: GameState, currentTick: number): ActiveCrisis | null {
  const eligible = CRISIS_TEMPLATES.filter((c) => game.refineryLevel >= c.minLevel)
  if (eligible.length === 0) return null
  const template = eligible[Math.floor(Math.random() * eligible.length)]
  const duration = CRISIS_DURATION_TICKS[template.urgency]
  const fixCost = Math.round(template.fixCostBase * (1 + game.refineryLevel * 0.1))
  return {
    key: template.key,
    title: template.title,
    description: template.description,
    urgency: template.urgency,
    fixCost,
    penaltyDescription: template.penaltyDescription,
    expiresAtTick: currentTick + duration,
  }
}

export function applyCrisisPenalty(game: GameState, currentTick: number): GameState {
  const template = CRISIS_TEMPLATES.find((c) => c.key === game.activeCrisis?.key)
  if (!template) return game
  const penalty = template.applyPenalty(game, currentTick)
  return { ...game, ...penalty, activeCrisis: null }
}

export { CRISIS_TEMPLATES as default }
