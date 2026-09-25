import { consumeV3ProtectedInventory, getV3StockAllocations, recordV3Ledger } from './productInventory'
import type {
  V3GameState,
  V3ProcessProfile,
  V3StartDevelopmentAction,
} from './types'
import { getV3Employee, returnV3EmployeeFromDevelopment } from './workforce'

export const V3_GASOLINE_DEVELOPMENT_FEE_CENTS = 5_000
export const V3_GASOLINE_SAMPLE_QUANTITY = 10
export const V3_GASOLINE_DEVELOPMENT_TICKS = 100

const PROFILE_QUALITY: Record<V3ProcessProfile, number> = {
  volume: 35,
  standard: 40,
  precision: 55,
}

export function getV3DevelopmentSignature(action: Pick<V3StartDevelopmentAction, 'family' | 'profile' | 'module' | 'knowledgeRank'>, leadContribution: 0 | 5): string {
  return `${action.family}|${action.profile}|${action.module}|${action.knowledgeRank}|${leadContribution}`
}

export type V3DevelopmentStartResult = {
  state: V3GameState
  blocker: null | 'chapter_locked' | 'project_active' | 'invalid_lab' | 'invalid_config' | 'duplicate_signature' | 'insufficient_cash' | 'insufficient_samples' | 'invalid_lead'
}

export function startV3Development(state: V3GameState, action: V3StartDevelopmentAction): V3DevelopmentStartResult {
  if (state.campaignProgress.chapter < 1) return { state, blocker: 'chapter_locked' }
  if (state.developmentProject) return { state, blocker: 'project_active' }
  if (state.world.grid[action.labCellIndex] !== 'laboratory') return { state, blocker: 'invalid_lab' }
  const labLevel = state.world.gridLevels[action.labCellIndex] ?? 1
  if (
    action.family !== 'gasoline' || action.module !== 'none' || action.knowledgeRank !== 0 ||
    labLevel < 1
  ) return { state, blocker: 'invalid_config' }

  const lead = action.leadEmployeeId ? getV3Employee(state, action.leadEmployeeId) : undefined
  if (
    action.leadEmployeeId &&
    (!lead || lead.type !== 'operator' || state.unpaidEmployeeIds.includes(lead.id) || state.employeeDuties[lead.id]?.kind === 'development')
  ) return { state, blocker: 'invalid_lead' }
  const leadContribution: 0 | 5 = lead && lead.level >= 3 ? 5 : 0
  const signature = getV3DevelopmentSignature(action, leadContribution)
  if (Object.values(state.productBlueprints).some((blueprint) => blueprint.signature === signature)) {
    return { state, blocker: 'duplicate_signature' }
  }
  if (state.world.moneyCents < V3_GASOLINE_DEVELOPMENT_FEE_CENTS) return { state, blocker: 'insufficient_cash' }

  const allocations = getV3StockAllocations(state, action.family)
  if (allocations.reduce((sum, allocation) => sum + allocation.free, 0) + 1e-8 < V3_GASOLINE_SAMPLE_QUANTITY) {
    return { state, blocker: 'insufficient_samples' }
  }
  let sampledState = state
  let remaining = V3_GASOLINE_SAMPLE_QUANTITY
  const sampleDebits: Array<{ blueprintId: string; quantity: number }> = []
  for (const allocation of allocations) {
    const quantity = Math.min(allocation.free, remaining)
    if (quantity <= 1e-8) continue
    const consumed = consumeV3ProtectedInventory(sampledState, action.family, quantity, {
      blueprintId: allocation.blueprintId,
      purpose: 'sample',
    })
    if (consumed.quantity <= 0) return { state, blocker: 'insufficient_samples' }
    sampledState = consumed.state
    sampleDebits.push({ blueprintId: allocation.blueprintId, quantity: consumed.quantity })
    remaining -= consumed.quantity
    if (remaining <= 1e-8) break
  }
  if (remaining > 1e-8) return { state, blocker: 'insufficient_samples' }

  const priorDuty = lead ? sampledState.employeeDuties[lead.id] : undefined
  const projectId = `project:${String(action.sequence).padStart(8, '0')}`
  const debited = recordV3Ledger({
    ...sampledState,
    world: {
      ...sampledState.world,
      moneyCents: sampledState.world.moneyCents - V3_GASOLINE_DEVELOPMENT_FEE_CENTS,
    },
    operatingLedger: {
      ...sampledState.operatingLedger,
      developmentExpenseCents: sampledState.operatingLedger.developmentExpenseCents + V3_GASOLINE_DEVELOPMENT_FEE_CENTS,
    },
    developmentProject: {
      id: projectId,
      signature,
      family: 'gasoline',
      leadEmployeeId: lead?.id ?? '',
      contributorEmployeeIds: lead ? [lead.id] : [],
      labCellIndex: action.labCellIndex,
      remainingTicks: V3_GASOLINE_DEVELOPMENT_TICKS,
      profile: action.profile,
      module: 'none',
      knowledgeRank: 0,
      leadContribution,
      quality: Math.min(80, Math.max(20, PROFILE_QUALITY[action.profile] + leadContribution)),
      sampleDebits,
      feeDebitedCents: V3_GASOLINE_DEVELOPMENT_FEE_CENTS,
    },
    employeeDuties: lead ? {
      ...sampledState.employeeDuties,
      [lead.id]: {
        kind: 'development',
        projectId,
        returnCellIndex: priorDuty?.kind === 'line' ? priorDuty.cellIndex : null,
      },
    } : sampledState.employeeDuties,
  }, { cashOutflowsCents: V3_GASOLINE_DEVELOPMENT_FEE_CENTS })
  return { state: debited, blocker: null }
}

export function cancelV3Development(state: V3GameState): V3GameState | null {
  const project = state.developmentProject
  if (!project) return null
  const cleared = { ...state, developmentProject: null }
  return project.leadEmployeeId ? returnV3EmployeeFromDevelopment(cleared, project.leadEmployeeId) : cleared
}

export function advanceV3Development(state: V3GameState, deltaTicks: number): V3GameState {
  const project = state.developmentProject
  if (!project || deltaTicks <= 0) return state
  if (project.leadEmployeeId && state.unpaidEmployeeIds.includes(project.leadEmployeeId)) return state
  const remainingTicks = Math.max(0, project.remainingTicks - deltaTicks)
  if (remainingTicks > 0) return { ...state, developmentProject: { ...project, remainingTicks } }

  const revision = 1 + Math.max(0, ...Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.family === project.family)
    .map((blueprint) => blueprint.revision))
  const blueprintId = `blueprint:${project.family}:${project.profile}:${revision}`
  const blueprint = {
    id: blueprintId,
    signature: project.signature,
    revision,
    family: project.family,
    name: `${project.profile[0].toUpperCase()}${project.profile.slice(1)} Gasoline`,
    quality: project.quality,
    profile: project.profile,
    module: project.module,
    minPlantLevel: (project.module === 'none' ? 1 : 2) as 1 | 2,
    provenance: 'developed' as const,
    commissionedAtTick: state.world.tickCount + deltaTicks,
    pinned: true,
    archived: false,
  }
  let completed: V3GameState = {
    ...state,
    productBlueprints: { ...state.productBlueprints, [blueprintId]: blueprint },
    developmentProject: null,
    developmentHistory: [...state.developmentHistory, {
      signature: project.signature,
      blueprintId,
      completedAtTick: state.world.tickCount + deltaTicks,
      creditedEmployeeIds: project.contributorEmployeeIds,
    }],
    world: {
      ...state.world,
      employees: state.world.employees.map((employee) =>
        project.leadEmployeeId && employee.id === project.leadEmployeeId
          ? { ...employee, xp: employee.xp + 20 }
          : employee,
      ),
    },
  }
  if (project.leadEmployeeId) completed = returnV3EmployeeFromDevelopment(completed, project.leadEmployeeId)
  return completed
}
