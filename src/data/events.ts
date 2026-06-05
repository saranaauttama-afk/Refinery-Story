import type { RandomEvent } from '../types'
import { serializeBilingualText, text } from '../translations'

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    key: 'crudeDiscount',
    name: text.data.events.crudeDiscount.name,
    message: serializeBilingualText(text.data.events.crudeDiscount.message),
  },
  {
    key: 'machineTuneUp',
    name: text.data.events.machineTuneUp.name,
    message: serializeBilingualText(text.data.events.machineTuneUp.message),
  },
  {
    key: 'minorLeak',
    name: text.data.events.minorLeak.name,
    message: serializeBilingualText(text.data.events.minorLeak.message),
  },
  {
    key: 'qualityBonus',
    name: text.data.events.qualityBonus.name,
    message: serializeBilingualText(text.data.events.qualityBonus.message),
  },
  {
    key: 'marketDemandSpike',
    name: text.data.events.marketDemandSpike.name,
    message: serializeBilingualText(text.data.events.marketDemandSpike.message),
  },
  {
    key: 'safetyInspection',
    name: text.data.events.safetyInspection.name,
    message: serializeBilingualText(text.data.events.safetyInspection.message),
  },
  {
    key: 'equipmentWear',
    name: text.data.events.equipmentWear.name,
    message: serializeBilingualText(text.data.events.equipmentWear.message),
  },
  {
    key: 'efficientBatch',
    name: text.data.events.efficientBatch.name,
    message: serializeBilingualText(text.data.events.efficientBatch.message),
  },
]
