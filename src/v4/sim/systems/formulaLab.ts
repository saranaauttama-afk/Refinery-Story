// Formula Lab — pure rules, not yet wired into GameState (see docs/v4/FORMULA-LAB.md).
// Catalyst Lab: research → graded catalyst stock.
// Formula Lab: base or known formula + catalysts → permanent formula with a grade.
// Blend stations: produce at the formula's grade while catalyst stock lasts.
import { FORMULA_GRADES, FORMULA_LAB as F } from '../../data/balance'
import { pairCompat } from '../../data/compatibility'
import type { AdditiveId } from '../../data/additives'
import type { BaseId } from '../../data/bases'
import {
  formulaKey,
  secretFor,
  synergyKey,
  synergyOf,
  synergies,
  secretFormulas,
} from '../../data/formulaLab'
import { random } from '../rng'

export type FGrade = (typeof FORMULA_GRADES)[number]
export const gradeIndex = (g: FGrade) => FORMULA_GRADES.indexOf(g)
export const gradeAt = (i: number): FGrade =>
  FORMULA_GRADES[Math.max(0, Math.min(FORMULA_GRADES.length - 1, Math.round(i)))]

export interface CatalystLot {
  additive: AdditiveId
  grade: FGrade
  units: number
}
export interface Formula {
  key: string
  base: BaseId
  catalysts: AdditiveId[]
  grade: FGrade
  /** Secret formula id when this set matches one. */
  secret: string | null
}
export interface FormulaLabState {
  rng: number
  stock: CatalystLot[]
  formulas: Formula[]
  /** Mixes in a row that did not beat their best input. */
  pity: number
  knownSynergies: string[]
  /** Revealed hints: `syn:<a+b>` or `secret:<id>`. */
  hints: string[]
  /** Lots produced per formula since the last catalyst unit was used. */
  lotCounter: Record<string, number>
}
export const emptyFormulaLab = (rng: number): FormulaLabState => ({
  rng,
  stock: [],
  formulas: [],
  pity: 0,
  knownSynergies: [],
  hints: [],
  lotCounter: {},
})

const byYear = <T>(table: readonly T[], year: number) =>
  table[Math.max(0, Math.min(table.length - 1, year - 1))]
export const slotsFor = (year: number) => byYear(F.mix.slotsByYear, year)
export const maxCatalystGrade = (year: number) => byYear(F.catalyst.maxGradeByYear, year) as FGrade
export const catalystUnits = (level: number) =>
  F.catalyst.unitsBase + F.catalyst.unitsPerLevel * (Math.max(1, Math.min(5, level)) - 1)

/** Odds [D…SS] at a fractional lab level (chemists add a fraction), capped by year. */
export function catalystWeights(level: number, chem: number, year: number): number[] {
  const eff = Math.max(1, Math.min(5, level + chem / F.catalyst.chemPerLevel))
  const lo = Math.floor(eff),
    hi = Math.min(5, lo + 1),
    t = eff - lo
  const a = F.catalyst.weights[lo - 1],
    b = F.catalyst.weights[hi - 1]
  const cap = gradeIndex(maxCatalystGrade(year))
  return a.map((w, i) => (i > cap ? 0 : w + (b[i] - w) * t))
}
const pickWeighted = (weights: number[], roll: number) => {
  const total = weights.reduce((n, w) => n + w, 0)
  for (let acc = 0, i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (roll * total < acc) return i
  }
  return weights.length - 1
}

const addStock = (stock: CatalystLot[], lot: CatalystLot): CatalystLot[] => {
  const i = stock.findIndex(x => x.additive === lot.additive && x.grade === lot.grade)
  if (i < 0) return [...stock, lot]
  return stock.map((x, j) => (j === i ? { ...x, units: x.units + lot.units } : x))
}
export const stockOf = (st: FormulaLabState, additive: AdditiveId, grade?: FGrade) =>
  st.stock
    .filter(x => x.additive === additive && (!grade || x.grade === grade))
    .reduce((n, x) => n + x.units, 0)

/** A finished Catalyst Lab job: one random unlocked catalyst, graded by lab level. */
export function rollCatalyst(
  st: FormulaLabState,
  opts: { pool: readonly AdditiveId[]; level: number; chem: number; year: number },
): { state: FormulaLabState; lot: CatalystLot | null; hint: string | null } {
  if (!opts.pool.length) return { state: st, lot: null, hint: null }
  const [r1, g1] = random(st.rng)
  const [r2, g2] = random(g1)
  const [r3, g3] = random(g2)
  const additive = opts.pool[Math.floor(r1 * opts.pool.length)]
  const grade = gradeAt(pickWeighted(catalystWeights(opts.level, opts.chem, opts.year), r2))
  const lot = { additive, grade, units: catalystUnits(opts.level) }
  let next: FormulaLabState = { ...st, rng: g3, stock: addStock(st.stock, lot) }
  let hint: string | null = null
  if (r3 < F.catalyst.hintChance) {
    const [r4, g4] = random(next.rng)
    const open = [
      ...synergies
        .filter(x => x.kind === 'good')
        .map(x => `syn:${synergyKey(x.a, x.b)}`)
        .filter(k => !next.hints.includes(k) && !next.knownSynergies.includes(k.slice(4))),
      ...secretFormulas
        .map(x => `secret:${x.id}`)
        .filter(
          k => !next.hints.includes(k) && !next.formulas.some(f => `secret:${f.secret}` === k),
        ),
    ]
    if (open.length) {
      hint = open[Math.floor(r4 * open.length)]
      next = { ...next, rng: g4, hints: [...next.hints, hint] }
    } else next = { ...next, rng: g4 }
  }
  return { state: next, lot, hint }
}

export interface MixPick {
  additive: AdditiveId
  grade: FGrade
}
export interface MixInput {
  base: BaseId
  /** Start from a known formula of this base; omit to start from the plain base (grade D). */
  from?: string
  picks: MixPick[]
  year: number
  /** Formula Lab level 1–5. */
  level: number
}
export type MixBlock = 'slots' | 'empty' | 'stock' | 'full' | 'formula' | 'duplicate' | null

export function mixBlock(st: FormulaLabState, m: MixInput): MixBlock {
  if (!m.picks.length) return 'empty'
  if (m.picks.length > slotsFor(m.year)) return 'slots'
  if (new Set(m.picks.map(p => p.additive)).size !== m.picks.length) return 'duplicate'
  const from = m.from ? st.formulas.find(f => f.key === m.from) : null
  if (m.from && (!from || from.base !== m.base)) return 'formula'
  for (const p of m.picks) if (stockOf(st, p.additive, p.grade) < F.mix.unitsPerSlot) return 'stock'
  const set = new Set([...(from?.catalysts ?? []), ...m.picks.map(p => p.additive)])
  if (set.size > F.mix.maxCatalysts) return 'full'
  return null
}

/** Grade math without luck: what the player can see before mixing. */
export function mixOdds(st: FormulaLabState, m: MixInput) {
  const from = m.from ? st.formulas.find(f => f.key === m.from) : null
  const catalysts = [...new Set([...(from?.catalysts ?? []), ...m.picks.map(p => p.additive)])]
  const inputs = [from ? gradeIndex(from.grade) : 0, ...m.picks.map(p => gradeIndex(p.grade))]
  const avg = inputs.reduce((n, g) => n + g, 0) / inputs.length
  const compat = catalysts.reduce((n, a) => n + F.mix.compat[pairCompat(m.base, a)], 0)
  let synergy = 0
  const touched: string[] = []
  for (let i = 0; i < catalysts.length; i++)
    for (let j = i + 1; j < catalysts.length; j++) {
      const kind = synergyOf(catalysts[i], catalysts[j])
      if (kind) {
        synergy += F.mix.synergy[kind]
        touched.push(synergyKey(catalysts[i], catalysts[j]))
      }
    }
  const secret = secretFor(m.base, catalysts)
  const bonus = compat + synergy + (secret ? F.mix.secretBonus : 0)
  const best = Math.max(...inputs)
  // The cap comes from the best catalyst, not the formula, so a formula cannot ratchet itself up:
  // better grades need better catalysts (lab level + year).
  const bestCatalyst = Math.max(...m.picks.map(p => gradeIndex(p.grade)))
  const cap = Math.min(
    FORMULA_GRADES.length - 1,
    bestCatalyst + F.mix.capAboveBest + (secret ? F.mix.secretCap : 0),
  )
  const shift = F.mix.shiftPerLevel * (Math.max(1, Math.min(5, m.level)) - 1)
  const pity = st.pity >= F.mix.pityAfter ? 1 : 0
  const center = avg + bonus + shift + pity
  return {
    catalysts,
    best,
    bestCatalyst,
    cap,
    center,
    low: gradeAt(Math.max(0, Math.min(cap, Math.round(center - F.mix.spread)))),
    high: gradeAt(Math.max(0, Math.min(cap, Math.round(center + F.mix.spread)))),
    secret,
    touched,
  }
}

export interface MixResult {
  state: FormulaLabState
  formula: Formula | null
  rolled: FGrade | null
  /** True when a known formula got a better grade, or a new formula was found. */
  improved: boolean
  isNew: boolean
  block: MixBlock
}
export function mixFormula(st: FormulaLabState, m: MixInput): MixResult {
  const block = mixBlock(st, m)
  if (block) return { state: st, formula: null, rolled: null, improved: false, isNew: false, block }
  const o = mixOdds(st, m)
  const [r, rng] = random(st.rng)
  const idx = Math.max(0, Math.min(o.cap, Math.round(o.center + (r * 2 - 1) * F.mix.spread)))
  const rolled = gradeAt(idx)
  // Spend the catalysts.
  let stock = st.stock
  for (const p of m.picks)
    stock = stock.map(x =>
      x.additive === p.additive && x.grade === p.grade
        ? { ...x, units: x.units - F.mix.unitsPerSlot }
        : x,
    )
  stock = stock.filter(x => x.units > 0)
  const key = formulaKey(m.base, o.catalysts)
  const old = st.formulas.find(f => f.key === key)
  const formula: Formula = {
    key,
    base: m.base,
    catalysts: [...o.catalysts].sort() as AdditiveId[],
    grade: old && gradeIndex(old.grade) >= idx ? old.grade : rolled,
    secret: o.secret?.id ?? null,
  }
  const isNew = !old
  const improved = isNew || gradeIndex(formula.grade) > gradeIndex(old!.grade)
  const formulas = old
    ? st.formulas.map(f => (f.key === key ? formula : f))
    : [...st.formulas, formula]
  return {
    state: {
      ...st,
      rng,
      stock,
      formulas,
      pity: idx > o.best ? 0 : st.pity + 1,
      knownSynergies: [...new Set([...st.knownSynergies, ...o.touched])],
    },
    formula,
    rolled,
    improved,
    isNew,
    block: null,
  }
}

/**
 * One lot from a blend station running this formula. Every `lotsPerUnit` lots uses one unit of
 * each catalyst (lowest grade first). If any catalyst is missing, the lot drops to the fallback.
 */
export function produceLot(
  st: FormulaLabState,
  key: string,
): { state: FormulaLabState; grade: FGrade; short: AdditiveId[] } {
  const formula = st.formulas.find(f => f.key === key)
  if (!formula) return { state: st, grade: F.production.fallbackGrade, short: [] }
  const count = (st.lotCounter[key] ?? 0) + 1
  if (count < F.production.lotsPerUnit || !formula.catalysts.length)
    return {
      state: { ...st, lotCounter: { ...st.lotCounter, [key]: count } },
      grade: formula.grade,
      short: [],
    }
  const short = formula.catalysts.filter(a => stockOf(st, a) < 1)
  if (short.length) return { state: st, grade: F.production.fallbackGrade, short }
  let stock = st.stock
  for (const a of formula.catalysts) {
    const lowest = stock
      .filter(x => x.additive === a)
      .sort((x, y) => gradeIndex(x.grade) - gradeIndex(y.grade))[0]
    stock = stock
      .map(x => (x === lowest ? { ...x, units: x.units - 1 } : x))
      .filter(x => x.units > 0)
  }
  return {
    state: { ...st, stock, lotCounter: { ...st.lotCounter, [key]: 0 } },
    grade: formula.grade,
    short: [],
  }
}

export const lotPrice = (grade: FGrade, secret: string | null) =>
  F.gradePrice[grade] * (secret ? F.secretPrice : 1)
