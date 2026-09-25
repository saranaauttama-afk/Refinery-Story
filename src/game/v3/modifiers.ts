import type { Employee } from '../types'
import {
  V3_CAPS,
  V3_RESEARCH,
  V3_ROLES,
  V3_SALES_OFFICE_TRADE_BY_LEVEL,
  V3_STAFF_LEVELS,
  type V3SupportedResearch,
} from './data'
import type { V3GameState } from './types'

export type V3CappedChannel = { raw: number; effective: number; cap: number }

export type V3Modifiers = {
  globalRate: V3CappedChannel
  storagePercent: V3CappedChannel
  trade: V3CappedChannel
  rp: V3CappedChannel
  coreStorageFlat: number
  mechanicStorageFlat: number
  /** Per-employee effective contribution while on an active, paid support duty. */
  supportContributions: Record<string, { channel: string; value: number }>
}

export function getV3LevelEffectiveness(employee: Employee): number {
  return 1 + V3_STAFF_LEVELS.bonusPerLevelRate * Math.max(0, employee.level - 1)
}

function capped(raw: number, cap: number): V3CappedChannel {
  return { raw, effective: Math.min(cap, Math.max(0, raw)), cap }
}

function owns(state: V3GameState, id: V3SupportedResearch): boolean {
  return state.world.unlockedResearchIds.includes(id as never)
}

/** Global (non-local) modifiers. Only paid Support duty supplies role/skill bonuses. */
export function getV3Modifiers(state: V3GameState): V3Modifiers {
  let globalRate = 0
  let storagePercent = 0
  let trade = 0
  let rp = 0
  let coreStorageFlat = 0
  for (const [id, rule] of Object.entries(V3_RESEARCH)) {
    if (!owns(state, id as V3SupportedResearch)) continue
    const effect = rule.effect
    if (effect.kind === 'globalRate') globalRate += effect.value
    else if (effect.kind === 'storagePercent') storagePercent += effect.value
    else if (effect.kind === 'trade') trade += effect.value
    else if (effect.kind === 'jobRp') rp += effect.value
    else if (effect.kind === 'coreStorage') coreStorageFlat += effect.value
  }
  // Sales Office: only the highest office counts, never stacked.
  let bestOffice = 0
  state.world.grid.forEach((cell, index) => {
    if (cell === 'salesOffice') bestOffice = Math.max(bestOffice, V3_SALES_OFFICE_TRADE_BY_LEVEL[state.world.gridLevels[index] ?? 1] ?? 0)
  })
  trade += bestOffice

  let mechanicStaff = 0
  let chemistStaff = 0
  const supportContributions: V3Modifiers['supportContributions'] = {}
  const supporters = state.world.employees
    .filter((employee) => state.employeeDuties[employee.id]?.kind === 'support' && !state.unpaidEmployeeIds.includes(employee.id))
    .sort((a, b) => a.id.localeCompare(b.id))
  for (const employee of supporters) {
    const role = V3_ROLES[employee.type]
    const effectiveness = getV3LevelEffectiveness(employee)
    if (role.support === 'storageFlat') {
      const counted = Math.max(0, Math.min(effectiveness, V3_CAPS.mechanicEffectiveStaff - mechanicStaff))
      mechanicStaff += counted
      supportContributions[employee.id] = { channel: 'storageFlat', value: counted * role.supportValue }
    } else if (role.support === 'rp') {
      const counted = Math.max(0, Math.min(effectiveness, V3_CAPS.chemistEffectiveStaff - chemistStaff))
      chemistStaff += counted
      rp += counted * role.supportValue
      supportContributions[employee.id] = { channel: 'rp', value: counted * role.supportValue }
    } else if (role.support === 'trade') {
      trade += role.supportValue * effectiveness
      supportContributions[employee.id] = { channel: 'trade', value: role.supportValue * effectiveness }
    } else if (role.support === 'storagePercent') {
      storagePercent += role.supportValue * effectiveness
      supportContributions[employee.id] = { channel: 'storagePercent', value: role.supportValue * effectiveness }
    }
    // Support skills feed matching global channels; safety/upkeep stay inactive.
    for (const skill of employee.skills ?? []) {
      if (skill.channel === 'output') globalRate += skill.value
      else if (skill.channel === 'trade') trade += skill.value
    }
  }
  return {
    globalRate: capped(globalRate, V3_CAPS.globalRate),
    storagePercent: capped(storagePercent, V3_CAPS.storagePercent),
    trade: capped(trade, V3_CAPS.trade),
    rp: capped(rp, V3_CAPS.rp),
    coreStorageFlat,
    mechanicStorageFlat: mechanicStaff * V3_ROLES.mechanic.supportValue,
    supportContributions,
  }
}
