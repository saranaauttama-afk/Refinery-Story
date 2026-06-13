import type { PerkConfig } from '../types'
import { text } from '../translations'

// Refinery Upgrade Perk Tree.
// Players earn 1 upgrade point per refinery level-up (see App.handleUpgradeRefinery)
// and spend them here. Three branches, three tiers each. Tier N requires tier N-1
// in the same branch, so investment is directional — you cannot max everything.
export const PERKS: PerkConfig[] = [
  // Efficiency branch — faster production
  {
    key: 'efficiency1',
    branch: 'efficiency',
    tier: 1,
    cost: 1,
    name: text.data.perks.efficiency1.name,
    description: text.data.perks.efficiency1.description,
  },
  {
    key: 'efficiency2',
    branch: 'efficiency',
    tier: 2,
    cost: 2,
    name: text.data.perks.efficiency2.name,
    description: text.data.perks.efficiency2.description,
    prerequisite: 'efficiency1',
  },
  {
    key: 'efficiency3',
    branch: 'efficiency',
    tier: 3,
    cost: 3,
    name: text.data.perks.efficiency3.name,
    description: text.data.perks.efficiency3.description,
    prerequisite: 'efficiency2',
  },
  // Capacity branch — more storage, cheaper crude
  {
    key: 'capacity1',
    branch: 'capacity',
    tier: 1,
    cost: 1,
    name: text.data.perks.capacity1.name,
    description: text.data.perks.capacity1.description,
  },
  {
    key: 'capacity2',
    branch: 'capacity',
    tier: 2,
    cost: 2,
    name: text.data.perks.capacity2.name,
    description: text.data.perks.capacity2.description,
    prerequisite: 'capacity1',
  },
  {
    key: 'capacity3',
    branch: 'capacity',
    tier: 3,
    cost: 3,
    name: text.data.perks.capacity3.name,
    description: text.data.perks.capacity3.description,
    prerequisite: 'capacity2',
  },
  // Quality branch — higher sell price
  {
    key: 'quality1',
    branch: 'quality',
    tier: 1,
    cost: 1,
    name: text.data.perks.quality1.name,
    description: text.data.perks.quality1.description,
  },
  {
    key: 'quality2',
    branch: 'quality',
    tier: 2,
    cost: 2,
    name: text.data.perks.quality2.name,
    description: text.data.perks.quality2.description,
    prerequisite: 'quality1',
  },
  {
    key: 'quality3',
    branch: 'quality',
    tier: 3,
    cost: 3,
    name: text.data.perks.quality3.name,
    description: text.data.perks.quality3.description,
    prerequisite: 'quality2',
  },
]

// Numeric effect of each perk. Kept here (not in balance.ts) because it is
// tightly coupled to the perk list above.
//
// Perk Diversity Pass (2026-06-13): `efficiency*`'s `production` field used
// to divide productionInterval (speed) -- but baseProductionInterval already
// hits PRODUCTION_BALANCE.minProductionMs by ~refineryLevel 8 with minimal
// other investment, making the ENTIRE branch (all 3 tiers) completely dead
// from that point on. Repurposed to a gasoline YIELD multiplier (extra
// gasoline per batch of crude processed -- no floor to hit), values
// unchanged. Also removed the dead `crudeDiscount` field from capacity2/3
// (never applied anywhere) and redistributed its value into `storage`.
export const PERK_EFFECTS = {
  // Gasoline yield bonus (extra gasoline output per batch of crude
  // processed). Applied via gasolineYieldCarry in the production tick.
  efficiency1: { production: 0.1 },
  efficiency2: { production: 0.15 },
  efficiency3: { production: 0.25 },
  // Storage bonus (added rate on max crude/gasoline storage). capacity2/3
  // absorb the value previously split off into the dead crudeDiscount field
  // (0.15+0.05=0.20, 0.25+0.10=0.35).
  capacity1: { storage: 0.1 },
  capacity2: { storage: 0.2 },
  capacity3: { storage: 0.35 },
  // Sell price bonus (added rate on all product sell prices)
  quality1: { sellPrice: 0.05 },
  quality2: { sellPrice: 0.1 },
  quality3: { sellPrice: 0.2 },
} as const
