import type { Employee, WorkerType } from '../types'
import { isV3ProcessBuilding } from './data'
import { recordV3Ledger } from './productInventory'
import type { V3EmployeeDuty, V3GameState } from './types'

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

export function getV3LineEmployee(state: V3GameState, cellIndex: number): Employee | undefined {
  const employeeId = Object.keys(state.employeeDuties).sort().find((id) => {
    const duty = state.employeeDuties[id]
    return duty.kind === 'line' && duty.cellIndex === cellIndex
  })
  return employeeId ? getV3Employee(state, employeeId) : undefined
}

export function getV3LocalCrewRate(state: V3GameState, cellIndex: number): number {
  const employee = getV3LineEmployee(state, cellIndex)
  if (!employee || employee.type !== 'operator' || state.unpaidEmployeeIds.includes(employee.id)) return 0
  const roleRate = Math.min(0.2, 0.1 + 0.02 * Math.max(0, employee.level - 1))
  const skillRate = (employee.skills ?? [])
    .filter((skill) => skill.channel === 'output')
    .reduce((sum, skill) => sum + skill.value, 0)
  return Math.min(0.3, roleRate + skillRate)
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

export function addV3DutyXp(state: V3GameState, actualWorkByCell: Record<number, number>): V3GameState {
  const employees = state.world.employees.map((employee) => {
    const duty = state.employeeDuties[employee.id]
    if (
      !duty || duty.kind !== 'line' ||
      state.unpaidEmployeeIds.includes(employee.id) ||
      (actualWorkByCell[duty.cellIndex] ?? 0) <= 0
    ) return employee
    return { ...employee, xp: employee.xp + actualWorkByCell[duty.cellIndex] }
  })
  return { ...state, world: { ...state.world, employees } }
}

export function returnV3EmployeeFromDevelopment(state: V3GameState, employeeId: string): V3GameState {
  const duty = state.employeeDuties[employeeId]
  if (duty?.kind !== 'development') return state
  const targetAvailable = duty.returnCellIndex !== null &&
    isV3ProcessBuilding(state.world.grid[duty.returnCellIndex]) &&
    Boolean(state.plantPrograms[duty.returnCellIndex]) &&
    !Object.entries(state.employeeDuties).some(([id, otherDuty]) =>
      id !== employeeId && otherDuty.kind === 'line' && otherDuty.cellIndex === duty.returnCellIndex,
    )
  return {
    ...state,
    employeeDuties: {
      ...state.employeeDuties,
      [employeeId]: targetAvailable && duty.returnCellIndex !== null
        ? { kind: 'line', cellIndex: duty.returnCellIndex }
        : { kind: 'reserve' },
    },
  }
}
