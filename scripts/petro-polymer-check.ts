import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

import { V3_ROLES, type V3ProcessBuilding } from '../src/game/v3/data'
import { getV3BlueprintQuality } from '../src/game/v3/development'
import { addV3VariantInventory, getV3ProductCapacity, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { getV3AvailableKnowledgeRank } from '../src/game/v3/research'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { Employee, WorkerType } from '../src/game/types'
import type { V3GameState } from '../src/game/v3/types'
import { act, assertBlocked, attempt, close, cycles, materialBasisTotal, SLOT, slotId } from './v3-check-helpers'

const PETRO = V3_DEFAULT_BLUEPRINT_ID.petrochemicals
const PELLET = V3_DEFAULT_BLUEPRINT_ID.plasticPellets

/** Labelled constructed fixture at C4: legal C3/C4 predicates are proven in check:v3-clients. */
function c4(): V3GameState {
  const base = createInitialV3GameState()
  return {
    ...base,
    campaignProgress: { ...base.campaignProgress, chapter: 4 },
    world: { ...base.world, moneyCents: 50_000_000, researchPoints: 500 },
  }
}
const resources = (state: V3GameState, values: { feedstock?: number; electricity?: number; waste?: number; crude?: number }): V3GameState => ({
  ...state,
  world: {
    ...state.world,
    feedstock: values.feedstock ?? state.world.feedstock,
    electricity: values.electricity ?? state.world.electricity,
    waste: values.waste ?? state.world.waste,
    crudeOil: values.crude ?? state.world.crudeOil,
  },
  materialCostBasis: {
    ...state.materialCostBasis,
    feedstockCents: (values.feedstock ?? state.world.feedstock) * 80,
    electricityCents: 0,
    wasteCents: 0,
    crudeCents: (values.crude ?? state.world.crudeOil) * 1_000,
  },
})

// ---- 14a Petro recipe, power need, route gate for Polymer ----
let state = c4()
state = act(state, { type: 'set_pause', buildingId: slotId(state, 4), paused: true })
state = assertBlocked(state, { type: 'build', ...SLOT(0), building: 'polymerPlant' }, 'v3.build.requires_route')
state = act(state, { type: 'build', ...SLOT(0), building: 'petrochemicalPlant' })
assert.equal(state.plantPrograms[slotId(state, 0)].blueprintId, PETRO)
let tick = runV3ProductionTick(resources(state, { feedstock: 100, electricity: 0 }), 25)
close(tick.lines.find((line) => line.buildingId === slotId(tick.state, 0))!.actualWork, 0.8, 'site power 4 < Petro 5/cycle')
assert.equal(tick.lines.find((line) => line.buildingId === slotId(tick.state, 0))!.limitedBy, 'power')
state = act(state, { type: 'build', ...SLOT(1), building: 'powerPlant' })
tick = runV3ProductionTick(resources(state, { feedstock: 100, electricity: 80 }), 25)
const petroLine = tick.lines.find((line) => line.buildingId === slotId(tick.state, 0))!
close(petroLine.actualWork, 1)
close(petroLine.outputQuantity, 5)
close(tick.state.world.feedstock, 90)
close(tick.state.world.waste, 1)
close(tick.state.variantInventory[PETRO].totalCostBasisCents, 800, 'Petro basis = 10 feedstock × 80')

// ---- 14b Polymer uses only free Petro, lowest Q first, never kept/premium ----
state = act(state, { type: 'build', ...SLOT(2), building: 'polymerPlant' })
state = act(state, { type: 'set_pause', buildingId: slotId(state, 0), paused: true })
const premiumId = 'blueprint:fixture:petro:65'
let poly: V3GameState = {
  ...state,
  productBlueprints: {
    ...state.productBlueprints,
    [premiumId]: { ...state.productBlueprints[PETRO], id: premiumId, signature: 'fixture:petro:65', revision: 9, quality: 65, provenance: 'developed', name: 'Fixture Petro Q65' },
  },
}
poly = addV3VariantInventory(poly, PETRO, 10, 1_000).state
poly = addV3VariantInventory(poly, premiumId, 20, 4_000).state
poly = act(poly, { type: 'set_stock_policy', blueprintId: premiumId, keepQuantity: 20, autoSell: false })
poly = resources(poly, { electricity: 80 })
tick = runV3ProductionTick(poly, 25)
const polymer = tick.lines.find((line) => line.buildingId === slotId(poly, 2))!
close(polymer.actualWork, 1)
close(tick.state.variantInventory[PETRO].quantity, 4, 'Q40 free Petro consumed')
close(tick.state.variantInventory[premiumId].quantity, 20, 'kept premium Petro untouched')
close(tick.state.variantInventory[PELLET].quantity, 5)
assert.equal(tick.state.productBlueprints[PELLET].quality, 40, 'pellets do not inherit Petro Q')
close(tick.state.variantInventory[PELLET].totalCostBasisCents, 600, 'pellet basis = 6 × Petro basis 100')
// Only protected stock left → Polymer idles with an input reason, nothing is eaten.
let starved = act(poly, { type: 'set_stock_policy', blueprintId: PETRO, keepQuantity: 10, autoSell: false })
tick = runV3ProductionTick(starved, 25)
close(tick.lines.find((line) => line.buildingId === slotId(starved, 2))!.actualWork, 0)
assert.equal(tick.lines.find((line) => line.buildingId === slotId(starved, 2))!.limitedBy, 'input')
close(getV3ProductQuantity(tick.state, 'petrochemicals'), 30)

// ---- One energy allocator: Lube and Polymer share scarce power without order starvation ----
let shared = act(poly, { type: 'build', ...SLOT(6), building: 'lubricantPlant' })
shared = addV3VariantInventory(resources(shared, { feedstock: 120, electricity: 4.5, crude: 0 }), PETRO, 30, 3_000).state
const evaluation = evaluateV3Production(shared, 25)
const plan = evaluation.lines
const lubeWork = plan.find((line) => line.buildingId === slotId(shared, 6))!.actualWork
const polyWork = plan.find((line) => line.buildingId === slotId(shared, 2))!.actualWork
close(lubeWork, polyWork, 'equal work share across different energy intensities')
assert.ok(lubeWork < 1 && polyWork < 1, 'power is the binding constraint')
close(lubeWork * 3 + polyWork * 6, evaluation.power.chargeAfterGeneration, 'battery fully allocated')

// ---- Waste Treatment: real recipe, commodity output, spot sale, no crew ----
let waste = act(state, { type: 'build', ...SLOT(7), building: 'wasteTreatmentPlant' })
waste = resources(waste, { waste: 40, electricity: 80 })
tick = runV3ProductionTick(waste, 25)
const treat = tick.lines.find((line) => line.buildingId === slotId(waste, 7))!
close(treat.actualWork, 1)
close(tick.state.world.waste, 36)
close(tick.state.commodityInventory.recycledMaterial!.quantity, 2)
close(tick.power.energyUsed, 1)
assertBlocked(tick.state, { type: 'set_module', buildingId: slotId(tick.state, 7), module: 'economy' }, 'v3.module.invalid_cell')
const recycledSale = act(tick.state, { type: 'trade', direction: 'sell', product: 'recycledMaterial', quantity: 2 })
assert.equal(recycledSale.world.moneyCents - tick.state.world.moneyCents, 2 * 1_200)
assertBlocked(recycledSale, { type: 'trade', direction: 'sell', product: 'recycledMaterial', quantity: 1 }, 'v3.trade.insufficient_stock')
assert.equal(getV3ProductCapacity(waste, 'recycledMaterial'), 150)
waste = act(waste, { type: 'build', ...SLOT(8), building: 'recyclingBunker' })
assert.equal(getV3ProductCapacity(waste, 'recycledMaterial'), 250)

// ---- Asphalt manual conversion: goods only, basis transfer, validated ----
let asphalt = resources(c4(), { crude: 10 })
asphalt = assertBlocked(asphalt, { type: 'convert_asphalt', quantity: 11 }, 'v3.trade.insufficient_stock')
asphalt = act(asphalt, { type: 'convert_asphalt', quantity: 10 })
close(asphalt.world.crudeOil, 0)
close(asphalt.commodityInventory.asphalt!.quantity, 10)
close(asphalt.commodityInventory.asphalt!.totalCostBasisCents, 10_000)
close(materialBasisTotal(asphalt) + asphalt.commodityInventory.asphalt!.totalCostBasisCents, 10_000, 'basis moved, not created')
const asphaltSale = act(asphalt, { type: 'trade', direction: 'sell', product: 'asphalt', quantity: 10 })
assert.equal(asphaltSale.world.moneyCents - asphalt.world.moneyCents, 12_000)
assert.equal(asphaltSale.operatingLedger.lifetimeCogsCents - asphalt.operatingLedger.lifetimeCogsCents, 10_000)

// ---- Role × plant for Petro/Polymer/Waste ----
const person = (type: WorkerType): Employee => ({ id: `employee:fixture:${type}`, type, name: type, level: 1, xp: 0, skills: [] })
const roles = Object.keys(V3_ROLES) as WorkerType[]
let staffing = act(state, { type: 'build', ...SLOT(7), building: 'wasteTreatmentPlant' })
staffing = act(staffing, { type: 'assign_duty', employeeId: staffing.world.employees[0].id, duty: { kind: 'reserve' } })
staffing = {
  ...staffing,
  world: { ...staffing.world, employees: [...staffing.world.employees, ...roles.map(person)] },
  employeeDuties: { ...staffing.employeeDuties, ...Object.fromEntries(roles.map((role) => [person(role).id, { kind: 'reserve' as const }])) },
  employeeRecords: { ...staffing.employeeRecords, ...Object.fromEntries(roles.map((role) => [person(role).id, { workTicks: 0, blueprintIds: [], milestoneIds: [] }])) },
}
const cells: Array<[V3ProcessBuilding, number]> = [['petrochemicalPlant', 0], ['polymerPlant', 2], ['wasteTreatmentPlant', 7]]
for (const role of roles) {
  for (const [building, buildingId] of cells) {
    const result = attempt(staffing, { type: 'assign_duty', employeeId: person(role).id, duty: { kind: 'line', buildingId: slotId(staffing, buildingId) } })
    const allowed = V3_ROLES[role].lineBuildings.includes(building)
    assert.equal(result.events[0].messageId, allowed ? 'v3.action.ok' : 'v3.duty.ineligible', `${role} on ${building}`)
  }
}
let hires = act(c4(), { type: 'hire_employee', role: 'chemicalEngineer' })
hires = act(hires, { type: 'hire_employee', role: 'polymerEngineer' })
assert.deepEqual(hires.world.employees.slice(-2).map((employee) => employee.type), ['chemicalEngineer', 'polymerEngineer'])

// ---- Development: Petro/Pellets fees & time; Q75 without specialist at C4 (rank2) ----
let dev = act(c4(), { type: 'build', ...SLOT(0), building: 'laboratory' })
dev = act(dev, { type: 'upgrade', buildingId: slotId(dev, 0) })
dev = act(dev, { type: 'upgrade', buildingId: slotId(dev, 0) })
dev = act(dev, { type: 'buy_research', researchId: 'premiumFuel' })
dev = act(dev, { type: 'buy_research', researchId: 'advancedProcessing' })
assert.equal(getV3AvailableKnowledgeRank(dev, slotId(dev, 0)), 2)
dev = addV3VariantInventory(dev, PETRO, 10, 1_000).state
dev = act(dev, { type: 'start_development', family: 'petrochemicals', profile: 'precision', module: 'precision', knowledgeRank: 2, leadEmployeeId: null, labBuildingId: slotId(dev, 0) })
assert.equal(dev.developmentProject?.quality, 75, 'Q75 without specialist at C4')
assert.equal(dev.developmentProject?.quality, getV3BlueprintQuality('precision', 'precision', 2, 0))
assert.equal(dev.developmentProject?.feeDebitedCents, 30_000)
assert.equal(dev.developmentProject?.remainingTicks, 175)
dev = cycles(dev, 7)
assert.ok(Object.values(dev.productBlueprints).some((blueprint) => blueprint.family === 'petrochemicals' && blueprint.quality === 75))
dev = addV3VariantInventory(dev, PELLET, 10, 1_000).state
dev = act(dev, { type: 'start_development', family: 'plasticPellets', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: null, labBuildingId: slotId(dev, 0) })
assert.equal(dev.developmentProject?.feeDebitedCents, 40_000)
assert.equal(dev.developmentProject?.remainingTicks, 200)

// ---- Land rings at C4: ring2 ($6,250/side) needs the same side of ring1 ----
let land = c4()
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'ring2:south' }, 'v3.land.requires_parcel')
land = act(land, { type: 'unlock_land_parcel', parcelId: 'ring1:south' })
const beforeRing2 = land.world.moneyCents
land = act(land, { type: 'unlock_land_parcel', parcelId: 'ring2:south' })
assert.equal(beforeRing2 - land.world.moneyCents, 625_000)
land = assertBlocked(land, { type: 'unlock_land_parcel', parcelId: 'ring3:south' }, 'v3.land.locked') // after clear
const far = act(land, { type: 'build', x: 45, y: 58, building: 'petrochemicalPlant' })
assert.equal(Object.values(far.world.buildingsById).some((building) => building.type === 'petrochemicalPlant' && building.y === 58), true)
assertBlocked({ ...land, campaignProgress: { ...land.campaignProgress, chapter: 2 } }, { type: 'unlock_land_parcel', parcelId: 'ring2:north' }, 'v3.land.locked')

// ---- Whole-chain conservation, reload determinism, parser safety ----
let chain = act(shared, { type: 'set_pause', buildingId: slotId(shared, 0), paused: false })
chain = act(chain, { type: 'set_pause', buildingId: slotId(chain, 4), paused: false })
chain = act(chain, { type: 'build', ...SLOT(7), building: 'wasteTreatmentPlant' })
chain = resources(chain, { crude: 60, feedstock: 200, waste: 40, electricity: 80 })
for (let index = 0; index < 8; index++) {
  const total = materialBasisTotal(chain) + Object.values(chain.commodityInventory).reduce((sum, entry) => sum + (entry?.totalCostBasisCents ?? 0), 0)
  chain = runV3ProductionTick(chain, 25).state
  const after = materialBasisTotal(chain) + Object.values(chain.commodityInventory).reduce((sum, entry) => sum + (entry?.totalCostBasisCents ?? 0), 0)
  close(after, total, `full-chain basis conservation ${index}`, 1e-4)
}
const reloaded = parseV3GameState(JSON.parse(JSON.stringify(chain)))
assert.equal(reloaded.status, 'loaded')
assert.deepEqual(runV3ProductionTick(reloaded.state!, 25).state, runV3ProductionTick(chain, 25).state)
const bogus = JSON.parse(JSON.stringify(chain))
bogus.plantPrograms[slotId(bogus, 0)].blueprintId = 'commodity:recycledMaterial'
assert.equal(parseV3GameState(bogus).status, 'invalid', 'commodity program only on Waste Treatment')

// ---- Single inventory writer: only productInventory.ts mutates stock collections ----
for (const file of readdirSync('src/game/v3')) {
  if (file === 'productInventory.ts' || file === 'state.ts' || file === 'types.ts') continue
  const source = readFileSync(`src/game/v3/${file}`, 'utf8')
  assert.ok(!/(variantInventory|commodityInventory)\s*:/.test(source), `${file} writes inventory outside productInventory`)
}

console.log('PASS: V3-14a/b Petro, Polymer protection/basis, shared power, Waste Treatment, asphalt, roles, rank2 Q75, land rings, conservation, single inventory writer')
