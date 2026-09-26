import { getV3BuildingType } from './yard'
import type { Employee, WorkerType } from '../types'
import {
  V3_CAPS,
  V3_ROLES,
  V3_STAFF_CAP_BY_CHAPTER,
  V3_STAFF_LEVELS,
  isV3ProcessBuilding,
  type V3ProcessBuilding,
} from './data'
import { recordV3Ledger } from './productInventory'
import type { V3EmployeeDuty, V3EmployeeRecord, V3GameState, V3ProductFamily } from './types'

const WAGE_DOLLARS_PER_MINUTE: Record<WorkerType, number> = {
  operator: 4,
  mechanic: 6,
  salesAgent: 8,
  safetyOfficer: 6,
  chemist: 8,
  logisticsCoordinator: 8,
  fuelSpecialist: 10,
  aviationSpecialist: 12,
  chemicalEngineer: 16,
  polymerEngineer: 18,
}

export function getV3Employee(state: V3GameState, employeeId: string): Employee | undefined {
  return state.world.employees.find((employee) => employee.id === employeeId)
}

export function getV3WageCents(employee: Employee, duty: V3EmployeeDuty, deltaTicks: number): number {
  const levelScale = Math.min(2, 1 + 0.1 * Math.max(0, employee.level - 1))
  const dutyScale = duty.kind === 'reserve' ? 0.25 : 1
  return WAGE_DOLLARS_PER_MINUTE[employee.type] * 100 * levelScale * dutyScale * deltaTicks / 300
}

export function getV3LineEmployee(state: V3GameState, buildingId: string): Employee | undefined {
  const employeeId = Object.keys(state.employeeDuties).sort().find((id) => {
    const duty = state.employeeDuties[id]
    return duty.kind === 'line' && duty.buildingId === buildingId
  })
  return employeeId ? getV3Employee(state, employeeId) : undefined
}

export function canV3StaffLine(type: WorkerType, building: string | null | undefined): boolean {
  return isV3ProcessBuilding(building as never) && V3_ROLES[type].lineBuildings.includes(building as V3ProcessBuilding)
}

export function canV3Support(type: WorkerType): boolean {
  return V3_ROLES[type].support !== null
}

/** Q+5 lead: matched specialist/Chemist for the family, or any Operator Lv≥3. */
export function getV3LeadContribution(employee: Employee, family: V3ProductFamily): 0 | 5 {
  if (employee.type === 'operator') return employee.level >= 3 ? 5 : 0
  return V3_ROLES[employee.type].leadFamilies.includes(family) ? 5 : 0
}

export function canV3Lead(employee: Employee, family: V3ProductFamily): boolean {
  return V3_ROLES[employee.type].leadFamilies.includes(family)
}

export function getV3LocalCrewRate(state: V3GameState, buildingId: string): number {
  const employee = getV3LineEmployee(state, buildingId)
  const building = getV3BuildingType(state, buildingId)
  if (!employee || state.unpaidEmployeeIds.includes(employee.id) || !canV3StaffLine(employee.type, building)) return 0
  const level = Math.max(0, employee.level - 1)
  const matched = V3_ROLES[employee.type].matchedBuildings.includes(building as V3ProcessBuilding)
  const roleRate = matched ? Math.min(0.25, 0.15 + 0.02 * level) : Math.min(0.2, 0.1 + 0.02 * level)
  const skillRate = (employee.skills ?? [])
    .filter((skill) => skill.channel === 'output')
    .reduce((sum, skill) => sum + skill.value, 0)
  return Math.min(V3_CAPS.localCrewRate, roleRate + skillRate)
}

export function getV3StaffCap(state: V3GameState): number {
  return V3_STAFF_CAP_BY_CHAPTER[state.campaignProgress.chapter] ?? V3_STAFF_CAP_BY_CHAPTER[0]
}

export function getV3TrainingCost(employee: Employee): { cents: number; rp: number } {
  return {
    cents: (V3_STAFF_LEVELS.trainBaseDollars + employee.level * V3_STAFF_LEVELS.trainDollarsPerLevel) * 100,
    rp: V3_STAFF_LEVELS.trainRp,
  }
}

/** Applies legacy thresholds; surplus XP carries to the next level. */
export function applyV3LevelUps(employee: Employee): Employee {
  let next = employee
  while (next.level < V3_STAFF_LEVELS.maxLevel) {
    const threshold = V3_STAFF_LEVELS.xpToNextLevel[next.level] ?? Infinity
    if (next.xp + 1e-9 < threshold) break
    next = { ...next, level: next.level + 1, xp: next.xp - threshold }
  }
  return next
}

export function emptyV3EmployeeRecord(): V3EmployeeRecord {
  return { workTicks: 0, blueprintIds: [], milestoneIds: [] }
}

export function creditV3EmployeeRecords(
  state: V3GameState,
  employeeIds: string[],
  credit: { blueprintId?: string; milestoneId?: string },
): V3GameState {
  if (!employeeIds.length) return state
  const employeeRecords = { ...state.employeeRecords }
  for (const id of employeeIds) {
    const record = employeeRecords[id] ?? emptyV3EmployeeRecord()
    employeeRecords[id] = {
      ...record,
      blueprintIds: credit.blueprintId && !record.blueprintIds.includes(credit.blueprintId) ? [...record.blueprintIds, credit.blueprintId] : record.blueprintIds,
      milestoneIds: credit.milestoneId && !record.milestoneIds.includes(credit.milestoneId) ? [...record.milestoneIds, credit.milestoneId] : record.milestoneIds,
    }
  }
  return { ...state, employeeRecords }
}

export type V3WageSettlement = {
  state: V3GameState
  paidEmployeeIds: string[]
  unpaidEmployeeIds: string[]
  wagesCents: number
}

export function settleV3Wages(state: V3GameState, deltaTicks: number): V3WageSettlement {
  let moneyCents = state.world.moneyCents
  let wagesCents = 0
  const paidEmployeeIds: string[] = []
  const unpaidEmployeeIds: string[] = []
  for (const employee of [...state.world.employees].sort((a, b) => a.id.localeCompare(b.id))) {
    if (state.unpaidEmployeeIds.includes(employee.id)) {
      unpaidEmployeeIds.push(employee.id)
      continue
    }
    const duty = state.employeeDuties[employee.id] ?? { kind: 'reserve' as const }
    const wage = getV3WageCents(employee, duty, deltaTicks)
    if (moneyCents + 1e-8 >= wage) {
      moneyCents -= wage
      wagesCents += wage
      paidEmployeeIds.push(employee.id)
    } else {
      unpaidEmployeeIds.push(employee.id)
    }
  }
  const paid = {
    ...state,
    world: { ...state.world, moneyCents: Math.max(0, moneyCents) },
    unpaidEmployeeIds,
  }
  return {
    state: wagesCents > 0 ? recordV3Ledger(paid, { wagesCents, cashOutflowsCents: wagesCents }) : paid,
    paidEmployeeIds,
    unpaidEmployeeIds,
    wagesCents,
  }
}

/**
 * XP only for actual productive line work: the legacy rate of 1 XP per active
 * tick, where a full-rate cycle of work equals 25 ticks. Level-ups apply once.
 */
export function addV3DutyXp(state: V3GameState, actualWorkByCell: Record<string, number>): V3GameState {
  let employeeRecords = state.employeeRecords
  const employees = state.world.employees.map((employee) => {
    const duty = state.employeeDuties[employee.id]
    const work = duty?.kind === 'line' ? actualWorkByCell[duty.buildingId] ?? 0 : 0
    if (!duty || duty.kind !== 'line' || state.unpaidEmployeeIds.includes(employee.id) || work <= 0) return employee
    const ticks = work * 25
    const record = employeeRecords[employee.id] ?? emptyV3EmployeeRecord()
    employeeRecords = { ...employeeRecords, [employee.id]: { ...record, workTicks: record.workTicks + ticks } }
    return applyV3LevelUps({ ...employee, xp: employee.xp + ticks * V3_STAFF_LEVELS.xpPerWorkTick })
  })
  return { ...state, employeeRecords, world: { ...state.world, employees } }
}

export function returnV3EmployeeFromDevelopment(state: V3GameState, employeeId: string): V3GameState {
  const duty = state.employeeDuties[employeeId]
  if (duty?.kind !== 'development') return state
  const employee = getV3Employee(state, employeeId)
  if (duty.returnSupport && employee && canV3Support(employee.type)) {
    return { ...state, employeeDuties: { ...state.employeeDuties, [employeeId]: { kind: 'support' } } }
  }
  const targetAvailable = duty.returnBuildingId !== null && Boolean(employee) &&
    canV3StaffLine(employee!.type, getV3BuildingType(state, duty.returnBuildingId)) &&
    Boolean(state.plantPrograms[duty.returnBuildingId]) &&
    !Object.entries(state.employeeDuties).some(([id, otherDuty]) =>
      id !== employeeId && otherDuty.kind === 'line' && otherDuty.buildingId === duty.returnBuildingId,
    )
  return {
    ...state,
    employeeDuties: {
      ...state.employeeDuties,
      [employeeId]: targetAvailable && duty.returnBuildingId !== null
        ? { kind: 'line', buildingId: duty.returnBuildingId }
        : { kind: 'reserve' },
    },
  }
}
