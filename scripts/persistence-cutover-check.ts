import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { runV3ProductionTick } from '../src/game/v3/production'
import { V3_TICK_MS, stepV3Clock } from '../src/game/v3/realtime'
import { onV3ResetRequested, requestV3Reset } from '../src/game/v3/session'
import { V3_STARTER_BUILDINGS, createInitialV3GameState } from '../src/game/v3/state'
import {
  V3_STORAGE_KEY,
  clearV3GameState,
  loadV3GameState,
  saveV3GameState,
  type V3StorageAdapter,
} from '../src/game/v3/storage'
import { act, legalChapterTwo } from './v3-check-helpers'

function memory(initial: Record<string, string> = {}): V3StorageAdapter & { data: Record<string, string>; writes: number } {
  const data = { ...initial }
  const adapter = {
    data,
    writes: 0,
    async getItem(key: string) { return key in data ? data[key] : null },
    async setItem(key: string, value: string) { adapter.writes += 1; data[key] = value },
    async removeItem(key: string) { delete data[key] },
  }
  return adapter
}

async function main() {
  // ---- Fresh / reload / reset round-trips are exact ----
  const store = memory()
  const fresh = await loadV3GameState(store)
  assert.equal(fresh.status, 'new')
  assert.deepEqual(fresh.state, createInitialV3GameState())
  let state = legalChapterTwo()
  for (let index = 0; index < 8; index++) state = runV3ProductionTick(state, 25).state
  assert.equal(await saveV3GameState(state, store), true)
  const reloaded = await loadV3GameState(store)
  assert.equal(reloaded.status, 'loaded')
  assert.deepEqual(reloaded.state, state, 'reload is exact')
  assert.deepEqual(runV3ProductionTick(reloaded.state!, 25).state, runV3ProductionTick(state, 25).state, 'reload continues identically')
  assert.equal(await clearV3GameState(store), true)
  const afterReset = await loadV3GameState(store)
  assert.equal(afterReset.status, 'new')
  assert.deepEqual(afterReset.state, createInitialV3GameState(), 'reset carries nothing from the previous run')
  assert.equal(afterReset.state!.developmentHistory.length, 0)
  assert.equal(afterReset.state!.jobReceipts.receipts.length, 0)
  assert.equal(Object.keys(afterReset.state!.variantInventory).length, 0)
  assert.equal(afterReset.state!.world.researchPoints, 0)

  // ---- Corrupt / newer / older saves fail safely and are never overwritten ----
  for (const [label, raw, status] of [
    ['corrupt JSON', '{not json', 'invalid'],
    ['newer revision', JSON.stringify({ ...createInitialV3GameState(), schemaRevision: 999 }), 'unsupported'],
    ['older revision', JSON.stringify({ ...createInitialV3GameState(), schemaRevision: 7 }), 'unsupported'],
    ['tampered money', JSON.stringify({ ...createInitialV3GameState(), world: { ...createInitialV3GameState().world, moneyCents: -5 } }), 'invalid'],
  ] as const) {
    const bad = memory({ [V3_STORAGE_KEY]: raw })
    const result = await loadV3GameState(bad)
    assert.equal(result.status, status, label)
    assert.equal(result.state, null, `${label}: no state is handed to the game`)
    assert.equal(bad.writes, 0, `${label}: loading never writes`)
    assert.equal(bad.data[V3_STORAGE_KEY], raw, `${label}: original bytes kept until an explicit reset`)
    assert.equal(await saveV3GameState({ ...createInitialV3GameState(), schemaRevision: 999 } as never, bad), false, 'invalid states are never saved')
    assert.equal(bad.data[V3_STORAGE_KEY], raw)
  }

  // ---- Recovery/loaner provenance survives reload ----
  let loaners = createInitialV3GameState()
  loaners = { ...loaners, world: { ...loaners.world, crudeOil: 0 }, materialCostBasis: { ...loaners.materialCostBasis, crudeCents: 0 } }
  for (const building of Object.values(V3_STARTER_BUILDINGS)) {
    loaners = act(loaners, { type: 'demolish', buildingId: building.id, expectedBuilding: building.type })
  }
  loaners = act(loaners, { type: 'restore_starter_loaners' })
  const loanerStore = memory()
  await saveV3GameState(loaners, loanerStore)
  const loanerReload = await loadV3GameState(loanerStore)
  assert.equal(loanerReload.status, 'loaded')
  assert.deepEqual(loanerReload.state!.recoveryState, loaners.recoveryState)
  assert.ok(loanerReload.state!.recoveryState!.loanerBuildingIds.length > 0)

  // ---- Real-time clock: speed, carry, pause, no offline catch-up ----
  let clock = { carryMs: 0 }
  let step = stepV3Clock(clock, 1_000, 1)
  assert.equal(step.ticks, 5)
  step = stepV3Clock({ carryMs: 150 }, 100, 1)
  assert.deepEqual([step.ticks, step.clock.carryMs], [1, 50])
  assert.equal(stepV3Clock(clock, 1_000, 3).ticks, 15)
  assert.equal(stepV3Clock({ carryMs: 180 }, 10_000, 0).ticks, 0, 'paused: nothing advances')
  assert.equal(stepV3Clock(clock, 3_600_000, 1).ticks, 5_000 / V3_TICK_MS, 'long gaps are capped (no offline progress)')
  clock = step.clock

  // ---- Reset goes through the game screen (single writer) ----
  let resets = 0
  assert.equal(requestV3Reset(), false, 'no screen mounted: caller clears storage instead')
  const unsubscribe = onV3ResetRequested(() => { resets += 1 })
  assert.equal(requestV3Reset(), true)
  assert.equal(resets, 1)
  unsubscribe()
  assert.equal(requestV3Reset(), false)

  // ---- Exactly one writer: the shipped app never reaches the old engine ----
  const root = resolve('.')
  const forbidden = ['src/hooks/GameContext', 'src/hooks/useGameLoop', 'src/game/utils/gameStorage'].map((path) => resolve(root, path))
  const visited = new Set<string>()
  const resolveImport = (from: string, spec: string): string | null => {
    if (!spec.startsWith('.')) return null
    const base = resolve(dirname(from), spec)
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
      if (existsSync(candidate) && !candidate.endsWith('/') && readdirSafe(candidate) === null) return candidate
    }
    return null
  }
  const readdirSafe = (path: string) => { try { return readdirSync(path) } catch { return null } }
  const walk = (file: string) => {
    if (visited.has(file)) return
    visited.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const target = resolveImport(file, match[1] ?? match[2])
      if (target) walk(target)
    }
  }
  const routes = readdirSync('app').filter((file) => file.endsWith('.tsx')).map((file) => resolve('app', file))
  assert.deepEqual(readdirSync('app').sort(), ['_layout.tsx', 'index.tsx', 'settings.tsx'], 'only the V3 game and settings routes ship')
  routes.forEach(walk)
  for (const path of forbidden) {
    assert.ok(![...visited].some((file) => file.startsWith(path)), `app bundle must not import ${path}`)
  }
  const writers = [...visited].filter((file) => /AsyncStorage\.setItem|\.setItem\(/.test(readFileSync(file, 'utf8')))
  const gameWriters = writers.filter((file) => /game/i.test(file))
  assert.deepEqual(gameWriters.map((file) => file.replace(`${root}/`, '')), ['src/game/v3/storage.ts'], 'the V3 storage module is the only game save writer')
  // Regression (V3-20): the shipped UI must always offer a way to buy crude.
  assert.ok([...visited].some((file) => /direction: 'buy', product: 'crude'/.test(readFileSync(file, 'utf8'))), 'a crude purchase action is reachable from the app')
  void clock

  console.log(`PASS: V3-17 persistence cutover — exact fresh/reload/reset, corrupt/newer/older never overwritten, loaner provenance, real-time clock, single writer (${visited.size} modules scanned)`)
}

main().catch((error) => { console.error(error); process.exit(1) })
