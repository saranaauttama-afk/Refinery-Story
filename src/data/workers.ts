import type { WorkerConfig } from '../types'
import { text } from '../translations'

export const WORKERS: WorkerConfig[] = [
  {
    key: 'operator',
    name: text.data.workers.operator.name,
    cost: 500,
    description: text.data.workers.operator.description,
  },
  {
    key: 'mechanic',
    name: text.data.workers.mechanic.name,
    cost: 800,
    description: text.data.workers.mechanic.description,
  },
  {
    key: 'salesAgent',
    name: text.data.workers.salesAgent.name,
    cost: 1000,
    description: text.data.workers.salesAgent.description,
  },
  {
    key: 'chemist',
    name: text.data.workers.chemist.name,
    cost: 1500,
    description: text.data.workers.chemist.description,
    unlockLevel: 4,
  },
  {
    key: 'logisticsCoordinator',
    name: text.data.workers.logisticsCoordinator.name,
    cost: 2000,
    description: text.data.workers.logisticsCoordinator.description,
    unlockLevel: 5,
  },
]
