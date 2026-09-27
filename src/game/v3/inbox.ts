import { V3_JOB_TEMPLATES } from './jobs'
import type { V3GameState, V3InboxItem } from './types'
import { hasV3Building } from './yard'

/** Master §10: at most one new item per 180 s of simulated time. */
export const V3_INBOX_GAP_TICKS = 900
const THANKS_RP = 1
const EXPERIMENT_RP = 3

type Candidate = Omit<V3InboxItem, 'createdAtTick' | 'status'>

/** Deterministic candidates derived from facts already in the save (no RNG). */
function candidates(state: V3GameState): Candidate[] {
  const list: Candidate[] = []
  for (const receipt of state.jobReceipts.receipts) {
    const template = V3_JOB_TEMPLATES[receipt.templateId]
    if (receipt.status !== 'completed' || template?.kind !== 'milestone') continue
    list.push({ id: `thanks:${template.id}`, kind: 'customer_thanks', rewardRp: THANKS_RP, decision: false, params: { client: template.clientId, stage: template.id.split(':')[1] } })
  }
  for (const employee of state.world.employees) {
    if (employee.level >= 3) list.push({ id: `staff:${employee.id}:lv3`, kind: 'staff_accomplishment', rewardRp: 0, decision: false, params: { name: employee.name, level: 3 } })
    if (employee.level >= 5) list.push({ id: `staff:${employee.id}:lv5`, kind: 'staff_accomplishment', rewardRp: 0, decision: false, params: { name: employee.name, level: 5 } })
    if ((state.employeeRecords[employee.id]?.blueprintIds.length ?? 0) > 0) {
      list.push({ id: `staff:${employee.id}:recipe`, kind: 'staff_accomplishment', rewardRp: 0, decision: false, params: { name: employee.name, recipes: state.employeeRecords[employee.id].blueprintIds.length } })
    }
  }
  const developed = Object.values(state.productBlueprints).filter((blueprint) => blueprint.provenance === 'developed').length
  if (developed > 0 && hasV3Building(state, 'laboratory')) {
    list.push({ id: `experiment:${developed}`, kind: 'experiment_opportunity', rewardRp: EXPERIMENT_RP, decision: true, params: { recipes: developed } })
  }
  return list
}

/**
 * Issues at most one optional item per call. Suppressed in the tutorial, during
 * recovery or maintenance emergency, before the 180 s gap, and while a decision
 * is pending (only one pending decision at a time). Items never touch money,
 * stock, jobs or projects and are never campaign prerequisites.
 */
export function advanceV3Inbox(state: V3GameState): V3GameState {
  const inbox = state.inbox
  if (state.campaignProgress.chapter < 1) return state
  if (state.recoveryState?.status === 'running' || state.maintenanceEmergency) return state
  if (inbox.lastIssuedTick !== null && state.world.tickCount - inbox.lastIssuedTick < V3_INBOX_GAP_TICKS) return state
  const issued = new Set(inbox.items.map((item) => item.id))
  const decisionPending = inbox.items.some((item) => item.decision && item.status === 'pending')
  const next = candidates(state).find((candidate) => !issued.has(candidate.id) && !(candidate.decision && decisionPending))
  if (!next) return state
  return {
    ...state,
    inbox: {
      items: [...inbox.items, { ...next, createdAtTick: state.world.tickCount, status: 'pending' }],
      lastIssuedTick: state.world.tickCount,
    },
  }
}

export type V3InboxBlocker = 'missing' | 'resolved'

export function resolveV3InboxItem(state: V3GameState, itemId: string, choice: 'claim' | 'dismiss'): { state: V3GameState; blocker: V3InboxBlocker | null } {
  const item = state.inbox.items.find((entry) => entry.id === itemId)
  if (!item) return { state, blocker: 'missing' }
  if (item.status !== 'pending') return { state, blocker: 'resolved' }
  const claimed = choice === 'claim'
  return {
    blocker: null,
    state: {
      ...state,
      world: { ...state.world, researchPoints: state.world.researchPoints + (claimed ? item.rewardRp : 0) },
      inbox: {
        ...state.inbox,
        items: state.inbox.items.map((entry) => entry.id === itemId ? { ...entry, status: claimed ? 'claimed' : 'dismissed' } : entry),
      },
    },
  }
}
