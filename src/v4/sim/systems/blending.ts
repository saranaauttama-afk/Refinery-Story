import { baseAvailable } from './investments'
import { recipeKnown } from './research'
import { plantFactor } from './plant'
import { staffStats } from './staff'
import { getModifiers } from './combos'
import { PRODUCTION as P, PAIR, GRADES, YARD, GRADE_SCALE } from '../../data/balance'
import { pairCompat, type Compat } from '../../data/compatibility'
import type { BaseId } from '../../data/bases'
import type { AdditiveId } from '../../data/additives'
import type { GameState, Stats, Grade, Building, Recipe } from '../types'
export const scoreLot = (stats: Stats, pair: Compat, familiarity: number, comboBonus = 0) =>
  Object.values(stats).reduce((a, b) => a + b, 0) *
  PAIR[pair] *
  (1 + P.familiarityBonus * familiarity) *
  (1 + comboBonus)
export const gradeScale = (rank: number) =>
  GRADE_SCALE[Math.max(0, Math.min(GRADE_SCALE.length - 1, rank - 1))]
/** Minimum score for each grade at this rank. */
export const gradeMin = (rank: number, min: number) => Math.round(min * gradeScale(rank))
export const gradeFor = (score: number, rank = 1): Grade =>
  GRADES.find(g => score >= gradeMin(rank, g.min))?.id ?? 'C'
export function lotStats(s: GameState): Stats {
  const n = P.baseStat * P.crudeQuality[s.crudeType]
  const m = getModifiers(s),
    p = staffStats(s)
  return {
    purity: n + m.purity + p.purity,
    yield: (n + m.yield + p.yield) * (1 + m.yieldPct),
    stability: n + m.stability + p.stability,
    eco: n + m.eco + p.eco,
  }
}
export function predictedScore(s: GameState, base = s.blend.base, additive = s.blend.additive) {
  const familiarity = additive
    ? ((s.familiarity[base] ?? 1) + (s.familiarity[additive] ?? 1)) / 2
    : (s.familiarity[base] ?? 1)
  const m = getModifiers(s)
  return (
    scoreLot(lotStats(s), pairCompat(base, additive), familiarity, m.quality) +
    m.score +
    (base === 'gasoline' ? m.gasolineScore : 0)
  )
}
export const blendStations = (s: GameState) => s.yard.buildings.filter(b => b.defId === 'blend')
export const recipeOf = (s: GameState, b: Building): Recipe => b.recipe ?? s.blend
/** Every recipe currently running, one per station (or the default when there is none). */
export const activeRecipes = (s: GameState): Recipe[] => {
  const st = blendStations(s)
  return st.length ? st.map(b => recipeOf(s, b)) : [s.blend]
}
/** Pick a recipe. With a station uid only that station changes; without one, all stations do. */
export function selectBlend(
  s: GameState,
  base: BaseId,
  additive: AdditiveId | null,
  station?: string,
): GameState {
  if (
    !baseAvailable(s, base) ||
    (additive && !s.unlockedAdditives.includes(additive)) ||
    !recipeKnown(s, base, additive)
  )
    return s
  const recipe = { base, additive }
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
    const { base, additive } = recipeOf(next, station)
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
    const stats = lotStats(next),
      score = predictedScore(next, base, additive),
      grade = gradeFor(score, next.rank),
      key = `${base}:${additive ?? 'none'}`,
      first = !next.triedPairs.includes(key)
    const familiarity = { ...next.familiarity },
      useCounts = { ...next.useCounts }
    for (const id of [base, additive])
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
        { uid: `l${next.nextId}`, base, additive, stats, score, grade, units },
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
          en: `${grade}!`,
          th: `${grade}!`,
        },
      ],
    }
  }
  return next
}
export function discardLot(s: GameState, uid: string): GameState {
  if (!s.tanks.some(l => l.uid === uid)) return s
  return { ...s, tanks: s.tanks.filter(l => l.uid !== uid) }
}
