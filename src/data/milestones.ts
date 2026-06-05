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
    reward: '$1000, +15 Rep',
  },
  {
    key: 'researchBeginner',
    name: text.data.milestones.researchBeginner.name,
    requirement: text.data.milestones.researchBeginner.requirement,
    reward: '$500, +20 Rep',
  },
]
