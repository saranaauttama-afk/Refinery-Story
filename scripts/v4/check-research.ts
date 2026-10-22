import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { canPlace, place } from '../../src/v4/sim/systems/yard'
import { selectBlend, blending, recipeOf, blendStations } from '../../src/v4/sim/systems/blending'
import {
  startCatalyst,
  catalystBlock,
  startMix,
  labMixBlock,
  setLabRole,
  researchSystem,
  labs,
} from '../../src/v4/sim/systems/research'
import { demandOf, marketSystem, demandFactor } from '../../src/v4/sim/systems/market'
import { sellTo, salePrice } from '../../src/v4/sim/systems/customers'
import { contractSystem } from '../../src/v4/sim/systems/contracts'
import { awards } from '../../src/v4/sim/systems/awards'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { B, MONTH, YEAR, DEMAND, FORMULA_LAB, PRODUCTION } from '../../src/v4/data/balance'
import type { GameState, Lot } from '../../src/v4/sim/types'

const spot = (s: GameState, id: string) => {
  for (let y = 0; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, id, x, y)) return { x, y }
  throw new Error('no room')
}
let s: GameState = {
  ...buildStarter(createNewGame(3)),
  money: 1e6,
  rd: 0,
  rank: 2,
  opened: true,
  unlockedAdditives: ['octane', 'dye', 'detergent'],
}
// Without a formula a station makes plain lots; unknown formulas cannot be picked.
assert.equal(selectBlend(s, 'gasoline', 'gasoline:octane'), s)
assert.notEqual(selectBlend(s, 'diesel', null), s)

// Catalyst research needs a lab, RD and money, and fills the catalyst stock.
let at = spot(s, 'lab')
s = place(s, 'lab', at.x, at.y)
const cat = labs(s)[0]
assert.equal(catalystBlock(s, cat.uid), 'rd')
s = { ...s, rd: 10000 }
let r = startCatalyst(s, cat.uid)
assert.equal(r.rd, s.rd - FORMULA_LAB.catalyst.rd)
assert.equal(catalystBlock(r, cat.uid), 'busy')
for (let i = 0; i < 6; i++) {
  if (!r.research.length) r = startCatalyst(r, cat.uid)
  r = researchSystem({ ...r, tick: r.research[0].endTick })
}
assert.ok(r.formulaLab.stock.length > 0, 'research adds catalysts')
// Year 1 never yields A or better.
assert.ok(r.formulaLab.stock.every(c => ['D', 'C', 'B'].includes(c.grade)))

// A second lab switched to Formula mixes a formula; catalysts are spent at the start.
at = spot(r, 'lab')
r = place(r, 'lab', at.x, at.y)
const mixer = labs(r)[1]
const pick = r.formulaLab.stock.find(c => c.units >= FORMULA_LAB.mix.unitsPerSlot)!
const request = {
  base: 'gasoline' as const,
  picks: [{ additive: pick.additive, grade: pick.grade }],
}
assert.equal(labMixBlock(r, mixer.uid, request), 'role')
r = setLabRole(r, mixer.uid, 'formula')
assert.equal(labMixBlock(r, mixer.uid, request), null)
const unitsBefore = r.formulaLab.stock.reduce((n, c) => n + c.units, 0)
r = startMix(r, mixer.uid, request)
assert.equal(
  r.formulaLab.stock.reduce((n, c) => n + c.units, 0),
  unitsBefore - FORMULA_LAB.mix.unitsPerSlot,
)
assert.equal(setLabRole(r, mixer.uid, 'catalyst'), r, 'busy labs keep their role')
assert.equal(r.formulaLab.formulas.length, 0, 'result shows when the job ends')
r = researchSystem({ ...r, tick: r.research.find(j => j.kind === 'mix')!.endTick })
const formula = r.formulaLab.formulas[0]
assert.ok(formula && formula.key === `gasoline:${pick.additive}`)

// A station running the formula makes lots at its grade (catalysts permitting).
const station = blendStations(r)[0]
r = selectBlend(r, 'gasoline', formula.key, station.uid)
assert.equal(recipeOf(r, blendStations(r)[0]).formula, formula.key)
r = {
  ...r,
  research: [],
  formulaLab: { ...r.formulaLab, stock: [{ additive: pick.additive, grade: 'B', units: 10 }] },
}
const made = blending({
  ...r,
  tick: PRODUCTION.cycle,
  tanks: [],
  baseStock: { ...r.baseStock, gasoline: 300 },
})
assert.equal(made.tanks[0].grade, formula.grade)
assert.equal(made.tanks[0].formula, formula.key)

// Contracts ask for more as the years pass.
const offerGrade = (year: number) =>
  contractSystem({ ...s, tick: (year - 1) * YEAR + 1 }).contracts.offers[0].minGrade
assert.equal(offerGrade(1), 'C')
assert.equal(offerGrade(10), 'A')

// Saves from before the Formula Lab load: recipes become plain, old research is dropped.
const legacy = JSON.parse(serialize(s))
delete legacy.formulaLab
legacy.knownRecipes = ['gasoline:octane']
legacy.clues = { gasoline: 1 }
legacy.blend = { base: 'diesel', additive: 'octane' }
legacy.research = [{ lab: 'x', base: 'gasoline', endTick: 5 }]
legacy.tanks = [{ ...lot0(), additive: 'octane' }]
const loaded = deserialize(JSON.stringify(legacy))
assert.deepEqual(loaded.blend, { base: 'diesel', formula: null })
assert.deepEqual(loaded.research, [])
assert.equal(loaded.tanks[0].formula, null)
assert.ok(!('knownRecipes' in loaded) && !('additive' in loaded.tanks[0]))
function lot0(): Lot {
  return lot('z')
}

// Demand cools with each truck and recovers weekly; it moves the price.
function lot(uid: string): Lot {
  return {
    uid,
    base: 'gasoline',
    formula: null,
    secret: null,
    grade: 'B',
    score: 150,
    units: 300,
    stats: { purity: 30, yield: 30, stability: 30, eco: 30 },
  }
}
// Secret formulas sell for more.
assert.ok(salePrice(s, { ...lot('q'), secret: 'premiumGas' }) > salePrice(s, lot('q')))
let m: GameState = { ...s, rank: 3, tanks: [lot('a'), lot('b')] }
const before = salePrice(m, lot('a'))
m = sellTo(m, 'gas0')
assert.equal(demandOf(m, 'gasoline'), 1 - DEMAND.perSale)
assert.ok(salePrice(m, lot('b')) < before)
m = marketSystem({ ...m, tick: B.ticksPerWeek * 10 })
// Before rank 3 the market never tires.
assert.equal(demandOf(sellTo({ ...s, rank: 2, tanks: [lot('c')] }, 'gas0'), 'gasoline'), 1)
assert.equal(demandOf(m, 'gasoline'), 1)
// A monthly trend heats one product.
const t = marketSystem({ ...s, tick: MONTH })
assert.ok(t.trend.base && demandFactor(t, t.trend.base) === DEMAND.trendBoost)

// Rivals keep pace: year-10 rivals score far above year-1 rivals.
const rivalTop = (year: number) => {
  const a = awards({ ...s, tick: YEAR * year - B.ticksPerWeek })
  return Math.max(...a.history.awards.at(-1)!.rivals.map(x => x.product))
}
assert.ok(rivalTop(10) > rivalTop(1) * 10)

console.log(
  'M12 catalyst research / formula mixing / formula lots / contract grades / legacy saves / demand / trend / rivals passed',
)
