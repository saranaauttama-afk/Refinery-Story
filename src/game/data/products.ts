import {
  JET_FUEL_BALANCE,
  JET_FUEL_PLANT_BALANCE,
  LUBRICANT_PLANT_BALANCE,
  PETROCHEMICAL_PLANT_BALANCE,
  WASTE_TREATMENT_PLANT_BALANCE,
  POLYMER_PLANT_BALANCE,
} from './balance'
import { text } from '../translations'
import type { BilingualTextValue } from '../types'

// Shared shape every sellable-product translation namespace satisfies.
export type ProductTextBundle = {
  kicker: BilingualTextValue
  title: BilingualTextValue
  lockedMessage: (level: number) => BilingualTextValue
  inventory: (amount: number) => BilingualTextValue
  noPlants: BilingualTextValue
  priceLabel: (price: number) => BilingualTextValue
  sell1Button: BilingualTextValue
  sell10Button: BilingualTextValue
  sellAllButton: (amount: number) => BilingualTextValue
  sellDisabledEmpty: BilingualTextValue
}

export type SellableProductKey = 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

export type SellableProductConfig = {
  key: SellableProductKey
  unlockLevel: number
  plantUnlockLevel: number
  className: string
  copy: ProductTextBundle
}

// The five plant-produced, directly-sold products. Asphalt is intentionally NOT
// here — it is manually produced and has no direct sell (standing orders only),
// so it keeps its own bespoke panel.
export const SELLABLE_PRODUCTS: SellableProductConfig[] = [
  {
    key: 'jetFuel',
    unlockLevel: JET_FUEL_BALANCE.unlockLevel,
    plantUnlockLevel: JET_FUEL_PLANT_BALANCE.unlockLevel,
    className: 'jetfuel-panel',
    copy: text.jetFuel,
  },
  {
    key: 'lubricants',
    unlockLevel: LUBRICANT_PLANT_BALANCE.unlockLevel,
    plantUnlockLevel: LUBRICANT_PLANT_BALANCE.unlockLevel,
    className: 'lubricants-panel',
    copy: text.lubricants,
  },
  {
    key: 'petrochemicals',
    unlockLevel: PETROCHEMICAL_PLANT_BALANCE.unlockLevel,
    plantUnlockLevel: PETROCHEMICAL_PLANT_BALANCE.unlockLevel,
    className: 'petrochemicals-panel',
    copy: text.petrochemicals,
  },
  {
    key: 'recycledMaterial',
    unlockLevel: WASTE_TREATMENT_PLANT_BALANCE.unlockLevel,
    plantUnlockLevel: WASTE_TREATMENT_PLANT_BALANCE.unlockLevel,
    className: 'recycled-material-panel',
    copy: text.recycledMaterial,
  },
  {
    key: 'plasticPellets',
    unlockLevel: POLYMER_PLANT_BALANCE.unlockLevel,
    plantUnlockLevel: POLYMER_PLANT_BALANCE.unlockLevel,
    className: 'plastic-pellets-panel',
    copy: text.plasticPellets,
  },
]
