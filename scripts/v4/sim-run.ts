import { salePrice } from '../../src/v4/sim/systems/customers'
import {
  labs,
  labJob,
  labRole,
  setLabRole,
  catalystBlock,
  startCatalyst,
  startMix,
  labMixBlock,
  gameYear,
  labLevel,
  type MixRequest,
} from '../../src/v4/sim/systems/research'
import { mixOdds, slotsFor, gradeIndex, stockOf } from '../../src/v4/sim/systems/formulaLab'
import {
  wears,
  conditionOf,
  overhaulCost,
  overhaul,
  specialize,
} from '../../src/v4/sim/systems/plant'
import { demandOf, adCost, advertise } from '../../src/v4/sim/systems/market'
import { projectCost, buyProject } from '../../src/v4/sim/systems/projects'
import { createNewGame } from '../../src/v4/sim/state'
import { tick } from '../../src/v4/sim/tick'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { place, canPlace, upgrade, upgradeCost } from '../../src/v4/sim/systems/yard'
import { recruit, hire, assign, train, levelUp } from '../../src/v4/sim/systems/staff'
import { invest, baseAvailable } from '../../src/v4/sim/systems/investments'
import {
  selectBlend,
  blendStations,
  recipeOf,
  activeRecipes,
  recipeGrade,
} from '../../src/v4/sim/systems/blending'
import { acceptContract, deliverContract } from '../../src/v4/sim/systems/contracts'
import { bases } from '../../src/v4/data/bases'
import { hiring, trainings } from '../../src/v4/data/staff'
import { investments } from '../../src/v4/data/investments'
import { B, MONTH, YEAR, FORMULA_LAB } from '../../src/v4/data/balance'
import type { GameState, Recipe } from '../../src/v4/sim/types'
import { random } from '../../src/v4/sim/rng'

// Each seed plays with its own style so balance is not tuned to one fixed bot.
export interface Bot {
  rng: number
  pace: number // >1 builds and hires later, <1 earlier
  reserveScale: number // how much cash the bot keeps aside
  staffBias: number // extra or fewer staff than the default plan
  explore: number // chance per week to try a non-optimal recipe
  supportOrder: string[]
  investOrder: string[]
}
export function makeBot(seed: number): Bot {
  let rng = (seed * 2654435761) >>> 0
  const draw = () => {
    const [value, next] = random(rng)
    rng = next
    return value
  }
  const shuffle = <T>(items: T[]) =>
    items
      .map(item => ({ item, key: draw() }))
      .sort((a, b) => a.key - b.key)
      .map(v => v.item)
  return {
    pace: 0.8 + draw() * 0.45,
    reserveScale: 0.6 + draw() * 1.2,
    staffBias: Math.floor(draw() * 3) - 1,
    explore: draw() * 0.3,
    supportOrder: shuffle(['canteen', 'lab']),
    investOrder: shuffle(investments.map(d => d.id)),
    rng,
  }
}
function roll(bot: Bot): number {
  const [value, next] = random(bot.rng)
  bot.rng = next
  return value
}
export function buildFirstFree(s: GameState, id: string): GameState {
  for (let y = 3; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, id, x, y)) return place(s, id, x, y)
  return s
}
export function autoplay(s: GameState, bot: Bot = makeBot(1)): GameState {
  // Decisions use the same guarded actions as the UI. No grants, rank forcing or direct resource edits.
  for (const c of s.contracts.active) s = deliverContract(s, c.uid)
  if (s.tick % B.ticksPerWeek !== 0) return s
  const year = (Math.floor(s.tick / YEAR) + 1) / bot.pace
  const reserve = (15000 + s.staff.reduce((n, p) => n + p.salary, 0)) * bot.reserveScale
  const buildOnce = (id: string, budget: number) => {
    if (!s.yard.buildings.some(b => b.defId === id) && s.money > budget + reserve)
      s = buildFirstFree(s, id)
  }
  for (const id of bot.supportOrder) buildOnce(id, id === 'lab' ? 15000 : 8000)
  if (year >= 3) {
    buildOnce('hydro', 25000)
    buildOnce('pipe', 1000)
    buildOnce('reformer', 120000)
  }
  if (year >= 6) {
    buildOnce('control', 80000)
    buildOnce('cracker', 300000)
  }
  const lines = year >= 7 ? 3 : year >= 4.6 ? 2 : 1
  // A second lab soon after the first (one researches catalysts, one mixes), a third later.
  const wantLabs = year >= 7 ? 3 : 2
  if (
    labs(s).length &&
    labs(s).length < wantLabs &&
    s.money > (year >= 7 ? 100000 : 30000) + reserve
  )
    s = buildFirstFree(s, 'lab')
  // Better labs mean better catalysts: upgrade them once the cash is clearly spare.
  if (year >= 1.5 && s.tick % MONTH === 0)
    for (const lab of labs(s)) if (s.money > upgradeCost(lab) * 4 + reserve) s = upgrade(s, lab.uid)
  const allLabs = labs(s)
  if (allLabs.length >= 2 && !allLabs.some(l => labRole(l) === 'formula'))
    s = setLabRole(s, allLabs[1].uid, 'formula')
  if (s.money > 500000 + reserve)
    for (const id of ['crudeTank', 'cdu', 'hydro', 'tank', 'blend'])
      if (s.yard.buildings.filter(b => b.defId === id).length < lines) s = buildFirstFree(s, id)
  const desiredStaff = Math.max(
    1,
    (year < 5 ? 1 : year < 7 ? 3 : Math.min(8, s.rank + 2)) + (year < 5 ? 0 : bot.staffBias),
  )
  if (year >= 4 && s.staff.length < desiredStaff && s.money > 100000 + reserve) {
    const method = [...hiring].reverse().find(h => h.rank <= s.rank && h.cost < s.money / 5)!
    s = recruit(s, method.id)
    const p = [...s.candidates].sort(
      (a, b) =>
        Object.values(b.stats).reduce((n, x) => n + x, 0) -
        Object.values(a.stats).reduce((n, x) => n + x, 0),
    )[0]
    if (p) s = hire(s, p.uid)
  }
  // Overhaul worn plants, then put spare cash into big projects.
  for (const b of s.yard.buildings)
    if (wears(b) && conditionOf(b) < 62 && s.money > overhaulCost(b) + reserve)
      s = overhaul(s, b.uid)
  for (const b of s.yard.buildings)
    if (wears(b) && !b.spec && b.level >= 3)
      s = specialize(s, b.uid, b.defId === 'blend' ? 'quality' : 'volume')
  for (const id of ['researchCenter', 'export'] as const)
    if (s.money > projectCost(s, id) * 2 + reserve) s = buyProject(s, id)
  const station = s.yard.buildings.find(b => b.defId === 'blend')
  const lab = labs(s)[0]
  if (lab && s.staff.length >= 2 && !s.staff.some(p => p.assignedTo === lab.uid)) {
    const chemist = [...s.staff].sort((a, b) => b.stats.chem - a.stats.chem)[0]
    s = assign(s, chemist.uid, lab.uid)
  }
  for (const p of s.staff) if (station && !p.assignedTo) s = assign(s, p.uid, station.uid)
  if (s.tick % MONTH === 0) {
    for (const p of s.staff) {
      if (s.money > reserve + 20000) {
        const options = trainings.filter(
          t =>
            t.rank <= s.rank &&
            t.power <= p.power &&
            t.cost < s.money / 12 &&
            (p.trainingCounts[t.id] ?? 0) < 12,
        )
        const training = options[Math.floor(s.tick / MONTH) % Math.max(1, options.length)]
        if (training) s = train(s, p.uid, training.id)
      }
      s = levelUp(s, p.uid)
    }
    for (const d of bot.investOrder.map(id => investments.find(v => v.id === id)!)) {
      const step = d.steps[s.investments[d.id] ?? 0]
      if (step && s.rank >= d.rank && s.money > step.cost * 3 + reserve) s = invest(s, d.id)
    }
  }
  // Upgrade the selected production chain when comfortably affordable.
  if (year >= 5 && s.tick % MONTH === 0)
    for (const b of s.yard.buildings.filter(b => ['cdu', 'blend', 'hydro'].includes(b.defId)))
      if (s.money > 500000 + reserve) s = upgrade(s, b.uid)
  const options = bases.filter(
    b =>
      baseAvailable(s, b.id) &&
      s.yard.buildings.some(v => v.defId === b.unit) &&
      (!['lube'].includes(b.id) || s.investments.port > 0) &&
      (!['jet'].includes(b.id) || s.investments.airport > 0) &&
      (!['wax', 'pellet'].includes(b.id) || s.investments.industrial > 0),
  )
  // Best recipe for each available base (a formula with catalysts in stock, else plain),
  // then the bases ranked by sale value.
  type Pick = { recipe: Recipe; value: number }
  const usable = (r: Recipe) => {
    const f = s.formulaLab.formulas.find(x => x.key === r.formula)
    return !f || f.catalysts.every(a => stockOf(s.formulaLab, a) > 0)
  }
  const valueOf = (r: Recipe) => {
    const f = s.formulaLab.formulas.find(x => x.key === r.formula)
    return salePrice(s, { base: r.base, grade: recipeGrade(s, r), secret: f?.secret ?? null })
  }
  const recipesFor = (base: Recipe['base']): Recipe[] => [
    { base, formula: null },
    ...s.formulaLab.formulas.filter(f => f.base === base).map(f => ({ base, formula: f.key })),
  ]
  const ranked: Pick[] = options
    .map(b => {
      let best: Pick | undefined
      for (const recipe of recipesFor(b.id).filter(usable)) {
        const value = valueOf(recipe)
        if (!best || value > best.value) best = { recipe, value }
      }
      return best!
    })
    .sort((a, b) => b.value - a.value)
  const stations = blendStations(s)
  // Like a player: every station runs the best product while its base lasts, extra stations
  // move to the next-best product instead of waiting.
  const reserved: Record<string, number> = {}
  if (ranked.length)
    stations.forEach(st => {
      let pick =
        ranked.find(r => s.baseStock[r.recipe.base] - (reserved[r.recipe.base] ?? 0) >= 600) ??
        ranked[0]
      reserved[pick.recipe.base] = (reserved[pick.recipe.base] ?? 0) + 600
      if (roll(bot) < bot.explore) {
        // Curious player: try something else this week.
        const base = options[Math.floor(roll(bot) * options.length)]
        const all = recipesFor(base.id)
        pick = { recipe: all[Math.floor(roll(bot) * all.length)], value: 0 }
      }
      const cur = recipeOf(s, st)
      if (cur.base !== pick.recipe.base || cur.formula !== pick.recipe.formula)
        s = selectBlend(s, pick.recipe.base, pick.recipe.formula, st.uid)
    })
  // Keep catalyst labs researching, and formula labs mixing whatever looks most promising.
  for (const lab of labs(s))
    if (!labJob(s, lab.uid)) {
      if (labRole(lab) === 'catalyst') {
        if (!catalystBlock(s, lab.uid) && s.money > FORMULA_LAB.catalyst.money + reserve)
          s = startCatalyst(s, lab.uid)
      } else if (s.money > FORMULA_LAB.mix.money + reserve) {
        const mix = bestMix(
          s,
          lab,
          ranked.map(r => r.recipe.base),
        )
        if (mix) s = startMix(s, lab.uid, mix)
      }
    }
  // Advertise the best product once buyers tire of it.
  const top = ranked[0]?.recipe.base
  if (top && demandOf(s, top) < 0.75 && s.money > adCost(s) * 10 + reserve) s = advertise(s, top)
  const mixing = new Set(activeRecipes(s).map(r => r.base))
  for (const c of s.contracts.offers)
    if (mixing.has(c.base) && s.contracts.active.length < 3) s = acceptContract(s, c.uid)
  return s
}
function combos<T>(xs: T[], k: number): T[][] {
  if (k === 0) return [[]]
  return xs.flatMap((x, i) => combos(xs.slice(i + 1), k - 1).map(c => [x, ...c]))
}
/** Greedy player: the mix whose expected grade beats the current best formula of a base most. */
function bestMix(
  s: GameState,
  lab: GameState['yard']['buildings'][number],
  bases: Recipe['base'][],
): MixRequest | null {
  const year = gameYear(s),
    level = labLevel(s, lab)
  const top = new Map<string, GameState['formulaLab']['stock'][number]>()
  for (const c of s.formulaLab.stock)
    if (
      c.units >= FORMULA_LAB.mix.unitsPerSlot &&
      gradeIndex(c.grade) >
        gradeIndex(top.get(c.additive)?.grade ?? 'D') - (top.has(c.additive) ? 0 : 1)
    )
      top.set(c.additive, c)
  const lots = [...top.values()]
    .sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))
    .slice(0, 6)
  let best: { mix: MixRequest; gain: number } | null = null
  for (const base of bases.slice(0, 3)) {
    const formulas = s.formulaLab.formulas.filter(f => f.base === base)
    const current = Math.max(gradeIndex('C'), ...formulas.map(f => gradeIndex(f.grade)))
    const starts = [
      undefined,
      ...formulas
        .sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))
        .slice(0, 2)
        .map(f => f.key),
    ]
    for (const from of starts)
      for (let k = 1; k <= slotsFor(year); k++)
        for (const c of combos(lots, k)) {
          const mix: MixRequest = {
            base,
            from,
            picks: c.map(x => ({ additive: x.additive, grade: x.grade })),
          }
          if (labMixBlock(s, lab.uid, mix)) continue
          const o = mixOdds({ ...s.formulaLab, rng: s.rng }, { ...mix, year, level })
          const gain = Math.min(o.center, o.cap) - current
          if (gain > 0.2 && (!best || gain > best.gain)) best = { mix, gain }
        }
  }
  return best?.mix ?? null
}
export function simulate(seed: number, years = 16) {
  const bot = makeBot(seed)
  let s = buildStarter(createNewGame(seed)),
    negative = 0,
    maxNegative = 0
  const reached: Record<number, number> = { 1: 1 }
  const annual: {
    year: number
    rank: number
    fame: number
    money: number
    profit: number
    rd: number
    known: number
    expenses: number
  }[] = []
  let firstSS = 0,
    firstA = 0,
    firstS = 0,
    expenses = 0
  for (let i = 0; i < years * YEAR; i++) {
    s = autoplay(tick(s), bot)
    if (!firstSS && s.tanks.some(l => l.grade === 'SS')) firstSS = s.tick / YEAR
    if (!firstS && s.tanks.some(l => l.grade === 'S' || l.grade === 'SS')) firstS = s.tick / YEAR
    if (!firstA && s.tanks.some(l => ['A', 'S', 'SS'].includes(l.grade))) firstA = s.tick / YEAR
    if (s.tick % YEAR === YEAR - 1) expenses = s.year.expenses
    for (let rank = 2; rank <= s.rank; rank++) if (!(rank in reached)) reached[rank] = s.tick / YEAR
    negative = s.money < 0 ? negative + 1 : 0
    maxNegative = Math.max(maxNegative, negative)
    if (s.tick % YEAR === 0)
      annual.push({
        year: s.tick / YEAR,
        rank: s.rank,
        fame: s.fame,
        money: Math.round(s.money),
        profit: Math.round(s.history.profits.slice(-12).reduce((n, p) => n + p.profit, 0) / 12),
        rd: Math.round(s.rd),
        known: s.formulaLab.formulas.length,
        expenses: Math.round(expenses),
      })
  }
  return {
    state: s,
    reached,
    maxNegativeMonths: maxNegative / MONTH,
    unlocksFirst40Weeks: s.unlockHistory.filter(u => u.tick <= 40 * B.ticksPerWeek).length,
    annual,
    firstA,
    firstS,
    firstSS,
    awardWins: s.history.awards.map(a => a.wins.length),
  }
}
if (process.argv[1]?.endsWith('sim-run.ts')) {
  const n = Number(process.argv[2] ?? 1)
  for (let seed = 1; seed <= n; seed++) {
    const { state, ...report } = simulate(seed)
    console.log(JSON.stringify({ seed, ...report }))
  }
}
