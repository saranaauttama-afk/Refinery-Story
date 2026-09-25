import assert from 'node:assert/strict'

import { reduceV3Action, validateV3Trade } from '../src/game/v3/actions'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import {
  loadV3GameState,
  saveV3GameState,
  V3_STORAGE_KEY,
  type V3StorageAdapter,
} from '../src/game/v3/storage'

class MemoryStorage implements V3StorageAdapter {
  values = new Map<string, string>()
  writes: string[] = []

  async getItem(key: string) { return this.values.get(key) ?? null }
  async setItem(key: string, value: string) {
    this.writes.push(key)
    this.values.set(key, value)
  }
  async removeItem(key: string) { this.values.delete(key) }
}

async function main() {
const first = createInitialV3GameState()
const second = createInitialV3GameState()
assert.deepEqual(first, second, 'fresh V3 state must be deterministic')
assert.deepEqual(first.world.grid.slice(3, 6), ['crudeTank', 'distillationUnit', 'gasolineTank'])
assert.equal(first.world.moneyCents, 60_000)
assert.equal(first.world.crudeOil, 18)
assert.equal(first.world.employees.length, 1)
assert.deepEqual(first.employeeDuties[first.world.employees[0].id], { kind: 'line', cellIndex: 4 })
for (const blueprintId of Object.values(V3_DEFAULT_BLUEPRINT_ID)) {
  const blueprint = first.productBlueprints[blueprintId]
  assert.ok(blueprint)
  assert.equal(blueprint.quality, 40)
  assert.equal(blueprint.provenance, 'default')
}

const storage = new MemoryStorage()
const noSave = await loadV3GameState(storage)
assert.equal(noSave.status, 'new')
assert.ok(noSave.state)
assert.equal(await saveV3GameState(noSave.state!, storage), true)
assert.deepEqual(storage.writes, [V3_STORAGE_KEY], 'V3 persistence must write only its own key')
assert.equal(storage.values.has('refinery-story-save'), false, 'V3 must not touch the legacy save key')

const reloaded = await loadV3GameState(storage)
assert.equal(reloaded.status, 'loaded')
assert.deepEqual(reloaded.state, noSave.state, 'V3 state must survive an exact JSON round trip')

const unsupportedStorage = new MemoryStorage()
unsupportedStorage.values.set(V3_STORAGE_KEY, JSON.stringify({ ...first, rulesetVersion: 99 }))
const unsupported = await loadV3GameState(unsupportedStorage)
assert.equal(unsupported.status, 'unsupported')
assert.equal(unsupported.state, null)
assert.equal(unsupportedStorage.writes.length, 0, 'unsupported saves must never be overwritten during load')

const invalidStorage = new MemoryStorage()
invalidStorage.values.set(V3_STORAGE_KEY, '{broken')
const invalid = await loadV3GameState(invalidStorage)
assert.equal(invalid.status, 'invalid')
assert.equal(invalidStorage.writes.length, 0, 'invalid saves must never be overwritten during load')

const corruptCurrentStorage = new MemoryStorage()
corruptCurrentStorage.values.set(V3_STORAGE_KEY, JSON.stringify({
  ...first,
  campaignProgress: { ...first.campaignProgress, chapter: 99 },
}))
const corruptCurrent = await loadV3GameState(corruptCurrentStorage)
assert.equal(corruptCurrent.status, 'invalid')
assert.equal(corruptCurrentStorage.writes.length, 0)

const build = reduceV3Action(first, {
  type: 'build',
  sequence: first.nextActionSequence,
  cellIndex: 0,
  building: 'gasolineTank',
})
assert.equal(build.actionId, 'action:build:00000001')
assert.equal(build.state.world.grid[0], 'gasolineTank')
assert.equal(build.state.world.moneyCents, 45_000)
assert.equal(build.state.operatingLedger.capexCents, 15_000)
assert.equal(build.state.nextActionSequence, 2)

const duplicate = reduceV3Action(build.state, {
  type: 'build',
  sequence: 1,
  cellIndex: 1,
  building: 'gasolineTank',
})
assert.equal(duplicate.changed, false)
assert.equal(duplicate.state, build.state)
assert.equal(duplicate.events[0].messageId, 'v3.action.sequence_mismatch')

const funded = {
  ...build.state,
  world: { ...build.state.world, moneyCents: 1_000_000 },
  campaignProgress: { ...build.state.campaignProgress, chapter: 2 as const },
}
const upgrade = reduceV3Action(funded, {
  type: 'upgrade',
  sequence: funded.nextActionSequence,
  cellIndex: 4,
})
assert.equal(upgrade.actionId, 'action:upgrade:00000002')
assert.equal(upgrade.state.world.gridLevels[4], 2)
assert.equal(upgrade.state.world.moneyCents, 800_000)
assert.equal(upgrade.state.operatingLedger.capexCents, 215_000)

assert.equal(validateV3Trade(first, {
  type: 'trade', sequence: 1, direction: 'buy', product: 'crude', quantity: 1.5,
})?.messageId, 'v3.trade.invalid_amount')
const tradeBoundary = reduceV3Action(first, {
  type: 'trade', sequence: 1, direction: 'buy', product: 'crude', quantity: 5,
})
assert.equal(tradeBoundary.events[0].messageId, 'v3.action.ok')
assert.equal(tradeBoundary.state.world.crudeOil, first.world.crudeOil + 5)
assert.equal(tradeBoundary.state.world.moneyCents, first.world.moneyCents - 5_000)
assert.equal(tradeBoundary.state.operatingLedger.lifetimeCashOutflowsCents, 5_000)

console.log('PASS: V3-03 fresh schema, deterministic actions, isolated persistence, and safe version handling')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
