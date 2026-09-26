import assert from 'node:assert/strict'

import { V3_JOB_TEMPLATES } from '../src/game/v3/jobs'
import { getV3OfferView } from '../src/game/v3/offers'
import { addV3VariantInventory, getV3ProductCapacity, getV3StockAllocations } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { BuildingType } from '../src/game/types'
import type { V3GameState } from '../src/game/v3/types'
import { act, assertBlocked, attempt, close } from './v3-check-helpers'

const PETRO = V3_DEFAULT_BLUEPRINT_ID.petrochemicals
const PELLET = V3_DEFAULT_BLUEPRINT_ID.plasticPellets

// ---- 15 milestones across 5 clients; Materials branches follow S6 economics ----
const milestones = Object.values(V3_JOB_TEMPLATES).filter((template) => template.kind === 'milestone')
assert.equal(milestones.length, 15)
assert.equal(new Set(milestones.map((template) => template.clientId)).size, 5)
const partner = V3_JOB_TEMPLATES['materials:partner']
assert.deepEqual(partner.branches!.map((branch) => [branch.family, branch.minimumQuality, branch.quantity, branch.unitPriceCents]), [
  ['petrochemicals', 65, 160, 11_050],
  ['plasticPellets', 75, 100, 22_800],
])

/** Labelled constructed fixture at C4 with a 5×5 yard (legal C4 proven in check:v3-clients). */
function c4(): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter: 4 }, world: { ...base.world, moneyCents: 100_000_000 } }
}
let state = c4()
assertBlocked({ ...state, campaignProgress: { ...state.campaignProgress, chapter: 3 } }, { type: 'accept_job', templateId: 'materials:trial', branch: 'petrochemicals' }, 'v3.job.locked')
state = assertBlocked(state, { type: 'accept_job', templateId: 'materials:trial' }, 'v3.job.invalid_branch')
state = assertBlocked(state, { type: 'accept_job', templateId: 'materials:trial', branch: 'gasoline' }, 'v3.job.invalid_branch')
state = assertBlocked(state, { type: 'accept_job', templateId: 'local:trial', branch: 'jetFuel' }, 'v3.job.invalid_branch')

// ---- Petro branch: reservation protects contract Petro from Polymer ----
state = act(state, { type: 'set_pause', buildingId: 4, paused: true })
state = act(state, { type: 'build', buildingId: 0, building: 'petrochemicalPlant' })
state = act(state, { type: 'set_pause', buildingId: 0, paused: true })
state = act(state, { type: 'build', buildingId: 1, building: 'polymerPlant' })
state = act(state, { type: 'build', buildingId: 2, building: 'powerPlant' })
state = { ...state, world: { ...state.world, electricity: 80, crudeOil: 0 }, materialCostBasis: { ...state.materialCostBasis, crudeCents: 0 } }
state = addV3VariantInventory(state, PETRO, 40, 4_000).state
state = act(state, { type: 'accept_job', templateId: 'materials:trial', branch: 'petrochemicals' })
assert.equal(state.acceptedJob!.family, 'petrochemicals')
assert.equal(state.acceptedJob!.quantity, 40)
assert.equal(getV3StockAllocations(state, 'petrochemicals')[0].jobReserved, 40)
let tick = runV3ProductionTick(state, 25)
close(tick.lines.find((line) => line.buildingId === 1)!.actualWork, 0, 'Polymer cannot eat contract Petro')
close(tick.state.variantInventory[PETRO].quantity, 40)
// Wrong branch cannot submit: Pellets never ship into a Petro job.
let wrong = addV3VariantInventory(tick.state, PELLET, 30, 3_000).state
wrong = assertBlocked(wrong, { type: 'dispatch_job', quantity: 10, blueprintId: PELLET }, 'v3.job.insufficient_qualified_stock')
const cash = wrong.world.moneyCents
wrong = act(wrong, { type: 'dispatch_job', quantity: 40 })
assert.equal(wrong.world.moneyCents - cash, 40 * 7_800 + 31_200)
assert.equal(wrong.clientProgress.materials.lastCompletedMilestoneId, 'materials:trial')
// Released reservation: surplus Petro now feeds Polymer again.
wrong = addV3VariantInventory({ ...wrong, world: { ...wrong.world, electricity: 80 } }, PETRO, 12, 1_200).state
tick = runV3ProductionTick(wrong, 25)
close(tick.lines.find((line) => line.buildingId === 1)!.actualWork, 1)

// ---- Pellet branch for Regular; branched repeats are manual only ----
let pellets = act({ ...wrong, productBlueprints: { ...wrong.productBlueprints, 'blueprint:fixture:pellet:65': { ...wrong.productBlueprints[PELLET], id: 'blueprint:fixture:pellet:65', signature: 'fixture:pellet:65', revision: 9, quality: 65, provenance: 'developed', name: 'Fixture Pellets Q65' } } }, { type: 'accept_job', templateId: 'materials:regular', branch: 'plasticPellets' })
assert.equal(pellets.acceptedJob!.minimumQuality, 65)
assert.equal(pellets.acceptedJob!.lockedUnitPriceCents, 20_400)
assertBlocked(pellets, { type: 'dispatch_job', quantity: 10, blueprintId: PELLET }, 'v3.job.insufficient_qualified_stock')
for (let shipped = 0; shipped < 50; shipped += 25) {
  pellets = addV3VariantInventory(pellets, 'blueprint:fixture:pellet:65', 25, 2_500).state
  pellets = act(pellets, { type: 'dispatch_job', quantity: 25, blueprintId: 'blueprint:fixture:pellet:65' })
}
assert.equal(pellets.clientProgress.materials.lastCompletedMilestoneId, 'materials:regular')
assertBlocked({ ...pellets, campaignProgress: { ...pellets.campaignProgress, chapter: 4 } }, { type: 'set_auto_repeat', templateId: 'materials:repeat' }, 'v3.job.auto_repeat_invalid')
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(pellets))).status, 'loaded')
const pelletView = getV3OfferView(pellets, 'materials:partner', 'plasticPellets')
assert.equal(pelletView.family, 'plasticPellets')
assert.equal(pelletView.minimumQuality, 75)
assert.notEqual(pelletView.feasibility, 'unavailable', 'Q75 attainable at C4')

// ---- Family cap shared across Q variants ----
let cap = c4()
const capacity = getV3ProductCapacity(cap, 'petrochemicals')
const premiumId = 'blueprint:fixture:petro:65'
cap = { ...cap, productBlueprints: { ...cap.productBlueprints, [premiumId]: { ...cap.productBlueprints[PETRO], id: premiumId, signature: 'fixture:petro:65', revision: 9, quality: 65, provenance: 'developed', name: 'Fixture Petro Q65' } } }
cap = addV3VariantInventory(cap, PETRO, capacity - 5, 0).state
const premium = addV3VariantInventory(cap, premiumId, 50, 0)
assert.equal(premium.quantity, 5, 'second variant only gets remaining family space')

// ---- 25-lot spatial budget: compact full chain fits a 5×5 yard via legal builds ----
let yard = act(act(c4(), { type: 'expand_grid' }), { type: 'expand_grid' })
assert.equal(yard.world.grid.length, 25)
const chain: BuildingType[] = [
  'distillationUnit', 'distillationUnit', 'laboratory', 'powerPlant', 'lubricantPlant', 'jetFuelPlant',
  'petrochemicalPlant', 'polymerPlant', 'lubricantTank', 'jetFuelTank', 'petrochemicalTank', 'pelletSilo',
  'salesOffice', 'wasteTreatmentPlant',
]
for (const building of chain) {
  const cell = yard.world.grid.findIndex((entry) => entry === null)
  yard = act(yard, { type: 'build', buildingId: cell, building })
}
const used = yard.world.grid.filter((cell) => cell !== null).length
assert.equal(used, 17, 'starter 3 + 14 = Master example minus workshop')
assert.ok(used <= 25)
assert.equal(parseV3GameState(JSON.parse(JSON.stringify(yard))).status, 'loaded')
void attempt

console.log('PASS: V3-14c Materials OR-branch (15 milestones), reservation vs Polymer, wrong-branch blocked, shared family cap, 25-lot full chain')
