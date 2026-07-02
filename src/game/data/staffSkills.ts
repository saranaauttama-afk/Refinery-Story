import type { BilingualTextValue, SkillChannel, StaffSkill, WorkerType, RecruitmentTier } from '../types'
import { bilingual } from '../translations'
import { STAFF_SKILL_BALANCE } from './balance'

// --- Staff Skills (v2) ---
// The four skill channels, the role→channel map, and the roll/derive logic.
// Skills are FLAT % fractions shown verbatim; aggregation (per-plant / team)
// lives in gameCalculations so it can read the whole GameState + balance.

export type SkillChannelMeta = {
  key: SkillChannel
  icon: string
  name: BilingualTextValue
  short: BilingualTextValue
}

export const SKILL_CHANNELS: SkillChannelMeta[] = [
  { key: 'output', icon: '⚙️', name: bilingual('Output', 'ผลผลิต'), short: bilingual('Output', 'ผลผลิต') },
  { key: 'trade', icon: '💰', name: bilingual('Sell Price', 'ราคาขาย'), short: bilingual('Trade', 'ขาย') },
  { key: 'safety', icon: '🌱', name: bilingual('Safety / ESG', 'ความปลอดภัย/ESG'), short: bilingual('Safety', 'ปลอดภัย') },
  { key: 'upkeep', icon: '🔧', name: bilingual('Upkeep', 'ค่าบำรุง'), short: bilingual('Upkeep', 'บำรุง') },
]

const CHANNEL_BY_KEY: Record<SkillChannel, SkillChannelMeta> = Object.fromEntries(
  SKILL_CHANNELS.map((c) => [c.key, c]),
) as Record<SkillChannel, SkillChannelMeta>

export function getSkillChannelMeta(channel: SkillChannel): SkillChannelMeta {
  return CHANNEL_BY_KEY[channel]
}

const ALL_CHANNELS: SkillChannel[] = SKILL_CHANNELS.map((c) => c.key)

// A worker's PRIMARY channel — their role skill lines up with what their job
// naturally does, so "operator = output", "sales = trade", etc.
const ROLE_CHANNEL: Record<WorkerType, SkillChannel> = {
  operator: 'output',
  mechanic: 'upkeep',
  salesAgent: 'trade',
  safetyOfficer: 'safety',
  chemist: 'output',
  logisticsCoordinator: 'upkeep',
  fuelSpecialist: 'trade',
  aviationSpecialist: 'output',
  chemicalEngineer: 'output',
  polymerEngineer: 'output',
}

export function getRoleChannel(type: WorkerType): SkillChannel {
  return ROLE_CHANNEL[type]
}

// Round to a tidy 0.5% step so displayed numbers stay clean (1%, 1.5%, 3% ...).
function roundStep(value: number): number {
  return Math.round(value / 0.005) * 0.005
}

function randRange([min, max]: readonly [number, number] | number[]): number {
  return min + Math.random() * (max - min)
}

function randChannel(): SkillChannel {
  return ALL_CHANNELS[Math.floor(Math.random() * ALL_CHANNELS.length)]
}

// Roll the skills for a fresh hire: a role skill (value by tier), a secondary
// skill on a different channel, and — rarely — a strong 3rd "Ace" skill.
export function rollSkillsForWorker(
  type: WorkerType,
  tier: RecruitmentTier,
): { skills: StaffSkill[]; isAce: boolean } {
  const roleChannel = ROLE_CHANNEL[type]
  const roleValue = roundStep(randRange(STAFF_SKILL_BALANCE.roleValueByTier[tier]))
  const skills: StaffSkill[] = [{ channel: roleChannel, value: Math.max(0.005, roleValue) }]

  // Secondary on a different channel for variety.
  const others = ALL_CHANNELS.filter((c) => c !== roleChannel)
  const secondaryChannel = others[Math.floor(Math.random() * others.length)]
  skills.push({
    channel: secondaryChannel,
    value: Math.max(0.005, roundStep(randRange(STAFF_SKILL_BALANCE.secondaryValue))),
  })

  const isAce = Math.random() < STAFF_SKILL_BALANCE.aceChance
  if (isAce) {
    skills.push({ channel: randChannel(), value: roundStep(randRange(STAFF_SKILL_BALANCE.aceValue)) })
  }
  return { skills, isAce }
}

// Deterministic skills for an employee that predates the skill system (old
// saves) — no RNG, derived from type + level (+ a bump for the veteran trait)
// so it's stable across reloads.
export function deriveSkillsForEmployee(
  type: WorkerType,
  level: number,
  trait?: string,
): { skills: StaffSkill[]; isAce: boolean } {
  const roleChannel = ROLE_CHANNEL[type]
  const roleValue = roundStep(0.015 + (Math.max(1, level) - 1) * 0.005)
  const secondaryChannel = ALL_CHANNELS[(ALL_CHANNELS.indexOf(roleChannel) + 1) % ALL_CHANNELS.length]
  const skills: StaffSkill[] = [
    { channel: roleChannel, value: Math.max(0.005, roleValue) },
    { channel: secondaryChannel, value: 0.01 },
  ]
  // Grandfather the best old trait into an Ace skill so veterans stay special.
  const isAce = trait === 'veteran' || trait === 'prodigy'
  if (isAce) skills.push({ channel: roleChannel, value: 0.1 })
  return { skills, isAce }
}
