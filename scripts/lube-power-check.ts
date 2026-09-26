import assert from 'node:assert/strict'

import { getV3ProductCapacity, getV3ProductQuantity, getV3SellableQuantity, getV3StockAllocations, addV3VariantInventory } from '../src/game/v3/productInventory'
import { evaluateV3Production, getV3BatteryCapacity, runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, V3_STARTER_BUILDINGS } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'
import { act, assertBlocked, slotId, attempt, close, cycles, earnGasolineCash, legalChapterTwo, materialBasisTotal, SLOT } from './v3-check-helpers'

const LUBE = V3_DEFAULT_BLUEPRINT_ID.lubricants
const DISTILL = 4
const LUBE_A = 1
const LUBE_B = 2
const POWER = 6

// ---- Legal route: C2 via Gasoline, then earn the Lube investment at spot ----
let state = legalChapterTwo()
const niranId = state.world.employees[0].id
state = assertBlocked(state, { type: 'build', ...SLOT(LUBE_A), building: 'jetFuelPlant' }, 'v3.build.locked')
state = assertBlocked(state, { type: 'expand_grid' }, 'v3.expand.insufficient_cash')
const earned = earnGasolineCash(state, 2_300_000)
state = earned.state
console.log(`legal C2 cash for 2 Lube + power Lv2 + Lube Tank Lv2: ${earned.cycles} Gasoline cycles (${(earned.cycles * 5 / 60).toFixed(1)} sim min)`)

state = act(state, { type: 'build', ...SLOT(LUBE_A), building: 'lubricantPlant' })
assert.equal(state.plantPrograms[slotId(state, LUBE_A)].blueprintId, LUBE)
assert.equal(state.plantPrograms[slotId(state, LUBE_A)].installedModule, 'none')

// Pipeline: Distillation creates feedstock; Lube uses only opening feedstock.
state = act(state, { type: 'trade', direction: 'buy', product: 'crude', quantity: 50 })
state = cycles(state, 3)
assert.ok(getV3ProductQuantity(state, 'lubricants') > 0, 'Lube produced from distillation feedstock')

// ---- Exact recipe fixture (labelled): Distillation paused, controlled stock ----
// Constructed values isolate the formula; every action still uses the reducer.
state = act(state, { type: 'set_pause', buildingId: slotId(state, DISTILL), paused: true })
const fixture = (base: V3GameState, feedstock: number, electricity: number, electricityCents = 0): V3GameState => ({
  ...base,
  world: { ...base.world, feedstock, electricity, waste: 0 },
  materialCostBasis: { ...base.materialCostBasis, feedstockCents: feedstock * 80, electricityCents },
  variantInventory: Object.fromEntries(Object.entries(base.variantInventory).filter(([id]) => base.productBlueprints[id].family !== 'lubricants')),
})
let exact = fixture(state, 60, 0)
exact = act(exact, { type: 'assign_duty', employeeId: niranId, duty: { kind: 'reserve' } })
let tick = runV3ProductionTick(exact, 25)
let lube = tick.lines.find((line) => line.buildingId === slotId(exact, LUBE_A))!
close(lube.actualWork, 1, 'Lv1 unstaffed Lube work/cycle')
close(lube.outputQuantity, 5, 'Lube output 5/cycle')
close(tick.state.world.feedstock, 54, 'Lube consumes 6 feedstock')
close(tick.state.world.waste, 1, 'Lube waste 1/cycle')
close(tick.power.siteEnergy, 4, 'site supply 4/cycle')
close(tick.state.world.electricity, 1, 'battery keeps 4-3')
close(tick.state.variantInventory[LUBE].totalCostBasisCents, 480, 'Lube basis = feedstock basis, site energy free')
close(lube.potentialEnergyPerMinute, 36, 'Lube Lv1 demand 3/cycle')

// Two identical lines on site power only: power-limited and symmetric.
exact = act(exact, { type: 'build', ...SLOT(LUBE_B), building: 'lubricantPlant' })
tick = runV3ProductionTick(fixture(exact, 120, 0), 25)
const [lineA, lineB] = [LUBE_A, LUBE_B].map((cell) => tick.lines.find((line) => line.buildingId === slotId(tick.state, cell))!)
close(lineA.actualWork, 2 / 3, 'shared site power split A')
close(lineB.actualWork, 2 / 3, 'shared site power split B')
assert.equal(lineA.limitedBy, 'power')

// Power Plant: generator fills the gap with crude that Distillation does not need.
exact = act(exact, { type: 'build', ...SLOT(POWER), building: 'powerPlant' })
assert.equal(getV3BatteryCapacity(exact), 80)
const crudeBefore = 30
let powered = { ...fixture(exact, 120, 0), world: { ...fixture(exact, 120, 0).world, crudeOil: crudeBefore }, materialCostBasis: { ...fixture(exact, 120, 0).materialCostBasis, crudeCents: crudeBefore * 1_000 } }
tick = runV3ProductionTick(powered, 25)
close(tick.power.generatorEnergy, 12, 'Lv1 generator 12/cycle')
close(tick.power.generatorFuel, 1, 'Lv1 generator burns 1 crude/cycle')
close(tick.state.world.crudeOil, crudeBefore - 1)
close(tick.lines.find((line) => line.buildingId === slotId(powered, LUBE_A))!.actualWork, 1)
close(tick.lines.find((line) => line.buildingId === slotId(powered, LUBE_B))!.actualWork, 1)
close(tick.state.world.electricity, 10, 'battery 16 charged − 6 used')
// Fuel basis moved crude → battery → goods; no new cash debit.
close(materialBasisTotal(tick.state), materialBasisTotal(powered), 'utility basis conservation')
assert.equal(tick.state.world.moneyCents <= powered.world.moneyCents, true)

// Distillation reservation: generator cannot steal the line's due crude.
powered = act(powered, { type: 'set_pause', buildingId: slotId(powered, DISTILL), paused: false })
powered = { ...powered, world: { ...powered.world, crudeOil: 6 }, materialCostBasis: { ...powered.materialCostBasis, crudeCents: 6_000 } }
let plan = evaluateV3Production(powered, 25)
close(plan.power.crudeReservedForDistillation, 6)
close(plan.power.generatorFuel, 0, 'no fuel from reserved crude')
const distillLine = plan.lines.find((line) => line.buildingId === slotId(powered, DISTILL))!
close(distillLine.actualWork * distillLine.inputPerWork, 6, 'Distillation receives all opening crude')

// Full battery burns no fuel.
let full = act(powered, { type: 'set_pause', buildingId: slotId(powered, LUBE_A), paused: true })
full = act(full, { type: 'set_pause', buildingId: slotId(full, LUBE_B), paused: true })
full = act(full, { type: 'set_pause', buildingId: slotId(full, DISTILL), paused: true })
full = { ...full, world: { ...full.world, crudeOil: 20, electricity: getV3BatteryCapacity(full) } }
plan = evaluateV3Production(full, 25)
close(plan.power.generatorFuel, 0, 'full battery zero fuel')

// Power Plant upgrade is real at C2 and truthfully locked for Lv3 until C3.
let upgraded = act(powered, { type: 'upgrade', buildingId: slotId(powered, POWER) })
assert.equal(getV3BatteryCapacity(upgraded), 140)
close(evaluateV3Production({ ...upgraded, world: { ...upgraded.world, electricity: 0, crudeOil: 100 } }, 25).power.generatorEnergy, 24)
assertBlocked(upgraded, { type: 'upgrade', buildingId: slotId(upgraded, POWER) }, 'v3.upgrade.locked')

// ---- Storage: Lube Tank capacity and output-space bound ----
assert.equal(getV3ProductCapacity(upgraded, 'lubricants'), 200)
upgraded = act(upgraded, { type: 'build', ...SLOT(7), building: 'lubricantTank' })
assert.equal(getV3ProductCapacity(upgraded, 'lubricants'), 275)
upgraded = act(upgraded, { type: 'upgrade', buildingId: slotId(upgraded, 7) })
assert.equal(getV3ProductCapacity(upgraded, 'lubricants'), 390)
upgraded = act(upgraded, { type: 'set_pause', buildingId: slotId(upgraded, LUBE_A), paused: false })
let nearlyFull = fixture(upgraded, 60, 50)
nearlyFull = addV3VariantInventory(nearlyFull, LUBE, 388, 388 * 100).state
tick = runV3ProductionTick(nearlyFull, 25)
const lubeLines = tick.lines.filter((line) => line.family === 'lubricants')
close(lubeLines.reduce((sum, line) => sum + line.outputQuantity, 0), 2, 'two lines share the last 2 units of space')
close(lubeLines[0].outputQuantity, lubeLines[1].outputQuantity, 'space shared evenly')
assert.ok(lubeLines.every((line) => line.limitedBy === 'output_space'))
const distillFeed = tick.lines.find((line) => line.buildingId === slotId(nearlyFull, DISTILL))!.feedstock
close(tick.state.world.feedstock, 60 - 2 / 5 * 6 + distillFeed, 'input debited only for actual work')
close(getV3ProductQuantity(tick.state, 'lubricants'), 390)
assertBlocked(tick.state, { type: 'demolish', buildingId: slotId(tick.state, 7), expectedBuilding: 'lubricantTank' }, 'v3.demolish.stock_overflow')

// ---- Workforce: one Operator improves exactly one line, demand follows work ----
let staffed = fixture(upgraded, 200, 200)
staffed = act(staffed, { type: 'assign_duty', employeeId: niranId, duty: { kind: 'line', buildingId: slotId(staffed, LUBE_A) } })
plan = evaluateV3Production(staffed, 25)
const staffedLine = plan.lines.find((line) => line.buildingId === slotId(staffed, LUBE_A))!
assert.ok(staffedLine.crewRate > 0)
close(staffedLine.requestedWork, 1 + staffedLine.crewRate)
close(staffedLine.potentialEnergyPerMinute, 36 * (1 + staffedLine.crewRate), 'crew raises actual power demand')
close(plan.lines.find((line) => line.buildingId === slotId(staffed, DISTILL))!.crewRate, 0, 'moved Operator leaves Distillation')

// ---- Market: Fleet Trial reservation, protected stock and staged payment ----
let market = addV3VariantInventory(fixture(staffed, 0, 0), LUBE, 40, 40 * 200).state
market = act(market, { type: 'accept_job', templateId: 'fleet:trial' })
assert.equal(getV3StockAllocations(market, 'lubricants')[0].jobReserved, 30)
close(getV3SellableQuantity(market, 'lubricants'), 10)
assertBlocked(market, { type: 'trade', direction: 'sell', product: 'lubricants', quantity: 11 }, 'v3.trade.insufficient_stock')
market = act(market, { type: 'set_stock_policy', blueprintId: LUBE, keepQuantity: 10, autoSell: true })
close(getV3SellableQuantity(market, 'lubricants', { source: 'auto' }), 0, 'keep + job protect all stock')
const split = act(act(market, { type: 'dispatch_job', quantity: 10 }), { type: 'dispatch_job', quantity: 20 })
const whole = act(market, { type: 'dispatch_job', quantity: 30 })
assert.equal(split.world.moneyCents, whole.world.moneyCents, 'split payout == whole payout')
assert.equal(whole.world.moneyCents - market.world.moneyCents, 30 * 3_600 + 10_800)
assert.equal(whole.world.researchPoints - market.world.researchPoints, 5)
assert.equal(whole.acceptedJob, null)
assert.equal(whole.operatingLedger.lifetimeReceiptsCents - market.operatingLedger.lifetimeReceiptsCents, 30 * 3_600 + 10_800)
close(whole.operatingLedger.lifetimeCogsCents - market.operatingLedger.lifetimeCogsCents, 30 * 200, 'Lube COGS from basis')
assert.equal(whole.clientProgress.fleet.lastCompletedMilestoneId, 'fleet:trial')
assertBlocked(whole, { type: 'accept_job', templateId: 'fleet:trial' }, 'v3.job.locked')
let spot = act(whole, { type: 'trade', direction: 'sell', product: 'lubricants', quantity: 10, overrideKeep: true })
assert.equal(spot.world.moneyCents - whole.world.moneyCents, 10 * 3_000, 'Lube spot $30')

// ---- Development: Lube family uses the same evaluator/fees ----
let dev = addV3VariantInventory(fixture(staffed, 0, 0), LUBE, 12, 1_200).state
dev = act(dev, {
  type: 'start_development', family: 'lubricants', profile: 'precision', module: 'none',
  knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(dev, 0),
})
assert.equal(dev.developmentProject?.feeDebitedCents, 10_000)
assert.equal(dev.developmentProject?.remainingTicks, 125)
close(getV3ProductQuantity(dev, 'lubricants'), 2, '10 Lube samples consumed')
dev = cycles(act(dev, { type: 'set_pause', buildingId: slotId(dev, LUBE_A), paused: true }), 5)
const precisionLube = Object.values(dev.productBlueprints).find((blueprint) => blueprint.family === 'lubricants' && blueprint.provenance === 'developed')
assert.ok(precisionLube)
assert.equal(precisionLube!.quality, 55)
assert.equal(precisionLube!.name, 'Precision Lubricants')
assertBlocked(dev, { type: 'set_program', buildingId: slotId(dev, DISTILL), blueprintId: precisionLube!.id }, 'v3.program.invalid_blueprint')
dev = act(dev, { type: 'set_program', buildingId: slotId(dev, LUBE_A), blueprintId: precisionLube!.id })
assert.equal(dev.plantPrograms[slotId(dev, LUBE_A)].setupRemainingTicks, 25)

// ---- Reload/recovery determinism and conservation over a running factory ----
let running = act(upgraded, { type: 'set_pause', buildingId: slotId(upgraded, DISTILL), paused: false })
running = act(running, { type: 'set_pause', buildingId: slotId(running, LUBE_B), paused: false })
running = act(running, { type: 'trade', direction: 'buy', product: 'crude', quantity: 40 })
const reloaded = parseV3GameState(JSON.parse(JSON.stringify(running)))
assert.equal(reloaded.status, 'loaded')
let a = running
let b = reloaded.state!
for (let index = 0; index < 6; index++) {
  const basisBefore = materialBasisTotal(a)
  a = runV3ProductionTick(a, 25).state
  b = runV3ProductionTick(b, 25).state
  close(materialBasisTotal(a), basisBefore, `material basis conserved cycle ${index}`)
  for (const value of [a.world.moneyCents, a.world.crudeOil, a.world.feedstock, a.world.electricity, a.world.waste]) {
    assert.ok(Number.isFinite(value) && value >= 0)
  }
}
assert.deepEqual(a, b, 'reloaded save continues identically')
assert.ok(a.world.electricity <= getV3BatteryCapacity(a) + 1e-9)

// ---- 4×4 expansion through the shared action keeps geometry and line state ----
const beforeExpand = ((__s) => act(__s, { type: 'assign_duty', employeeId: niranId, duty: { kind: 'line', buildingId: slotId(__s, DISTILL) } }))(earnGasolineCash(a, a.world.moneyCents + 600_000).state)
const planBefore = evaluateV3Production(beforeExpand, 25)
const expanded = act(beforeExpand, { type: 'expand_grid' })
assert.equal(expanded.world.grid.length, 16)
assert.equal(expanded.world.moneyCents, beforeExpand.world.moneyCents - 600_000)
assert.equal(expanded.operatingLedger.capexCents - beforeExpand.operatingLedger.capexCents, 600_000)
assert.equal(getV3BuildingType(expanded, slotId(expanded, 1)), 'lubricantPlant')
assert.equal(getV3BuildingType(expanded, slotId(expanded, 5)), 'distillationUnit', '(1,1) moves from 4 to 5')
assert.equal(expanded.plantPrograms[slotId(expanded, 5)].buildingId, 5)
assert.deepEqual(expanded.employeeDuties[niranId], { kind: 'line', buildingId: V3_STARTER_BUILDINGS.gasolineTank.id }, 'duty follows its line')
const planAfter = evaluateV3Production(expanded, 25)
assert.deepEqual(
  planAfter.lines.map((line) => [line.building, line.actualWork]),
  planBefore.lines.map((line) => [line.building, line.actualWork]),
  'expansion does not change production',
)
assertBlocked(expanded, { type: 'expand_grid' }, 'v3.expand.locked') // 5×5 waits for C4
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(expanded))).status, 'loaded')
void attempt

console.log('PASS: V3-11a Lube recipe, site/generator power, reservation, tanks, crew, Fleet trial, development, reload, 4x4 expansion')
