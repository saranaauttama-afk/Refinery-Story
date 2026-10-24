// Rewarded-ad rewards: each one works, its limit holds, and limits run on game time.
import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { canPlace, place } from '../../src/v4/sim/systems/yard'
import { startCatalyst, researchSystem, labs } from '../../src/v4/sim/systems/research'
import { sellTo } from '../../src/v4/sim/systems/customers'
import {
  adAvailable,
  adFinishResearch,
  adDoubleResearch,
  adSkipStorm,
  adSellBoost,
  adHint,
  emptyRewards,
} from '../../src/v4/sim/systems/rewards'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { REWARD_ADS as R, MONTH, YEAR } from '../../src/v4/data/balance'
import type { GameState, Lot } from '../../src/v4/sim/types'

const lot = (): Lot => ({
  uid: 'x',
  grade: 'B',
  base: 'gasoline',
  formula: null,
  secret: null,
  score: 150,
  stats: { purity: 30, yield: 30, stability: 30, eco: 30 },
  units: 300,
})
let s: GameState = {
  ...buildStarter(createNewGame(3)),
  money: 1e6,
  rd: 1e5,
  rank: 2,
  opened: true,
  unlockedAdditives: ['octane', 'dye', 'detergent'],
}
let at = { x: 0, y: 0 }
outer: for (let y = 0; y < s.yard.size; y++)
  for (let x = 0; x < s.yard.size; x++)
    if (canPlace(s, 'lab', x, y)) {
      at = { x, y }
      break outer
    }
s = place(s, 'lab', at.x, at.y)
const lab = labs(s)[0].uid
const units = (g: GameState) => g.formulaLab.stock.reduce((n, c) => n + c.units, 0)

// Finish now: only while a catalyst research runs; three per game year, fresh next year.
assert.ok(!adAvailable(s, 'finish', lab), 'nothing to finish without a job')
assert.equal(adFinishResearch(s, lab), s)
let r = startCatalyst(s, lab)
assert.ok(adAvailable(r, 'finish', lab))
for (let i = 0; i < R.finishPerYear; i++) {
  if (!r.research.length) r = startCatalyst(r, lab)
  r = adFinishResearch(r, lab)
  assert.equal(r.research[0].endTick, r.tick)
  r = researchSystem(r)
  assert.equal(r.research.length, 0)
}
r = startCatalyst(r, lab)
assert.ok(!adAvailable(r, 'finish', lab), 'limit per year holds')
assert.equal(adFinishResearch(r, lab), r)
r = startCatalyst({ ...r, research: [], tick: r.tick + YEAR }, lab)
r = adFinishResearch(r, lab)
assert.equal(r.research[0].endTick, r.tick, 'a new game year resets the limit')

// Double: once per research, gives exactly double the units of the same roll.
const plain = researchSystem({ ...startCatalyst(s, lab), tick: s.tick + 10_000 })
let d = startCatalyst(s, lab)
d = adDoubleResearch(d, lab)
assert.ok(!adAvailable(d, 'double', lab), 'once per research')
assert.equal(adDoubleResearch(d, lab), d)
d = researchSystem({ ...d, tick: s.tick + 10_000 })
assert.equal(units(d), units(plain) * R.doubleCatalyst)

// Storm: only during a storm, and a cleared storm cannot be skipped again.
assert.ok(!adAvailable(s, 'storm'))
let storm = { ...s, stormUntil: s.tick + 200 }
assert.ok(adAvailable(storm, 'storm'))
storm = adSkipStorm(storm)
assert.ok(storm.tick >= storm.stormUntil && !adAvailable(storm, 'storm'))

// Next truck x2: once per game month, consumed by the next sale only.
const stocked = { ...s, tanks: [lot()] }
const normal = sellTo(stocked, 'gas0').money - stocked.money
let b = adSellBoost(stocked)
assert.ok(b.rewards.boostArmed && !adAvailable(b, 'boost'))
const boosted = sellTo(b, 'gas0')
assert.equal(boosted.money - b.money, normal * R.sellMultiplier)
assert.ok(!boosted.rewards.boostArmed, 'consumed by one sale')
const again = sellTo({ ...boosted, tanks: [lot()] }, 'gas0')
assert.equal(again.money - boosted.money, normal)
assert.ok(
  !adAvailable({ ...boosted, tick: boosted.tick + 1 }, 'boost'),
  'same month: no second claim',
)
assert.ok(adAvailable({ ...boosted, tick: boosted.tick + MONTH }, 'boost'), 'next month: allowed')

// Hint: one per game year, a hint nobody has found yet, no duplicates.
const h = adHint(s)
assert.equal(h.formulaLab.hints.length, s.formulaLab.hints.length + 1)
assert.ok(!adAvailable(h, 'hint'), 'one per year')
assert.equal(adHint(h), h)
assert.ok(adAvailable({ ...h, tick: h.tick + YEAR }, 'hint'))

// Same inputs, same result (no clock, no random), and the counters survive a save.
assert.deepEqual(adHint(s), adHint(s))
const back = deserialize(serialize(adSellBoost(adHint(s))))
assert.equal(back.rewards.hintCount, 1)
assert.ok(back.rewards.boostArmed)
const old = JSON.parse(serialize(s))
delete old.rewards
assert.deepEqual(deserialize(JSON.stringify(old)).rewards, emptyRewards(), 'old saves load')
console.log('rewards ok')
