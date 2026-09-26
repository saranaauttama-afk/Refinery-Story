import assert from 'node:assert/strict'

import { V3_AWARD_PERIOD_TICKS } from '../src/game/v3/awards'
import { evaluateV3CampaignProgress, evaluateV3ClearConditions } from '../src/game/v3/campaign'
import { V3_JOB_TEMPLATES } from '../src/game/v3/jobs'
import { addV3VariantInventory, getV3RollingOperatingProfit } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { V3_DEFAULT_BLUEPRINT_ID, createInitialV3GameState } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState, V3JobReceipt, V3ProductBlueprint, V3ProductFamily } from '../src/game/v3/types'
import { act, assertBlocked, slotId } from './v3-check-helpers'

// ---- Showcase catalog (Master §11) ----
const showcases = Object.values(V3_JOB_TEMPLATES).filter((template) => template.kind === 'showcase')
assert.deepEqual(showcases.map((template) => [template.family, template.quantity]), [
  ['gasoline', 150], ['lubricants', 120], ['jetFuel', 100], ['petrochemicals', 100], ['plasticPellets', 80],
])
assert.ok(showcases.every((template) => template.minimumQuality === 65 && template.researchReward === 15 && template.minimumChapter === 4))

/** Labelled constructed fixtures: C4, cash, and a certified blueprint inserted directly. */
function c4(): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter: 4 }, world: { ...base.world, moneyCents: 50_000_000 } }
}
function blueprint(state: V3GameState, family: V3ProductFamily, quality: number, provenance: 'developed' | 'default'): { state: V3GameState; id: string } {
  const id = `blueprint:fixture:${family}:${quality}:${provenance}`
  const entry: V3ProductBlueprint = {
    ...state.productBlueprints[V3_DEFAULT_BLUEPRINT_ID[family]], id, signature: id, revision: 50, quality, provenance, name: `Fixture ${quality}`,
  }
  return { id, state: { ...state, productBlueprints: { ...state.productBlueprints, [id]: entry } } }
}
function partnerReceipt(templateId: string, blueprintId: string, tick: number): V3JobReceipt {
  return { id: `receipt:fixture:${templateId}`, jobId: `job:fixture:${templateId}`, templateId, status: 'completed', settledAtTick: tick, deliveredQuantity: 1, paidCents: 0, deliveredByBlueprint: { [blueprintId]: 1 } }
}
function shipShowcase(state: V3GameState, blueprintId: string): V3GameState {
  state = act(state, { type: 'accept_job', templateId: 'showcase:gasoline' })
  while (state.acceptedJob) {
    const batch = Math.min(20, state.acceptedJob.quantity - state.acceptedJob.deliveredQuantity)
    state = addV3VariantInventory(state, blueprintId, batch, batch * 500).state
    state = act(state, { type: 'dispatch_job', quantity: batch, blueprintId })
  }
  return state
}

// ---- Showcase needs a DEVELOPED Q≥65 blueprint; no client rank change ----
let state = c4()
const factory = blueprint(state, 'gasoline', 70, 'default')
state = addV3VariantInventory(factory.state, factory.id, 20, 2_000).state
state = act(state, { type: 'accept_job', templateId: 'showcase:gasoline' })
state = assertBlocked(state, { type: 'dispatch_job', quantity: 10, blueprintId: factory.id }, 'v3.job.insufficient_qualified_stock')
state = act(state, { type: 'cancel_job' })
state = { ...state, world: { ...state.world, tickCount: state.world.tickCount + 600 } }
const developed = blueprint(state, 'gasoline', 65, 'developed')
const rpBefore = developed.state.world.researchPoints
let shown = shipShowcase(developed.state, developed.id)
assert.ok(shown.campaignProgress.showcaseReceiptId)
assert.equal(shown.clientProgress.showcase, undefined, 'Showcase changes no client rank')
assert.ok(shown.world.researchPoints - rpBefore >= 15)
assertBlocked(shown, { type: 'accept_job', templateId: 'showcase:gasoline' }, 'v3.job.locked')

// ---- Clear conditions are exact ----
const jet = blueprint(shown, 'jetFuel', 75, 'developed')
const withPartners = (base: V3GameState, templates: string[]): V3GameState => ({
  ...base,
  jobReceipts: { ...base.jobReceipts, receipts: [...base.jobReceipts.receipts, ...templates.map((id) => partnerReceipt(id, id.startsWith('airline') ? jet.id : developed.id, base.world.tickCount))] },
})
// Recognized profit: sell stock above basis inside the window after 180s have elapsed.
function profitable(base: V3GameState): V3GameState {
  let next = { ...base, world: { ...base.world, tickCount: Math.max(base.world.tickCount, 1_000) } }
  next = addV3VariantInventory(next, V3_DEFAULT_BLUEPRINT_ID.gasoline, 10, 100).state
  return act(next, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: 10 })
}
const noAdvanced = profitable(withPartners(jet.state, ['local:partner', 'performance:partner', 'fleet:partner']))
assert.equal(evaluateV3ClearConditions(noAdvanced).advancedClient, false)
assert.equal(noAdvanced.campaignProgress.chapter, 4, 'needs Airline or Materials among the Partners')
const twoPartners = profitable(withPartners(jet.state, ['local:partner', 'airline:partner']))
assert.equal(twoPartners.campaignProgress.chapter, 4, 'needs 3 of 5')
const noShowcase = profitable(withPartners({ ...jet.state, campaignProgress: { ...jet.state.campaignProgress, showcaseReceiptId: null } }, ['local:partner', 'performance:partner', 'airline:partner']))
assert.equal(noShowcase.campaignProgress.chapter, 4, 'needs a Showcase')
// Gifts/bonuses and estimated-basis receipts cannot fake profit.
let bonusOnly = withPartners({ ...jet.state, operatingLedger: { ...jet.state.operatingLedger, buckets: [] } }, ['local:partner', 'performance:partner', 'airline:partner'])
bonusOnly = { ...bonusOnly, world: { ...bonusOnly.world, tickCount: 2_000 } }
bonusOnly = runV3ProductionTick(bonusOnly, 25).state
assert.ok(getV3RollingOperatingProfit(bonusOnly).cents <= 0)
assert.equal(bonusOnly.campaignProgress.chapter, 4, 'no recognized profit, no clear')
let estimated = addV3VariantInventory(bonusOnly, V3_DEFAULT_BLUEPRINT_ID.gasoline, 10, 0, true).state
estimated = act(estimated, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: 10 })
assert.equal(estimated.campaignProgress.chapter, 4, 'estimated-basis sale is unrecognized')
// Window must be complete (180s of simulated time).
const early = withPartners({ ...jet.state, world: { ...jet.state.world, tickCount: 100 } }, ['local:partner', 'performance:partner', 'airline:partner'])
const earlySale = act(addV3VariantInventory(early, V3_DEFAULT_BLUEPRINT_ID.gasoline, 10, 100).state, { type: 'trade', direction: 'sell', product: 'gasoline', quantity: 10 })
assert.equal(earlySale.campaignProgress.chapter, 4, 'rolling 180s window not complete yet')

// Positive case: exactly the Master conditions, nothing else required.
const cleared = profitable(withPartners(jet.state, ['local:partner', 'performance:partner', 'airline:partner']))
assert.equal(cleared.campaignProgress.chapter, 5)
assert.ok(cleared.campaignProgress.claimedFlags.includes('clear'))
const report = cleared.campaignReport!
assert.deepEqual(report.partners, ['airline', 'local', 'performance'])
assert.deepEqual(report.families, ['gasoline', 'jetFuel'])
assert.equal(report.showcaseTemplateId, 'showcase:gasoline')
assert.equal(report.starProduct?.blueprintId, developed.id)
assert.ok(report.lotsUsed <= 9, 'no requirement to own every building')
assert.ok(!cleared.world.unlockedResearchIds.length, 'no all-research gate')

// ---- Sticky clear, single payout, report restorable ----
const cashAtClear = cleared.world.moneyCents
let after = act(cleared, { type: 'demolish', buildingId: slotId(cleared, 5), expectedBuilding: 'gasolineTank' })
after = { ...after, world: { ...after.world, moneyCents: 0 } }
after = evaluateV3CampaignProgress(after)
assert.equal(after.campaignProgress.chapter, 5, 'clear is sticky')
assert.deepEqual(after.campaignReport, report, 'report emitted once, unchanged')
assert.ok(cleared.world.moneyCents <= cashAtClear, 'clear itself pays no money')
const reloaded = parseV3GameState(JSON.parse(JSON.stringify(cleared)))
assert.equal(reloaded.status, 'loaded')
assert.deepEqual(reloaded.state!.campaignReport, report)

// ---- 6×6 only after clear ----
let yard = act(act(cleared, { type: 'expand_grid' }), { type: 'expand_grid' })
const beforeSix = yard.world.moneyCents
yard = act(yard, { type: 'expand_grid' })
assert.equal(yard.world.grid.length, 36)
assert.equal(beforeSix - yard.world.moneyCents, 10_000_000)
assertBlocked(yard, { type: 'expand_grid' }, 'v3.expand.unavailable')

// ---- Award periods: frozen targets, grade RP only above best, no penalty ----
let award = createInitialV3GameState()
assert.deepEqual([award.awards.current.deliveryTarget, award.awards.current.varietyTarget], [60, 1])
award = { ...award, campaignProgress: { ...award.campaignProgress, chapter: 4 } }
assert.equal(award.awards.current.deliveryTarget, 60, 'targets stay frozen mid-period')
award = { ...award, world: { ...award.world, tickCount: V3_AWARD_PERIOD_TICKS - 25 } }
award = { ...award, awards: { ...award.awards, current: { ...award.awards.current, qualifiedUnits: 60, qualifiedFamilies: ['gasoline'] } } }
award = { ...award, operatingLedger: { ...award.operatingLedger, lifetimeRecognizedProfitCents: 1_000 } }
const rp0 = award.world.researchPoints
award = runV3ProductionTick(award, 25).state
assert.equal(award.awards.history.at(-1)!.grade, 'S')
assert.equal(award.world.researchPoints - rp0, 15)
assert.equal(award.awards.current.deliveryTarget, 300, 'next period snapshots 5 families at C4')
const rp1 = award.world.researchPoints
award = { ...award, world: { ...award.world, tickCount: 2 * V3_AWARD_PERIOD_TICKS - 25 } }
award = { ...award, awards: { ...award.awards, current: { ...award.awards.current, qualifiedUnits: 300, qualifiedFamilies: ['gasoline', 'jetFuel', 'lubricants'] } } }
award = runV3ProductionTick(award, 25).state
assert.equal(award.world.researchPoints, rp1, 'no second award payout (cap 15 per run)')
const moneyBefore = award.world.moneyCents
award = { ...award, world: { ...award.world, tickCount: 3 * V3_AWARD_PERIOD_TICKS - 25 } }
award = runV3ProductionTick(award, 25).state
assert.equal(award.awards.history.at(-1)!.grade, '-')
assert.ok(award.world.moneyCents >= moneyBefore - 1_000, 'low grade has no penalty beyond normal costs')

// ---- Revision-10 saves: old receipts become unrecognized (no fake profit) ----
const rev10 = JSON.parse(JSON.stringify(profitable(c4())))
rev10.schemaRevision = 10
delete rev10.awards
delete rev10.campaignReport
delete rev10.operatingLedger.lifetimeRecognizedProfitCents
for (const bucket of rev10.operatingLedger.buckets) delete bucket.unrecognizedCents
const upgraded = parseV3GameState(rev10)
assert.equal(upgraded.status, 'loaded')
assert.ok(getV3RollingOperatingProfit(upgraded.state!).cents <= 0, 'pre-upgrade sales cannot fake clear profit')

// ---- Reset path is a fresh state, not NewGame+ ----
const fresh = createInitialV3GameState()
assert.equal(fresh.campaignProgress.chapter, 0)
assert.equal(fresh.campaignReport, null)

console.log('PASS: V3-15 showcase (developed Q65), exact clear conditions, unrecognized bonuses/estimated sales, sticky clear/report, 6x6, frozen awards, rev10 load')
