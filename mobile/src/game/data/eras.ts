import type { EraConfig } from '../types'
import { text } from '../translations'

// Tech Eras layer a long-term progression goal over research.
// You advance into the next era when BOTH the research count and refinery level
// thresholds are met. Each era grants cumulative global bonuses and is announced
// with a banner the first time it is reached.
export const ERAS: EraConfig[] = [
  {
    key: 'foundation',
    index: 0,
    name: text.data.eras.foundation.name,
    tagline: text.data.eras.foundation.tagline,
    requiredResearch: 0,
    requiredLevel: 1,
    sellPriceBonusRate: 0,
    researchRateBonusRate: 0,
  },
  {
    key: 'expansion',
    index: 1,
    name: text.data.eras.expansion.name,
    tagline: text.data.eras.expansion.tagline,
    requiredResearch: 4,
    requiredLevel: 7,
    sellPriceBonusRate: 0.1,
    researchRateBonusRate: 0.15,
  },
  {
    key: 'modern',
    index: 2,
    name: text.data.eras.modern.name,
    tagline: text.data.eras.modern.tagline,
    requiredResearch: 8,
    requiredLevel: 13,
    sellPriceBonusRate: 0.2,
    researchRateBonusRate: 0.3,
  },
  {
    key: 'energyTransition',
    index: 3,
    name: text.data.eras.energyTransition.name,
    tagline: text.data.eras.energyTransition.tagline,
    // Endgame: requires all 10 research items and well past "Industry
    // Leader" (level 15) -- a genuine late-game inflection point, not just
    // the next rung on the same ladder.
    requiredResearch: 10,
    requiredLevel: 18,
    sellPriceBonusRate: 0.3,
    researchRateBonusRate: 0.4,
    demandShift: true,
  },
]

// Returns the highest era whose requirements are met.
export function getCurrentEra(unlockedResearchCount: number, refineryLevel: number): EraConfig {
  let current = ERAS[0]
  for (const era of ERAS) {
    if (
      unlockedResearchCount >= era.requiredResearch &&
      refineryLevel >= era.requiredLevel
    ) {
      current = era
    }
  }
  return current
}

export function getNextEra(currentIndex: number): EraConfig | undefined {
  return ERAS.find((era) => era.index === currentIndex + 1)
}
