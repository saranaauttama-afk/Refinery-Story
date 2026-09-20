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
  // Personality, surfaced in the year-end ceremony to make the ranking a
  // rivalry rather than a table: a one-line title, a taunt shown when this
  // rival outranks the player ("catch me"), and a concede line when the player
  // has passed them.
  title: BilingualTextValue
  taunt: BilingualTextValue
  concede: BilingualTextValue
  // Year-1 score as a fraction of the A-grade threshold.
  baselineFactor: number
  // Extra fraction of baseline added per year (their own growth), capped at
  // growthCapYears so early-game gaps don't compound forever.
  growthPerYear: number
  growthCapYears: number
  // Random swing applied each year, as a fraction of that year's baseline.
  varianceFactor: number
  // Rubber-band: the rival's baseline also tracks the player's best year so far,
  // at this fraction of it. Keeps the #1 fight a real contest as the player
  // scales (a purely static baseline gets left behind by mid-game). The frontr-
  // unner (~1.0) hovers right at your peak; the underdog trails. The higher of
  // this and the static baseline wins, so rivals never go trivially weak early.
  rubberBandFactor: number
}

export const RIVAL_REFINERIES: RivalRefineryConfig[] = [
  {
    key: 'coastal',
    name: bilingual('Coastal Refining Co.', 'บริษัทกลั่นชายฝั่ง'),
    title: bilingual('the steady incumbent', 'เจ้าตลาดมั่นคง'),
    taunt: bilingual('"Consistency wins. Keep up if you can."', '"ความสม่ำเสมอคือผู้ชนะ ตามให้ทันสิ"'),
    concede: bilingual('"Hmph. Beginner\'s luck."', '"ฮึ่ม โชคของมือใหม่"'),
    baselineFactor: 0.8,
    growthPerYear: 0.015,
    growthCapYears: 10,
    varianceFactor: 0.1,
    rubberBandFactor: 0.85,
  },
  {
    key: 'apex',
    name: bilingual('Apex Petrochem', 'แอเพ็กซ์ ปิโตรเคม'),
    title: bilingual('the aggressive frontrunner', 'ผู้นำสุดดุดัน'),
    taunt: bilingual('"You\'re not in our league yet."', '"ยังไม่ถึงรุ่นเราหรอกน่า"'),
    concede: bilingual('"This... isn\'t over."', '"เรื่อง...ยังไม่จบ"'),
    baselineFactor: 1.1,
    growthPerYear: 0.03,
    growthCapYears: 10,
    varianceFactor: 0.3,
    rubberBandFactor: 1.0,
  },
  {
    key: 'highland',
    name: bilingual('Highland Energy Group', 'ไฮแลนด์ เอนเนอร์ยี กรุ๊ป'),
    title: bilingual('the hungry upstart', 'ม้ามืดผู้หิวกระหาย'),
    taunt: bilingual('"We\'re coming for the top — watch us."', '"เรากำลังไล่ขึ้นที่หนึ่ง คอยดูนะ"'),
    concede: bilingual('"Respect. We\'ll be back."', '"นับถือ เดี๋ยวเรากลับมา"'),
    baselineFactor: 0.5,
    growthPerYear: 0.05,
    growthCapYears: 10,
    varianceFactor: 0.15,
    rubberBandFactor: 0.72,
  },
]

const RIVAL_BY_KEY: Record<string, RivalRefineryConfig> = Object.fromEntries(
  RIVAL_REFINERIES.map((r) => [r.key, r]),
)

export function getRivalConfig(key: string): RivalRefineryConfig | undefined {
  return RIVAL_BY_KEY[key]
}

export function getRivalBaselineScore(
  rival: RivalRefineryConfig,
  year: number,
  playerBestScore = 0,
): number {
  const aThreshold = AWARDS_BALANCE.gradeThresholds.A
  const growthYears = Math.min(Math.max(year - 1, 0), rival.growthCapYears)
  const staticBaseline = aThreshold * rival.baselineFactor * (1 + growthYears * rival.growthPerYear)
  // Whichever is higher: the fixed year-scaled baseline (keeps early rivals from
  // being trivial) or a fraction of the player's best year (keeps them chasing).
  return Math.max(staticBaseline, playerBestScore * rival.rubberBandFactor)
}
