import type { GameState } from './types'
import { buildings } from '../data/buildings'
import { bases } from '../data/bases'
import { additives } from '../data/additives'
export const serialize = (s: GameState): string => JSON.stringify(s)
const finiteTree = (x: unknown): boolean =>
  typeof x === 'number'
    ? Number.isFinite(x)
    : Array.isArray(x)
      ? x.every(finiteTree)
      : x && typeof x === 'object'
        ? Object.values(x).every(finiteTree)
        : true
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x)
const validBlend = (x: unknown) => {
  if (!record(x)) return false
  return (
    bases.some(b => b.id === x.base) &&
    (x.additive === null || additives.some(a => a.id === x.additive))
  )
}
export function deserialize(raw: string): GameState {
  const s = JSON.parse(raw)
  // Fields added after the first v4 builds.
  if (record(s)) {
    if (s.loan === undefined) s.loan = 0
    if (s.knownRecipes === undefined) {
      // Saves from before lab research: every pair already tried or in use counts as found.
      const used = [
        s.blend,
        ...((s.yard as { buildings?: { recipe?: unknown }[] })?.buildings ?? []).map(b => b.recipe),
      ]
        .filter(record)
        .map(r => `${r.base}:${r.additive ?? 'none'}`)
      s.knownRecipes = [
        ...new Set(
          [...(Array.isArray(s.triedPairs) ? (s.triedPairs as string[]) : []), ...used].filter(
            k => !k.endsWith(':none'),
          ),
        ),
      ]
    }
    if (s.research === undefined) s.research = []
    if (s.clues === undefined) s.clues = {}
    if (s.demand === undefined) s.demand = {}
    if (s.trend === undefined) s.trend = { base: null, until: 0 }
    if (s.projects === undefined) s.projects = {}
    if (s.opened === undefined)
      s.opened =
        (record(s.year) && Number(s.year.sold) > 0) ||
        (record(s.history) && Array.isArray(s.history.awards) && s.history.awards.length > 0)
  }
  const arrays = [
    'staff',
    'firedStaff',
    'candidates',
    'tanks',
    'trucks',
    'unlockedAdditives',
    'popups',
    'triedPairs',
    'blueprints',
    'decos',
    'activeCombos',
    'discoveredCombos',
    'comboHints',
    'unlockHistory',
    'notices',
    'ledger',
    'log',
    'knownRecipes',
    'research',
  ]
  if (
    !record(s) ||
    s.version !== 4 ||
    !Number.isInteger(s.tick) ||
    (s.tick as number) < 0 ||
    !Number.isInteger(s.seed) ||
    !Number.isInteger(s.rng) ||
    !Number.isInteger(s.nextId) ||
    !Number.isFinite(s.money) ||
    !Number.isFinite(s.fame) ||
    !Number.isFinite(s.rd) ||
    ![0, 1, 2, 4].includes(s.speed as number) ||
    !Number.isInteger(s.rank) ||
    (s.rank as number) < 1 ||
    (s.rank as number) > 10 ||
    arrays.some(k => !Array.isArray(s[k])) ||
    !record(s.yard) ||
    !Array.isArray(s.yard.buildings) ||
    !Array.isArray(s.yard.ownedParcels) ||
    !record(s.year) ||
    !record(s.history) ||
    !Array.isArray(s.history.awards) ||
    !Array.isArray(s.history.profits) ||
    !record(s.settings) ||
    typeof s.settings.sound !== 'boolean' ||
    typeof s.settings.haptics !== 'boolean' ||
    !validBlend(s.blend) ||
    !record(s.contracts) ||
    !Array.isArray(s.contracts.offers) ||
    !Array.isArray(s.contracts.active) ||
    !record(s.cuts) ||
    !record(s.baseStock) ||
    !record(s.familiarity) ||
    !record(s.useCounts) ||
    !record(s.investments) ||
    !record(s.market) ||
    !record(s.carriedBuildings) ||
    !Number.isInteger(s.hintIndex) ||
    typeof s.opened !== 'boolean' ||
    !Number.isFinite(s.loan) ||
    !record(s.clues) ||
    !record(s.demand) ||
    !record(s.trend) ||
    !record(s.projects) ||
    ['crude', 'monthProfit', 'stormUntil', 'careerManuals', 'merchantUntil'].some(
      k => !Number.isFinite(s[k]),
    ) ||
    !finiteTree(s)
  )
    throw new Error('Invalid v4 save')
  for (const b of s.yard.buildings) {
    if (
      !record(b) ||
      !buildings.some(d => d.id === b.defId) ||
      !Number.isInteger(b.x) ||
      !Number.isInteger(b.y) ||
      !Number.isInteger(b.level) ||
      !Array.isArray(b.staff) ||
      (b.recipe !== undefined && !validBlend(b.recipe)) ||
      (b.condition !== undefined && !Number.isFinite(b.condition)) ||
      (b.repairUntil !== undefined && !Number.isFinite(b.repairUntil))
    )
      throw new Error('Invalid building in v4 save')
  }
  for (const p of [
    ...(s.staff as unknown[]),
    ...(s.firedStaff as unknown[]),
    ...(s.candidates as unknown[]),
  ]) {
    if (
      !record(p) ||
      !record(p.stats) ||
      !record(p.jobLevels) ||
      !record(p.trainingCounts) ||
      typeof p.uid !== 'string' ||
      typeof p.name !== 'string' ||
      typeof p.resting !== 'boolean'
    )
      throw new Error('Invalid staff in v4 save')
  }
  for (const l of s.tanks as unknown[]) {
    if (
      !record(l) ||
      !record(l.stats) ||
      !bases.some(b => b.id === l.base) ||
      !['SS', 'S', 'A', 'B', 'C'].includes(l.grade as string) ||
      !Number.isFinite(l.units) ||
      !Number.isFinite(l.score) ||
      ['purity', 'yield', 'stability', 'eco'].some(
        k => !Number.isFinite((l.stats as Record<string, unknown>)[k]),
      )
    )
      throw new Error('Invalid lot in v4 save')
  }
  if (
    bases.some(b => !Number.isFinite((s.baseStock as Record<string, unknown>)[b.id])) ||
    ['naphtha', 'kerosene', 'gasoil', 'residue'].some(
      k => !Number.isFinite((s.cuts as Record<string, unknown>)[k]),
    ) ||
    !['normal', 'boom', 'bust'].includes(s.market.phase as string) ||
    !Number.isFinite(s.market.nextChangeTick)
  )
    throw new Error('Invalid buffers in v4 save')
  return s as unknown as GameState
}
