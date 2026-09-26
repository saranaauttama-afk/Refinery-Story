import type { Employee, SkillChannel, WorkerType } from '../types'
import { V3_ROLES, V3_STAFF_LEVELS } from './data'
import { getV3Fame } from './fame'
import type { V3GameState } from './types'

/**
 * V3-21e staff careers and rare candidates (Kairosoft "class up").
 * A Lv5 employee can be promoted: level resets to 1 but the career rank gives
 * a permanent boost (line crew +5% per rank with a matching cap raise; support
 * effect ×1.25 per rank). Rare candidates appear once per in-game quarter at
 * fame Lv3+. All deterministic; V3-A hypotheses for V3-18.
 */
export const V3_CAREER = {
  maxRank: 2,
  crewRatePerRank: 0.05,
  supportPerRank: 0.25,
  promotionDollars: [2_000, 4_000] as const,
  promotionRp: [10, 20] as const,
  titles: [
    { en: '', th: '' },
    { en: 'Senior', th: 'อาวุโส' },
    { en: 'Chief', th: 'หัวหน้า' },
  ],
} as const

export function getV3CareerRank(state: V3GameState, employeeId: string): number {
  return state.employeeRecords[employeeId]?.careerRank ?? 0
}

export type V3PromotionBlocker = 'employee_missing' | 'max_rank' | 'level_required' | 'insufficient_cash' | 'insufficient_rp'

export function validateV3Promotion(state: V3GameState, employeeId: string): { blocker: V3PromotionBlocker; params?: Record<string, number> } | null {
  const employee = state.world.employees.find((entry) => entry.id === employeeId)
  if (!employee) return { blocker: 'employee_missing' }
  const rank = getV3CareerRank(state, employeeId)
  if (rank >= V3_CAREER.maxRank) return { blocker: 'max_rank' }
  if (employee.level < V3_STAFF_LEVELS.maxLevel) return { blocker: 'level_required', params: { level: V3_STAFF_LEVELS.maxLevel } }
  const cents = V3_CAREER.promotionDollars[rank] * 100
  if (state.world.moneyCents < cents) return { blocker: 'insufficient_cash', params: { costCents: cents } }
  if (state.world.researchPoints + 1e-8 < V3_CAREER.promotionRp[rank]) return { blocker: 'insufficient_rp', params: { rp: V3_CAREER.promotionRp[rank] } }
  return null
}

export function promoteV3Employee(state: V3GameState, employeeId: string): V3GameState {
  const rank = getV3CareerRank(state, employeeId)
  const cents = V3_CAREER.promotionDollars[rank] * 100
  const record = state.employeeRecords[employeeId] ?? { workTicks: 0, blueprintIds: [], milestoneIds: [] }
  return {
    ...state,
    world: {
      ...state.world,
      moneyCents: state.world.moneyCents - cents,
      researchPoints: state.world.researchPoints - V3_CAREER.promotionRp[rank],
      employees: state.world.employees.map((employee) => employee.id === employeeId ? { ...employee, level: 1, xp: 0 } : employee),
    },
    employeeRecords: { ...state.employeeRecords, [employeeId]: { ...record, careerRank: rank + 1 } },
    operatingLedger: { ...state.operatingLedger, capexCents: state.operatingLedger.capexCents + cents },
  }
}

// ---- Rare candidates ----
export const V3_RARE_CANDIDATE_TICKS = 900 // one per in-game quarter
export const V3_RARE_CANDIDATE_MIN_FAME = 3
const SKILL_FOR_ROLE: Record<WorkerType, SkillChannel> = {
  operator: 'output', fuelSpecialist: 'output', aviationSpecialist: 'output', chemicalEngineer: 'output',
  polymerEngineer: 'output', chemist: 'output', logisticsCoordinator: 'output',
  salesAgent: 'trade', mechanic: 'upkeep', safetyOfficer: 'safety',
}
const RARE_NAMES = ['Aria', 'Boon', 'Chai', 'Dao', 'Ekk', 'Fon', 'Gade', 'Hana', 'Ira', 'Jom', 'Kan', 'Lek']

export type V3RareCandidate = { id: string; employee: Employee; costCents: number; quarter: number }

export function getV3RareCandidate(state: V3GameState): V3RareCandidate | null {
  if (getV3Fame(state).level < V3_RARE_CANDIDATE_MIN_FAME) return null
  const quarter = Math.floor(state.world.tickCount / V3_RARE_CANDIDATE_TICKS)
  const id = `candidate:q${quarter}`
  if (state.campaignProgress.claimedFlags.includes(id)) return null
  const roles = (Object.keys(V3_ROLES) as WorkerType[])
    .filter((role) => V3_ROLES[role].hireable && V3_ROLES[role].hireChapter <= state.campaignProgress.chapter)
  if (!roles.length) return null
  const role = roles[(quarter * 7 + 3) % roles.length]
  const name = `${RARE_NAMES[quarter % RARE_NAMES.length]} ★`
  const employee: Employee = {
    id: `employee:rare:${String(quarter).padStart(5, '0')}`,
    type: role,
    name,
    level: 3,
    xp: 0,
    isAce: true,
    skills: [{ channel: SKILL_FOR_ROLE[role], value: 0.04 }, { channel: role === 'salesAgent' ? 'output' : 'trade', value: 0.02 }],
  }
  return { id, employee, costCents: V3_ROLES[role].hireCostDollars * 300, quarter }
}
