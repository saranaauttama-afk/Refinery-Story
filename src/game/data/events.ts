import type { RandomEvent } from '../types'
import { serializeBilingualText, text } from '../translations'

// Random "incidents" — the only events left on the ambient timer. Each is a
// small, ESG-gated setback that safety officers soften (eventPenaltyMultiplier).
// Trivial freebie events (free crude/cash/RP/gasoline) were removed: they were
// noise with no decision, and their meaningful cousins already exist as choice
// events. See getRandomEvent / applyRandomEvent.
export const RANDOM_EVENTS: RandomEvent[] = [
  {
    key: 'minorLeak',
    name: text.data.events.minorLeak.name,
    message: serializeBilingualText(text.data.events.minorLeak.message),
    isIncident: true,
  },
  {
    key: 'equipmentWear',
    name: text.data.events.equipmentWear.name,
    message: serializeBilingualText(text.data.events.equipmentWear.message),
    isIncident: true,
  },
  {
    key: 'storageContamination',
    name: text.data.events.storageContamination.name,
    message: serializeBilingualText(text.data.events.storageContamination.message),
    isIncident: true,
  },
  {
    key: 'distillationHiccup',
    name: text.data.events.distillationHiccup.name,
    message: serializeBilingualText(text.data.events.distillationHiccup.message),
    requiresFeedstockChain: true,
    isIncident: true,
  },
]
