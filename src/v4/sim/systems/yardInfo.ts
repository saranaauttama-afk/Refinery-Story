import { buildingDef } from '../../data/buildings'
import { comboLeads } from './combos'
import { text } from '../../i18n'
import type { GameState } from '../types'
export { upgradeCost } from './yard'

const memberName = (id: string) => (id === 'process' ? 'process' : buildingDef(id).name)

// comboLeads plus display-ready partner names, for the UI.
export function comboLeadsFor(s: GameState, id: string) {
  return comboLeads(s, id).map(l => ({
    ...l,
    partnerNames: l.partners.map(memberName).join(' + '),
  }))
}
