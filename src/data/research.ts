import type { ResearchItem } from '../types'
import { text } from '../translations'

export const RESEARCH_ITEMS: ResearchItem[] = [
  {
    key: 'betterPumps',
    name: text.data.researchItems.betterPumps.name,
    cost: 10,
    description: text.data.researchItems.betterPumps.description,
  },
  {
    key: 'biggerTanks',
    name: text.data.researchItems.biggerTanks.name,
    cost: 20,
    description: text.data.researchItems.biggerTanks.description,
  },
  {
    key: 'premiumFuel',
    name: text.data.researchItems.premiumFuel.name,
    cost: 30,
    description: text.data.researchItems.premiumFuel.description,
  },
  {
    key: 'advancedDistillation',
    name: text.data.researchItems.advancedDistillation.name,
    prerequisite: 'betterPumps',
    cost: 50,
    description: text.data.researchItems.advancedDistillation.description,
  },
  {
    key: 'industrialStorage',
    name: text.data.researchItems.industrialStorage.name,
    prerequisite: 'biggerTanks',
    cost: 75,
    description: text.data.researchItems.industrialStorage.description,
  },
  {
    key: 'premiumContracts',
    name: text.data.researchItems.premiumContracts.name,
    prerequisite: 'premiumFuel',
    cost: 100,
    description: text.data.researchItems.premiumContracts.description,
  },
]
