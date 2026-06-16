// Recruitment pool (mobile-only feature, addresses "hiring is just a flat
// always-available list" with a more game-like "3 candidates apply, pick
// one" flow that's common in mobile management games).
//
// Quality tiers: candidates are randomly one of Rookie/Skilled/Expert/Star,
// with weights that shift as the refinery levels up (early game = mostly
// Rookies, late game = more Skilled/Expert). Star is always rare and always
// comes with the Veteran trait.

import type { Employee, RecruitmentCandidate, RecruitmentTier, WorkerType } from '../types'
import { STAFF_LEVEL_BALANCE } from './balance'
import { WORKERS } from './workers'
import { getStaffName } from './staffNames'
import { getEmployeesByType } from '../utils/gameCalculations'

export type { RecruitmentCandidate, RecruitmentTier }

export const RECRUITMENT_BALANCE = {
  poolSize: 3,
  // ~2 minutes at 200ms/tick.
  refreshIntervalTicks: 600,
  manualRefreshBaseCost: 200,
  manualRefreshCostPerLevel: 20,
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
export function generateCandidate(refineryLevel: number, nameIndex: number): RecruitmentCandidate {
  const unlockedTypes = getUnlockedWorkerTypes(refineryLevel)
  const type = unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)]
  const tier = rollTier(refineryLevel)
  const isVeteran = tier === 'star' || Math.random() < STAFF_LEVEL_BALANCE.veteranHireChance
  return {
    id: `candidate-${nameIndex}-${type}`,
    type,
    name: getStaffName(nameIndex),
    tier,
    startingLevel: RECRUITMENT_BALANCE.tiers[tier].startingLevel,
    cost: getCandidateCost(type, tier),
    isVeteran,
  }
}

export function generateRecruitmentPool(
  refineryLevel: number,
  startNameIndex: number,
): { pool: RecruitmentCandidate[]; nextNameIndex: number } {
  const pool: RecruitmentCandidate[] = []
  let nameIndex = startNameIndex
  for (let i = 0; i < RECRUITMENT_BALANCE.poolSize; i++) {
    pool.push(generateCandidate(refineryLevel, nameIndex))
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
    ...(candidate.isVeteran ? { trait: 'veteran' as const } : {}),
  }
}
