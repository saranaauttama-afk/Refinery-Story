import assert from 'node:assert/strict'
import { FORMULA_LAB as F } from '../../src/v4/data/balance'
import { pairCompat } from '../../src/v4/data/compatibility'
import { additives } from '../../src/v4/data/additives'
import { secretFormulas, synergies, synergyKey } from '../../src/v4/data/formulaLab'
import {
  emptyFormulaLab,
  catalystWeights,
  rollCatalyst,
  mixFormula,
  mixOdds,
  produceLot,
  gradeIndex,
  type LabSlice,
} from '../../src/v4/sim/systems/formulaLab'

const ids = new Set(additives.map(a => a.id))
// Content sanity: synergy pairs unique and valid; every secret uses compatible catalysts.
assert.equal(new Set(synergies.map(x => synergyKey(x.a, x.b))).size, synergies.length)
for (const x of synergies) assert.ok(ids.has(x.a) && ids.has(x.b) && x.a !== x.b)
for (const sf of secretFormulas) {
  assert.ok(sf.catalysts.length <= F.mix.maxCatalysts)
  for (const a of sf.catalysts) assert.ok('SAB'.includes(pairCompat(sf.base, a)), `${sf.id} ${a}`)
}
// Year gates catalyst grade; level raises odds.
assert.deepEqual(catalystWeights(5, 0, 1).slice(3), [0, 0, 0])
assert.equal(catalystWeights(5, 0, 8)[5], 0)
assert.ok(catalystWeights(5, 0, 9)[5] > 0)
assert.ok(catalystWeights(3, 0, 8)[4] < catalystWeights(4, 0, 8)[4])

const withStock = (stock: LabSlice['stock']): LabSlice => ({
  ...{ ...emptyFormulaLab(), rng: 7 },
  stock,
})
// Year 1 has one slot.
let st = withStock([
  { additive: 'octane', grade: 'C', units: 4 },
  { additive: 'detergent', grade: 'C', units: 4 },
])
assert.equal(
  mixFormula(st, {
    base: 'gasoline',
    picks: [
      { additive: 'octane', grade: 'C' },
      { additive: 'detergent', grade: 'C' },
    ],
    year: 1,
    level: 1,
  }).block,
  'slots',
)
// The cap: a C catalyst can reach at most C, whatever the lab level.
for (let seed = 1; seed < 200; seed++) {
  const r = mixFormula(
    { ...st, rng: seed },
    { base: 'gasoline', picks: [{ additive: 'octane', grade: 'C' }], year: 1, level: 5 },
  )
  assert.ok(r.formula && gradeIndex(r.formula.grade) <= gradeIndex('C'))
}
// Never worse: re-mixing keeps the better grade, and spends stock.
st = withStock([{ additive: 'octane', grade: 'D', units: 10 }])
st = {
  ...st,
  formulas: [
    { key: 'gasoline:octane', base: 'gasoline', catalysts: ['octane'], grade: 'A', secret: null },
  ],
}
const again = mixFormula(st, {
  base: 'gasoline',
  from: 'gasoline:octane',
  picks: [{ additive: 'octane', grade: 'D' }],
  year: 3,
  level: 1,
})
assert.equal(again.formula!.grade, 'A')
assert.equal(again.state.stock[0].units, 10 - F.mix.unitsPerSlot)
// Synergy shows in the odds and is learned after mixing.
st = withStock([
  { additive: 'octane', grade: 'B', units: 4 },
  { additive: 'detergent', grade: 'B', units: 4 },
  { additive: 'cetane', grade: 'B', units: 4 },
])
const good = mixOdds(st, {
  base: 'gasoline',
  picks: [
    { additive: 'octane', grade: 'B' },
    { additive: 'detergent', grade: 'B' },
  ],
  year: 3,
  level: 1,
})
const bad = mixOdds(st, {
  base: 'gasoline',
  picks: [
    { additive: 'octane', grade: 'B' },
    { additive: 'cetane', grade: 'B' },
  ],
  year: 3,
  level: 1,
})
assert.ok(good.center > bad.center)
const learned = mixFormula(st, {
  base: 'gasoline',
  picks: [
    { additive: 'octane', grade: 'B' },
    { additive: 'detergent', grade: 'B' },
  ],
  year: 3,
  level: 1,
})
assert.ok(learned.state.knownSynergies.includes('detergent+octane'))
// Secret formula is named and lifts the grade; S catalysts still cap at S.
st = withStock([
  { additive: 'octane', grade: 'S', units: 4 },
  { additive: 'cleanburn', grade: 'S', units: 4 },
])
const secret = mixOdds(st, {
  base: 'gasoline',
  picks: [
    { additive: 'octane', grade: 'S' },
    { additive: 'cleanburn', grade: 'S' },
  ],
  year: 8,
  level: 5,
})
assert.equal(secret.secret?.id, 'premiumGas')
assert.equal(secret.cap, gradeIndex('S') + F.mix.secretCap)
assert.ok(
  secret.center >
    mixOdds(st, {
      base: 'diesel',
      picks: [
        { additive: 'octane', grade: 'S' },
        { additive: 'cleanburn', grade: 'S' },
      ],
      year: 8,
      level: 5,
    }).center,
)
// Pity: after enough flat mixes the centre rises by one.
const flat = mixOdds(
  { ...st, pity: F.mix.pityAfter },
  { base: 'gasoline', picks: [{ additive: 'octane', grade: 'S' }], year: 8, level: 1 },
)
const plain = mixOdds(st, {
  base: 'gasoline',
  picks: [{ additive: 'octane', grade: 'S' }],
  year: 8,
  level: 1,
})
assert.equal(flat.center - plain.center, 1)
// Production uses one catalyst unit per lotsPerUnit lots, lowest grade first, then falls back.
st = {
  ...withStock([
    { additive: 'octane', grade: 'A', units: 1 },
    { additive: 'octane', grade: 'D', units: 1 },
  ]),
  formulas: [
    { key: 'gasoline:octane', base: 'gasoline', catalysts: ['octane'], grade: 'S', secret: null },
  ],
}
const grades: string[] = []
for (let i = 0; i < F.production.lotsPerUnit * 3; i++) {
  const r = produceLot(st, 'gasoline:octane')
  st = r.state
  grades.push(r.grade)
  if (i === F.production.lotsPerUnit - 1)
    assert.deepEqual(
      st.stock.map(x => x.grade),
      ['A'],
    )
}
assert.equal(grades.filter(g => g === 'S').length, F.production.lotsPerUnit * 3 - 1)
assert.equal(grades.at(-1), F.plainGrade)
// Research adds stock deterministically from the seed.
const a = rollCatalyst(
  { ...emptyFormulaLab(), rng: 3 },
  { pool: ['octane', 'dye'], level: 2, chem: 0, year: 2 },
)
const b = rollCatalyst(
  { ...emptyFormulaLab(), rng: 3 },
  { pool: ['octane', 'dye'], level: 2, chem: 0, year: 2 },
)
assert.deepEqual(a.lot, b.lot)
assert.equal(a.state.stock[0].units, F.catalyst.unitsBase + F.catalyst.unitsPerLevel)
console.log(
  'Formula Lab: content / year gates / cap / never-worse / synergy / secret / pity / production passed',
)
