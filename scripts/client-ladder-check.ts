import assert from 'node:assert/strict'

import { V3_JOB_TEMPLATES, V3_REPEAT_COOLDOWN_TICKS } from '../src/game/v3/jobs'
import { getV3AttainableQuality, getV3OfferView, getV3RushTerms } from '../src/game/v3/offers'
import { addV3VariantInventory, getV3ProductCapacity, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3ProductBlueprint, V3ProductFamily } from '../src/game/v3/types'
import { act, assertBlocked, attempt, legalChapterTwo } from './v3-check-helpers'

// ---- Catalog: 12 milestones for 4 clients, S6 economics, no Materials yet ----
// V3-13 scope: the four fuel clients (Materials joined in V3-14, see check:v3-materials).
const milestones = Object.values(V3_JOB_TEMPLATES).filter((template) => template.kind === 'milestone' && template.clientId !== 'materials')
assert.equal(milestones.length, 12)
assert.deepEqual([...new Set(milestones.map((template) => template.clientId))].sort(), ['airline', 'fleet', 'local', 'performance'])
for (const template of milestones) {
  const stage = template.id.split(':')[1]
  assert.equal(template.researchReward, { trial: 5, regular: 10, partner: 15 }[stage])
  assert.equal(template.reputationReward, { trial: 5, regular: 10, partner: 20 }[stage])
  assert.equal(template.completionBonusCents, Math.round(template.quantity * template.unitPriceCents * 0.1))
}
assert.equal(V3_JOB_TEMPLATES['airline:partner'].unitPriceCents, 9_500, 'Jet $50 × 1.90')
assert.equal(V3_JOB_TEMPLATES['local:repeat'].completionBonusCents, 0)
assert.equal(V3_JOB_TEMPLATES['local:repeat'].researchReward, 0)

/** Labelled fixture: certified blueprint inserted directly to isolate job rules. */
function withBlueprint(state: V3GameState, family: V3ProductFamily, quality: number): { state: V3GameState; id: string } {
  const id = `blueprint:fixture:${family}:${quality}`
  const blueprint: V3ProductBlueprint = {
    id, signature: `fixture:${family}:${quality}`, revision: 99, family, name: `Fixture ${family} Q${quality}`,
    quality, profile: 'precision', module: 'none', minPlantLevel: 1, provenance: 'developed',
    commissionedAtTick: state.world.tickCount, pinned: false, archived: false,
  }
  return { id, state: { ...state, productBlueprints: { ...state.productBlueprints, [id]: blueprint } } }
}
function stock(state: V3GameState, blueprintId: string, quantity: number): V3GameState {
  return addV3VariantInventory(state, blueprintId, quantity, quantity * 100).state
}
/** Staged delivery: tanks need not hold the whole order (Master §5). */
function complete(state: V3GameState, templateId: string, blueprintId: string): V3GameState {
  const family = state.productBlueprints[blueprintId].family
  state = act(state, { type: 'accept_job', templateId })
  while (state.acceptedJob?.templateId === templateId) {
    const remaining = state.acceptedJob.quantity - state.acceptedJob.deliveredQuantity
    const space = Math.floor(getV3ProductCapacity(state, family) - getV3ProductQuantity(state, family))
    const batch = Math.min(remaining, Math.max(1, space))
    state = stock(state, blueprintId, batch)
    state = act(state, { type: 'dispatch_job', quantity: batch, blueprintId })
  }
  return state
}
const tick = (state: V3GameState, ticks: number) => {
  for (let index = 0; index < ticks; index += 25) state = runV3ProductionTick(state, 25).state
  return state
}

// ---- Ladder order; first milestone never infers later ones ----
let state = legalChapterTwo()
state = assertBlocked(state, { type: 'accept_job', templateId: 'local:partner' }, 'v3.job.locked')
state = assertBlocked(state, { type: 'accept_job', templateId: 'fleet:regular' }, 'v3.job.requires_previous')
const q75 = withBlueprint(state, 'gasoline', 75)
state = complete(q75.state, 'performance:trial', q75.id)
assert.ok(!state.jobReceipts.receipts.some((receipt) => receipt.templateId === 'performance:regular'))
assert.equal(state.clientProgress.performance.lastCompletedMilestoneId, 'performance:trial')
assertBlocked(state, { type: 'accept_job', templateId: 'performance:repeat' }, 'v3.job.requires_previous')

// ---- Cancellation cannot farm premium, RP or XP; cooldown counts from acceptance ----
let farm = stock(state, q75.id, 80)
farm = act(farm, { type: 'accept_job', templateId: 'local:regular' })
const acceptedAt = farm.world.tickCount
farm = act(farm, { type: 'dispatch_job', quantity: 40, blueprintId: q75.id })
const before = { rp: farm.world.researchPoints, reputation: farm.world.reputation, xp: farm.world.employees.map((employee) => employee.xp) }
const cashBeforeCancel = farm.world.moneyCents
farm = act(farm, { type: 'cancel_job' })
assert.equal(farm.world.moneyCents, cashBeforeCancel, 'no bonus, nothing clawed back')
assert.equal(farm.world.researchPoints, before.rp)
assert.equal(farm.world.reputation, before.reputation)
assert.deepEqual(farm.world.employees.map((employee) => employee.xp), before.xp)
assert.equal(farm.jobReceipts.receipts.at(-1)!.status, 'cancelled')
farm = assertBlocked(farm, { type: 'accept_job', templateId: 'local:regular' }, 'v3.job.cooldown')
assert.equal(farm.jobReceipts.templateRetryAtTick['local:regular'], acceptedAt + V3_REPEAT_COOLDOWN_TICKS)
farm = { ...farm, world: { ...farm.world, tickCount: acceptedAt + V3_REPEAT_COOLDOWN_TICKS } }
farm = act(farm, { type: 'accept_job', templateId: 'local:regular' })
assert.equal(farm.acceptedJob!.deliveredQuantity, 0, 'fresh order; earlier shipments are not credited twice')

// ---- C3 route A: Local Regular + Performance Regular + one upgrade ----
// legalChapterTwo already shipped local:trial.
let routeA = complete(state, 'local:regular', q75.id)
routeA = complete(routeA, 'performance:regular', q75.id)
assert.equal(routeA.campaignProgress.chapter, 2, 'two Regulars alone are not enough')
routeA = { ...routeA, world: { ...routeA.world, moneyCents: routeA.world.moneyCents + 500_000 } }
routeA = act(routeA, { type: 'upgrade', buildingId: 5 })
assert.equal(routeA.campaignProgress.chapter, 3, 'upgrade transaction triggers C3')

// ---- C3 route B: Local Regular + Fleet Regular (Lube) + power upgrade ----
let routeB = complete(state, 'local:regular', q75.id)
const lube = withBlueprint(routeB, 'lubricants', 55)
routeB = complete(lube.state, 'fleet:trial', lube.id)
routeB = complete(routeB, 'fleet:regular', lube.id)
routeB = { ...routeB, world: { ...routeB.world, moneyCents: routeB.world.moneyCents + 2_000_000 } }
routeB = act(routeB, { type: 'build', buildingId: 1, building: 'powerPlant' })
assert.equal(routeB.campaignProgress.chapter, 2)
routeB = act(routeB, { type: 'upgrade', buildingId: 1 })
assert.equal(routeB.campaignProgress.chapter, 3, 'distinct non-Performance C3 route')

// ---- Repeats: income only, no RP/reputation/XP; cooldown from acceptance ----
let repeat = routeA
const rp = repeat.world.researchPoints
const reputation = repeat.world.reputation
repeat = stock(repeat, q75.id, 80)
repeat = act(repeat, { type: 'accept_job', templateId: 'local:repeat' })
const repeatAccepted = repeat.world.tickCount
const xpBefore = repeat.world.employees.map((employee) => employee.xp)
const cashBefore = repeat.world.moneyCents
repeat = act(repeat, { type: 'dispatch_job', quantity: 80, blueprintId: q75.id })
assert.equal(repeat.world.moneyCents - cashBefore, 80 * 2_160, 'Regular quote, no bonus')
assert.equal(repeat.world.researchPoints, rp)
assert.equal(repeat.world.reputation, reputation)
assert.deepEqual(repeat.world.employees.map((employee) => employee.xp), xpBefore)
repeat = assertBlocked(repeat, { type: 'accept_job', templateId: 'local:repeat' }, 'v3.job.cooldown')

// ---- Auto-repeat: C3 opt-in, re-accepts the repeat after cooldown, stoppable ----
assertBlocked(state, { type: 'set_auto_repeat', templateId: 'local:repeat' }, 'v3.job.auto_repeat_locked')
assertBlocked(repeat, { type: 'set_auto_repeat', templateId: 'local:regular' }, 'v3.job.auto_repeat_invalid')
assertBlocked(repeat, { type: 'set_auto_repeat', templateId: 'fleet:repeat' }, 'v3.job.auto_repeat_invalid')
let auto = act(repeat, { type: 'set_auto_repeat', templateId: 'local:repeat' })
auto = act(auto, { type: 'trade', direction: 'buy', product: 'crude', quantity: 6 })
auto = tick(auto, 25)
assert.equal(auto.acceptedJob, null, 'cooldown still running')
auto = tick(auto, repeatAccepted + V3_REPEAT_COOLDOWN_TICKS - auto.world.tickCount)
assert.equal(auto.acceptedJob?.templateId, 'local:repeat', 'auto re-accepted after cooldown')
assert.ok(auto.acceptedJob!.id.startsWith('job:auto:'))
const reloadedAuto = parseV3GameState(JSON.parse(JSON.stringify(auto)))
assert.equal(reloadedAuto.status, 'loaded')
assert.equal(reloadedAuto.state!.jobReceipts.autoRepeatTemplateId, 'local:repeat')
auto = act(act(auto, { type: 'set_auto_repeat', templateId: null }), { type: 'cancel_job' })
auto = tick(auto, V3_REPEAT_COOLDOWN_TICKS + 25)
assert.equal(auto.acceptedJob, null, 'auto-repeat off: no new job')

// ---- Rush: proven route, ≤90s output, deadline ≥180s & ≥2×ETA, pauses, expiry keeps pay ----
let rush = { ...routeA, world: { ...routeA.world, crudeOil: 60 } }
rush = act(rush, { type: 'set_program', buildingId: 4, blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline })
rush = tick(rush, 150)
assertBlocked(rush, { type: 'accept_job', templateId: 'fleet:rush' }, 'v3.job.requires_previous')
const terms = getV3RushTerms(rush, 'local:rush')!
assert.ok(terms, 'Rush offered on proven Local route with a qualifying line')
const gasLine = runV3ProductionTick(rush, 25).lines.find((line) => line.buildingId === 4)!
assert.ok(terms.quantity <= gasLine.potentialOutputPerMinute * 1.5 + 1e-9)
assert.ok(terms.deadlineTicks >= 900)
assert.ok(terms.deadlineTicks / 5 >= 2 * terms.quantity / gasLine.potentialOutputPerMinute * 60 - 1)
rush = act(rush, { type: 'accept_job', templateId: 'local:rush' })
const job = rush.acceptedJob!
assert.equal(job.quantity, terms.quantity)
assert.equal(job.lockedUnitPriceCents, 2_160, 'repeat unit quote')
assert.equal(job.completionBonusCents, Math.round(terms.quantity * 2_160 * 0.25))
assert.equal(job.deadlineTick, rush.world.tickCount + terms.deadlineTicks)
const paused = parseV3GameState(JSON.parse(JSON.stringify(rush))).state!
assert.equal(paused.acceptedJob!.deadlineTick, job.deadlineTick, 'closing/reloading does not run the clock')
let expired = act({ ...rush, stockPolicies: {} }, { type: 'set_pause', buildingId: 4, paused: true })
expired = { ...expired, variantInventory: Object.fromEntries(Object.entries(expired.variantInventory).filter(([id]) => expired.productBlueprints[id].family !== 'gasoline')) }
expired = stock(expired, V3_DEFAULT_BLUEPRINT_ID.gasoline, 1)
expired = act(expired, { type: 'dispatch_job', quantity: 1 })
const paidBeforeExpiry = expired.world.moneyCents
expired = tick(expired, job.deadlineTick! - expired.world.tickCount + 25)
assert.equal(expired.acceptedJob, null)
assert.equal(expired.jobReceipts.receipts.at(-1)!.status, 'expired')
assert.equal(expired.jobReceipts.receipts.at(-1)!.paidCents, 2_160, 'shipped units stay paid')
assert.ok(expired.world.moneyCents <= paidBeforeExpiry, 'no bonus on expiry')

// ---- C4: Partner + certified Q≥65; Airline Q75 reachable at C3 ----
let c4 = complete(routeA, 'local:partner', q75.id)
assert.equal(c4.campaignProgress.chapter, 4)
// Negative: a Partner without any certified Q≥65 blueprint stays in C3.
let noShowcase: V3GameState = { ...routeB, productBlueprints: Object.fromEntries(Object.entries(routeB.productBlueprints).filter(([, blueprint]) => blueprint.quality < 65)) }
noShowcase = { ...noShowcase, variantInventory: Object.fromEntries(Object.entries(noShowcase.variantInventory).filter(([id]) => noShowcase.productBlueprints[id])) }
noShowcase = complete(withBlueprint(noShowcase, 'gasoline', 55).state, 'local:partner', 'blueprint:fixture:gasoline:55')
assert.equal(noShowcase.campaignProgress.chapter, 3, 'Partner alone is not C4')
const showcase = withBlueprint(noShowcase, 'lubricants', 65)
assert.equal(act(showcase.state, { type: 'set_auto_repeat', templateId: null }).campaignProgress.chapter, 4, 'next transaction with Q65 certified → C4')
assert.ok(getV3AttainableQuality(3) >= 75, 'Airline Partner Q75 attainable at C3')
assert.equal(getV3AttainableQuality(1), 60)
const airlineAtC2 = getV3OfferView(state, 'airline:trial')
assert.equal(airlineAtC2.acceptBlocker, 'locked')
assert.equal(airlineAtC2.feasibility, 'planned')
assert.ok(airlineAtC2.reasons.includes('no_plant'))
const airlineAtC3 = getV3OfferView(routeA, 'airline:partner')
assert.notEqual(airlineAtC3.feasibility, 'unavailable')
const localView = getV3OfferView(rush, 'local:repeat')
assert.equal(localView.feasibility, 'ready')
assert.ok(localView.etaSeconds !== null)
assert.equal(getV3OfferView(createInitialV3GameState(), 'performance:partner').reasons.includes('needs_blueprint'), true)
void attempt

console.log('PASS: V3-13 ladder (12 milestones/4 clients), order, cancel/cooldown, repeats, auto-repeat, Rush clock/expiry, two C3 routes, C4, Q75 feasibility')
