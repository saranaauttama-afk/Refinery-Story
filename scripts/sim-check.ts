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
import { ENDGAME_GOALS } from '../src/game/data/endgameGoals'

// Industry Legend was reached in ~43,700 ticks (~2h26m) in the faithful sim.
// Budget generously at 90,000 ticks (~5h) — exceeding it means something
// regressed (e.g. an endgame goal became unreachable, as with the award bug).
const LEGEND_TICK_BUDGET = 90_000

const failures: string[] = []
const check = (cond: boolean, msg: string) => { if (!cond) failures.push(msg) }
const finite = (n: number) => Number.isFinite(n)

console.log('Running balance regression check (full playthrough)...\n')
const { game: g, goalTick, yearScores } = runPlaythrough()

// 1. Industry Legend is reachable, and within a sane time budget.
check(goalTick['LEGEND'] !== undefined, 'Industry Legend was NOT reached within the tick cap')
if (goalTick['LEGEND'] !== undefined) {
  check(goalTick['LEGEND'] <= LEGEND_TICK_BUDGET,
    `Legend took ${goalTick['LEGEND'].toLocaleString()} ticks (budget ${LEGEND_TICK_BUDGET.toLocaleString()})`)
}

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
check(g.totalGasolineProduced >= 100_000, `lifetime gasoline below the 100k goal (${Math.round(g.totalGasolineProduced)})`)

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
