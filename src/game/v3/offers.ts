import { V3_BUILDINGS, V3_MODULE_CHAPTER, V3_PLANT_BY_FAMILY, V3_TICKS_PER_CYCLE } from './data'
import { V3_JOB_TEMPLATES, getV3AcceptBlocker, resolveV3JobTemplate, type V3JobBlocker, type V3RushTerms } from './jobs'
import { getV3Modifiers } from './modifiers'
import { getV3StockAllocations } from './productInventory'
import { evaluateV3Production } from './production'
import type { V3GameState, V3ProductFamily } from './types'

export type V3OfferFeasibility = 'ready' | 'planned' | 'unavailable'
export type V3OfferReason =
  | 'route_locked'
  | 'no_plant'
  | 'quality_unreachable'
  | 'needs_blueprint'
  | 'no_qualified_line'

export type V3OfferView = {
  templateId: string
  family: V3ProductFamily
  minimumQuality: number
  acceptBlocker: V3JobBlocker | null
  feasibility: V3OfferFeasibility
  reasons: V3OfferReason[]
  quantity: number
  unitPriceCents: number
  completionBonusCents: number
  /** Live ETA in simulated seconds from qualifying stock + fully supplied qualifying lines. */
  etaSeconds: number | null
  rush: V3RushTerms | null
}

/**
 * Highest certifiable Q at a chapter with ordinary means: Precision (+15),
 * module from C2 (+10), knowledge rank1 from C2 / rank2 from C4, and a lead
 * (Operator Lv3 or matched specialist, +5).
 */
export function getV3AttainableQuality(chapter: number): number {
  const module = chapter >= V3_MODULE_CHAPTER ? 10 : 0
  const rank = chapter >= 4 ? 2 : chapter >= 2 ? 1 : 0
  return Math.min(80, 40 + 15 + module + 5 * rank + 5)
}

function qualifiedRate(state: V3GameState, family: string, minimumQuality: number): number {
  // ETA excludes boost and assumes ordinary affordable input (fully supplied rate).
  return evaluateV3Production(state, V3_TICKS_PER_CYCLE).lines
    .filter((line) => line.family === family && (line.status === 'ready' || line.status === 'setup'))
    .filter((line) => (state.productBlueprints[line.blueprintId]?.quality ?? 0) >= minimumQuality)
    .reduce((sum, line) => sum + (line.status === 'ready' ? line.potentialOutputPerMinute : 0), 0)
}

function qualifiedStock(state: V3GameState, family: string, minimumQuality: number): number {
  return getV3StockAllocations(state, family as never)
    .filter((entry) => entry.quality >= minimumQuality)
    .reduce((sum, entry) => sum + entry.free + entry.jobReserved, 0)
}

/** Rush: ≤90s of qualifying output; deadline ≥2× conservative ETA and ≥180s. */
export function getV3RushTerms(state: V3GameState, templateId: string): V3RushTerms | null {
  const template = V3_JOB_TEMPLATES[templateId]
  if (!template || template.kind !== 'rush') return null
  const perMinute = qualifiedRate(state, template.family, template.minimumQuality)
  if (perMinute <= 1e-9) return null
  const quantity = Math.floor(perMinute * 1.5 + 1e-9)
  if (quantity < 1) return null
  const conservativeSeconds = quantity / perMinute * 60
  const deadlineSeconds = Math.max(180, Math.ceil(2 * conservativeSeconds))
  return { quantity, deadlineTicks: deadlineSeconds * 5 }
}

export function getV3OfferView(state: V3GameState, templateId: string, branch: V3ProductFamily | null = null): V3OfferView {
  const template = resolveV3JobTemplate(templateId, branch ?? V3_JOB_TEMPLATES[templateId].branches?.[0].family ?? null)!
  const reasons: V3OfferReason[] = []
  const plant = V3_PLANT_BY_FAMILY[template.family]
  const chapter = state.campaignProgress.chapter
  if (!plant || V3_BUILDINGS[plant].buildChapter > Math.max(chapter, template.minimumChapter)) reasons.push('route_locked')
  else if (!state.world.grid.includes(plant)) reasons.push('no_plant')
  if (getV3AttainableQuality(Math.max(chapter, template.minimumChapter)) < template.minimumQuality) reasons.push('quality_unreachable')
  const hasBlueprint = Object.values(state.productBlueprints)
    .some((blueprint) => blueprint.family === template.family && blueprint.quality >= template.minimumQuality)
  if (!hasBlueprint) reasons.push('needs_blueprint')
  const rush = template.kind === 'rush' ? getV3RushTerms(state, templateId) : null
  const quantity = template.kind === 'rush' ? rush?.quantity ?? 0 : template.quantity
  const perMinute = qualifiedRate(state, template.family, template.minimumQuality)
  const remaining = Math.max(0, quantity - qualifiedStock(state, template.family, template.minimumQuality))
  const etaSeconds = remaining <= 1e-9 ? 0 : perMinute > 1e-9 ? Math.ceil(remaining / perMinute * 60) : null
  if (etaSeconds === null && hasBlueprint && !reasons.includes('no_plant')) reasons.push('no_qualified_line')
  const feasibility: V3OfferFeasibility = reasons.includes('route_locked') || reasons.includes('quality_unreachable')
    ? 'unavailable'
    : reasons.length ? 'planned' : 'ready'
  const tradeRate = template.clientId === 'tutorial' ? 0 : getV3Modifiers(state).trade.effective
  const unitPriceCents = Math.round(template.unitPriceCents * (1 + tradeRate))
  return {
    templateId,
    family: template.family,
    minimumQuality: template.minimumQuality,
    acceptBlocker: getV3AcceptBlocker(state, templateId) ?? (template.kind === 'rush' && !rush ? 'rush_unavailable' : null),
    feasibility,
    reasons,
    quantity,
    unitPriceCents,
    completionBonusCents: template.kind === 'rush'
      ? Math.round(quantity * unitPriceCents * 0.25)
      : Math.round(template.completionBonusCents * (1 + tradeRate)),
    etaSeconds,
    rush,
  }
}
