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
    isIncident: true,
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
    isIncident: true,
  },
  {
    key: 'efficientBatch',
    name: text.data.events.efficientBatch.name,
    message: serializeBilingualText(text.data.events.efficientBatch.message),
  },
  {
    key: 'localNewsCoverage',
    name: text.data.events.localNewsCoverage.name,
    message: serializeBilingualText(text.data.events.localNewsCoverage.message),
  },
  {
    key: 'supplierDiscount',
    name: text.data.events.supplierDiscount.name,
    message: serializeBilingualText(text.data.events.supplierDiscount.message),
  },
  {
    key: 'equipmentInspection',
    name: text.data.events.equipmentInspection.name,
    message: serializeBilingualText(text.data.events.equipmentInspection.message),
  },
  {
    key: 'workerSuggestion',
    name: text.data.events.workerSuggestion.name,
    message: serializeBilingualText(text.data.events.workerSuggestion.message),
  },
  {
    key: 'storageContamination',
    name: text.data.events.storageContamination.name,
    message: serializeBilingualText(text.data.events.storageContamination.message),
    isIncident: true,
  },
  {
    key: 'communityVisit',
    name: text.data.events.communityVisit.name,
    message: serializeBilingualText(text.data.events.communityVisit.message),
  },
  {
    key: 'distillationHiccup',
    name: text.data.events.distillationHiccup.name,
    message: serializeBilingualText(text.data.events.distillationHiccup.message),
    requiresFeedstockChain: true,
    isIncident: true,
  },
  {
    key: 'feedstockSurplus',
    name: text.data.events.feedstockSurplus.name,
    message: serializeBilingualText(text.data.events.feedstockSurplus.message),
    requiresFeedstockChain: true,
  },
]
