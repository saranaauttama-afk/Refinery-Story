import { baseAvailable } from './investments'
import { plantFactor, specStats } from './plant'
import { staffStats } from './staff'
import { getModifiers } from './combos'
import { produceLot } from './formulaLab'
import { PRODUCTION as P, YARD, FORMULA_LAB as F } from '../../data/balance'
import { additives } from '../../data/additives'
import type { BaseId } from '../../data/bases'
import type { GameState, Stats, Grade, Building, Recipe } from '../types'
/** Award "product" score of a lot: its stats, scaled by grade, familiarity and combos. */
export const scoreLot = (stats: Stats, grade: Grade, familiarity: number, comboBonus = 0) =>
  Object.values(stats).reduce((a, b) => a + b, 0) *
  F.gradeScore[grade] *
  (1 + P.familiarityBonus * familiarity) *
  (1 + comboBonus)
export const formulaOf = (s: GameState, key: string | null) =>
  key ? (s.formulaLab.formulas.find(f => f.key === key) ?? null) : null
/** Grade a station running this recipe makes while its catalysts last. */
export const recipeGrade = (s: GameState, r: Recipe): Grade =>
  formulaOf(s, r.formula)?.grade ?? F.plainGrade
export function lotStats(s: GameState): Stats {
  const n = P.baseStat * P.crudeQuality[s.crudeType]
  const m = getModifiers(s),
    p = staffStats(s),
    sp = specStats(s)
  return {
    purity: n + m.purity + p.purity + sp.purity,
    yield: (n + m.yield + p.yield) * (1 + m.yieldPct),
    stability: n + m.stability + p.stability + sp.stability,
    eco: n + m.eco + p.eco + sp.eco,
  }
}
const familiarityOf = (s: GameState, base: BaseId, catalysts: readonly string[]) =>
  [base, ...catalysts].reduce((n, id) => n + (s.familiarity[id] ?? 1), 0) / (1 + catalysts.length)
export function predictedScore(s: GameState, r: Recipe = s.blend, grade = recipeGrade(s, r)) {
  const m = getModifiers(s)
  const catalysts = formulaOf(s, r.formula)?.catalysts ?? []
  return (
    scoreLot(lotStats(s), grade, familiarityOf(s, r.base, catalysts), m.quality) +
    m.score +
    (r.base === 'gasoline' ? m.gasolineScore : 0)
  )
}
export const blendStations = (s: GameState) => s.yard.buildings.filter(b => b.defId === 'blend')
export const recipeOf = (s: GameState, b: Building): Recipe => b.recipe ?? s.blend
/** Every recipe currently running, one per station (or the default when there is none). */
export const activeRecipes = (s: GameState): Recipe[] => {
  const st = blendStations(s)
  return st.length ? st.map(b => recipeOf(s, b)) : [s.blend]
}
/** Pick a plain base or a formula. With a station uid only that station changes; without one,
 *  all stations do. */
export function selectBlend(
  s: GameState,
  base: BaseId,
  formula: string | null,
  station?: string,
): GameState {
  const f = formulaOf(s, formula)
  if (!baseAvailable(s, base) || (formula && (!f || f.base !== base))) return s
  const recipe: Recipe = { base, formula }
  return {
    ...s,
    blend: recipe,
    yard: {
      ...s.yard,
      buildings: s.yard.buildings.map(b =>
        b.defId === 'blend' && (!station || b.uid === station) ? { ...b, recipe } : b,
      ),
    },
  }
}
export const tankCapacity = (s: GameState) =>
  s.yard.buildings
    .filter(b => b.defId === 'tank')
    .reduce((n, b) => n + P.tankCapacity * (1 + YARD.outputPerLevel * (b.level - 1)), 0) *
  (1 + getModifiers(s).capacity)
export const tankUnits = (s: GameState) => s.tanks.reduce((n, l) => n + l.units, 0)
export function blending(s: GameState): GameState {
  if (s.tick % P.cycle !== 0 || s.tick < s.stormUntil) return s
  const stations = blendStations(s)
  if (!stations.length) return s
  const capacity = tankCapacity(s)
  let next = s
  for (const station of stations) {
    const recipe = recipeOf(next, station),
      { base } = recipe
    const units =
      P.lotUnits * (1 + YARD.outputPerLevel * (station.level - 1)) * plantFactor(next, station)
    if (units <= 0) continue
    if (next.baseStock[base] < units) continue
    if (tankUnits(next) + units > capacity) {
      // Tell the player why the station stopped.
      next = {
        ...next,
        nextId: next.nextId + 1,
        popups: [
          ...next.popups,
          {
            uid: `full${next.nextId}`,
            tick: next.tick,
            x: station.x,
            y: station.y,
            en: 'Tanks full!',
            th: 'ถังเต็ม!',
          },
        ],
      }
      continue
    }
    const formula = formulaOf(next, recipe.formula)
    let grade: Grade = F.plainGrade
    let short: string[] = []
    if (formula) {
      const r = produceLot({ ...next.formulaLab, rng: next.rng }, formula.key)
      const { rng: _rng, ...lab } = r.state
      next = { ...next, formulaLab: lab }
      grade = r.grade
      short = r.short
    }
    const stats = lotStats(next),
      score = predictedScore(next, recipe, grade),
      key = formula?.key ?? `${base}:none`,
      first = !next.triedPairs.includes(key)
    const familiarity = { ...next.familiarity },
      useCounts = { ...next.useCounts }
    for (const id of [base, ...(formula?.catalysts ?? [])])
      if (id) {
        useCounts[id] = (useCounts[id] ?? 0) + 1
        familiarity[id] = Math.min(
          P.familiarityMax,
          1 + Math.floor(useCounts[id] / P.familiarityLots),
        )
      }
    next = {
      ...next,
      year: {
        ...next.year,
        lots: next.year.lots + 1,
        ecoTotal: next.year.ecoTotal + stats.eco,
        bestScore: Math.max(next.year.bestScore, score),
      },
      nextId: next.nextId + 1,
      baseStock: { ...next.baseStock, [base]: next.baseStock[base] - units },
      tanks: [
        ...next.tanks,
        {
          uid: `l${next.nextId}`,
          base,
          formula: formula?.key ?? null,
          secret: formula?.secret ?? null,
          stats,
          score,
          grade,
          units,
        },
      ],
      fame: next.fame + (first ? P.firstTryFame : 0),
      triedPairs: first ? [...next.triedPairs, key] : next.triedPairs,
      familiarity,
      useCounts,
      popups: [
        ...next.popups,
        {
          uid: `p${next.nextId}`,
          tick: next.tick,
          x: station.x,
          y: station.y,
          en: short.length ? `No ${shortName(short).en}` : `${grade}!`,
          th: short.length ? `${shortName(short).th} หมด` : `${grade}!`,
        },
      ],
    }
  }
  return next
}
const shortName = (ids: string[]) => additives.find(a => a.id === ids[0])!.name

export function discardLot(s: GameState, uid: string): GameState {
  if (!s.tanks.some(l => l.uid === uid)) return s
  return { ...s, tanks: s.tanks.filter(l => l.uid !== uid) }
}
