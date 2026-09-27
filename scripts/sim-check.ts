/**
 * Balance regression gate. Runs the faithful full-loop playthrough and asserts
 * the invariants that the balance work this cycle established, so a future tuning
 * change can't silently re-break game completion (the award bug hid for a long
 * time precisely because nothing checked it).
 *
 * Run:  npm run sim:check   (or  npx tsx scripts/sim-check.ts)
 * Exits non-zero on any failed assertion — wire into CI / a pre-push hook.
 */
import { runPlaythrough } from './full-loop-sim'
import { ENDGAME_GOALS, LEGEND_LIFETIME_GASOLINE } from '../src/game/data/endgameGoals'
import {
  applyBankruptcySafetyNet,
  calculateDerivedStats,
  createInitialGameState,
} from '../src/game/utils/gameCalculations'
import { applyAutoTrade, tick, type AutoTradeSettings } from '../src/game/utils/gameTick'

// Direction A targets Industry Legend around ~200k ticks (~11h at 1x).
// Budget generously at 320,000 ticks (~18h) — exceeding it means something
// regressed (e.g. an endgame goal became unreachable, as with the award bug),
// not merely that the game is intentionally long.
const LEGEND_TICK_BUDGET = 320_000
// Mid/late progression must not collapse back into the old 1.5-hour sprint.
// These floors are deliberately below the current auto-pilot result so normal
// simulation variance is safe, but a future economy multiplier/reward spike
// cannot silently erase the middle game again.
const LEGEND_TICK_FLOOR = 180_000
const MAX_LEVEL_TICK_FLOOR = 120_000
const ALL_RESEARCH_TICK_FLOOR = 55_000
const MAX_GRID_TICK_FLOOR = 70_000

const failures: string[] = []
const check = (cond: boolean, msg: string) => { if (!cond) failures.push(msg) }
const finite = (n: number) => Number.isFinite(n)

// Opening experience: a fresh run must visibly produce immediately. This is
// intentionally checked separately from the long automated playthrough.
const fresh = createInitialGameState()
check(fresh.grid.includes('crudeTank'), 'new game is missing its starter Crude Tank')
check(fresh.grid.includes('distillationUnit'), 'new game is missing its starter Distillation Unit')
check(fresh.crudeOil > 0, 'new game has no crude for its first production cycle')

// Opening economy regression: before a downstream plant exists, Distillation
// must not burn crude into unsellable feedstock. Run one real minute of the
// actual tick + auto-trade loop, not a derived gross-income estimate.
const earlyAutoTrade: AutoTradeSettings = {
  enabled: true,
  crudeBuyEnabled: true,
  gasolineSellEnabled: true,
  productSellEnabled: {},
  buyThreshold: 20,
  sellThreshold: 80,
  productSellThresholds: {},
}
let early = fresh
for (let i = 0; i < 300; i++) early = applyAutoTrade(tick(early), earlyAutoTrade)
check(early.feedstock === 0, `starter refinery created unusable feedstock (${early.feedstock})`)
check(early.totalGasolineProduced > 0, 'starter refinery produced no gasoline in its first minute')
check(early.money > 0, `starter refinery went bankrupt in its first minute (${Math.round(early.money)})`)

// A legacy save with stranded feedstock but no downstream plant is still truly
// stuck; that unusable inventory must not suppress the emergency subsidy.
const stranded = { ...fresh, money: 0, crudeOil: 0, gasoline: 0, feedstock: 10 }
const relief = applyBankruptcySafetyNet(stranded, calculateDerivedStats(stranded))
check(relief.triggered, 'stranded feedstock blocked the bankruptcy safety net')

console.log('Running balance regression check (full playthrough)...\n')
const { game: g, goalTick, yearScores } = runPlaythrough()

// 1. Industry Legend is reachable, and within a sane time budget.
check(goalTick['LEGEND'] !== undefined, 'Industry Legend was NOT reached within the tick cap')
if (goalTick['LEGEND'] !== undefined) {
  check(goalTick['LEGEND'] >= LEGEND_TICK_FLOOR,
    `Legend arrived too early at ${goalTick['LEGEND'].toLocaleString()} ticks (floor ${LEGEND_TICK_FLOOR.toLocaleString()})`)
  check(goalTick['LEGEND'] <= LEGEND_TICK_BUDGET,
    `Legend took ${goalTick['LEGEND'].toLocaleString()} ticks (budget ${LEGEND_TICK_BUDGET.toLocaleString()})`)
}

check((goalTick['maxLevel'] ?? 0) >= MAX_LEVEL_TICK_FLOOR,
  `max refinery level arrived too early (${(goalTick['maxLevel'] ?? 0).toLocaleString()} ticks)`)
check((goalTick['allResearch'] ?? 0) >= ALL_RESEARCH_TICK_FLOOR,
  `all research arrived too early (${(goalTick['allResearch'] ?? 0).toLocaleString()} ticks)`)
check((goalTick['maxGrid'] ?? 0) >= MAX_GRID_TICK_FLOOR,
  `max grid arrived too early (${(goalTick['maxGrid'] ?? 0).toLocaleString()} ticks)`)

// 2. Every individual endgame goal completes.
for (const goal of ENDGAME_GOALS) {
  check(goalTick[goal.key] !== undefined, `endgame goal "${goal.key}" never completed`)
}

// 3. Annual award is meaningful: S is reachable, but not trivially handed out in
//    year 1 (guards both the "S impossible" bug and an over-easy re-tune).
const grades = yearScores.map((y) => y.grade)
check(grades.includes('S'), 'no year ever reached S-grade (award perGasoline/money inputs likely broken again)')
check(yearScores.length === 0 || yearScores[0].grade !== 'S', 'year 1 is already S-grade (award thresholds too low)')

// 4. No NaN / Infinity leaked into core state.
const numbers: [string, number][] = [
  ['money', g.money], ['reputation', g.reputation], ['researchPoints', g.researchPoints],
  ['gasoline', g.gasoline], ['totalGasolineProduced', g.totalGasolineProduced], ['esgScore', g.esgScore],
]
for (const [name, val] of numbers) check(finite(val), `${name} is not finite (${val})`)

// 5. Economy sanity.
check(g.money > 0, `ended with non-positive cash (${Math.round(g.money)})`)
check(g.totalGasolineProduced >= LEGEND_LIFETIME_GASOLINE, `lifetime gasoline below the ${LEGEND_LIFETIME_GASOLINE.toLocaleString()} goal (${Math.round(g.totalGasolineProduced)})`)

// --- report ---
if (failures.length === 0) {
  console.log('✅ all checks passed')
  console.log(`   Legend @ ${goalTick['LEGEND'].toLocaleString()} ticks · grades ${grades.join('') || '-'} · cash $${Math.round(g.money).toLocaleString()}`)
  process.exit(0)
} else {
  console.error(`❌ ${failures.length} check(s) failed:`)
  for (const f of failures) console.error(`   - ${f}`)
  process.exit(1)
}
