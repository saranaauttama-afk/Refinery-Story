import type { GameState } from './types'
import { buildings } from '../data/buildings'
import { YARD } from '../data/balance'
import { bases } from '../data/bases'
import { emptyFormulaLab } from './systems/formulaLab'
import { emptyRewards } from './systems/rewards'
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
const validBlend = (x: unknown) =>
  record(x) &&
  bases.some(b => b.id === x.base) &&
  (x.formula === null || typeof x.formula === 'string')
const GRADE_IDS = ['SS', 'S', 'A', 'B', 'C', 'D']
/** Saves from before the Formula Lab: recipes become plain bases, old pair research is dropped. */
function migrateFormulaLab(s: Record<string, unknown>) {
  if (s.formulaLab !== undefined) return
  s.formulaLab = emptyFormulaLab()
  const plain = (r: unknown) => (record(r) ? { base: r.base, formula: null } : r)
  s.blend = plain(s.blend)
  for (const b of (s.yard as { buildings?: Record<string, unknown>[] })?.buildings ?? [])
    if (b.recipe !== undefined) b.recipe = plain(b.recipe)
  if (Array.isArray(s.tanks))
    s.tanks = s.tanks.map(l => {
      if (!record(l)) return l
      const { additive: _a, ...rest } = l
      return { ...rest, formula: null, secret: null }
    })
  s.research = []
  delete s.knownRecipes
  delete s.clues
}
export function deserialize(raw: string): GameState {
  const s = JSON.parse(raw)
  // Fields added after the first v4 builds.
  if (record(s)) {
    if (s.loan === undefined) s.loan = 0
    if (s.research === undefined) s.research = []
    migrateFormulaLab(s)
    // Labs switched to formula mixing became their own building, the Product Lab.
    for (const b of (s.yard as { buildings?: Record<string, unknown>[] })?.buildings ?? []) {
      if (b.labRole === 'formula') b.defId = 'productLab'
      delete b.labRole
    }
    if (s.demand === undefined) s.demand = {}
    if (s.trend === undefined) s.trend = { base: null, until: 0 }
    if (s.projects === undefined) s.projects = {}
    if (s.ads === undefined) s.ads = {}
    if (s.rewards === undefined) s.rewards = emptyRewards()
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
    !record(s.formulaLab) ||
    !Array.isArray(s.formulaLab.stock) ||
    !Array.isArray(s.formulaLab.formulas) ||
    !Array.isArray(s.formulaLab.knownSynergies) ||
    !Array.isArray(s.formulaLab.hints) ||
    !record(s.formulaLab.lotCounter) ||
    !(s.formulaLab.formulas as unknown[]).every(
      f => record(f) && typeof f.key === 'string' && GRADE_IDS.includes(f.grade as string),
    ) ||
    !(s.formulaLab.stock as unknown[]).every(
      c => record(c) && GRADE_IDS.includes(c.grade as string) && Number.isFinite(c.units),
    ) ||
    !(s.research as unknown[]).every(
      j => record(j) && (j.kind === 'catalyst' || j.kind === 'mix'),
    ) ||
    !record(s.demand) ||
    !record(s.trend) ||
    !record(s.projects) ||
    !record(s.ads) ||
    !record(s.rewards) ||
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
      (b.spec !== undefined && !['volume', 'quality', 'eco'].includes(b.spec as string)) ||
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
      !GRADE_IDS.includes(l.grade as string) ||
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
  return fitYard(s as unknown as GameState)
}
/** Older saves had a 40 × 40 yard: drop parcels outside the 32 × 24 block and put any
 *  building standing outside it back into storage (placing it again is free). */
function fitYard(s: GameState): GameState {
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < YARD.maxW / YARD.parcel && y < YARD.maxH / YARD.parcel
  const parcels = s.yard.ownedParcels.filter(k => {
    const [x, y] = k.split(',').map(Number)
    return inside(x, y)
  })
  if (parcels.length === s.yard.ownedParcels.length) return s
  const fits = (b: GameState['yard']['buildings'][number]) => {
    const d = buildings.find(x => x.id === b.defId)!
    return b.x + d.w <= YARD.maxW && b.y + d.h <= YARD.maxH
  }
  const carried = { ...s.carriedBuildings }
  for (const b of s.yard.buildings) if (!fits(b)) carried[b.defId] = (carried[b.defId] ?? 0) + 1
  return {
    ...s,
    carriedBuildings: carried,
    yard: {
      ...s.yard,
      size: Math.min(s.yard.size, YARD.maxW),
      ownedParcels: parcels.length ? parcels : ['0,0'],
      buildings: s.yard.buildings.filter(fits),
    },
  }
}
