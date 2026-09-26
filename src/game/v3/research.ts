import { getV3BuildingType, getV3BuildingLevel, listV3Buildings } from './yard'
import type { ResearchKey } from '../types'
import { V3_RESEARCH, type V3SupportedResearch } from './data'
import type { V3GameState } from './types'

export type V3ResearchBlocker = 'unsupported' | 'owned' | 'locked' | 'prerequisite' | 'lab_level' | 'insufficient_rp'

function isSupported(researchId: ResearchKey): researchId is V3SupportedResearch {
  return Object.hasOwn(V3_RESEARCH, researchId)
}

export function getV3ResearchKnowledgeRank(researchId: V3SupportedResearch): 0 | 1 | 2 {
  const effect = V3_RESEARCH[researchId].effect
  return effect.kind === 'knowledgeRank' ? effect.rank : 0
}

export function getV3HighestLabLevel(state: V3GameState): number {
  return listV3Buildings(state).reduce((best, building) =>
    building.type === 'laboratory' ? Math.max(best, building.level) : best, 0)
}

export function validateV3Research(state: V3GameState, researchId: ResearchKey): { blocker: V3ResearchBlocker; params?: Record<string, number | string> } | null {
  if (!isSupported(researchId)) return { blocker: 'unsupported' }
  const rule = V3_RESEARCH[researchId]
  if (state.world.unlockedResearchIds.includes(researchId)) return { blocker: 'owned' }
  if (state.campaignProgress.chapter < rule.chapter) return { blocker: 'locked', params: { chapter: rule.chapter } }
  if (rule.prerequisite && !state.world.unlockedResearchIds.includes(rule.prerequisite as ResearchKey)) {
    return { blocker: 'prerequisite', params: { research: rule.prerequisite } }
  }
  if (rule.labLevel > 0 && getV3HighestLabLevel(state) < rule.labLevel) return { blocker: 'lab_level', params: { level: rule.labLevel } }
  if (state.world.researchPoints + 1e-8 < rule.rp) return { blocker: 'insufficient_rp', params: { rp: rule.rp } }
  return null
}

export function unlockV3Research(state: V3GameState, researchId: ResearchKey): V3GameState {
  const rule = V3_RESEARCH[researchId as V3SupportedResearch]
  return {
    ...state,
    world: {
      ...state.world,
      researchPoints: state.world.researchPoints - rule.rp,
      unlockedResearchIds: [...state.world.unlockedResearchIds, researchId],
    },
  }
}

/** Knowledge rank available to a new project in the selected lab. */
export function getV3AvailableKnowledgeRank(state: V3GameState, labBuildingId: string): 0 | 1 | 2 {
  const labLevel = getV3BuildingType(state, labBuildingId) === 'laboratory' ? getV3BuildingLevel(state, labBuildingId) : 0
  const owned = state.world.unlockedResearchIds
  if (labLevel >= V3_RESEARCH.advancedProcessing.labLevel && owned.includes('advancedProcessing') && owned.includes('premiumFuel')) return 2
  if (labLevel >= V3_RESEARCH.premiumFuel.labLevel && owned.includes('premiumFuel')) return 1
  return 0
}
