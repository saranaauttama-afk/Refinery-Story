// Pure employee helper functions — no imports from gameCalculations.
// This file exists to break the circular dependency:
//   gameCalculations → recruitment → gameCalculations
// Both files import from here instead of from each other.

import type { Employee, WorkerType } from '../types'

export function getEmployeesByType(employees: Employee[], type: WorkerType): Employee[] {
  return employees.filter((employee) => employee.type === type)
}
