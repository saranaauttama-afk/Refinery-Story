import assert from 'node:assert/strict'

import { explainV3ProgramFit, getV3ModuleQuote } from '../src/game/v3/actions'
import { getV3BlueprintQuality } from '../src/game/v3/development'
import { addV3VariantInventory, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { getV3AvailableKnowledgeRank } from '../src/game/v3/research'
import { V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProductFamily } from '../src/game/v3/types'
import { act, assertBlocked, buildAnywhere, close, cycles, earnGasolineCash, legalChapterTwo, materialBasisTotal, sellAllFree, SLOT, slotId } from './v3-check-helpers'

const LAB = 0
const DISTILL = 4

function developed(state: V3GameState, family: V3ProductFamily, quality: number) {
  const blueprint = Object.values(state.productBlueprints).find((entry) =>
    entry.family === family && entry.provenance === 'developed' && entry.quality === quality)
  assert.ok(blueprint, `developed ${family} Q${quality}`)
  return blueprint!
}

// ---- V3-11b legal route: second premium delivery funds rank1 research ----
let state = legalChapterTwo()
const niranId = state.world.employees[0].id
assert.equal(state.world.researchPoints, 15)
state = assertBlocked(state, { type: 'buy_research', researchId: 'premiumFuel' }, 'v3.research.lab_level')
state = assertBlocked(state, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none',
  knowledgeRank: 1, leadEmployeeId: null, labBuildingId: slotId(state, LAB),
}, 'v3.development.knowledge_locked')

state = earnGasolineCash(state, 1_200_000).state
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 30 })
state = cycles(state, 3)
state = act(state, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none',
  knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(state, LAB),
})
state = cycles(state, 4)
const precisionGas = developed(state, 'gasoline', 55)
state = sellAllFree(state, 'gasoline')
state = act(state, { type: 'set_program', buildingId: slotId(state, DISTILL), blueprintId: precisionGas.id })
while ((state.variantInventory[precisionGas.id]?.quantity ?? 0) < 35) {
  const room = Math.floor(60 - state.world.crudeOil)
  if (room > 0) state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: room })
  state = cycles(state, 1)
}
state = act(state, { type: 'accept_job', templateId: 'performance:trial' })
state = act(state, { type: 'dispatch_job', quantity: 35, blueprintId: precisionGas.id })
assert.equal(state.world.researchPoints, 20 + state.awards.paidGradeRp, 'Tutorial + Local + Performance trials = 20 RP (+ any period award RP)')

state = earnGasolineCash(state, 800_000).state
state = act(state, { type: 'upgrade', buildingId: slotId(state, LAB) })
state = act(state, { type: 'buy_research', researchId: 'premiumFuel' })
assert.equal(state.world.researchPoints, state.awards.paidGradeRp, 'premiumFuel spent the 20 trial RP')
assert.equal(getV3AvailableKnowledgeRank(state, slotId(state, LAB)), 1)
state = assertBlocked(state, { type: 'buy_research', researchId: 'premiumFuel' }, 'v3.research.owned')
state = assertBlocked(state, { type: 'buy_research', researchId: 'advancedProcessing' }, 'v3.research.locked')

// Modules: C2 + plant Lv2, 20% of base build cost, no refund, never a silent Q drop.
state = assertBlocked(state, { type: 'set_module', buildingId: slotId(state, DISTILL), module: 'precision' }, 'v3.module.plant_level')
state = act(state, { type: 'upgrade', buildingId: slotId(state, DISTILL) })
assert.equal(getV3ModuleQuote(state, slotId(state, DISTILL), 'precision').costCents, 36_000)
const beforeFit = state.world.moneyCents
state = act(state, { type: 'set_module', buildingId: slotId(state, DISTILL), module: 'precision' })
assert.equal(beforeFit - state.world.moneyCents, 36_000)
assert.equal(state.plantPrograms[slotId(state, DISTILL)].paused, true, 'incompatible program pauses instead of producing lower Q')
assert.equal(evaluateV3Production(state, 25).lines.find((line) => line.buildingId === slotId(state, DISTILL))!.actualWork, 0)
state = assertBlocked(state, { type: 'set_module', buildingId: slotId(state, DISTILL), module: 'precision' }, 'v3.module.no_change')
state = assertBlocked(state, { type: 'set_program', buildingId: slotId(state, DISTILL), blueprintId: precisionGas.id }, 'v3.program.module_mismatch')
// Development is never blocked by line fit; the reason names what is missing.
assert.deepEqual(explainV3ProgramFit(state, slotId(state, DISTILL), precisionGas.id)?.params, { need: 'none', installed: 'precision' })

// Q65 at C2 without research; Q70 with rank1. Lab uses the proposed module, not a bought one.
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 1 })
const gasSamples = (target: V3GameState) => addV3VariantInventory(target, V3_DEFAULT_BLUEPRINT_ID.gasoline, 10, 10_000).state
state = ((__s) => act(__s, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'precision',
  knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(__s, LAB),
}))(gasSamples(state))
state = cycles(state, 4)
const q65 = developed(state, 'gasoline', 65)
assert.equal(q65.minPlantLevel, 2)
assert.equal(q65.quality, getV3BlueprintQuality('precision', 'precision', 0, 0), 'preview Q == certified Q')
state = ((__s) => act(__s, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'precision',
  knowledgeRank: 1, leadEmployeeId: null, labBuildingId: slotId(__s, LAB),
}))(gasSamples(state))
state = cycles(state, 4)
const q70 = developed(state, 'gasoline', 70)
state = act(state, { type: 'set_program', buildingId: slotId(state, DISTILL), blueprintId: q70.id })
state = act(state, { type: 'set_pause', buildingId: slotId(state, DISTILL), paused: false })
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 30 })
const q70Before = state.variantInventory[q70.id]?.quantity ?? 0
state = cycles(state, 3)
assert.ok((state.variantInventory[q70.id]?.quantity ?? 0) > q70Before, 'Q70 output after setup')

// Module multipliers are applied per cell in the same evaluator.
const line = evaluateV3Production(state, 25).lines.find((entry) => entry.buildingId === slotId(state, DISTILL))!
const crew = line.crewRate
close(line.requestedWork, 1.4 * 0.8 * 0.9 * (1 + crew), 'Lv2 × Precision profile × Precision module')
close(line.inputPerWork, 6 * 1.1, 'module input multiplier 1.0')

// Returning to none is free; re-fitting is charged again (no refund loop).
let moduleLoop = act(state, { type: 'set_module', buildingId: slotId(state, DISTILL), module: 'none' })
assert.equal(moduleLoop.world.moneyCents, state.world.moneyCents)
assert.equal(moduleLoop.plantPrograms[slotId(moduleLoop, DISTILL)].paused, true)
moduleLoop = act(moduleLoop, { type: 'set_module', buildingId: slotId(moduleLoop, DISTILL), module: 'precision' })
assert.equal(state.world.moneyCents - moduleLoop.world.moneyCents, 36_000)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(moduleLoop))).status, 'loaded')

// ---- V3-11c Jet at C3 (constructed fixture: C3 predicate belongs to V3-13) ----
let jet: V3GameState = {
  ...state,
  campaignProgress: { ...state.campaignProgress, chapter: 3 },
  world: {
    ...state.world,
    moneyCents: 10_000_000,
    employees: state.world.employees.map((employee) => employee.id === niranId ? { ...employee, level: 3 } : employee),
  },
}
jet = act(jet, { type: 'build', ...SLOT(1), building: 'jetFuelPlant' })
jet = act(jet, { type: 'build', ...SLOT(2), building: 'lubricantPlant' })
jet = act(jet, { type: 'build', ...SLOT(6), building: 'jetFuelTank' })
jet = act(jet, { type: 'set_pause', buildingId: slotId(jet, DISTILL), paused: true })
jet = act(jet, { type: 'assign_duty', employeeId: niranId, duty: { kind: 'reserve' } })
const feedFixture = (base: V3GameState, feedstock: number): V3GameState => ({
  ...base,
  world: { ...base.world, feedstock, electricity: 0, waste: 0 },
  materialCostBasis: { ...base.materialCostBasis, feedstockCents: feedstock * 80, electricityCents: 0 },
})
// Jet alone on site power: feedstock 8 → jet 5, energy 4.
let only = ((__s) => act(__s, { type: 'set_pause', buildingId: slotId(__s, 2), paused: true }))(feedFixture(jet, 80))
let tick = runV3ProductionTick(only, 25)
const jetLine = tick.lines.find((entry) => entry.buildingId === slotId(only, 1))!
close(jetLine.actualWork, 1)
close(jetLine.outputQuantity, 5)
close(tick.state.world.feedstock, 72)
close(tick.power.energyUsed, 4)
close(tick.state.variantInventory[V3_DEFAULT_BLUEPRINT_ID.jetFuel].totalCostBasisCents, 640)

// Lube and Jet share scarce feedstock without fixed-order starvation.
jet = act(jet, { type: 'build', ...SLOT(7), building: 'powerPlant' })
const scarce = { ...feedFixture(jet, 7), world: { ...feedFixture(jet, 7).world, electricity: 80 } }
const shared = evaluateV3Production(scarce, 25).lines.filter((entry) => entry.family !== 'gasoline')
close(shared[0].actualWork, shared[1].actualWork, 'equal work share Jet vs Lube')
close(shared.reduce((sum, entry) => sum + entry.actualWork * entry.inputPerWork, 0), 7, 'all feedstock used')

// Q75 Jet: Precision/Precision module/rank1/Operator Lv3 lead.
jet = addV3VariantInventory(jet, V3_DEFAULT_BLUEPRINT_ID.jetFuel, 10, 6_400).state
jet = act(jet, {
  type: 'start_development', family: 'jetFuel', profile: 'precision', module: 'precision',
  knowledgeRank: 1, leadEmployeeId: niranId, labBuildingId: slotId(jet, LAB),
})
assert.equal(jet.developmentProject?.quality, 75)
assert.equal(jet.developmentProject?.feeDebitedCents, 20_000)
assert.equal(jet.developmentProject?.remainingTicks, 150)
jet = cycles(jet, 6)
const q75 = developed(jet, 'jetFuel', 75)
assert.equal(q75.name, 'Precision Jet Fuel (Precision module)')
assertBlocked(jet, { type: 'set_program', buildingId: slotId(jet, 1), blueprintId: q75.id }, 'v3.program.plant_level')
jet = act(jet, { type: 'upgrade', buildingId: slotId(jet, 1) })
jet = act(jet, { type: 'set_module', buildingId: slotId(jet, 1), module: 'precision' })
jet = act(jet, { type: 'set_program', buildingId: slotId(jet, 1), blueprintId: q75.id })
jet = act(jet, { type: 'set_pause', buildingId: slotId(jet, 1), paused: false })
jet = act(jet, { type: 'set_pause', buildingId: slotId(jet, 2), paused: false })
jet = act(jet, { type: 'set_pause', buildingId: slotId(jet, DISTILL), paused: false })
jet = act(jet, { type: 'set_program', buildingId: slotId(jet, DISTILL), blueprintId: q70.id })
jet = act(jet, { type: 'build', ...SLOT(8), building: 'crudeTank' })
let shipped = false
for (let round = 0; round < 80 && !shipped; round++) {
  const room = Math.floor(jet.world.crudeOil < 100 ? 100 - jet.world.crudeOil : 0)
  if (room > 0) {
    const bought = act(jet, { type: 'trade', direction: 'buy', product: 'crude', quantity: room })
    jet = bought
  }
  jet = cycles(jet, 1)
  jet = sellAllFree(jet, 'gasoline')
  jet = sellAllFree(jet, 'lubricants')
  shipped = (jet.variantInventory[q75.id]?.quantity ?? 0) >= 30
}
assert.ok(shipped, 'Q75 Jet produced through the legal line')
const airline = act(jet, { type: 'accept_job', templateId: 'airline:trial' })
const paid = act(airline, { type: 'dispatch_job', quantity: 30, blueprintId: q75.id })
assert.equal(paid.world.moneyCents - airline.world.moneyCents, 30 * 7_500 + 22_500)
assert.equal(paid.clientProgress.airline.lastCompletedMilestoneId, 'airline:trial')
assert.ok(getV3ProductQuantity(paid, 'jetFuel') >= 0)
assertBlocked(state, { type: 'accept_job', templateId: 'airline:trial' }, 'v3.job.locked')

// Multi-cell independence: a second Jet cell at Lv1 keeps its own level/program/staff.
let multi = act(paid, { type: 'unlock_land_parcel', parcelId: 'ring1:east' })
const second = buildAnywhere(multi, 'jetFuelPlant')
multi = second.state
const secondJet = second.id
multi = act(multi, { type: 'assign_duty', employeeId: niranId, duty: { kind: 'line', buildingId: secondJet } })
const jets = evaluateV3Production(multi, 25).lines.filter((entry) => entry.family === 'jetFuel')
assert.equal(jets.length, 2)
const upgradedJet = jets.find((entry) => entry.blueprintId === q75.id)!
const baseJet = jets.find((entry) => entry.buildingId === secondJet)!
close(upgradedJet.requestedWork, 1.4 * 0.8 * 0.9, 'Lv2 Q75 cell unaffected by other cell crew')
close(baseJet.requestedWork, 1 + baseJet.crewRate, 'Lv1 default cell with its own Operator')
assert.equal(baseJet.blueprintId, V3_DEFAULT_BLUEPRINT_ID.jetFuel)

// Conservation while Gasoline, Lube and Jet all run with generator fuel.
let running = paid
for (let index = 0; index < 5; index++) {
  const before = materialBasisTotal(running)
  running = runV3ProductionTick(running, 25).state
  close(materialBasisTotal(running), before, `three-family basis conservation ${index}`)
}
const reload = parseV3GameState(JSON.parse(JSON.stringify(running)))
assert.equal(reload.status, 'loaded')
assert.deepEqual(runV3ProductionTick(reload.state!, 25).state, runV3ProductionTick(running, 25).state)

console.log('PASS: V3-11b/c modules, rank1 research, Q65@C2, Q75 Jet@C3 fixture, shared feedstock, Airline trial, reload')
