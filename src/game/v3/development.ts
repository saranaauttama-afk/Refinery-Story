import { getV3AvailableKnowledgeRank } from './research'
import {
  V3_DEVELOPMENT_BY_FAMILY,
  V3_MODULE_CHAPTER,
  V3_DEVELOPMENT_SAMPLE_QUANTITY,
  V3_MODULE_QUALITY,
  V3_PLANT_BY_FAMILY,
  V3_PROFILE_QUALITY,
} from './data'
import { consumeV3ProtectedInventory, getV3StockAllocations, recordV3Ledger } from './productInventory'
import type {
  V3GameState,
  V3ModuleKey,
  V3ProcessProfile,
  V3ProductFamily,
  V3StartDevelopmentAction,
} from './types'
import { applyV3LevelUps, canV3Lead, creditV3EmployeeRecords, getV3Employee, getV3LeadContribution, returnV3EmployeeFromDevelopment } from './workforce'

export const V3_GASOLINE_DEVELOPMENT_FEE_CENTS = V3_DEVELOPMENT_BY_FAMILY.gasoline.feeCents
export const V3_GASOLINE_SAMPLE_QUANTITY = V3_DEVELOPMENT_SAMPLE_QUANTITY
export const V3_GASOLINE_DEVELOPMENT_TICKS = V3_DEVELOPMENT_BY_FAMILY.gasoline.ticks

const FAMILY_NAME: Record<V3ProductFamily, string> = {
  gasoline: 'Gasoline',
  lubricants: 'Lubricants',
  jetFuel: 'Jet Fuel',
  petrochemicals: 'Petrochemicals',
  plasticPellets: 'Plastic Pellets',
}

/** Systems S2: Q = clamp(40 + profile + module + 5*rank + lead, 20, 80). */
export function getV3BlueprintQuality(
  profile: V3ProcessProfile,
  module: V3ModuleKey,
  knowledgeRank: 0 | 1 | 2,
  leadContribution: 0 | 5,
): number {
  return Math.min(80, Math.max(20, 40 + V3_PROFILE_QUALITY[profile] + V3_MODULE_QUALITY[module] + 5 * knowledgeRank + leadContribution))
}

export function isV3FamilyPorted(family: V3ProductFamily): boolean {
  return V3_PLANT_BY_FAMILY[family] !== undefined
}

export function getV3DevelopmentSignature(action: Pick<V3StartDevelopmentAction, 'family' | 'profile' | 'module' | 'knowledgeRank'>, leadContribution: 0 | 5): string {
  return `${action.family}|${action.profile}|${action.module}|${action.knowledgeRank}|${leadContribution}`
}

export type V3DevelopmentStartResult = {
  state: V3GameState
  blocker: null | 'chapter_locked' | 'project_active' | 'invalid_lab' | 'invalid_config' | 'knowledge_locked' | 'duplicate_signature' | 'insufficient_cash' | 'insufficient_samples' | 'invalid_lead'
}

export function startV3Development(state: V3GameState, action: V3StartDevelopmentAction): V3DevelopmentStartResult {
  if (!isV3FamilyPorted(action.family)) return { state, blocker: 'invalid_config' }
  const familyRules = V3_DEVELOPMENT_BY_FAMILY[action.family]
  if (state.campaignProgress.chapter < familyRules.chapter) return { state, blocker: 'chapter_locked' }
  if (state.developmentProject) return { state, blocker: 'project_active' }
  if (state.world.grid[action.labCellIndex] !== 'laboratory') return { state, blocker: 'invalid_lab' }
  const labLevel = state.world.gridLevels[action.labCellIndex] ?? 1
  if (labLevel < 1 || ![0, 1, 2].includes(action.knowledgeRank)) return { state, blocker: 'invalid_config' }
  if (action.module !== 'none' && state.campaignProgress.chapter < V3_MODULE_CHAPTER) return { state, blocker: 'invalid_config' }
  // Rank uses the selected lab only (never the sum of labs) plus owned research.
  if (action.knowledgeRank > getV3AvailableKnowledgeRank(state, action.labCellIndex)) return { state, blocker: 'knowledge_locked' }
  const feeCents = familyRules.feeCents

  const lead = action.leadEmployeeId ? getV3Employee(state, action.leadEmployeeId) : undefined
  if (
    action.leadEmployeeId &&
    (!lead || !canV3Lead(lead, action.family) || state.unpaidEmployeeIds.includes(lead.id) || state.employeeDuties[lead.id]?.kind === 'development')
  ) return { state, blocker: 'invalid_lead' }
  const leadContribution: 0 | 5 = lead ? getV3LeadContribution(lead, action.family) : 0
  const signature = getV3DevelopmentSignature(action, leadContribution)
  if (Object.values(state.productBlueprints).some((blueprint) => blueprint.signature === signature)) {
    return { state, blocker: 'duplicate_signature' }
  }
  if (state.world.moneyCents < feeCents) return { state, blocker: 'insufficient_cash' }

  const allocations = getV3StockAllocations(state, action.family)
  if (allocations.reduce((sum, allocation) => sum + allocation.free, 0) + 1e-8 < V3_DEVELOPMENT_SAMPLE_QUANTITY) {
    return { state, blocker: 'insufficient_samples' }
  }
  let sampledState = state
  let remaining = V3_DEVELOPMENT_SAMPLE_QUANTITY
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
      moneyCents: sampledState.world.moneyCents - feeCents,
    },
    operatingLedger: {
      ...sampledState.operatingLedger,
      developmentExpenseCents: sampledState.operatingLedger.developmentExpenseCents + feeCents,
    },
    developmentProject: {
      id: projectId,
      signature,
      family: action.family,
      leadEmployeeId: lead?.id ?? '',
      contributorEmployeeIds: lead ? [lead.id] : [],
      labCellIndex: action.labCellIndex,
      remainingTicks: familyRules.ticks,
      profile: action.profile,
      module: action.module,
      knowledgeRank: action.knowledgeRank,
      leadContribution,
      quality: getV3BlueprintQuality(action.profile, action.module, action.knowledgeRank, leadContribution),
      sampleDebits,
      feeDebitedCents: feeCents,
    },
    employeeDuties: lead ? {
      ...sampledState.employeeDuties,
      [lead.id]: {
        kind: 'development',
        projectId,
        returnCellIndex: priorDuty?.kind === 'line' ? priorDuty.cellIndex : null,
        ...(priorDuty?.kind === 'support' ? { returnSupport: true } : {}),
      },
    } : sampledState.employeeDuties,
  }, { cashOutflowsCents: feeCents })
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
    name: `${project.profile[0].toUpperCase()}${project.profile.slice(1)}${project.module === 'none' ? '' : ` ${project.module[0].toUpperCase()}${project.module.slice(1)}`} ${FAMILY_NAME[project.family]}`,
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
  completed = creditV3EmployeeRecords(completed, project.contributorEmployeeIds, { blueprintId })
  completed = {
    ...completed,
    world: { ...completed.world, employees: completed.world.employees.map((employee) => applyV3LevelUps(employee)) },
  }
  if (project.leadEmployeeId) completed = returnV3EmployeeFromDevelopment(completed, project.leadEmployeeId)
  return completed
}
