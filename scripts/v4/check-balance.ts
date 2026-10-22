import assert from 'node:assert/strict'
import { writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { simulate } from './sim-run'
import { POLISH, FUN } from '../../src/v4/data/balance'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { hints } from '../../src/v4/data/onboarding'
import { createNewGame } from '../../src/v4/sim/state'
import { tick } from '../../src/v4/sim/tick'
import { buildStarter } from '../../src/v4/sim/systems/starter'
const reports: Array<Omit<ReturnType<typeof simulate>, 'state'> & { seed: number }> = []
for (let seed = 1; seed <= POLISH.reportSeeds; seed++) {
  const r = simulate(seed)
  assert.ok(r.maxNegativeMonths <= 6, `seed ${seed}: softlock`)
  assert.ok(r.unlocksFirst40Weeks >= 5, `seed ${seed}: early unlocks`)
  assert.deepEqual(deserialize(serialize(r.state)), r.state, `seed ${seed}: late save roundtrip`)
  reports.push({
    seed,
    reached: r.reached,
    maxNegativeMonths: r.maxNegativeMonths,
    unlocksFirst40Weeks: r.unlocksFirst40Weeks,
    annual: r.annual,
    firstA: r.firstA,
    firstS: r.firstS,
    firstSS: r.firstSS,
    awardWins: r.awardWins,
  })
}
// Pacing: research and wear add luck, so most seeds must land in the window (rank 5 in
// years 3–5 for 90%, rank 10 in years 12–16 for 85%), and none may be far outside.
const within = (rank: number, lo: number, hi: number) =>
  reports.filter(r => r.reached[rank] >= lo && r.reached[rank] <= hi).length / reports.length
assert.ok(within(5, 3, 5) >= 0.9, `rank 5 window ${within(5, 3, 5)}`)
assert.ok(within(10, 12, 16) >= 0.85, `rank 10 window ${within(10, 12, 16)}`)
assert.ok(within(5, 2.5, 6) === 1, 'rank 5 outlier')
for (const r of reports)
  assert.ok(r.reached[10] >= 11 || !r.reached[10], `seed ${r.seed} rank 10 too early`)
const income = ([1, 5, 10] as const).map(year => {
  const samples = reports.map(r => r.annual[year - 1].profit),
    mean = Math.round(samples.reduce((n, v) => n + v, 0) / samples.length)
  const [low, high] = POLISH.incomeMeanBounds[year]
  assert.ok(mean >= low && mean <= high, `year ${year} mean ${mean}`)
  return {
    year,
    target: POLISH.incomeTargets[year],
    mean,
    min: Math.min(...samples),
    max: Math.max(...samples),
  }
})
// Fun gates: the bot must not find the game too easy (docs/v4/AUDIT.md).
const median = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
const first = {
  A: median(reports.map(r => r.firstA || 99)),
  S: median(reports.map(r => r.firstS || 99)),
  SS: median(reports.map(r => r.firstSS || 99)),
}
for (const g of ['A', 'S', 'SS'] as const) {
  const [lo, hi] = FUN.firstGrade[g]
  assert.ok(first[g] >= lo && first[g] <= hi, `first ${g} median year ${first[g]}`)
}
const wins = mean(reports.flatMap(r => r.awardWins.slice(FUN.awardsFromYear - 1, 15)))
assert.ok(wins >= FUN.awardsMean[0] && wins <= FUN.awardsMean[1], `award wins ${wins}`)
const formulas15 = mean(reports.map(r => r.annual[14].known))
assert.ok(
  formulas15 >= FUN.formulasY15[0] && formulas15 <= FUN.formulasY15[1],
  `formulas Y15 ${formulas15}`,
)
const cashMonths = (y: number) =>
  mean(reports.map(r => r.annual[y - 1].money / Math.max(1, r.annual[y - 1].profit)))
for (const y of [5, 10])
  assert.ok(cashMonths(y) <= FUN.cashMonthsMax, `cash Y${y} ${cashMonths(y)} months of profit`)
const rd10 = mean(reports.map(r => r.annual[9].rd))
assert.ok(rd10 <= FUN.rdY10Max, `RD piles up: ${rd10}`)
const funLine = `first A/S/SS Y${first.A.toFixed(1)}/${first.S.toFixed(1)}/${first.SS.toFixed(1)}, awards ${wins.toFixed(1)}/yr, formulas Y15 ${formulas15.toFixed(1)}, cash Y5 ${cashMonths(5).toFixed(0)}/Y10 ${cashMonths(10).toFixed(0)} months, RD Y10 ${Math.round(rd10)}`
assert.equal(hints.length, POLISH.hintLimit)
const clean = createNewGame()
assert.throws(() => deserialize(serialize({ ...clean, cuts: {} } as never)))
assert.throws(() => deserialize(serialize({ ...clean, settings: undefined } as never)))
assert.throws(() => deserialize(serialize({ ...clean, money: Infinity })))
// Frozen inputs catch accidental mutation in the running systems and starter action.
function freeze(value: unknown) {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const v of Object.values(value)) freeze(v)
  }
}
freeze(clean)
const starter = buildStarter(clean)
freeze(starter)
assert.notEqual(tick(starter), starter)
assert.equal(clean.tick, 0)
for (const name of readdirSync('src/v4/sim', { recursive: true }) as string[]) {
  if (!name.endsWith('.ts')) continue
  const source = readFileSync(join('src/v4/sim', name), 'utf8')
  assert.doesNotMatch(source, /\b(?:Date\.now|Math\.random)\s*\(/)
  assert.doesNotMatch(source, /from\s+['"](?:react|react-native|expo|@shopify)/)
}
if (process.argv.includes('--write-report')) {
  writeFileSync(
    'docs/v4/BALANCE-REPORT.json',
    JSON.stringify(
      {
        seeds: POLISH.reportSeeds,
        years: 16,
        policy:
          'Normal guarded actions; cautious hiring, three staged production lines; operating profit excludes construction, hiring and training capital spend.',
        income,
        reports,
      },
      null,
      2,
    ) + '\n',
  )
  writeFileSync(
    'docs/v4/BALANCE-REPORT.md',
    '# M8 balance report\n\n20 seeded runs × 16 years, using guarded game actions. Monthly operating profit is annual operating income minus upkeep, salaries, crude and incident costs, divided by 12; capital spending is tracked in cash but excluded from this metric.\n\n| Year | Target/month | Mean | Min | Max |\n|---|---:|---:|---:|---:|\n' +
      income
        .map(
          r =>
            `| ${r.year} | $${r.target.toLocaleString()} | $${r.mean.toLocaleString()} | $${r.min.toLocaleString()} | $${r.max.toLocaleString()} |`,
        )
        .join('\n') +
      '\n\nAll 20 runs pass rank-5/rank-10 timing, five early unlocks, no six-month debt lock and late-save roundtrip checks. Full annual results and reach times: [BALANCE-REPORT.json](BALANCE-REPORT.json). These are deterministic bot results, not human playtest or native frame-rate measurements.\n',
  )
}
console.log(
  `M8 ${POLISH.reportSeeds} seeds × 16 years / pacing / no softlock / save integrity / sim isolation / hints passed; monthly mean ${income.map(r => `Y${r.year} $${r.mean}`).join(', ')}`,
)
console.log(`M11 fun gates passed: ${funLine}`)
