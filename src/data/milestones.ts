import type { Milestone } from '../types'
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
]
