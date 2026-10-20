import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { canPlace, place } from '../../src/v4/sim/systems/yard'
import { selectBlend } from '../../src/v4/sim/systems/blending'
import {
  startResearch,
  researchBlock,
  researchCost,
  researchSystem,
  recipeKnown,
  labs,
  researchWeights,
} from '../../src/v4/sim/systems/research'
import { demandOf, marketSystem, demandFactor } from '../../src/v4/sim/systems/market'
import { sellTo, salePrice } from '../../src/v4/sim/systems/customers'
import { awards } from '../../src/v4/sim/systems/awards'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { B, MONTH, YEAR, DEMAND, RESEARCH } from '../../src/v4/data/balance'
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
// Unknown pairs cannot be mixed; no-additive always can.
assert.equal(selectBlend(s, 'gasoline', 'octane'), s)
assert.notEqual(selectBlend(s, 'diesel', null), s)
assert.ok(recipeKnown(s, 'gasoline', null))

// Research needs a lab, RD and money.
const at = spot(s, 'lab')
s = place(s, 'lab', at.x, at.y)
const lab = labs(s)[0]
assert.equal(researchBlock(s, lab.uid, 'gasoline'), 'rd')
s = { ...s, rd: 10000 }
const cost = researchCost(s, 'gasoline')
const started = startResearch(s, lab.uid, 'gasoline')
assert.equal(started.rd, s.rd - cost.rd)
assert.equal(researchBlock(started, lab.uid, 'gasoline'), 'busy')

// Run research until something is found; every failure leaves a clue.
let r = started
let found = 0
for (let i = 0; i < 40 && !found; i++) {
  if (!r.research.length) r = startResearch(r, lab.uid, 'gasoline')
  r = researchSystem({ ...r, tick: r.research[0].endTick })
  found = r.knownRecipes.length
  if (!found) assert.ok((r.clues.gasoline ?? 0) > 0)
}
assert.equal(found, 1, 'research finds a recipe')
const [base, add] = r.knownRecipes[0].split(':')
assert.notEqual(selectBlend(r, base as never, add as never), r, 'found pair can be mixed')
assert.ok(researchCost(r, 'gasoline').rd > cost.rd, 'next project on the same base costs more')
// Better labs find better pairs.
assert.ok(researchWeights(5)[3] > researchWeights(1)[3])
assert.equal(
  RESEARCH.weightsLv1.reduce((a, b) => a + b),
  100,
)

// Old saves keep the pairs they already tried.
const legacy = JSON.parse(serialize({ ...s, triedPairs: ['gasoline:octane', 'diesel:none'] }))
delete legacy.knownRecipes
delete legacy.research
delete legacy.demand
delete legacy.trend
delete legacy.clues
const loaded = deserialize(JSON.stringify(legacy))
assert.deepEqual(loaded.knownRecipes, ['gasoline:octane'])

// Demand cools with each truck and recovers weekly; it moves the price.
const lot = (uid: string): Lot => ({
  uid,
  base: 'gasoline',
  additive: null,
  grade: 'B',
  score: 150,
  units: 300,
  stats: { purity: 30, yield: 30, stability: 30, eco: 30 },
})
let m: GameState = { ...s, tanks: [lot('a'), lot('b')] }
const before = salePrice(m, lot('a'))
m = sellTo(m, 'gas0')
assert.equal(demandOf(m, 'gasoline'), 1 - DEMAND.perSale)
assert.ok(salePrice(m, lot('b')) < before)
m = marketSystem({ ...m, tick: B.ticksPerWeek * 10 })
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

console.log('M12 lab research / clues / legacy recipes / demand / trend / rivals passed')
