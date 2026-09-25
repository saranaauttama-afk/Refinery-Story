import assert from 'node:assert/strict'

import { reduceV3Action } from '../src/game/v3/actions'
import { runV3ProductionTick } from '../src/game/v3/production'
import { getV3ProductQuantity } from '../src/game/v3/productInventory'
import { createInitialV3GameState } from '../src/game/v3/state'
import type { V3GameState, V3ProcessProfile, V3ProductBlueprint } from '../src/game/v3/types'

type Market = 'spot' | 'job'
type ScenarioResult = {
  profile: V3ProcessProfile
  quality: number
  market: Market
  quantity: number
  seconds: number
  receiptsDollars: number
  cogsDollars: number
  wagesDollars: number
  contributionDollars: number
  contributionPerMinute: number
}

const PROFILE_QUALITY: Record<'volume' | 'precision', number> = { volume: 35, precision: 55 }
const JOB_BY_PROFILE = { volume: 'local:trial', precision: 'performance:trial' } as const
const JOB_QUANTITY = { volume: 40, precision: 35 } as const

function fixture(profile: 'volume' | 'precision'): { state: V3GameState; blueprint: V3ProductBlueprint } {
  const base = createInitialV3GameState()
  const blueprint: V3ProductBlueprint = {
    ...base.productBlueprints['blueprint:gasoline:standard:1'],
    id: `blueprint:gasoline:${profile}:gate`,
    signature: `gasoline|${profile}|none|0|0`,
    revision: 2,
    name: `${profile} gate`,
    quality: PROFILE_QUALITY[profile],
    profile,
    provenance: 'developed',
    commissionedAtTick: 0,
  }
  return {
    blueprint,
    state: {
      ...base,
      world: { ...base.world, moneyCents: 1_000_000, crudeOil: 60 },
      productBlueprints: { ...base.productBlueprints, [blueprint.id]: blueprint },
      variantInventory: {},
      materialCostBasis: { ...base.materialCostBasis, crudeCents: 60_000 },
      campaignProgress: { ...base.campaignProgress, chapter: 1 },
      plantPrograms: {
        4: { ...base.plantPrograms[4], blueprintId: blueprint.id },
      },
    },
  }
}

function run(profile: 'volume' | 'precision', market: Market): ScenarioResult {
  const { blueprint, state: initial } = fixture(profile)
  const quantity = market === 'job' ? JOB_QUANTITY[profile] : 35
  let state = initial
  let ticks = 0
  while (getV3ProductQuantity(state, 'gasoline') + 1e-8 < quantity && ticks < 1_000) {
    state = runV3ProductionTick(state, 1).state
    ticks += 1
  }
  assert.ok(getV3ProductQuantity(state, 'gasoline') + 1e-8 >= quantity, `${profile}/${market} must reach target`)
  const beforeReceipts = state.operatingLedger.lifetimeReceiptsCents
  const beforeCogs = state.operatingLedger.lifetimeCogsCents
  if (market === 'spot') {
    state = reduceV3Action(state, {
      type: 'trade', sequence: state.nextActionSequence, direction: 'sell', product: 'gasoline',
      quantity, blueprintId: blueprint.id,
    }).state
  } else {
    state = reduceV3Action(state, {
      type: 'accept_job', sequence: state.nextActionSequence, templateId: JOB_BY_PROFILE[profile],
    }).state
    state = reduceV3Action(state, {
      type: 'dispatch_job', sequence: state.nextActionSequence, quantity, blueprintId: blueprint.id,
    }).state
  }
  const receiptsCents = state.operatingLedger.lifetimeReceiptsCents - beforeReceipts
  const cogsCents = state.operatingLedger.lifetimeCogsCents - beforeCogs
  const wagesCents = state.operatingLedger.buckets.reduce((sum, bucket) => sum + bucket.wagesCents, 0)
  const contributionCents = receiptsCents - cogsCents - wagesCents
  const seconds = ticks / 5
  return {
    profile,
    quality: blueprint.quality,
    market,
    quantity,
    seconds,
    receiptsDollars: receiptsCents / 100,
    cogsDollars: cogsCents / 100,
    wagesDollars: wagesCents / 100,
    contributionDollars: contributionCents / 100,
    contributionPerMinute: contributionCents / 100 / seconds * 60,
  }
}

const results = [
  run('volume', 'spot'),
  run('precision', 'spot'),
  run('volume', 'job'),
  run('precision', 'job'),
]

const by = (profile: 'volume' | 'precision', market: Market) => results.find((row) => row.profile === profile && row.market === market)!
assert.ok(by('volume', 'spot').seconds < by('precision', 'spot').seconds, 'Volume must win throughput')
assert.ok(by('volume', 'spot').contributionPerMinute > by('precision', 'spot').contributionPerMinute, 'Volume must be the better spot recipe')
assert.ok(by('precision', 'job').contributionPerMinute > by('volume', 'job').contributionPerMinute, 'Precision must win while its qualifying premium job lasts')
assert.ok(by('precision', 'job').receiptsDollars / by('precision', 'job').quantity > by('volume', 'job').receiptsDollars / by('volume', 'job').quantity, 'Performance must pay a higher unit value')

console.table(results.map((row) => ({
  profile: row.profile,
  Q: row.quality,
  market: row.market,
  quantity: row.quantity,
  seconds: row.seconds.toFixed(1),
  receipts: row.receiptsDollars.toFixed(2),
  COGS: row.cogsDollars.toFixed(2),
  wages: row.wagesDollars.toFixed(2),
  contribution: row.contributionDollars.toFixed(2),
  contributionPerMin: row.contributionPerMinute.toFixed(2),
})))
console.log('PASS: V3-10 automated gate preserves Volume/spot throughput and Precision/premium-buyer value')
