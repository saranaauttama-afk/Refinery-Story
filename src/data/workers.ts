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
]
