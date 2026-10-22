import assert from 'node:assert/strict'
import { B, PRODUCTION, FORMULA_LAB } from '../../src/v4/data/balance'
import { scoreLot, blending } from '../../src/v4/sim/systems/blending'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { tick } from '../../src/v4/sim/tick'
import { compatibility } from '../../src/v4/data/compatibility'
import { bases } from '../../src/v4/data/bases'
import { additives } from '../../src/v4/data/additives'
const stats = { purity: 25, yield: 25, stability: 25, eco: 25 }
// Award score grows with grade, familiarity and combo quality.
const scores = (['D', 'C', 'B', 'A', 'S', 'SS'] as const).map(g => scoreLot(stats, g, 1, 0.04))
for (let i = 1; i < scores.length; i++) assert.ok(scores[i] > scores[i - 1])
assert.ok(Math.abs(scores[1] - 100 * FORMULA_LAB.gradeScore.C * 1.03 * 1.04) < 1e-6)
for (const b of bases) {
  assert.equal(Object.keys(compatibility[b.id]).length, 20)
  for (const a of additives) assert.ok('SABCDF'.includes(compatibility[b.id][a.id]))
}
let s = buildStarter(createNewGame())
// The guided first layout costs $50k and leaves a little slack.
assert.equal(s.money, B.startingMoney - 50000)
const initialFame = s.fame
for (let i = 0; i < 360 && !s.tanks.length; i++) s = tick(s)
assert.ok(s.tanks.length > 0)
assert.ok(s.tick <= 360)
assert.equal(s.tanks[0].grade, FORMULA_LAB.plainGrade)
assert.equal(s.fame, initialFame + 10)
const original = s
for (let i = 0; i < 100; i++)
  s = blending({
    ...s,
    tick: PRODUCTION.cycle,
    tanks: [],
    baseStock: { ...s.baseStock, gasoline: 300 },
  })
assert.equal(s.fame, initialFame + 10)
assert.equal(s.familiarity.gasoline, 10)
assert.equal(original.tanks.length, 1)
console.log('M3 compat matrix / grade score / first plain lot / familiarity / first try passed')
