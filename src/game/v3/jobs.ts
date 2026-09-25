import { consumeV3ProtectedInventory, getV3ProductCapacity, getV3StockAllocations, recordV3Ledger } from './productInventory'
import { evaluateV3CampaignProgress } from './campaign'
import { getV3Modifiers } from './modifiers'
import { applyV3LevelUps, creditV3EmployeeRecords } from './workforce'
import type { V3AcceptedJob, V3GameState, V3ProductFamily } from './types'

export type V3JobTemplate = {
  id: string
  clientId: string
  family: V3ProductFamily
  minimumQuality: number
  quantity: number
  unitPriceCents: number
  completionBonusCents: number
  researchReward: number
  reputationReward: number
  minimumChapter: 0 | 1 | 2 | 3
  milestone: boolean
}

export const V3_JOB_TEMPLATES: Record<string, V3JobTemplate> = {
  'tutorial:gasoline': {
    id: 'tutorial:gasoline', clientId: 'tutorial', family: 'gasoline', minimumQuality: 0,
    quantity: 20, unitPriceCents: 1_800, completionBonusCents: 20_000,
    researchReward: 10, reputationReward: 0, minimumChapter: 0, milestone: true,
  },
  'local:trial': {
    id: 'local:trial', clientId: 'local', family: 'gasoline', minimumQuality: 35,
    quantity: 40, unitPriceCents: 1_980, completionBonusCents: 7_920,
    researchReward: 5, reputationReward: 5, minimumChapter: 1, milestone: true,
  },
  'performance:trial': {
    id: 'performance:trial', clientId: 'performance', family: 'gasoline', minimumQuality: 55,
    quantity: 35, unitPriceCents: 2_700, completionBonusCents: 9_450,
    researchReward: 5, reputationReward: 5, minimumChapter: 1, milestone: true,
  },
  // Master §7 Trial rows. Quote = spot × Q multiplier (Q40–50 1.20, Q55–60 1.50);
  // milestone completion bonus is 10% of the quoted order. Regular/Partner rows
  // belong to V3-13.
  'fleet:trial': {
    id: 'fleet:trial', clientId: 'fleet', family: 'lubricants', minimumQuality: 40,
    quantity: 30, unitPriceCents: 3_600, completionBonusCents: 10_800,
    researchReward: 5, reputationReward: 5, minimumChapter: 2, milestone: true,
  },
  'airline:trial': {
    id: 'airline:trial', clientId: 'airline', family: 'jetFuel', minimumQuality: 55,
    quantity: 30, unitPriceCents: 7_500, completionBonusCents: 22_500,
    researchReward: 5, reputationReward: 5, minimumChapter: 3, milestone: true,
  },
}

export type V3JobBlocker = 'template_missing' | 'slot_occupied' | 'locked' | 'cooldown' | 'no_active_job' | 'invalid_quantity' | 'insufficient_qualified_stock'
export type V3JobResult = { state: V3GameState; blocker: V3JobBlocker | null; quantity: number; paidCents: number }

export function acceptV3Job(state: V3GameState, templateId: string, sequence: number): V3JobResult {
  const template = V3_JOB_TEMPLATES[templateId]
  if (!template) return { state, blocker: 'template_missing', quantity: 0, paidCents: 0 }
  if (state.acceptedJob) return { state, blocker: 'slot_occupied', quantity: 0, paidCents: 0 }
  if (state.campaignProgress.chapter < template.minimumChapter) return { state, blocker: 'locked', quantity: 0, paidCents: 0 }
  if (state.jobReceipts.receipts.some((receipt) => receipt.templateId === template.id && receipt.status === 'completed')) {
    return { state, blocker: 'locked', quantity: 0, paidCents: 0 }
  }
  if ((state.jobReceipts.templateRetryAtTick[template.id] ?? 0) > state.world.tickCount) {
    return { state, blocker: 'cooldown', quantity: 0, paidCents: 0 }
  }
  // Capped trade bonus is snapshotted into the quote; the tutorial quote is explicit.
  const tradeRate = template.clientId === 'tutorial' ? 0 : getV3Modifiers(state).trade.effective
  const job: V3AcceptedJob = {
    id: `job:${String(sequence).padStart(8, '0')}`,
    templateId: template.id,
    family: template.family,
    minimumQuality: template.minimumQuality,
    quantity: template.quantity,
    deliveredQuantity: 0,
    lockedUnitPriceCents: Math.round(template.unitPriceCents * (1 + tradeRate)),
    completionBonusCents: Math.round(template.completionBonusCents * (1 + tradeRate)),
    paidToDateCents: 0,
    acceptedAtTick: state.world.tickCount,
    deadlineTick: null,
    status: 'accepted',
    contributorWork: {},
    deliveredByBlueprint: {},
  }
  return {
    blocker: null,
    quantity: 0,
    paidCents: 0,
    state: {
      ...state,
      acceptedJob: job,
      jobReceipts: {
        ...state.jobReceipts,
        templateRetryAtTick: {
          ...state.jobReceipts.templateRetryAtTick,
          [template.id]: state.world.tickCount + 600,
        },
      },
    },
  }
}

export function dispatchV3Job(state: V3GameState, requestedQuantity: number, blueprintId?: string): V3JobResult {
  const job = state.acceptedJob
  if (!job || job.status !== 'accepted') return { state, blocker: 'no_active_job', quantity: 0, paidCents: 0 }
  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    return { state, blocker: 'invalid_quantity', quantity: 0, paidCents: 0 }
  }
  const remaining = job.quantity - job.deliveredQuantity
  const quantity = Math.min(requestedQuantity, remaining)
  const consumed = consumeV3ProtectedInventory(state, job.family as V3ProductFamily, quantity, { purpose: 'job-dispatch', blueprintId })
  if (consumed.quantity + 1e-8 < quantity) {
    return { state, blocker: 'insufficient_qualified_stock', quantity: 0, paidCents: 0 }
  }
  const deliveredQuantity = job.deliveredQuantity + consumed.quantity
  const targetPaidCents = Math.round(deliveredQuantity * job.lockedUnitPriceCents)
  const shipmentPaidCents = Math.max(0, targetPaidCents - job.paidToDateCents)
  const completed = deliveredQuantity + 1e-8 >= job.quantity
  const deliveredByBlueprint = { ...job.deliveredByBlueprint }
  for (const [blueprintId, before] of Object.entries(state.variantInventory)) {
    const used = before.quantity - (consumed.state.variantInventory[blueprintId]?.quantity ?? 0)
    if (used > 1e-8) deliveredByBlueprint[blueprintId] = (deliveredByBlueprint[blueprintId] ?? 0) + used
  }
  const template = V3_JOB_TEMPLATES[job.templateId]
  const completionPaidCents = completed ? job.completionBonusCents : 0
  const totalPaidCents = shipmentPaidCents + completionPaidCents
  let next: V3GameState = {
    ...consumed.state,
    world: {
      ...consumed.state.world,
      moneyCents: consumed.state.world.moneyCents + totalPaidCents,
      researchPoints: consumed.state.world.researchPoints +
        (completed ? (template?.researchReward ?? 0) * (1 + getV3Modifiers(state).rp.effective) : 0),
      reputation: consumed.state.world.reputation + (completed ? template?.reputationReward ?? 0 : 0),
      employees: consumed.state.world.employees.map((employee) =>
        completed && (job.contributorWork[employee.id] ?? 0) > 0
          ? applyV3LevelUps({ ...employee, xp: employee.xp + 5 })
          : employee,
      ),
    },
    acceptedJob: completed ? null : {
      ...job,
      deliveredQuantity,
      paidToDateCents: targetPaidCents,
      deliveredByBlueprint,
    },
  }
  if (completed) {
    const credited = Object.entries(job.contributorWork).filter(([, work]) => work > 0).map(([id]) => id).sort()
    if (template?.milestone) next = creditV3EmployeeRecords(next, credited, { milestoneId: template.id })
    next = {
      ...next,
      clientProgress: template ? {
        ...next.clientProgress,
        [template.clientId]: {
          clientId: template.clientId,
          lastCompletedMilestoneId: template.milestone ? template.id : next.clientProgress[template.clientId]?.lastCompletedMilestoneId ?? null,
          repeatAvailableAtTick: state.world.tickCount + 600,
        },
      } : next.clientProgress,
      jobReceipts: {
        ...next.jobReceipts,
        receipts: [...next.jobReceipts.receipts, {
          id: `receipt:${job.id}`,
          jobId: job.id,
          templateId: job.templateId,
          status: 'completed',
          settledAtTick: state.world.tickCount,
          deliveredQuantity,
          paidCents: targetPaidCents + completionPaidCents,
          deliveredByBlueprint,
        }],
      },
    }
  }
  next = evaluateV3CampaignProgress(recordV3Ledger(next, { receiptsCents: totalPaidCents, cogsCents: consumed.costBasisCents }))
  return { state: next, blocker: null, quantity: consumed.quantity, paidCents: totalPaidCents }
}

export function cancelV3Job(state: V3GameState): V3JobResult {
  const job = state.acceptedJob
  if (!job || job.status !== 'accepted') return { state, blocker: 'no_active_job', quantity: 0, paidCents: 0 }
  return {
    blocker: null,
    quantity: 0,
    paidCents: 0,
    state: {
      ...state,
      acceptedJob: null,
      jobReceipts: {
        ...state.jobReceipts,
        receipts: [...state.jobReceipts.receipts, {
          id: `receipt:${job.id}:cancelled`,
          jobId: job.id,
          templateId: job.templateId,
          status: 'cancelled',
          settledAtTick: state.world.tickCount,
          deliveredQuantity: job.deliveredQuantity,
          paidCents: job.paidToDateCents,
          deliveredByBlueprint: job.deliveredByBlueprint,
        }],
      },
    },
  }
}

export function addV3JobContribution(state: V3GameState, employeeId: string | null, family: V3ProductFamily, quality: number, quantity: number): V3GameState {
  const job = state.acceptedJob
  if (!job || !employeeId || job.family !== family || quality < job.minimumQuality || quantity <= 0) return state
  return {
    ...state,
    acceptedJob: {
      ...job,
      contributorWork: {
        ...job.contributorWork,
        [employeeId]: (job.contributorWork[employeeId] ?? 0) + quantity,
      },
    },
  }
}

export function runV3AutoDispatch(state: V3GameState): V3GameState {
  const job = state.acceptedJob
  if (!job) return state
  const remaining = job.quantity - job.deliveredQuantity
  const allocations = getV3StockAllocations(state, job.family)
  const eligible = allocations.reduce((sum, allocation) =>
    sum + (state.stockPolicies[allocation.blueprintId]?.autoDispatch ? allocation.jobReserved : 0), 0)
  const threshold = Math.min(remaining, Math.max(1, Math.floor(getV3ProductCapacity(state, job.family) * 0.25)))
  if (eligible + 1e-8 < threshold && eligible + 1e-8 < remaining) return state
  const quantity = Math.min(Math.floor(eligible + 1e-8), remaining)
  return quantity > 0 ? dispatchV3Job(state, quantity).state : state
}
