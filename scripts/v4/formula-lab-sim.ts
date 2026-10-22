// Monte Carlo of a typical player chasing the best gasoline formula.
// Prints the year the first formula reaches each grade (p10 / median / p90 over many seeds).
// Run: node --import tsx scripts/v4/formula-lab-sim.ts
import { FORMULA_GRADES, ADDITIVE_LEVELS, FORMULA_LAB as F } from '../../src/v4/data/balance'
import { additives, type AdditiveId } from '../../src/v4/data/additives'
import type { BaseId } from '../../src/v4/data/bases'
import {
  emptyFormulaLab,
  rollCatalyst,
  mixFormula,
  mixOdds,
  produceLot,
  slotsFor,
  gradeIndex,
  type LabSlice,
  type MixPick,
} from '../../src/v4/sim/systems/formulaLab'

const YEARS = Number(process.env.YEARS ?? 15),
  WEEKS = 48,
  RUNS = Number(process.env.RUNS ?? 80)
const base: BaseId = 'gasoline'
// Assumed typical progress (edit to try other players).
const labLevel = (y: number) => [1, 1, 2, 2, 3, 3, 4, 4, 5][Math.min(8, y - 1)]
const labs = (y: number) => (y < 5 ? 1 : 2)
const chem = (y: number) => 20 * y
const lotsPerWeek = (y: number) => (y < 4 ? 1.25 : 2.5)
const pool = (y: number) =>
  additives
    .filter(a => ADDITIVE_LEVELS[a.id] <= Math.min(5, 1 + Math.floor(y / 2)))
    .map(a => a.id) as AdditiveId[]

function combos<T>(xs: T[], k: number): T[][] {
  if (k === 0) return [[]]
  return xs.flatMap((x, i) => combos(xs.slice(i + 1), k - 1).map(c => [x, ...c]))
}
function bestMix(st: LabSlice, year: number) {
  const level = labLevel(year)
  // Only the best usable grade of each catalyst, and only the three best formulas, keep it fast.
  const bestOf = new Map<string, LabSlice['stock'][number]>()
  for (const x of st.stock)
    if (
      x.units >= F.mix.unitsPerSlot &&
      gradeIndex(x.grade) >
        gradeIndex(bestOf.get(x.additive)?.grade ?? 'D') - (bestOf.has(x.additive) ? 0 : 1)
    )
      bestOf.set(x.additive, x)
  const lots = [...bestOf.values()]
    .sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))
    .slice(0, 8)
  const starts = [
    undefined,
    ...st.formulas
      .filter(f => f.base === base)
      .sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))
      .slice(0, 3)
      .map(f => f.key),
  ]
  let best: { from?: string; picks: MixPick[]; gain: number } | null = null
  const top = Math.max(-1, ...st.formulas.map(f => gradeIndex(f.grade)))
  for (const from of starts)
    for (let k = 1; k <= slotsFor(year); k++)
      for (const c of combos(lots, k)) {
        if (new Set(c.map(x => x.additive)).size !== c.length) continue
        const m = {
          base,
          from,
          picks: c.map(x => ({ additive: x.additive, grade: x.grade })),
          year,
          level,
        }
        const o = mixOdds(st, m)
        if (o.catalysts.length > F.mix.maxCatalysts) continue
        const gain = Math.min(o.center, o.cap) - top
        if (gain > 0.2 && (!best || gain > best.gain)) best = { from, picks: m.picks, gain }
      }
  return best
}

const firsts: Record<string, number[]> = Object.fromEntries(FORMULA_GRADES.map(g => [g, []]))
const fallbackShare: number[] = []
for (let run = 0; run < RUNS; run++) {
  let st = { ...emptyFormulaLab(), rng: 1000 + run }
  const seen = new Set<string>()
  let lots = 0,
    fallback = 0,
    carry = 0
  for (let y = 1; y <= YEARS; y++) {
    for (let w = 0; w < WEEKS; w++) {
      if (w % F.catalyst.weeks === 0)
        for (let l = 0; l < labs(y); l++)
          st = rollCatalyst(st, { pool: pool(y), level: labLevel(y), chem: chem(y), year: y }).state
      const mix = w % 2 === 0 ? bestMix(st, y) : null
      if (mix)
        st = mixFormula(st, {
          base,
          from: mix.from,
          picks: mix.picks,
          year: y,
          level: labLevel(y),
        }).state
      const top = [...st.formulas].sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))[0]
      for (const f of st.formulas)
        for (const g of FORMULA_GRADES)
          if (gradeIndex(f.grade) >= gradeIndex(g) && !seen.has(g)) {
            seen.add(g)
            firsts[g].push(y)
          }
      carry += lotsPerWeek(y)
      while (top && carry >= 1) {
        carry--
        const r = produceLot(st, top.key)
        st = r.state
        lots++
        if (r.short.length) fallback++
      }
    }
  }
  fallbackShare.push(lots ? fallback / lots : 0)
}
const q = (xs: number[], p: number) =>
  [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
console.log(`Formula Lab sim — ${RUNS} runs, ${base}, ${YEARS} years`)
console.log('grade | reached | p10 | median | p90 (year of first formula at that grade)')
for (const g of FORMULA_GRADES) {
  const xs = firsts[g]
  const pct = Math.round((xs.length / RUNS) * 100)
  console.log(
    `${g.padEnd(5)} | ${String(pct).padStart(6)}% | ${xs.length ? [q(xs, 0.1), q(xs, 0.5), q(xs, 0.9)].map(v => String(v).padStart(3)).join(' | ') : '  - |   - |   -'}`,
  )
}
console.log(`lots that ran out of catalyst: median ${Math.round(q(fallbackShare, 0.5) * 100)}%`)
