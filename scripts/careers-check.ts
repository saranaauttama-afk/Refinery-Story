import assert from 'node:assert/strict'

import { V3_CAREER, V3_RARE_CANDIDATE_TICKS, getV3CareerRank, getV3RareCandidate } from '../src/game/v3/careers'
import { getV3Modifiers } from '../src/game/v3/modifiers'
import { V3_STARTER_BUILDINGS, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { Employee } from '../src/game/types'
import type { V3GameState } from '../src/game/v3/types'
import { getV3LocalCrewRate } from '../src/game/v3/workforce'
import { act, assertBlocked } from './v3-check-helpers'

const DISTILL = V3_STARTER_BUILDINGS.distillationUnit.id
const rich = (state: V3GameState, level: number): V3GameState => ({
  ...state,
  world: {
    ...state.world, moneyCents: 10_000_000, researchPoints: 100,
    employees: state.world.employees.map((employee) => ({ ...employee, level })),
  },
})

// ---- Promotion: needs Lv5, costs money+RP, resets level, raises crew rate and cap ----
let state = rich(createInitialV3GameState(), 4)
const niran = state.world.employees[0].id
state = assertBlocked(state, { type: 'promote_employee', employeeId: niran }, 'v3.career.level_required')
state = rich(state, 5)
const crewBefore = getV3LocalCrewRate(state, DISTILL)
const cashBefore = state.world.moneyCents
state = act(state, { type: 'promote_employee', employeeId: niran })
assert.equal(getV3CareerRank(state, niran), 1)
assert.equal(state.world.employees[0].level, 1, 'class up resets level')
assert.equal(cashBefore - state.world.moneyCents, V3_CAREER.promotionDollars[0] * 100)
const crewSenior = getV3LocalCrewRate(state, DISTILL)
const crewLv1Plain = getV3LocalCrewRate({ ...state, employeeRecords: { ...state.employeeRecords, [niran]: { ...state.employeeRecords[niran], careerRank: 0 } } }, DISTILL)
assert.ok(Math.abs(crewSenior - crewLv1Plain - 0.05) < 1e-9, 'Senior adds +5% at the same level')
assert.ok(crewBefore > crewSenior, 'trade-off: Lv5 plain beats a fresh Senior Lv1')
state = rich(state, 5)
state = act(state, { type: 'promote_employee', employeeId: niran })
assert.equal(getV3CareerRank(state, niran), 2)
state = rich(state, 5)
assertBlocked(state, { type: 'promote_employee', employeeId: niran }, 'v3.career.max_rank')
// Chief Lv5 exceeds the ordinary 30% local cap by the rank allowance.
const operator: Employee = { ...state.world.employees[0], skills: [{ channel: 'output', value: 0.2 }] }
const capped = { ...state, world: { ...state.world, employees: [operator] } }
assert.ok(Math.abs(getV3LocalCrewRate(capped, DISTILL) - 0.4) < 1e-9, 'cap 30% + 2 ranks × 5%')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(state))).status, 'loaded')

// ---- Support effect scales with rank (still under channel caps) ----
let support: V3GameState = { ...createInitialV3GameState(), campaignProgress: { ...createInitialV3GameState().campaignProgress, chapter: 3 } }
support = rich(support, 1)
support = act(support, { type: 'hire_employee', role: 'salesAgent' })
const agent = support.world.employees.at(-1)!.id
support = act(support, { type: 'assign_duty', employeeId: agent, duty: { kind: 'support' } })
const plain = getV3Modifiers(support).trade.effective
const chief = getV3Modifiers({ ...support, employeeRecords: { ...support.employeeRecords, [agent]: { ...support.employeeRecords[agent], careerRank: 2 } } }).trade.effective
assert.ok(Math.abs(chief - plain * 1.5) < 1e-9)

// ---- Rare candidates: fame Lv3, one per quarter, deterministic, claimable once ----
let rare = rich(createInitialV3GameState(), 1)
assert.equal(getV3RareCandidate(rare), null, 'fame Lv1: none')
rare = { ...rare, world: { ...rare.world, reputation: 30 } }
const candidate = getV3RareCandidate(rare)!
assert.ok(candidate)
assert.deepEqual(getV3RareCandidate(rare), candidate, 'deterministic')
assert.equal(candidate.employee.level, 3)
assert.equal(candidate.employee.isAce, true)
assertBlocked(rare, { type: 'hire_candidate', candidateId: 'candidate:q999' }, 'v3.candidate.unavailable')
const hired = act(rare, { type: 'hire_candidate', candidateId: candidate.id })
assert.equal(hired.world.employees.at(-1)!.id, candidate.employee.id)
assert.equal(rare.world.moneyCents - hired.world.moneyCents, candidate.costCents)
assert.equal(getV3RareCandidate(hired), null, 'claimed for this quarter')
const nextQuarter = { ...hired, world: { ...hired.world, tickCount: V3_RARE_CANDIDATE_TICKS } }
assert.notEqual(getV3RareCandidate(nextQuarter)?.id, candidate.id, 'a new quarter brings a new candidate')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(hired))).status, 'loaded')

console.log('PASS: V3-21e careers — Lv5 class-up with level reset, crew/cap and support scaling, max rank; rare ★ candidates by fame/quarter')
