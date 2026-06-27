import type { GameState } from '../types'
import { bilingual } from '../translations'
import { MAX_REFINERY_LEVEL } from './balance'
import { RESEARCH_ITEMS } from './research'

// Endgame spine (Roadmap feature 5). A ladder of ambitious post-"prototype
// win" objectives. Completing ALL of them awards the permanent "Industry
// Legend" status (game.legendAchieved) -- the real climax beyond Lv20, so the
// late game has something to chase instead of dead-ending. All checks read
// existing GameState fields; no new tracking is needed.

const LEGEND_MILLION = 1_000_000
const LEGEND_LIFETIME_GASOLINE = 100_000

export type EndgameGoal = {
  key: string
  name: { en: string; th: string }
  description: { en: string; th: string }
  isComplete: (game: GameState) => boolean
  // current/target for a progress bar (target is the threshold).
  progress: (game: GameState) => { current: number; target: number }
}

export const ENDGAME_GOALS: EndgameGoal[] = [
  {
    key: 'maxLevel',
    name: bilingual('Peak Refinery', 'โรงกลั่นขั้นสูงสุด'),
    description: bilingual(`Reach refinery level ${MAX_REFINERY_LEVEL}.`, `อัปเกรดโรงกลั่นถึงเลเวล ${MAX_REFINERY_LEVEL}`),
    isComplete: (g) => g.refineryLevel >= MAX_REFINERY_LEVEL,
    progress: (g) => ({ current: g.refineryLevel, target: MAX_REFINERY_LEVEL }),
  },
  {
    key: 'millionaire',
    name: bilingual('Industry Tycoon', 'เจ้าพ่ออุตสาหกรรม'),
    description: bilingual('Hold $1,000,000 in cash.', 'มีเงินสด $1,000,000'),
    isComplete: (g) => g.money >= LEGEND_MILLION,
    progress: (g) => ({ current: Math.floor(g.money), target: LEGEND_MILLION }),
  },
  {
    key: 'allResearch',
    name: bilingual('Master Researcher', 'นักวิจัยระดับปรมาจารย์'),
    description: bilingual('Unlock every research item.', 'ปลดล็อกงานวิจัยครบทุกชิ้น'),
    isComplete: (g) => g.unlockedResearchIds.length >= RESEARCH_ITEMS.length,
    progress: (g) => ({ current: g.unlockedResearchIds.length, target: RESEARCH_ITEMS.length }),
  },
  {
    key: 'maxGrid',
    name: bilingual('Sprawling Complex', 'อาณาจักรโรงงาน'),
    description: bilingual('Expand the grid to its maximum size.', 'ขยายพื้นที่ถึงขนาดใหญ่สุด'),
    isComplete: (g) => g.gridExpansionLevel >= 3,
    progress: (g) => ({ current: g.gridExpansionLevel, target: 3 }),
  },
  {
    key: 'perfectYear',
    name: bilingual('Flawless Year', 'ปีที่สมบูรณ์แบบ'),
    description: bilingual('Earn an S-grade annual award.', 'ได้รางวัลประจำปีเกรด S'),
    isComplete: (g) => g.awardHistory.some((a) => a.grade === 'S'),
    progress: (g) => ({ current: g.awardHistory.some((a) => a.grade === 'S') ? 1 : 0, target: 1 }),
  },
  {
    key: 'industrialOutput',
    name: bilingual('Industrial Output', 'กำลังผลิตมหาศาล'),
    description: bilingual(`Produce ${LEGEND_LIFETIME_GASOLINE.toLocaleString()} lifetime gasoline.`, `ผลิตน้ำมันสะสม ${LEGEND_LIFETIME_GASOLINE.toLocaleString()} หน่วย`),
    isComplete: (g) => g.totalGasolineProduced >= LEGEND_LIFETIME_GASOLINE,
    progress: (g) => ({ current: g.totalGasolineProduced, target: LEGEND_LIFETIME_GASOLINE }),
  },
]

export function areAllEndgameGoalsComplete(game: GameState): boolean {
  return ENDGAME_GOALS.every((goal) => goal.isComplete(game))
}
