import type { BilingualTextValue } from '../types'
import { bilingual } from '../translations'
import { AWARDS_BALANCE } from './balance'

// Three fictional rival companies, each with a distinct personality. Scores
// are generated relative to the player's STATIC grade thresholds (the same
// ones getAwardGrade checks against) so the ranking stays fair as the player
// grows — a rival isn't secretly outpacing a rising bar the player can't see.
export type RivalRefineryConfig = {
  key: string
  name: BilingualTextValue
  // Year-1 score as a fraction of the A-grade threshold.
  baselineFactor: number
  // Extra fraction of baseline added per year (their own growth), capped at
  // growthCapYears so early-game gaps don't compound forever.
  growthPerYear: number
  growthCapYears: number
  // Random swing applied each year, as a fraction of that year's baseline.
  varianceFactor: number
}

export const RIVAL_REFINERIES: RivalRefineryConfig[] = [
  {
    key: 'coastal',
    name: bilingual('Coastal Refining Co.', 'บริษัทกลั่นชายฝั่ง'),
    baselineFactor: 0.8,
    growthPerYear: 0.015,
    growthCapYears: 10,
    varianceFactor: 0.1,
  },
  {
    key: 'apex',
    name: bilingual('Apex Petrochem', 'แอเพ็กซ์ ปิโตรเคม'),
    baselineFactor: 1.1,
    growthPerYear: 0.03,
    growthCapYears: 10,
    varianceFactor: 0.3,
  },
  {
    key: 'highland',
    name: bilingual('Highland Energy Group', 'ไฮแลนด์ เอนเนอร์ยี กรุ๊ป'),
    baselineFactor: 0.5,
    growthPerYear: 0.05,
    growthCapYears: 10,
    varianceFactor: 0.15,
  },
]

export function getRivalBaselineScore(rival: RivalRefineryConfig, year: number): number {
  const aThreshold = AWARDS_BALANCE.gradeThresholds.A
  const growthYears = Math.min(Math.max(year - 1, 0), rival.growthCapYears)
  return aThreshold * rival.baselineFactor * (1 + growthYears * rival.growthPerYear)
}
