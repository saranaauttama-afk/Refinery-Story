import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { canPlace, place } from '../../src/v4/sim/systems/yard'
import { selectBlend, recipeOf, blendStations } from '../../src/v4/sim/systems/blending'
import { arrivalInterval } from '../../src/v4/sim/systems/customers'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { tick } from '../../src/v4/sim/tick'
import type { GameState, Lot } from '../../src/v4/sim/types'

// A second blend station can run its own recipe.
let s: GameState = { ...buildStarter(createNewGame(7)), money: 1e6, opened: true }
const spot = (() => {
  for (let y = 0; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, 'blend', x, y)) return { x, y }
  throw new Error('no room')
})()
s = place(s, 'blend', spot.x, spot.y)
const [one, two] = blendStations(s)
assert.ok(one && two, 'two stations')
assert.deepEqual(recipeOf(s, two), s.blend, 'new station starts on the current recipe')
s = selectBlend(s, 'gasoline', null, one.uid)
s = selectBlend(s, 'diesel', null, two.uid)
assert.equal(recipeOf(s, blendStations(s)[0]).base, 'gasoline')
assert.equal(recipeOf(s, blendStations(s)[1]).base, 'diesel')
let made = new Set<string>()
for (let i = 0; i < 2000 && made.size < 2; i++) {
  s = tick(s)
  for (const l of s.tanks) made.add(l.base)
}
assert.ok(made.has('gasoline') && made.has('diesel'), 'both product lines run at once')

// Picking without a station changes every station.
const all = selectBlend(s, 'diesel', null)
assert.ok(blendStations(all).every(b => recipeOf(all, b).base === 'diesel'))

// Old saves without per-station recipes fall back to the shared recipe.
const legacy = JSON.parse(serialize(s))
for (const b of legacy.yard.buildings) delete b.recipe
const loaded = deserialize(JSON.stringify(legacy))
assert.ok(blendStations(loaded).every(b => recipeOf(loaded, b) === loaded.blend))

// Selling two kinds of product brings buyers more often.
const lot = (uid: string, base: Lot['base']): Lot => ({
  uid,
  base,
  formula: null,
  secret: null,
  grade: 'B',
  score: 150,
  units: 300,
  stats: { purity: 30, yield: 30, stability: 30, eco: 30 },
})
const single = { ...s, tanks: [lot('a', 'gasoline')] }
const double = { ...s, tanks: [lot('a', 'gasoline'), lot('b', 'diesel')] }
assert.ok(arrivalInterval(double) < arrivalInterval(single))

// Plain stations make plain-grade lots.
assert.ok(s.tanks.every(l => l.grade === 'C' && l.formula === null))

console.log(
  'M10 per-station recipes / both lines / legacy save / product-line buyers / plain grade passed',
)
