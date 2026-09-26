import assert from 'node:assert/strict'

import { V3_AWARD_PERIOD_TICKS } from '../src/game/v3/awards'
import { V3_RIVALS, getV3IndustryScore, getV3PlayerRank, getV3Rankings, getV3RivalScore } from '../src/game/v3/rivals'
import { runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'

// ---- Rivals are deterministic and monotonic ----
for (const rival of V3_RIVALS) {
  let last = -1
  for (let month = 0; month <= 480; month += 12) {
    const score = getV3RivalScore(rival, month * 300)
    assert.equal(score, getV3RivalScore(rival, month * 300))
    assert.ok(score >= last, `${rival.id} never shrinks`)
    last = score
  }
}

// ---- Player score comes only from real progress data; fresh start is last ----
const fresh = createInitialV3GameState()
const freshScore = getV3IndustryScore(fresh)
assert.equal(freshScore.fame + freshScore.business + freshScore.recipes, 0, 'no fame/business/recipes at start')
assert.equal(freshScore.total, freshScore.factory, 'only the starter factory counts')
assert.equal(getV3PlayerRank(fresh), 5)
// Enough fame to pass Titan's opening score takes #1 (calibrated rivals start high).
const strong: V3GameState = { ...fresh, world: { ...fresh.world, reputation: Math.ceil(getV3RivalScore(V3_RIVALS[3], V3_AWARD_PERIOD_TICKS) / 10) + 10 } }
assert.equal(getV3PlayerRank(strong), 1, 'overtaking Titan takes #1')
const tie: V3GameState = { ...fresh, world: { ...fresh.world, reputation: V3_RIVALS[0].base / 10 } }
assert.ok(getV3Rankings(tie).findIndex((entry) => entry.player) > getV3Rankings(tie).findIndex((entry) => entry.id === V3_RIVALS[0].id), 'ties go to the rival')

// ---- Year-end: first time reaching #3/#2/#1 pays reputation once ----
let year: V3GameState = { ...strong, world: { ...strong.world, tickCount: V3_AWARD_PERIOD_TICKS - 25 } }
year = runV3ProductionTick(year, 25).state
assert.ok(['rank:1', 'rank:2', 'rank:3'].every((flag) => year.campaignProgress.claimedFlags.includes(flag)))
assert.equal(year.world.reputation, strong.world.reputation + 3 + 5 + 10, 'grade "-" gives 0; ranks 3+5+10')
year = { ...year, world: { ...year.world, tickCount: 2 * V3_AWARD_PERIOD_TICKS - 25 } }
const before = year.world.reputation
year = runV3ProductionTick(year, 25).state
assert.equal(year.world.reputation, before, 'rank rewards are one-time')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(year))).status, 'loaded')

console.log('PASS: V3-21c rivals — deterministic monotonic rivals, data-only player score, tie rule, one-time year-end rank rewards')
