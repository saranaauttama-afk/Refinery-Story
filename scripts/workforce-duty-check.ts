import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { evaluateV3GasolineProduction, runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { Employee } from '../src/game/types'
import { returnV3EmployeeFromDevelopment } from '../src/game/v3/workforce'

const close = (actual: number, expected: number, message?: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message ?? 'value'}: ${actual} != ${expected}`)

let state = createInitialV3GameState()
const niranId = state.world.employees[0].id
let preview = evaluateV3GasolineProduction(state, 25)
close(preview[0].crewRate, 0.2)
close(preview[0].potentialOutputPerMinute, 72)

let action = reduceV3Action(state, {
  type: 'assign_duty', sequence: state.nextActionSequence, employeeId: niranId, duty: { kind: 'reserve' },
})
state = action.state
close(evaluateV3GasolineProduction(state, 25)[0].potentialOutputPerMinute, 60)

state = {
  ...state,
  world: {
    ...state.world,
    moneyCents: 300_000,
    grid: state.world.grid.map((cell, index) => index === 0 ? null : cell),
  },
}
action = reduceV3Action(state, {
  type: 'build', sequence: state.nextActionSequence, buildingId: 0, building: 'distillationUnit',
})
state = action.state
action = reduceV3Action(state, {
  type: 'assign_duty', sequence: state.nextActionSequence, employeeId: niranId, duty: { kind: 'line', buildingId: 0 },
})
state = action.state
preview = evaluateV3GasolineProduction(state, 25)
close(preview.find((line) => line.buildingId === 0)!.potentialOutputPerMinute, 72)
close(preview.find((line) => line.buildingId === 4)!.potentialOutputPerMinute, 60)

const secondOperator: Employee = {
  id: 'employee:operator:000002', type: 'operator', name: 'Mali', level: 1, xp: 0,
  skills: [{ channel: 'output', value: 0.05 }],
}
state = { ...state, world: { ...state.world, employees: [...state.world.employees, secondOperator] } }
action = reduceV3Action(state, {
  type: 'assign_duty', sequence: state.nextActionSequence, employeeId: secondOperator.id, duty: { kind: 'line', buildingId: 0 },
})
assert.equal(action.events[0].messageId, 'v3.duty.occupied')

state = createInitialV3GameState()
const beforeXp = state.world.employees[0].xp
let production = runV3ProductionTick(state, 25)
close(production.state.world.moneyCents, 60_000 - 400 / 12)
close(production.state.operatingLedger.lifetimeCashOutflowsCents, 400 / 12)
close(production.state.operatingLedger.lifetimeOperatingExpenseCents, 400 / 12)
// V3-12: legacy productive-duty rate, 1 XP per active tick (25 per full-rate cycle of work).
close(production.state.world.employees[0].xp, beforeXp + 1.2 * 25)

const paused = {
  ...createInitialV3GameState(),
  plantPrograms: { 4: { ...createInitialV3GameState().plantPrograms[4], paused: true } },
}
production = runV3ProductionTick(paused, 25)
close(production.state.world.employees[0].xp, 0)
close(production.state.operatingLedger.lifetimeOperatingExpenseCents, 400 / 12)

state = { ...createInitialV3GameState(), world: { ...createInitialV3GameState().world, moneyCents: 0 } }
production = runV3ProductionTick(state, 25)
assert.deepEqual(production.state.unpaidEmployeeIds, [niranId])
close(production.state.world.moneyCents, 0)
close(production.lines[0].crewRate, 0)
close(production.lines[0].potentialOutputPerMinute, 60)
close(production.state.world.employees[0].xp, 0)

state = { ...production.state, world: { ...production.state.world, moneyCents: 1_000 } }
production = runV3ProductionTick(state, 25)
close(production.lines[0].crewRate, 0, 'unpaid standby requires explicit resume')
close(production.state.world.moneyCents, 1_000)
action = reduceV3Action(production.state, {
  type: 'resume_employee', sequence: production.state.nextActionSequence, employeeId: niranId,
})
assert.equal(action.events[0].messageId, 'v3.action.ok')
assert.deepEqual(action.state.unpaidEmployeeIds, [])
close(evaluateV3GasolineProduction(action.state, 25)[0].crewRate, 0.2)

const reserveState = {
  ...createInitialV3GameState(),
  employeeDuties: { [niranId]: { kind: 'reserve' as const } },
}
production = runV3ProductionTick(reserveState, 25)
close(production.state.operatingLedger.lifetimeOperatingExpenseCents, 100 / 12)
close(production.state.world.employees[0].xp, 0)
close(production.lines[0].crewRate, 0)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(production.state))).status, 'loaded')

state = createInitialV3GameState()
state = {
  ...state,
  employeeDuties: { [niranId]: { kind: 'development', projectId: 'project:1', returnBuildingId: 4 } },
}
state = returnV3EmployeeFromDevelopment(state, niranId)
assert.deepEqual(state.employeeDuties[niranId], { kind: 'line', buildingId: 4 })
state = {
  ...state,
  employeeDuties: {
    [niranId]: { kind: 'development', projectId: 'project:2', returnBuildingId: 4 },
    [secondOperator.id]: { kind: 'line', buildingId: 4 },
  },
}
state = returnV3EmployeeFromDevelopment(state, niranId)
assert.deepEqual(state.employeeDuties[niranId], { kind: 'reserve' })

console.log('PASS: V3-06 exclusive duty, local crew, wages, unpaid standby, resume, XP, and reload')
