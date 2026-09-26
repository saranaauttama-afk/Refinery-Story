import assert from 'node:assert/strict'

import { V3_ROLES, type V3ProcessBuilding } from '../src/game/v3/data'
import { getV3Modifiers } from '../src/game/v3/modifiers'
import { getV3CrudeCapacity, getV3PhysicalCrudeCapacity, addV3VariantInventory } from '../src/game/v3/productInventory'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState, V3_STARTER_BUILDINGS } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { Employee, WorkerType } from '../src/game/types'
import type { V3GameState } from '../src/game/v3/types'
import { getV3LocalCrewRate } from '../src/game/v3/workforce'
import { act, assertBlocked, slotId, attempt, close, cycles, SLOT } from './v3-check-helpers'

const ROLES = Object.keys(V3_ROLES) as WorkerType[]
const PLANTS = ['distillationUnit', 'lubricantPlant', 'jetFuelPlant'] as const satisfies readonly V3ProcessBuilding[]

/** Labelled fixture: chapter/cash/roster set directly to isolate one rule. */
function fixture(chapter: 0 | 1 | 2 | 3 | 4, extra: Employee[] = [], moneyCents = 10_000_000): V3GameState {
  const base = createInitialV3GameState()
  return {
    ...base,
    campaignProgress: { ...base.campaignProgress, chapter },
    world: { ...base.world, moneyCents, employees: [...base.world.employees, ...extra] },
    employeeDuties: { ...base.employeeDuties, ...Object.fromEntries(extra.map((employee) => [employee.id, { kind: 'reserve' as const }])) },
    employeeRecords: { ...base.employeeRecords, ...Object.fromEntries(extra.map((employee) => [employee.id, { workTicks: 0, blueprintIds: [], milestoneIds: [] }])) },
  }
}
const person = (type: WorkerType, index = 1, level = 1): Employee => ({ id: `employee:fixture:${type}:${index}`, type, name: `${type} ${index}`, level, xp: 0, skills: [] })

// ---- Role × plant eligibility (every role, every ported line, plus Support) ----
for (const role of ROLES) {
  let state = fixture(3, [person(role)])
  const plantCells: Record<(typeof PLANTS)[number], number> = { distillationUnit: 4, lubricantPlant: 0, jetFuelPlant: 1 }
  state = act(state, { type: 'build', ...SLOT(0), building: 'lubricantPlant' })
  state = act(state, { type: 'build', ...SLOT(1), building: 'jetFuelPlant' })
  state = act(state, { type: 'assign_duty', employeeId: state.world.employees[0].id, duty: { kind: 'reserve' } })
  const id = person(role).id
  for (const plant of PLANTS) {
    const result = attempt(state, { type: 'assign_duty', employeeId: id, duty: { kind: 'line', buildingId: plantCells[plant] } })
    const allowed = V3_ROLES[role].lineBuildings.includes(plant)
    assert.equal(result.events[0].messageId, allowed ? 'v3.action.ok' : 'v3.duty.ineligible', `${role} on ${plant}`)
    if (allowed) {
      const rate = getV3LocalCrewRate(result.state, plantCells[plant])
      close(rate, V3_ROLES[role].matchedBuildings.includes(plant) ? 0.15 : 0.1, `${role} Lv1 crew on ${plant}`)
      assert.equal(parseV3GameState(JSON.parse(JSON.stringify(result.state))).status, 'loaded')
    }
  }
  const support = attempt(state, { type: 'assign_duty', employeeId: id, duty: { kind: 'support' } })
  assert.equal(support.events[0].messageId, V3_ROLES[role].support ? 'v3.action.ok' : 'v3.duty.ineligible', `${role} support`)
}
// Level scaling and caps on local crew.
let crew = fixture(3, [person('aviationSpecialist', 1, 5)])
crew = act(crew, { type: 'build', ...SLOT(1), building: 'jetFuelPlant' })
crew = act(crew, { type: 'assign_duty', employeeId: person('aviationSpecialist').id, duty: { kind: 'line', buildingId: slotId(crew, 1) } })
close(getV3LocalCrewRate(crew, slotId(crew, 1)), 0.23, 'matched Lv5 = min(0.25, 0.15+0.08)')

// ---- Deterministic vacancy hiring, chapter unlocks, cap, atomic failure ----
let hiring = createInitialV3GameState()
hiring = assertBlocked(hiring, { type: 'hire_employee', role: 'mechanic' }, 'v3.hire.locked')
hiring = assertBlocked(hiring, { type: 'hire_employee', role: 'safetyOfficer' }, 'v3.hire.locked')
hiring = act(hiring, { type: 'hire_employee', role: 'operator' })
const hired = hiring.world.employees.at(-1)!
assert.equal(hired.type, 'operator')
assert.equal(hired.id, `employee:operator:${String(hiring.nextActionSequence - 1).padStart(6, '0')}`)
assert.deepEqual(hiring.employeeDuties[hired.id], { kind: 'reserve' })
assert.equal(hiring.world.moneyCents, 60_000 - 50_000)
hiring = assertBlocked(hiring, { type: 'hire_employee', role: 'operator' }, 'v3.hire.insufficient_cash')
let capped = { ...hiring, world: { ...hiring.world, moneyCents: 1_000_000 } }
capped = act(capped, { type: 'hire_employee', role: 'operator' })
capped = act(capped, { type: 'hire_employee', role: 'operator' })
assert.equal(capped.world.employees.length, 4)
assertBlocked(capped, { type: 'hire_employee', role: 'operator' }, 'v3.hire.staff_cap')

// ---- Capped supports cannot be won by mass hiring ----
const mechanics = Array.from({ length: 10 }, (_, index) => person('mechanic', index + 1))
const sales = Array.from({ length: 10 }, (_, index) => person('salesAgent', index + 1))
let supportState = fixture(4, [...mechanics, ...sales])
for (const employee of [...mechanics, ...sales]) supportState = act(supportState, { type: 'assign_duty', employeeId: employee.id, duty: { kind: 'support' } })
const modifiers = getV3Modifiers(supportState)
close(modifiers.mechanicStorageFlat, 75, 'mechanics count at most 3 staff-equivalents')
close(modifiers.trade.raw, 0.4)
close(modifiers.trade.effective, 0.15, 'trade capped at 15%')
close(getV3CrudeCapacity(supportState), getV3PhysicalCrudeCapacity(supportState) + 75)
// Reserve or unpaid supporters contribute nothing.
const unpaid = { ...supportState, unpaidEmployeeIds: [...mechanics, ...sales].map((employee) => employee.id) }
close(getV3Modifiers(unpaid).trade.effective, 0)
close(getV3Modifiers(unpaid).mechanicStorageFlat, 0)

// ---- Trade snapshot: spot receipts and job quote; moving staff later cannot reprice ----
let trade = fixture(2, [person('salesAgent')])
trade = { ...trade, world: { ...trade.world, researchPoints: 0 } }
trade = act(trade, { type: 'assign_duty', employeeId: person('salesAgent').id, duty: { kind: 'support' } })
trade = addV3VariantInventory(trade, V3_DEFAULT_BLUEPRINT_ID.lubricants, 40, 4_000).state
const spot = act(trade, { type: 'trade', direction: 'sell', product: 'lubricants', quantity: 10 })
assert.equal(spot.world.moneyCents - trade.world.moneyCents, Math.round(10 * 3_000 * 1.04))
let quoted = act(trade, { type: 'accept_job', templateId: 'fleet:trial' })
assert.equal(quoted.acceptedJob?.lockedUnitPriceCents, Math.round(3_600 * 1.04))
quoted = act(quoted, { type: 'assign_duty', employeeId: person('salesAgent').id, duty: { kind: 'reserve' } })
const settled = act(quoted, { type: 'dispatch_job', quantity: 30 })
assert.equal(settled.world.moneyCents - quoted.world.moneyCents, Math.round(30 * 3_744) + Math.round(10_800 * 1.04))

// ---- Chemist RP bonus is capped and paid once on completion ----
let chem = fixture(2, [person('chemist')])
chem = act(chem, { type: 'assign_duty', employeeId: person('chemist').id, duty: { kind: 'support' } })
chem = addV3VariantInventory(chem, V3_DEFAULT_BLUEPRINT_ID.lubricants, 30, 3_000).state
chem = act(chem, { type: 'accept_job', templateId: 'fleet:trial' })
const rpBefore = chem.world.researchPoints
chem = act(chem, { type: 'dispatch_job', quantity: 30 })
close(chem.world.researchPoints - rpBefore, 5 * 1.1)

// ---- R&D lead loses line benefit until return; Support lead returns to Support ----
let rnd = fixture(2, [person('chemist')])
rnd = act(rnd, { type: 'build', ...SLOT(0), building: 'laboratory' })
rnd = addV3VariantInventory(rnd, V3_DEFAULT_BLUEPRINT_ID.gasoline, 20, 20_000).state
const niran = rnd.world.employees[0].id
assert.ok(getV3LocalCrewRate(rnd, slotId(rnd, 4)) > 0)
rnd = act(rnd, { type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0, leadEmployeeId: niran, labBuildingId: slotId(rnd, 0) })
close(getV3LocalCrewRate(rnd, slotId(rnd, 4)), 0, 'lead left the line')
assertBlocked(rnd, { type: 'assign_duty', employeeId: niran, duty: { kind: 'line', buildingId: slotId(rnd, 4) } }, 'v3.duty.occupied')
rnd = cycles(rnd, 4)
assert.deepEqual(rnd.employeeDuties[niran], { kind: 'line', buildingId: V3_STARTER_BUILDINGS.distillationUnit.id }, 'returns to vacant line')
assert.ok(getV3LocalCrewRate(rnd, slotId(rnd, 4)) > 0)
const blueprintId = rnd.developmentHistory.at(-1)!.blueprintId
assert.ok(rnd.employeeRecords[niran].blueprintIds.includes(blueprintId), 'accomplishment: developed blueprint')
rnd = addV3VariantInventory(rnd, V3_DEFAULT_BLUEPRINT_ID.gasoline, 20, 20_000).state
rnd = act(rnd, { type: 'assign_duty', employeeId: person('chemist').id, duty: { kind: 'support' } })
rnd = act(rnd, { type: 'start_development', family: 'gasoline', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: person('chemist').id, labBuildingId: slotId(rnd, 0) })
assert.equal(rnd.developmentProject?.leadContribution, 5, 'Chemist lead gives Q+5 for any family')
assert.equal(rnd.developmentProject?.quality, 40)
close(getV3Modifiers(rnd).rp.effective, 0, 'Chemist in R&D gives no support bonus')
rnd = cycles(rnd, 4)
assert.deepEqual(rnd.employeeDuties[person('chemist').id], { kind: 'support' })
// Non-lead roles cannot lead a project.
let noLead = fixture(2, [person('mechanic')])
noLead = act(noLead, { type: 'build', ...SLOT(0), building: 'laboratory' })
noLead = addV3VariantInventory(noLead, V3_DEFAULT_BLUEPRINT_ID.gasoline, 20, 20_000).state
assertBlocked(noLead, { type: 'start_development', family: 'gasoline', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: person('mechanic').id, labBuildingId: slotId(noLead, 0) }, 'v3.development.invalid_lead')

// ---- XP from actual duty, legacy thresholds; training legal action ----
let xp = createInitialV3GameState()
xp = { ...xp, world: { ...xp.world, moneyCents: 10_000_000 } }
xp = act(xp, { type: 'build', ...SLOT(0), building: 'crudeTank' })
for (let index = 0; index < 50 && xp.world.employees[0].level < 2; index++) {
  xp = act(xp, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
  xp = cycles(xp, 1)
  if (xp.world.employees[0].level < 2) xp = act(xp, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: Math.floor(xp.variantInventory[V3_DEFAULT_BLUEPRINT_ID.gasoline]?.quantity ?? 0) || 1 })
}
assert.equal(xp.world.employees[0].level, 2, 'Operator reaches Lv2 from actual work')
assert.ok(xp.employeeRecords[xp.world.employees[0].id].workTicks >= 1_200)
let train = { ...xp, world: { ...xp.world, researchPoints: 4 } }
train = assertBlocked(train, { type: 'train_employee', employeeId: xp.world.employees[0].id }, 'v3.train.insufficient_rp')
train = { ...train, world: { ...train.world, researchPoints: 5 } }
const capexBefore = train.operatingLedger.capexCents
train = act(train, { type: 'train_employee', employeeId: xp.world.employees[0].id })
assert.equal(train.world.employees[0].level, 3)
assert.equal(train.operatingLedger.capexCents - capexBefore, (600 + 2 * 500) * 100)
const maxed = { ...train, world: { ...train.world, employees: train.world.employees.map((employee) => ({ ...employee, level: 5 })) } }
assertBlocked(maxed, { type: 'train_employee', employeeId: xp.world.employees[0].id }, 'v3.train.max_level')

// ---- Research mapping: capped global rate, core/percent storage ----
let research = fixture(2)
research = { ...research, world: { ...research.world, researchPoints: 200 } }
const baseWork = evaluateV3Production(research, 25).lines[0].requestedWork
research = act(research, { type: 'buy_research', researchId: 'betterPumps' })
close(evaluateV3Production(research, 25).lines[0].requestedWork, baseWork * 1.05)
research = act(research, { type: 'buy_research', researchId: 'advancedDistillation' })
close(evaluateV3Production(research, 25).lines[0].requestedWork, baseWork * 1.15)
const skilled = { ...person('mechanic'), skills: [{ channel: 'output' as const, value: 0.2 }] }
let withSkill = { ...research, world: { ...research.world, employees: [...research.world.employees, skilled] }, employeeDuties: { ...research.employeeDuties, [skilled.id]: { kind: 'support' as const } }, employeeRecords: { ...research.employeeRecords, [skilled.id]: { workTicks: 0, blueprintIds: [], milestoneIds: [] } } }
close(getV3Modifiers(withSkill).globalRate.raw, 0.35)
close(evaluateV3Production(withSkill, 25).lines[0].requestedWork, baseWork * 1.2, 'global rate cap 20%, no double global output')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(withSkill))).status, 'loaded')
research = act(research, { type: 'buy_research', researchId: 'biggerTanks' })
close(getV3CrudeCapacity(research), getV3PhysicalCrudeCapacity(research) + 20)
research = act(research, { type: 'buy_research', researchId: 'industrialStorage' })
close(getV3CrudeCapacity(research), (getV3PhysicalCrudeCapacity(research) + 20) * 1.15)
assertBlocked(research, { type: 'buy_research', researchId: 'storageOptimization' }, 'v3.research.locked')

// ---- Specialization: optional at C3, one choice, rate/energy/waste ----
let spec = fixture(2)
spec = assertBlocked(spec, { type: 'choose_specialization', path: 'green' }, 'v3.specialization.locked')
spec = { ...spec, campaignProgress: { ...spec.campaignProgress, chapter: 3 } }
spec = act(spec, { type: 'build', ...SLOT(0), building: 'lubricantPlant' })
const before = evaluateV3Production(spec, 25).lines.find((line) => line.buildingId === 0)!
spec = act(spec, { type: 'choose_specialization', path: 'green' })
const after = evaluateV3Production(spec, 25).lines.find((line) => line.buildingId === 0)!
close(after.requestedWork, before.requestedWork * 0.95)
close(after.energyPerWork, before.energyPerWork * 0.9)
assertBlocked(spec, { type: 'choose_specialization', path: 'industrial' }, 'v3.specialization.chosen')
const specTick = runV3ProductionTick({ ...spec, world: { ...spec.world, feedstock: 60, electricity: 20 }, materialCostBasis: { ...spec.materialCostBasis, feedstockCents: 4_800 } }, 25)
const lubeLine = specTick.lines.find((line) => line.buildingId === 0)!
close(lubeLine.waste, lubeLine.actualWork * 0.8, 'green waste ×0.8')

// ---- Milestone accomplishment credit only to contributors with positive work ----
let credit = fixture(2)
credit = act(credit, { type: 'accept_job', templateId: 'local:trial' })
credit = act(credit, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
for (let index = 0; index < 12; index++) {
  credit = act(credit, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
  credit = cycles(credit, 1)
}
credit = act(credit, { type: 'dispatch_job', quantity: 40 })
assert.ok(credit.employeeRecords[credit.world.employees[0].id].milestoneIds.includes('local:trial'))

// ---- Revision-7 preview saves upgrade by adding empty records only ----
const rev7 = JSON.parse(JSON.stringify(createInitialV3GameState()))
rev7.schemaRevision = 7
delete rev7.employeeRecords
const upgraded = parseV3GameState(rev7)
assert.equal(upgraded.status, 'loaded')
assert.deepEqual(upgraded.state!.employeeRecords, createInitialV3GameState().employeeRecords)

console.log('PASS: V3-12 role matrix, hiring/cap, capped supports, trade/RP snapshots, R&D duty return, XP/training, research mapping, specialization, records, rev7 load')
