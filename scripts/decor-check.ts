import assert from 'node:assert/strict'

import { V3_LAND_PARCELS } from '../src/game/v3/data'
import { boostV3Reputation, getV3Appeal, listV3Decorations } from '../src/game/v3/decor'
import { V3_APPEAL_MAX_BONUS, V3_DECOR, V3_DECOR_CAP, V3_DECOR_KINDS } from '../src/game/v3/decorData'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'
import { getV3Occupancy, validateV3Placement } from '../src/game/v3/yard'
import { act, assertBlocked, attempt } from './v3-check-helpers'

function at(chapter: 0 | 1 | 2 | 3 | 4 | 5, moneyCents = 100_000_000): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter }, world: { ...base.world, moneyCents } }
}

// ---- Catalog: 15 cheap items, each unlocked by chapter ----
assert.equal(V3_DECOR_KINDS.length, 15)
for (const kind of V3_DECOR_KINDS) {
  const spec = V3_DECOR[kind]
  assert.ok(spec.costDollars <= 800, `${kind} stays cheap`)
  assert.ok(spec.w * spec.h <= 4, `${kind} is small (≤ 2×2)`)
}

// ---- Place / remove: charges, full refund, capex reversed ----
let state = at(0)
const cash = state.world.moneyCents
state = act(state, { type: 'place_decoration', kind: 'tree', x: 40, y: 40, rotated: false })
assert.equal(cash - state.world.moneyCents, V3_DECOR.tree.costDollars * 100)
const tree = listV3Decorations(state)[0]
assert.equal(tree.kind, 'tree')
state = act(state, { type: 'remove_decoration', decorationId: tree.id })
assert.equal(state.world.moneyCents, cash, 'removing refunds in full')
assert.equal(state.operatingLedger.capexCents, 0, 'capex reversed on removal')
assertBlocked(state, { type: 'remove_decoration', decorationId: tree.id }, 'v3.decor.missing')

// ---- Unlocks: chapter gate and Expo-win statue ----
assertBlocked(at(0), { type: 'place_decoration', kind: 'bench', x: 40, y: 40, rotated: false }, 'v3.decor.locked')
assertBlocked(at(1), { type: 'place_decoration', kind: 'busStop', x: 40, y: 40, rotated: false }, 'v3.decor.locked')
act(at(2), { type: 'place_decoration', kind: 'busStop', x: 40, y: 40, rotated: false })
assertBlocked(at(4), { type: 'place_decoration', kind: 'awardStatue', x: 40, y: 40, rotated: false }, 'v3.decor.expo_required')
const winner = at(4)
act({ ...winner, expoResults: [{ year: 1, blueprintId: 'x', family: 'gasoline', quality: 80, score: 90, rank: 1, rivalScores: [], cashCents: 0, reputation: 10 }] } as V3GameState,
  { type: 'place_decoration', kind: 'awardStatue', x: 40, y: 40, rotated: false })

// ---- Shared grid: decor and buildings block each other; rotation; land; cash ----
let grid = at(2)
grid = act(grid, { type: 'place_decoration', kind: 'busStop', x: 40, y: 40, rotated: true })
const stop = listV3Decorations(grid)[0]
assert.equal(getV3Occupancy(grid).get('40,41'), stop.id, 'rotated 2×1 covers 1×2')
assert.equal(getV3Occupancy(grid).get('41,40'), undefined)
assertBlocked(grid, { type: 'place_decoration', kind: 'tree', x: 40, y: 41, rotated: false }, 'v3.place.overlap')
assertBlocked(grid, { type: 'build', x: 39, y: 39, building: 'crudeTank' }, 'v3.place.overlap')
assert.equal(validateV3Placement(grid, 'crudeTank', 1, 42, 40), null, 'free cells still buildable')
assertBlocked(grid, { type: 'place_decoration', kind: 'tree', x: 47, y: 47, rotated: false }, 'v3.place.overlap')
assertBlocked(grid, { type: 'place_decoration', kind: 'tree', x: 37, y: 40, rotated: false }, 'v3.place.locked_land')
assertBlocked(grid, { type: 'place_decoration', kind: 'tree', x: 40.5, y: 40, rotated: false }, 'v3.place.out_of_bounds')
assertBlocked(at(3, 500), { type: 'place_decoration', kind: 'fountain', x: 44, y: 55, rotated: false }, 'v3.build.insufficient_cash')

// ---- Cap: 150 decorations; spam gives diminishing appeal ----
let full = at(3)
const core = V3_LAND_PARCELS.find((parcel) => parcel.id === 'core')!
for (let y = core.y; y < core.y + core.h && listV3Decorations(full).length < V3_DECOR_CAP; y++) {
  for (let x = core.x; x < core.x + core.w && listV3Decorations(full).length < V3_DECOR_CAP; x++) {
    const result = attempt(full, { type: 'place_decoration', kind: 'tree', x, y, rotated: false })
    if (result.events[0]?.tone === 'success') full = result.state
  }
}
assert.equal(listV3Decorations(full).length, V3_DECOR_CAP)
assertBlocked(full, { type: 'place_decoration', kind: 'fence', x: 60, y: 61, rotated: false }, 'v3.decor.cap')
const spam = getV3Appeal(full)
assert.ok(spam.points < V3_DECOR.tree.appeal / (1 - 0.85) + 1e-9, '150 trees are worth less than ~7 first trees')
assert.ok(spam.bonus > 0 && spam.bonus < V3_APPEAL_MAX_BONUS)

let varied = at(3)
let vx = 40
for (const kind of ['tree', 'streetLamp', 'shrub', 'bench', 'flowerBed', 'flagPole', 'trashBin', 'fence'] as const) {
  varied = act(varied, { type: 'place_decoration', kind, x: vx, y: 40, rotated: false })
  vx += 1
}
assert.ok(getV3Appeal(varied).points / 8 > spam.points / V3_DECOR_CAP, 'variety beats spam per item')
assert.equal(getV3Appeal(at(0)).bonus, 0, 'no decorations, no bonus')

// ---- Appeal boosts reputation gains only, never above +10% ----
assert.equal(boostV3Reputation(at(0), 10), 10)
const boosted = boostV3Reputation(full, 10)
assert.ok(boosted > 10 && boosted <= 10 * (1 + V3_APPEAL_MAX_BONUS))
assert.equal(boostV3Reputation(full, 0), 0)

// ---- Saves: round trip, older saves without decorations, tampering ----
const saved = parseV3GameState(JSON.parse(JSON.stringify(grid)))
assert.equal(saved.status, 'loaded')
assert.deepEqual(saved.status === 'loaded' && saved.state.world.decorations, grid.world.decorations)
const older = JSON.parse(JSON.stringify(at(0)))
delete older.world.decorations
const olderLoaded = parseV3GameState(older)
assert.equal(olderLoaded.status, 'loaded', 'saves from before decorations still load')
assert.deepEqual(olderLoaded.status === 'loaded' && olderLoaded.state.world.decorations, {})
const overlapping = JSON.parse(JSON.stringify(grid))
overlapping.world.decorations[stop.id].x = 47
overlapping.world.decorations[stop.id].y = 47
assert.equal(parseV3GameState(overlapping).status, 'invalid', 'decoration on a building is rejected')
const unknown = JSON.parse(JSON.stringify(grid))
unknown.world.decorations[stop.id].kind = 'castle'
assert.equal(parseV3GameState(unknown).status, 'invalid', 'unknown decoration kind is rejected')

// ---- Performance budget: full 48×48 yard + 150 decorations stays cheap to query ----
const big = { ...full, world: { ...full.world, unlockedParcelIds: V3_LAND_PARCELS.map((parcel) => parcel.id) } }
const started = performance.now()
for (let index = 0; index < 200; index++) getV3Occupancy(big)
const perCall = (performance.now() - started) / 200
assert.ok(perCall < 2, `occupancy for a full yard takes ${perCall.toFixed(3)} ms (budget 2 ms)`)

console.log(`PASS: decorations — 15 items, chapter/Expo unlocks, shared grid with buildings, rotation, full refund, 150 cap, diminishing appeal (spam ${spam.points.toFixed(1)} pts → +${(spam.bonus * 100).toFixed(1)}% fame gain, max ${V3_APPEAL_MAX_BONUS * 100}%), save round trip/defaults/tamper, occupancy ${perCall.toFixed(3)} ms on a full yard`)
