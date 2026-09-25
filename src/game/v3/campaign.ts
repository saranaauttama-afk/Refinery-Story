import type { V3GameState } from './types'

export type V3GuidanceStep =
  | 'produce_tutorial_stock'
  | 'accept_tutorial'
  | 'ship_tutorial'
  | 'build_laboratory'
  | 'prepare_development'
  | 'run_development'
  | 'select_developed_blueprint'
  | 'produce_developed_stock'
  | 'accept_qualifying_job'
  | 'ship_developed_product'
  | 'chapter_two'

export function evaluateV3CampaignProgress(state: V3GameState): V3GameState {
  let chapter = state.campaignProgress.chapter
  const claimedFlags = new Set(state.campaignProgress.claimedFlags)
  if (
    chapter === 0 &&
    state.jobReceipts.receipts.some((receipt) => receipt.templateId === 'tutorial:gasoline' && receipt.status === 'completed')
  ) {
    chapter = 1
    claimedFlags.add('chapter:1')
  }
  const developedDeliveries: Record<string, number> = {}
  for (const receipt of state.jobReceipts.receipts) {
    if (receipt.status !== 'completed') continue
    for (const [blueprintId, quantity] of Object.entries(receipt.deliveredByBlueprint)) {
      if (state.productBlueprints[blueprintId]?.provenance === 'developed') {
        developedDeliveries[blueprintId] = (developedDeliveries[blueprintId] ?? 0) + quantity
      }
    }
  }
  if (chapter === 1 && Object.values(developedDeliveries).some((quantity) => quantity >= 40 - 1e-8)) {
    chapter = 2
    claimedFlags.add('chapter:2')
  }
  if (chapter === state.campaignProgress.chapter && claimedFlags.size === state.campaignProgress.claimedFlags.length) return state
  return {
    ...state,
    campaignProgress: {
      ...state.campaignProgress,
      chapter,
      claimedFlags: [...claimedFlags],
    },
  }
}

export function getV3GuidanceStep(state: V3GameState): V3GuidanceStep {
  if (state.campaignProgress.chapter >= 2) return 'chapter_two'
  if (state.campaignProgress.chapter === 0) {
    const tutorial = state.acceptedJob?.templateId === 'tutorial:gasoline' ? state.acceptedJob : null
    if (!tutorial) {
      const gas = Object.values(state.variantInventory).reduce((sum, entry) =>
        state.productBlueprints[entry.blueprintId]?.family === 'gasoline' ? sum + entry.quantity : sum, 0)
      return gas >= 20 ? 'accept_tutorial' : 'produce_tutorial_stock'
    }
    return 'ship_tutorial'
  }
  if (!state.world.grid.includes('laboratory')) return 'build_laboratory'
  if (state.developmentProject) return 'run_development'
  const developedIds = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.family === 'gasoline' && blueprint.provenance === 'developed')
    .map((blueprint) => blueprint.id)
  if (!developedIds.length) return 'prepare_development'
  const selected = Object.values(state.plantPrograms).some((program) => developedIds.includes(program.blueprintId))
  if (!selected) return 'select_developed_blueprint'
  const developedStock = developedIds.reduce((sum, id) => sum + (state.variantInventory[id]?.quantity ?? 0), 0)
  if (!state.acceptedJob) return developedStock >= 40 ? 'accept_qualifying_job' : 'produce_developed_stock'
  return 'ship_developed_product'
}
