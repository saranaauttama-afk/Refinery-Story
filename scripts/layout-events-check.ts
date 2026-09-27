import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { getV3AdjacencyPreview, getV3AdjacencyRate, getV3LineAdjacency } from '../src/game/v3/adjacency'
import { V3_BUILDINGS } from '../src/game/v3/data'
import { V3_INBOX_GAP_TICKS } from '../src/game/v3/inbox'
import { evaluateV3Maintenance } from '../src/game/v3/maintenance'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { createInitialV3GameState, V3_STARTER_BUILDINGS } from '../src/game/v3/state'
import { parseV3GameState } from '../src/game/v3/storage'
import type { V3GameState } from '../src/game/v3/types'
import { getV3BuildingAt } from '../src/game/v3/yard'
import { act, assertBlocked, close, cycles, legalChapterTwo } from './v3-check-helpers'

/** Labelled fixture: C2 with cash, Distillation paused so only the Lube line runs. */
function c2(): V3GameState {
  const base = createInitialV3GameState()
  return { ...base, campaignProgress: { ...base.campaignProgress, chapter: 2 }, world: { ...base.world, moneyCents: 50_000_000 } }
}

// ---- Tank adjacency: +5% rate, 4-direction edges, once per target ----
let state = act(c2(), { type: 'build', x: 45, y: 45, building: 'lubricantPlant' })
const lube = getV3BuildingAt(state, 45, 45)!.id
const base = evaluateV3Production(state, 25).lines.find((line) => line.buildingId === lube)!.requestedWork
const preview = getV3AdjacencyPreview(state, 'lubricantTank', 1, 47, 45)
assert.deepEqual(preview, [{ buildingId: lube, kind: 'tank' }], 'preview shows the benefit before placing')
assert.deepEqual(getV3AdjacencyPreview(state, 'lubricantTank', 1, 47, 47), [], 'diagonal does not count')
assert.deepEqual(getV3AdjacencyPreview(state, 'gasolineTank', 1, 47, 45), [], 'only the matching tank counts')
state = act(state, { type: 'build', x: 47, y: 45, building: 'lubricantTank' })
close(evaluateV3Production(state, 25).lines.find((line) => line.buildingId === lube)!.requestedWork, base * 1.05)
state = act(state, { type: 'build', x: 45, y: 47, building: 'lubricantTank' })
close(getV3AdjacencyRate(state, lube), 1.05, 'a second tank does not stack')
assert.ok(state.discoveredAdjacencies.includes('tank:lubricantPlant'), 'discovery history recorded')
const distillRate = getV3AdjacencyRate(state, V3_STARTER_BUILDINGS.distillationUnit.id)
close(distillRate, 1, 'starter tanks are spaced, no free bonus')

// ---- Workshop adjacency: -10% upkeep for touching lines only, 25% total cap ----
let upkeep = act(c2(), { type: 'build', x: 45, y: 45, building: 'lubricantPlant' })
const lubeLine = getV3BuildingAt(upkeep, 45, 45)!.id
const dueBefore = evaluateV3Maintenance(upkeep).lines.find((line) => line.buildingId === lubeLine)!
upkeep = act(upkeep, { type: 'build', x: 45, y: 47, building: 'maintenanceWorkshop' })
assert.equal(getV3LineAdjacency(upkeep, lubeLine).workshop, true)
const dueAfter = evaluateV3Maintenance(upkeep).lines.find((line) => line.buildingId === lubeLine)!
assert.ok(dueAfter.cut >= 0.1 + 0.05 - 1e-9 && dueAfter.cut <= 0.25 + 1e-9, 'local 10% + workshop 5% global, capped')
assert.ok(dueAfter.dueCents < dueBefore.dueCents)
const distillUpkeep = evaluateV3Maintenance(upkeep).lines.find((line) => line.buildingId === V3_STARTER_BUILDINGS.distillationUnit.id)
if (distillUpkeep) assert.ok(distillUpkeep.cut < dueAfter.cut, 'non-touching line gets only the global cut')

// ---- Move/swap cannot farm: no reward exists, history keeps one entry per kind ----
const tank = getV3BuildingAt(state, 47, 45)!.id
let farm = state
const cash = farm.world.moneyCents
const rp = farm.world.researchPoints
for (let index = 0; index < 5; index++) {
  farm = act(farm, { type: 'move_building', buildingId: tank, x: 51, y: 52 })
  farm = act(farm, { type: 'move_building', buildingId: tank, x: 47, y: 45 })
}
assert.equal(farm.world.moneyCents, cash)
assert.equal(farm.world.researchPoints, rp)
assert.equal(farm.discoveredAdjacencies.filter((entry) => entry === 'tank:lubricantPlant').length, 1)
const swapped = act(farm, { type: 'demolish', buildingId: tank, expectedBuilding: 'lubricantTank' })
assert.ok(swapped.world.moneyCents - farm.world.moneyCents <= V3_BUILDINGS.lubricantTank.buildCostDollars * 50, 'demolish refunds at most half the build cost: rebuild/swap loses money')

// ---- Inbox: optional, unique, spaced, suppressed, one pending decision ----
let inbox = createInitialV3GameState()
inbox = cycles(inbox, 10)
assert.equal(inbox.inbox.items.length, 0, 'suppressed during the tutorial chapter')
let story = legalChapterTwo()
story = cycles(story, 1)
assert.equal(story.inbox.items.length, 1, 'one item per issue')
assert.ok(['customer_thanks', 'staff_accomplishment', 'experiment_opportunity'].includes(story.inbox.items[0].kind))
for (let index = 0; index < 200 && story.inbox.items.length < 3; index++) story = cycles(story, 1)
const issuedAt = story.inbox.items.map((entry) => entry.createdAtTick)
for (let index = 1; index < issuedAt.length; index++) assert.ok(issuedAt[index] - issuedAt[index - 1] >= V3_INBOX_GAP_TICKS, '180 s minimum gap')
assert.ok(story.inbox.items.some((entry) => entry.id === 'thanks:local:trial'), 'customer thanks for a real milestone')
assert.equal(new Set(story.inbox.items.map((entry) => entry.id)).size, story.inbox.items.length, 'unique IDs')
// Claim once; second claim blocked; dismiss pays nothing.
const item = story.inbox.items.find((entry) => entry.id === 'thanks:local:trial')!
const rpBefore = story.world.researchPoints
const claimed = act(story, { type: 'resolve_inbox', itemId: item.id, choice: 'claim' })
assert.equal(claimed.world.researchPoints - rpBefore, item.rewardRp)
assertBlocked(claimed, { type: 'resolve_inbox', itemId: item.id, choice: 'claim' }, 'v3.inbox.resolved')
assertBlocked(claimed, { type: 'resolve_inbox', itemId: 'thanks:nope', choice: 'claim' }, 'v3.inbox.missing')
const dismissed = act(story, { type: 'resolve_inbox', itemId: item.id, choice: 'dismiss' })
assert.equal(dismissed.world.researchPoints, rpBefore)
// Deterministic across reload.
const reloaded = parseV3GameState(JSON.parse(JSON.stringify(story)))
assert.equal(reloaded.status, 'loaded')
assert.deepEqual(cycles(reloaded.state!, 40).inbox, cycles(story, 40).inbox)
// Only one pending decision; recovery suppresses issuing.
let decisions = cycles(story, 400)
assert.ok(decisions.inbox.items.filter((entry) => entry.decision && entry.status === 'pending').length <= 1)
const recovering = { ...decisions, recoveryState: { ...(decisions.recoveryState ?? { paidCents: 0, loanerBuildingIds: [] }), status: 'running' as const, remainingTicks: 100_000 } } as V3GameState
assert.equal(cycles(recovering, 60).inbox.items.length, recovering.inbox.items.length, 'suppressed during recovery')

// ---- Background/modal flow with an accepted job and running development ----
let busy = legalChapterTwo()
busy = act(busy, { type: 'trade', direction: 'buy', product: 'crude', quantity: 30 })
busy = cycles(busy, 3)
busy = act(busy, {
  type: 'start_development', family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0,
  leadEmployeeId: null, labBuildingId: getV3BuildingAt(busy, 45, 45)?.id ?? Object.values(busy.world.buildingsById).find((building) => building.type === 'laboratory')!.id,
})
busy = act(busy, { type: 'accept_job', templateId: 'local:regular' })
const project = busy.developmentProject
const job = busy.acceptedJob
// "Background" = no ticks; reload mid-flow; inbox never alters the job or project.
const resumed = parseV3GameState(JSON.parse(JSON.stringify(busy))).state!
assert.deepEqual(resumed.developmentProject, project)
assert.deepEqual(resumed.acceptedJob, job)
const ticked = runV3ProductionTick(resumed, 25).state
assert.equal(ticked.acceptedJob?.id, job?.id)
assert.equal(ticked.developmentProject?.id, project?.id)
for (const entry of cycles(busy, 12).inbox.items) {
  assert.ok(entry.rewardRp <= 5 && !('moneyCents' in entry.params), 'events never debit or grant money/stock')
}

// ---- Events are never campaign prerequisites ----
const campaignSource = readFileSync('src/game/v3/campaign.ts', 'utf8')
assert.ok(!/inbox/i.test(campaignSource), 'campaign/clear logic does not read the inbox')

console.log('PASS: V3-16 tank/workshop adjacency (4-dir, once per target, preview, capped), no move/swap farming, inbox unique/spaced/suppressed/one decision/optional, reload with job+development')
