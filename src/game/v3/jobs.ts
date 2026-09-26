import { consumeV3ProtectedInventory, getV3ProductCapacity, getV3StockAllocations, recordV3Ledger } from './productInventory'
import { evaluateV3CampaignProgress } from './campaign'
import { getV3Modifiers } from './modifiers'
import { applyV3LevelUps, creditV3EmployeeRecords } from './workforce'
import { V3_SPOT_PRICE_CENTS } from './data'
import type { V3AcceptedJob, V3GameState, V3ProductFamily } from './types'

export type V3JobKind = 'tutorial' | 'milestone' | 'repeat' | 'rush' | 'showcase'

export type V3JobTemplate = {
  id: string
  clientId: string
  kind: V3JobKind
  family: V3ProductFamily
  minimumQuality: number
  quantity: number
  unitPriceCents: number
  completionBonusCents: number
  researchReward: number
  reputationReward: number
  minimumChapter: 0 | 1 | 2 | 3 | 4
  milestone: boolean
  /** Template that must be completed first (ladder order / proven route). */
  requires: string | null
  /** Materials OR-branch: the player picks one product per job at acceptance. */
  branches: V3JobBranch[] | null
}

export type V3JobBranch = {
  family: V3ProductFamily
  minimumQuality: number
  quantity: number
  unitPriceCents: number
  completionBonusCents: number
}

/** Systems S6 quote multiplier by required quality. */
export function getV3QuoteMultiplier(quality: number): number {
  if (quality >= 75) return 1.9
  if (quality >= 65) return 1.7
  if (quality >= 55) return 1.5
  if (quality >= 40) return 1.2
  return 1.1
}

type LadderRow = { clientId: string; family: V3ProductFamily; rows: Array<[number, number]>; chapters: [0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4] }

// Master §7 client table (Materials arrives with V3-14).
const LADDERS: LadderRow[] = [
  { clientId: 'local', family: 'gasoline', rows: [[35, 40], [40, 80], [55, 150]], chapters: [1, 2, 3] },
  { clientId: 'performance', family: 'gasoline', rows: [[55, 35], [65, 70], [75, 120]], chapters: [1, 2, 3] },
  { clientId: 'fleet', family: 'lubricants', rows: [[40, 30], [55, 70], [65, 140]], chapters: [2, 2, 3] },
  { clientId: 'airline', family: 'jetFuel', rows: [[55, 30], [65, 60], [75, 120]], chapters: [3, 3, 3] },
]
const STAGES = ['trial', 'regular', 'partner'] as const
const STAGE_RP = [5, 10, 15]
const STAGE_REPUTATION = [5, 10, 20]

function buildCatalog(): Record<string, V3JobTemplate> {
  const catalog: Record<string, V3JobTemplate> = {
    'tutorial:gasoline': {
      id: 'tutorial:gasoline', clientId: 'tutorial', kind: 'tutorial', family: 'gasoline', minimumQuality: 0,
      quantity: 20, unitPriceCents: 1_800, completionBonusCents: 20_000,
      researchReward: 10, reputationReward: 0, minimumChapter: 0, milestone: true, requires: null, branches: null,
    },
  }
  for (const ladder of LADDERS) {
    ladder.rows.forEach(([quality, quantity], stage) => {
      const unitPriceCents = Math.round(V3_SPOT_PRICE_CENTS[ladder.family] * getV3QuoteMultiplier(quality))
      const id = `${ladder.clientId}:${STAGES[stage]}`
      catalog[id] = {
        id, clientId: ladder.clientId, kind: 'milestone', family: ladder.family, minimumQuality: quality,
        quantity, unitPriceCents, completionBonusCents: Math.round(quantity * unitPriceCents * 0.1),
        researchReward: STAGE_RP[stage], reputationReward: STAGE_REPUTATION[stage],
        minimumChapter: ladder.chapters[stage], milestone: true,
        requires: stage === 0 ? null : `${ladder.clientId}:${STAGES[stage - 1]}`,
        branches: null,
      }
    })
    // Repeats: same criteria as the milestone, income only (no bonus/RP/reputation).
    for (const [stage, suffix] of [[1, 'repeat'], [2, 'partner-repeat']] as const) {
      const base = catalog[`${ladder.clientId}:${STAGES[stage]}`]
      catalog[`${ladder.clientId}:${suffix}`] = {
        ...base, id: `${ladder.clientId}:${suffix}`, kind: 'repeat', completionBonusCents: 0,
        researchReward: 0, reputationReward: 0, milestone: false, requires: base.id,
      }
    }
    // Owner decision (ก, 2026-09-26): a C1 Local starter repeat keeps the C2 rule
    // ("ship 40 of your developed Gasoline via any job") always reachable, even
    // when both one-time trials were completed with default or mixed stock.
    if (ladder.clientId === 'local') {
      const trial = catalog['local:trial']
      catalog['local:starter-repeat'] = {
        ...trial, id: 'local:starter-repeat', kind: 'repeat', completionBonusCents: 0,
        researchReward: 0, reputationReward: 0, milestone: false, requires: trial.id, minimumChapter: 1,
      }
    }
    // Rush: optional after C3, only on a proven Regular route; quantity/deadline set at offer.
    const regular = catalog[`${ladder.clientId}:regular`]
    catalog[`${ladder.clientId}:rush`] = {
      ...regular, id: `${ladder.clientId}:rush`, kind: 'rush', quantity: 0, completionBonusCents: 0,
      researchReward: 0, reputationReward: 0, minimumChapter: 3, milestone: false, requires: regular.id,
    }
  }
  // Materials (C4): Petro OR Pellets per job (Master §7); one product per job.
  const materials: Array<[[number, number], [number, number]]> = [[[40, 40], [50, 25]], [[55, 80], [65, 50]], [[65, 160], [75, 100]]]
  materials.forEach(([[petroQ, petroQty], [pelletQ, pelletQty]], stage) => {
    const branch = (family: V3ProductFamily, quality: number, quantity: number): V3JobBranch => {
      const unitPriceCents = Math.round(V3_SPOT_PRICE_CENTS[family] * getV3QuoteMultiplier(quality))
      return { family, minimumQuality: quality, quantity, unitPriceCents, completionBonusCents: Math.round(quantity * unitPriceCents * 0.1) }
    }
    const branches = [branch('petrochemicals', petroQ, petroQty), branch('plasticPellets', pelletQ, pelletQty)]
    const id = `materials:${STAGES[stage]}`
    catalog[id] = {
      id, clientId: 'materials', kind: 'milestone', ...branches[0],
      researchReward: STAGE_RP[stage], reputationReward: STAGE_REPUTATION[stage], minimumChapter: 4,
      milestone: true, requires: stage === 0 ? null : `materials:${STAGES[stage - 1]}`, branches,
    }
  })
  for (const [stage, suffix] of [[1, 'repeat'], [2, 'partner-repeat']] as const) {
    const base = catalog[`materials:${STAGES[stage]}`]
    catalog[`materials:${suffix}`] = {
      ...base, id: `materials:${suffix}`, kind: 'repeat', completionBonusCents: 0, researchReward: 0,
      reputationReward: 0, milestone: false, requires: base.id,
      branches: base.branches!.map((entry) => ({ ...entry, completionBonusCents: 0 })),
    }
  }
  // Showcase (Master §11): developed blueprint Q≥65, Q65 quote tier, 10% bonus,
  // RP15 once per template, no client rank change, no deadline.
  const showcase: Array<[V3ProductFamily, number]> = [
    ['gasoline', 150], ['lubricants', 120], ['jetFuel', 100], ['petrochemicals', 100], ['plasticPellets', 80],
  ]
  for (const [family, quantity] of showcase) {
    const unitPriceCents = Math.round(V3_SPOT_PRICE_CENTS[family] * getV3QuoteMultiplier(65))
    catalog[`showcase:${family}`] = {
      id: `showcase:${family}`, clientId: 'showcase', kind: 'showcase', family, minimumQuality: 65, quantity,
      unitPriceCents, completionBonusCents: Math.round(quantity * unitPriceCents * 0.1),
      researchReward: 15, reputationReward: 0, minimumChapter: 4, milestone: true, requires: null, branches: null,
    }
  }
  return catalog
}

/** Template terms for a chosen branch; null when the branch is missing or invalid. */
export function resolveV3JobTemplate(templateId: string, branch?: V3ProductFamily | null): V3JobTemplate | null {
  const template = V3_JOB_TEMPLATES[templateId]
  if (!template) return null
  if (!template.branches) return branch && branch !== template.family ? null : template
  const chosen = template.branches.find((entry) => entry.family === branch)
  return chosen ? { ...template, ...chosen } : null
}

export const V3_JOB_TEMPLATES: Record<string, V3JobTemplate> = buildCatalog()
export const V3_REPEAT_COOLDOWN_TICKS = 600
export const V3_AUTO_REPEAT_CHAPTER = 3

export type V3JobBlocker = 'template_missing' | 'slot_occupied' | 'locked' | 'cooldown' | 'no_active_job' | 'invalid_quantity' | 'insufficient_qualified_stock' | 'requires_previous' | 'rush_unavailable' | 'invalid_branch'

export type V3RushTerms = { quantity: number; deadlineTicks: number }

function completedTemplate(state: V3GameState, templateId: string): boolean {
  return state.jobReceipts.receipts.some((receipt) => receipt.templateId === templateId && receipt.status === 'completed')
}

/** Order/cooldown/chapter rules shared by manual accept, auto-repeat and offer views. */
export function getV3AcceptBlocker(state: V3GameState, templateId: string): V3JobBlocker | null {
  const template = V3_JOB_TEMPLATES[templateId]
  if (!template) return 'template_missing'
  if (state.acceptedJob) return 'slot_occupied'
  if (state.campaignProgress.chapter < template.minimumChapter) return 'locked'
  if (template.milestone && completedTemplate(state, template.id)) return 'locked'
  if (template.requires && !completedTemplate(state, template.requires)) return 'requires_previous'
  if ((state.jobReceipts.templateRetryAtTick[template.id] ?? 0) > state.world.tickCount) return 'cooldown'
  return null
}
export type V3JobResult = { state: V3GameState; blocker: V3JobBlocker | null; quantity: number; paidCents: number }

export function acceptV3Job(
  state: V3GameState,
  templateId: string,
  sequence: number | string,
  rush: V3RushTerms | null = null,
  branch: V3ProductFamily | null = null,
): V3JobResult {
  const blocker = getV3AcceptBlocker(state, templateId)
  if (blocker) return { state, blocker, quantity: 0, paidCents: 0 }
  const template = resolveV3JobTemplate(templateId, branch)
  if (!template) return { state, blocker: 'invalid_branch', quantity: 0, paidCents: 0 }
  if (template.kind === 'rush' && (!rush || rush.quantity < 1 || rush.deadlineTicks < 900)) {
    return { state, blocker: 'rush_unavailable', quantity: 0, paidCents: 0 }
  }
  const quantity = template.kind === 'rush' ? rush!.quantity : template.quantity
  // Capped trade bonus is snapshotted into the quote; the tutorial quote is explicit.
  const tradeRate = template.clientId === 'tutorial' ? 0 : getV3Modifiers(state).trade.effective
  const unitPriceCents = Math.round(template.unitPriceCents * (1 + tradeRate))
  const job: V3AcceptedJob = {
    id: typeof sequence === 'number' ? `job:${String(sequence).padStart(8, '0')}` : sequence,
    templateId: template.id,
    family: template.family,
    minimumQuality: template.minimumQuality,
    quantity,
    deliveredQuantity: 0,
    lockedUnitPriceCents: unitPriceCents,
    // Rush bonus is 25% of the locked order; milestones keep their 10% quote.
    completionBonusCents: template.kind === 'rush'
      ? Math.round(quantity * unitPriceCents * 0.25)
      : Math.round(template.completionBonusCents * (1 + tradeRate)),
    paidToDateCents: 0,
    acceptedAtTick: state.world.tickCount,
    deadlineTick: template.kind === 'rush' ? state.world.tickCount + rush!.deadlineTicks : null,
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
          [template.id]: state.world.tickCount + V3_REPEAT_COOLDOWN_TICKS,
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
        completed && template?.milestone && (job.contributorWork[employee.id] ?? 0) > 0
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
  // Award period: qualified (accepted-job, Q-eligible) deliveries only; spot never counts.
  next = {
    ...next,
    awards: {
      ...next.awards,
      current: {
        ...next.awards.current,
        qualifiedUnits: next.awards.current.qualifiedUnits + consumed.quantity,
        qualifiedFamilies: next.awards.current.qualifiedFamilies.includes(job.family)
          ? next.awards.current.qualifiedFamilies
          : [...next.awards.current.qualifiedFamilies, job.family],
      },
    },
  }
  if (completed) {
    const credited = Object.entries(job.contributorWork).filter(([, work]) => work > 0).map(([id]) => id).sort()
    if (template?.milestone) next = creditV3EmployeeRecords(next, credited, { milestoneId: template.id })
    next = {
      ...next,
      campaignProgress: template?.kind === 'showcase' && !next.campaignProgress.showcaseReceiptId
        ? { ...next.campaignProgress, showcaseReceiptId: `receipt:${job.id}` }
        : next.campaignProgress,
      // Showcase changes no client rank.
      clientProgress: template && template.kind !== 'showcase' ? {
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
  // Completion bonuses and receipts for goods with estimated basis never count as recognized profit.
  const unrecognizedCents = completionPaidCents + (consumed.estimatedBasis ? shipmentPaidCents : 0)
  next = evaluateV3CampaignProgress(recordV3Ledger(next, { receiptsCents: totalPaidCents, cogsCents: consumed.costBasisCents, unrecognizedCents }))
  return { state: next, blocker: null, quantity: consumed.quantity, paidCents: totalPaidCents }
}

export function cancelV3Job(state: V3GameState, status: 'cancelled' | 'expired' = 'cancelled'): V3JobResult {
  const job = state.acceptedJob
  if (!job || job.status !== 'accepted') return { state, blocker: 'no_active_job', quantity: 0, paidCents: 0 }
  // Cancel/expire keeps goods already paid, forfeits bonus/RP/XP; cooldown from acceptance stands.
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
          id: `receipt:${job.id}:${status}`,
          jobId: job.id,
          templateId: job.templateId,
          status,
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

/**
 * Clock work after dispatch in each production tick: a Rush that reached its
 * deadline expires (deadline only advances with simulated ticks, so pause/close
 * stops it), then an opted-in repeat is re-accepted into the free slot.
 */
export function advanceV3JobClock(state: V3GameState): V3GameState {
  let next = state
  const job = next.acceptedJob
  if (job && job.deadlineTick !== null && next.world.tickCount >= job.deadlineTick) {
    next = cancelV3Job(next, 'expired').state
  }
  const autoId = next.jobReceipts.autoRepeatTemplateId
  if (
    autoId && !next.acceptedJob &&
    next.campaignProgress.chapter >= V3_AUTO_REPEAT_CHAPTER &&
    V3_JOB_TEMPLATES[autoId]?.kind === 'repeat' &&
    !getV3AcceptBlocker(next, autoId)
  ) {
    next = acceptV3Job(next, autoId, `job:auto:${String(next.world.tickCount).padStart(10, '0')}`).state
  }
  return next
}
