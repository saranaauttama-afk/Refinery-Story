// Recruitment pool (mobile-only feature, addresses "hiring is just a flat
// always-available list" with a more game-like "3 candidates apply, pick
// one" flow that's common in mobile management games).
//
// Quality tiers: candidates are randomly one of Rookie/Skilled/Expert/Star,
// with weights that shift as the refinery levels up (early game = mostly
// Rookies, late game = more Skilled/Expert). Star is always rare and always
// comes with the Veteran trait.

import type { Employee, RecruitmentCandidate, RecruitmentTier, WorkerType } from '../types'
import { rollStaffTrait, rollStarTrait } from './staffTraits'
import { STAFF_LEVEL_BALANCE } from './balance'
import { WORKERS } from './workers'
import { getStaffName } from './staffNames'
import { getEmployeesByType } from '../utils/employeeUtils'

export type { RecruitmentCandidate, RecruitmentTier }

export const RECRUITMENT_BALANCE = {
  poolSize: 3,
  // ~2 minutes at 200ms/tick.
  refreshIntervalTicks: 3600,
  manualRefreshBaseCost: 200,
  manualRefreshCostPerLevel: 20,
  // Chance a refresh offers an already-staffed specialist (for quality
  // upgrades) when you own its plant but have no empty slot for it. Under-
  // staffed specialists are guaranteed instead (see generateRecruitmentPool).
  specialistUpgradeChance: 0.4,
  tiers: {
    rookie: { startingLevel: 1, costMultiplier: 1.0 },
    skilled: { startingLevel: 2, costMultiplier: 1.5 },
    expert: { startingLevel: 3, costMultiplier: 2.5 },
    star: { startingLevel: 4, costMultiplier: 4.0 },
  } as const,
  // Tier weights by refinery level bracket (highest minLevel <= current
  // refineryLevel wins). Star's chance climbs from 1% -> 5% -> 10%; "นานๆ
  // จะมีสตาร์มาที" but a bit more often once the refinery is established.
  tierWeightBrackets: [
    { minLevel: 1, weights: { rookie: 70, skilled: 25, expert: 4, star: 1 } },
    { minLevel: 5, weights: { rookie: 45, skilled: 35, expert: 15, star: 5 } },
    { minLevel: 10, weights: { rookie: 25, skilled: 35, expert: 30, star: 10 } },
  ],
} as const

export function getUnlockedWorkerTypes(refineryLevel: number): WorkerType[] {
  return WORKERS.filter((w) => (w.unlockLevel ?? 1) <= refineryLevel).map((w) => w.key)
}

function getTierWeights(refineryLevel: number): Record<RecruitmentTier, number> {
  let weights: Record<RecruitmentTier, number> = RECRUITMENT_BALANCE.tierWeightBrackets[0].weights
  for (const bracket of RECRUITMENT_BALANCE.tierWeightBrackets) {
    if (refineryLevel >= bracket.minLevel) weights = bracket.weights
  }
  return weights
}

export function rollTier(refineryLevel: number): RecruitmentTier {
  const weights = getTierWeights(refineryLevel)
  const total = weights.rookie + weights.skilled + weights.expert + weights.star
  let roll = Math.random() * total
  for (const tier of ['rookie', 'skilled', 'expert', 'star'] as const) {
    roll -= weights[tier]
    if (roll < 0) return tier
  }
  return 'rookie'
}

export function getCandidateCost(type: WorkerType, tier: RecruitmentTier): number {
  const worker = WORKERS.find((w) => w.key === type)!
  return Math.round(worker.cost * RECRUITMENT_BALANCE.tiers[tier].costMultiplier)
}

// `nameIndex` is a monotonically-increasing counter (GameState.
// recruitmentNameCounter) so candidate names cycle through STAFF_NAME_POOL
// independently of how many employees have actually been hired -- a
// candidate's displayed name doesn't change if other hires happen first.
export function generateCandidate(
  refineryLevel: number,
  nameIndex: number,
  forceType?: WorkerType,
  // Types kept out of the random draw (e.g. specialists whose plant you don't
  // own). Ignored when forceType is set. Falls back to the full unlocked list
  // if excluding would leave nothing.
  excludeTypes: WorkerType[] = [],
): RecruitmentCandidate {
  const unlockedTypes = getUnlockedWorkerTypes(refineryLevel)
  let type: WorkerType
  if (forceType && unlockedTypes.includes(forceType)) {
    type = forceType
  } else {
    const pickable = unlockedTypes.filter((t) => !excludeTypes.includes(t))
    const from = pickable.length > 0 ? pickable : unlockedTypes
    type = from[Math.floor(Math.random() * from.length)]
  }
  const tier = rollTier(refineryLevel)
  // Every candidate has a personality; star recruits get a standout one.
  const trait = tier === 'star' ? rollStarTrait() : rollStaffTrait()
  return {
    id: `candidate-${nameIndex}-${type}`,
    type,
    name: getStaffName(nameIndex),
    tier,
    startingLevel: RECRUITMENT_BALANCE.tiers[tier].startingLevel,
    cost: getCandidateCost(type, tier),
    isVeteran: trait === 'veteran',
    trait,
  }
}

export type RecruitmentPoolOptions = {
  // Guaranteed in slot 0 (one, random among them): a specialist you're short a
  // body for. Highest priority so an empty plant gets filled promptly.
  guaranteeTypes?: WorkerType[]
  // Offered in slot 0 with `specialistUpgradeChance` when nothing is guaranteed:
  // already-staffed specialists you own the plant for, so you can keep fishing
  // for a better-tier hire and retire the weaker one.
  chanceTypes?: WorkerType[]
  // Kept out of the random draw entirely (e.g. specialists with no plant yet).
  excludeTypes?: WorkerType[]
}

export function generateRecruitmentPool(
  refineryLevel: number,
  startNameIndex: number,
  { guaranteeTypes = [], chanceTypes = [], excludeTypes = [] }: RecruitmentPoolOptions = {},
): { pool: RecruitmentCandidate[]; nextNameIndex: number } {
  const pool: RecruitmentCandidate[] = []
  let nameIndex = startNameIndex
  const unlocked = getUnlockedWorkerTypes(refineryLevel)
  const guarantees = guaranteeTypes.filter((t) => unlocked.includes(t))
  const chances = chanceTypes.filter((t) => unlocked.includes(t))
  for (let i = 0; i < RECRUITMENT_BALANCE.poolSize; i++) {
    // Slot 0: a needed specialist if any; else, sometimes, an upgrade-worthy
    // one; else a normal random hire (specialists without a plant excluded).
    let forceType: WorkerType | undefined
    if (i === 0) {
      if (guarantees.length > 0) {
        forceType = guarantees[Math.floor(Math.random() * guarantees.length)]
      } else if (chances.length > 0 && Math.random() < RECRUITMENT_BALANCE.specialistUpgradeChance) {
        forceType = chances[Math.floor(Math.random() * chances.length)]
      }
    }
    pool.push(generateCandidate(refineryLevel, nameIndex, forceType, excludeTypes))
    nameIndex++
  }
  return { pool, nextNameIndex: nameIndex }
}

export function getManualRefreshCost(refineryLevel: number): number {
  return (
    RECRUITMENT_BALANCE.manualRefreshBaseCost +
    (refineryLevel - 1) * RECRUITMENT_BALANCE.manualRefreshCostPerLevel
  )
}

// Builds the actual Employee from a chosen candidate. `id` follows the same
// per-type scheme as createNewEmployee (`${type}-${count}`) for uniqueness;
// `name`/`level`/`trait` come from the candidate.
export function hireCandidateEmployee(employees: Employee[], candidate: RecruitmentCandidate): Employee {
  const typeIndex = getEmployeesByType(employees, candidate.type).length
  return {
    id: `${candidate.type}-${typeIndex}`,
    type: candidate.type,
    name: candidate.name,
    level: candidate.startingLevel,
    xp: 0,
    ...(candidate.trait ? { trait: candidate.trait } : {}),
  }
}
