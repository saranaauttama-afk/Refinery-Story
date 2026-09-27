import type { GameState, Milestone, MilestoneKey } from '../types'
import { text } from '../translations'

export const MILESTONES: Milestone[] = [
  {
    key: 'firstFuel',
    name: text.data.milestones.firstFuel.name,
    requirement: text.data.milestones.firstFuel.requirement,
    reward: '$300',
  },
  {
    key: 'smallSupplier',
    name: text.data.milestones.smallSupplier.name,
    requirement: text.data.milestones.smallSupplier.requirement,
    reward: '5 RP, +10 Rep',
  },
  {
    key: 'growingRefinery',
    name: text.data.milestones.growingRefinery.name,
    requirement: text.data.milestones.growingRefinery.requirement,
    reward: '$1,000, +15 Rep',
  },
  {
    key: 'researchBeginner',
    name: text.data.milestones.researchBeginner.name,
    requirement: text.data.milestones.researchBeginner.requirement,
    reward: '$500, +20 Rep',
  },
  // Midgame milestones
  {
    key: 'upgradeBuilder',
    name: text.data.milestones.upgradeBuilder.name,
    requirement: text.data.milestones.upgradeBuilder.requirement,
    reward: '$500, 5 RP',
  },
  {
    key: 'reputedSupplier',
    name: text.data.milestones.reputedSupplier.name,
    requirement: text.data.milestones.reputedSupplier.requirement,
    reward: '$800, 10 RP',
  },
  {
    key: 'industrialProducer',
    name: text.data.milestones.industrialProducer.name,
    requirement: text.data.milestones.industrialProducer.requirement,
    reward: '$1,200',
  },
  {
    key: 'refineryLevel5',
    name: text.data.milestones.refineryLevel5.name,
    requirement: text.data.milestones.refineryLevel5.requirement,
    reward: '$1,500, +20 Rep',
  },
  {
    key: 'researchAdvanced',
    name: text.data.milestones.researchAdvanced.name,
    requirement: text.data.milestones.researchAdvanced.requirement,
    reward: '$1,000, +15 Rep',
  },
  {
    key: 'contractVeteran',
    name: text.data.milestones.contractVeteran.name,
    requirement: text.data.milestones.contractVeteran.requirement,
    reward: '$2,000, 15 RP',
  },
  {
    key: 'tierThreeContractor',
    name: text.data.milestones.tierThreeContractor.name,
    requirement: text.data.milestones.tierThreeContractor.requirement,
    reward: '$3,000, +40 Rep',
  },
  {
    key: 'fullWorkforce',
    name: text.data.milestones.fullWorkforce.name,
    requirement: text.data.milestones.fullWorkforce.requirement,
    reward: '$3,000, +35 Rep',
  },
  // Late-game milestones (Level 10–15 gap)
  {
    key: 'jetFuelPioneer',
    name: text.data.milestones.jetFuelPioneer.name,
    requirement: text.data.milestones.jetFuelPioneer.requirement,
    reward: '$2,500, +25 Rep',
  },
  {
    key: 'aviationPartner',
    name: text.data.milestones.aviationPartner.name,
    requirement: text.data.milestones.aviationPartner.requirement,
    reward: '$4,000, 30 RP',
  },
  {
    key: 'petrochemicalPioneer',
    name: text.data.milestones.petrochemicalPioneer.name,
    requirement: text.data.milestones.petrochemicalPioneer.requirement,
    reward: '$5,000, +50 Rep',
  },
  {
    key: 'productMogul',
    name: text.data.milestones.productMogul.name,
    requirement: text.data.milestones.productMogul.requirement,
    reward: '$10,000, +75 Rep',
  },
  // Idle-scale mid/late ladder — display entries; the check/reward logic is
  // data-driven in LADDER_MILESTONES below (applied generically in
  // applyMilestones instead of one hand-coded block per milestone).
  ...([
    'continentalRefiner',
    'globalRefiner',
    'energyEmpire',
    'firstMillion',
    'firstBillion',
    'fuelForANation',
    'oceanOfFuel',
    'contractLegend',
  ] as const).map((key) => ({
    key,
    name: text.data.milestones[key].name,
    requirement: text.data.milestones[key].requirement,
    reward: text.data.milestones[key].reward,
  })),
]

// The mid/late-game ladder that fills the long idle-scale climb (L20-60,
// $1M-$100B) with sub-goals. Each entry is checked generically every tick;
// rewards are sized at ~10-20% of a contemporary refinery upgrade so hitting
// one feels great without skipping a level outright.
export type LadderMilestone = {
  key: MilestoneKey
  isComplete: (game: GameState) => boolean
  progress: (game: GameState) => { current: number; target: number }
  moneyReward: number
  rpReward: number
  reputationReward: number
}

export const LADDER_MILESTONES: LadderMilestone[] = [
  {
    key: 'continentalRefiner',
    isComplete: (g) => g.refineryLevel >= 20,
    progress: (g) => ({ current: g.refineryLevel, target: 20 }),
    moneyReward: 300_000,
    rpReward: 100,
    reputationReward: 100,
  },
  {
    key: 'globalRefiner',
    isComplete: (g) => g.refineryLevel >= 25,
    progress: (g) => ({ current: g.refineryLevel, target: 25 }),
    moneyReward: 1_200_000,
    rpReward: 200,
    reputationReward: 200,
  },
  {
    key: 'energyEmpire',
    isComplete: (g) => g.refineryLevel >= 30,
    progress: (g) => ({ current: g.refineryLevel, target: 30 }),
    moneyReward: 4_000_000,
    rpReward: 300,
    reputationReward: 300,
  },
  {
    key: 'firstMillion',
    isComplete: (g) => g.money >= 1_000_000,
    progress: (g) => ({ current: Math.floor(g.money), target: 1_000_000 }),
    moneyReward: 0,
    rpReward: 80,
    reputationReward: 80,
  },
  {
    key: 'firstBillion',
    isComplete: (g) => g.money >= 10_000_000,
    progress: (g) => ({ current: Math.floor(g.money), target: 10_000_000 }),
    moneyReward: 0,
    rpReward: 250,
    reputationReward: 250,
  },
  {
    key: 'fuelForANation',
    isComplete: (g) => g.totalGasolineProduced >= 300_000,
    progress: (g) => ({ current: g.totalGasolineProduced, target: 300_000 }),
    moneyReward: 1_500_000,
    rpReward: 150,
    reputationReward: 150,
  },
  {
    key: 'oceanOfFuel',
    isComplete: (g) => g.totalGasolineProduced >= 800_000,
    progress: (g) => ({ current: g.totalGasolineProduced, target: 800_000 }),
    moneyReward: 6_000_000,
    rpReward: 350,
    reputationReward: 350,
  },
  {
    key: 'contractLegend',
    isComplete: (g) => g.completedContractCount >= 30,
    progress: (g) => ({ current: g.completedContractCount, target: 30 }),
    moneyReward: 3_000_000,
    rpReward: 200,
    reputationReward: 200,
  },
]
