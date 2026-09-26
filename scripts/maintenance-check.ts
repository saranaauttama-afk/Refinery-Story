import assert from 'node:assert/strict'

import { evaluateV3Maintenance, getV3EmergencyExitCents } from '../src/game/v3/maintenance'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { Employee } from '../src/game/types'
import type { V3GameState } from '../src/game/v3/types'
import { getV3WageCents } from '../src/game/v3/workforce'
import { act, assertBlocked, close } from './v3-check-helpers'

const perCycle = (dollars: number) => dollars * 100 * 0.002 / 12
const line = (state: V3GameState, cellIndex: number) => evaluateV3Maintenance(state).lines.find((entry) => entry.cellIndex === cellIndex)!

/** Labelled fixture: chapter/cash set directly to isolate the maintenance rule. */
function at(chapter: 0 | 1 | 2 | 3 | 4, moneyCents = 10_000_000): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter }, world: { ...base.world, moneyCents } }
}

// ---- Starter Distillation and core tanks are free until C2 ----
assert.equal(evaluateV3Maintenance(createInitialV3GameState()).dueCents, 0)
let c1 = act(at(1), { type: 'build', cellIndex: 0, building: 'laboratory' })
close(evaluateV3Maintenance(c1).dueCents, perCycle(400), 'Lab pays from C1; starters free')
assert.equal(line(c1, 4).waivedReason, 'starter')
let c2 = at(2)
close(evaluateV3Maintenance(c2).dueCents, perCycle(1_800) + 2 * perCycle(150), 'C2: starters pay')

// ---- Formula: level rate for processing, 1/1.25/1.5 for support/storage, paused 50% ----
c2 = act(c2, { type: 'build', cellIndex: 0, building: 'lubricantPlant' })
c2 = act(c2, { type: 'build', cellIndex: 1, building: 'lubricantTank' })
close(line(c2, 0).dueCents, perCycle(5_000))
c2 = act(c2, { type: 'upgrade', cellIndex: 0 })
close(line(c2, 0).dueCents, perCycle(5_000) * 1.4, 'processing Lv2 ×1.4')
c2 = act(c2, { type: 'upgrade', cellIndex: 1 })
close(line(c2, 1).dueCents, perCycle(750) * 1.25, 'storage Lv2 ×1.25')
const paused = act(c2, { type: 'set_pause', cellIndex: 0, paused: true })
close(line(paused, 0).dueCents, perCycle(5_000) * 1.4 * 0.5, 'paused manufacturing 50%')

// ---- Paid as incurred: operating expense, not COGS, never negative ----
const before = c2
const tick = runV3ProductionTick(before, 25).state
const due = evaluateV3Maintenance(before).dueCents
assert.equal(tick.maintenanceEmergency, null)
const wageCents = before.world.employees.reduce((sum, employee) => sum + getV3WageCents(employee, before.employeeDuties[employee.id] ?? { kind: 'reserve' }, 25), 0)
close(before.world.moneyCents - tick.world.moneyCents - wageCents, due, 'cash debit = maintenance + wages', 1e-6)
close(tick.operatingLedger.lifetimeCogsCents, before.operatingLedger.lifetimeCogsCents, 'maintenance is not COGS')
close(tick.operatingLedger.lifetimeOperatingExpenseCents - before.operatingLedger.lifetimeOperatingExpenseCents, due + wageCents)

// ---- Upkeep cuts: highest workshop only, research, Safety Officer support, 25% cap ----
let cuts = act(c2, { type: 'build', cellIndex: 2, building: 'maintenanceWorkshop' })
cuts = act(cuts, { type: 'build', cellIndex: 6, building: 'maintenanceWorkshop' })
close(evaluateV3Maintenance(cuts).globalCut, 0.05, 'two Lv1 workshops do not stack')
cuts = act(cuts, { type: 'upgrade', cellIndex: 2 })
close(evaluateV3Maintenance(cuts).globalCut, 0.08)
cuts = { ...cuts, world: { ...cuts.world, researchPoints: 100 } }
cuts = act(cuts, { type: 'buy_research', researchId: 'saferOperations' })
close(evaluateV3Maintenance(cuts).globalCut, 0.18)
cuts = act(cuts, { type: 'hire_employee', role: 'safetyOfficer' })
cuts = act(cuts, { type: 'assign_duty', employeeId: cuts.world.employees.at(-1)!.id, duty: { kind: 'support' } })
close(evaluateV3Maintenance(cuts).globalCut, 0.23)
cuts = act(cuts, { type: 'hire_employee', role: 'safetyOfficer' })
cuts = act(cuts, { type: 'assign_duty', employeeId: cuts.world.employees.at(-1)!.id, duty: { kind: 'support' } })
close(evaluateV3Maintenance(cuts).globalCut, 0.25, 'all upkeep reductions capped 25%')
close(line(cuts, 0).dueCents, perCycle(5_000) * 1.4 * 0.75)
// Local crew upkeep skill applies to that line only, still inside the cap.
const skilled: Employee = { id: 'employee:fixture:upkeep', type: 'operator', name: 'Upkeep Op', level: 1, xp: 0, skills: [{ channel: 'upkeep', value: 0.1 }] }
let local = { ...c2, world: { ...c2.world, employees: [...c2.world.employees, skilled] }, employeeDuties: { ...c2.employeeDuties, [skilled.id]: { kind: 'reserve' as const } }, employeeRecords: { ...c2.employeeRecords, [skilled.id]: { workTicks: 0, blueprintIds: [], milestoneIds: [] } } }
local = act(local, { type: 'assign_duty', employeeId: skilled.id, duty: { kind: 'line', cellIndex: 0 } })
close(line(local, 0).cut, 0.1)
close(line(local, 4).cut, 0, 'other lines unaffected')

// ---- Unpaid maintenance: no debt, Emergency operation, confirmed restoration ----
let broke = act(c2, { type: 'upgrade', cellIndex: 4 })
broke = act(broke, { type: 'set_program', cellIndex: 4, blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline })
broke = { ...broke, world: { ...broke.world, moneyCents: 10, crudeOil: 30 }, materialCostBasis: { ...broke.materialCostBasis, crudeCents: 30_000 } }
broke = runV3ProductionTick(broke, 25).state
assert.deepEqual(broke.maintenanceEmergency, { sinceTick: broke.world.tickCount - 25, cellIndex: 4 })
assert.ok(broke.world.moneyCents >= 0, 'no negative money / debt')
const emergencyPlan = evaluateV3Production(broke, 25).lines
const emergencyLine = emergencyPlan.find((entry) => entry.cellIndex === 4)!
close(emergencyLine.requestedWork, 1, 'Standard Lv1 baseline, no crew/bonus')
assert.equal(emergencyLine.blueprintId, V3_DEFAULT_BLUEPRINT_ID.gasoline)
assert.equal(emergencyPlan.find((entry) => entry.cellIndex === 0)!.status, 'paused', 'other lines paused')
assert.equal(broke.world.gridLevels[4], 2, 'real level retained')
assert.equal(evaluateV3Maintenance(broke).dueCents, 0, 'maintenance suspended while benefits are off')
const cashBefore = broke.world.moneyCents
broke = runV3ProductionTick(broke, 25).state
assert.ok(broke.world.moneyCents >= cashBefore - 1e-6 - 1_000, 'no maintenance debit in emergency')
broke = assertBlocked(broke, { type: 'restore_operations' }, 'v3.maintenance.unaffordable')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(broke))).status, 'loaded')
const funded = { ...broke, world: { ...broke.world, moneyCents: Math.ceil(getV3EmergencyExitCents(broke)) + 1 } }
const restored = act(funded, { type: 'restore_operations' })
assert.equal(restored.maintenanceEmergency, null)
assert.equal(evaluateV3Production(restored, 25).lines.find((entry) => entry.cellIndex === 0)!.status, 'ready')
assertBlocked(restored, { type: 'restore_operations' }, 'v3.maintenance.not_in_emergency')

// ---- Revision-9 saves load without an emergency ----
const rev9 = JSON.parse(JSON.stringify(createInitialV3GameState()))
rev9.schemaRevision = 9
delete rev9.maintenanceEmergency
const upgraded = parseV3GameState(rev9)
assert.equal(upgraded.status, 'loaded')
assert.equal(upgraded.state!.maintenanceEmergency, null)

console.log('PASS: maintenance formula, starter waiver, ledger, capped upkeep cuts, local skill, emergency baseline/no debt/restore, rev9 load')
