import { PROJECTS, YARD } from '../../data/balance'
import type { GameState } from '../types'

// ── Projects ────────────────────────────────────────────────────────────────

export type ProjectId = keyof typeof PROJECTS
export const projectLevel = (s: GameState, id: ProjectId) => s.projects[id] ?? 0
export const projectCost = (s: GameState, id: ProjectId) =>
  Math.round(PROJECTS[id].cost * PROJECTS[id].growth ** projectLevel(s, id))
export function buyProject(s: GameState, id: ProjectId): GameState {
  const p = PROJECTS[id]
  const level = projectLevel(s, id),
    cost = projectCost(s, id)
  if (!p || s.rank < p.rank || level >= p.max || s.money < cost) return s
  return {
    ...s,
    money: s.money - cost,
    projects: { ...s.projects, [id]: level + 1 },
    unlockHistory: [...s.unlockHistory, { tick: s.tick, key: `project:${id}:${level + 1}` }],
  }
}
export const exportBonus = (s: GameState) =>
  1 + PROJECTS.export.pricePerLevel * projectLevel(s, 'export')
export const labBonus = (s: GameState) =>
  PROJECTS.researchCenter.labLevels * projectLevel(s, 'researchCenter')

// ── Land ────────────────────────────────────────────────────────────────────

export const landPrice = (s: GameState) =>
  Math.round(
    YARD.landCost * YARD.landGrowth ** Math.max(0, s.yard.ownedParcels.length - YARD.startParcels),
  )
