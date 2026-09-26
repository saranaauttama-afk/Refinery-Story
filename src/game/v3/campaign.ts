import type { BuildingType } from '../types'
import { getV3RollingOperatingProfit } from './productInventory'
import type { V3CampaignReport, V3GameState, V3ProductFamily } from './types'

const UPGRADE_KINDS: ReadonlySet<BuildingType> = new Set<BuildingType>([
  'distillationUnit', 'lubricantPlant', 'jetFuelPlant',
  'crudeTank', 'gasolineTank', 'lubricantTank', 'jetFuelTank',
  'powerPlant',
])

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
  | 'chapter_three'
  | 'chapter_four'

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
  // C3: two distinct clients reached Regular + at least one processing/tank/power upgrade.
  const completed = new Set(state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').map((receipt) => receipt.templateId))
  const regularClients = new Set([...completed].filter((id) => id.endsWith(':regular')).map((id) => id.split(':')[0]))
  const upgraded = state.world.grid.some((cell, index) =>
    cell !== null && UPGRADE_KINDS.has(cell) && (state.world.gridLevels[index] ?? 1) >= 2)
  if (chapter === 2 && regularClients.size >= 2 && upgraded) {
    chapter = 3
    claimedFlags.add('chapter:3')
  }
  // C4: one client Partner + a certified (developed) blueprint with Q≥65.
  const partner = [...completed].some((id) => id.endsWith(':partner'))
  const showcase = Object.values(state.productBlueprints).some((blueprint) => blueprint.provenance === 'developed' && blueprint.quality >= 65)
  if (chapter === 3 && partner && showcase) {
    chapter = 4
    claimedFlags.add('chapter:4')
  }
  // C5 clear (Master §11, Systems S6): 3 of 5 clients at Partner covering 2+
  // families with Airline or Materials among them, a Showcase delivered and a
  // positive recognized operating profit over the last 180s. Sticky once set.
  let report = state.campaignReport
  let clearedAtTick = state.campaignProgress.clearedAtTick
  if (chapter === 4 && !clearedAtTick) {
    const clear = evaluateV3ClearConditions(state)
    if (clear.met) {
      chapter = 5
      clearedAtTick = state.world.tickCount
      claimedFlags.add('chapter:5')
      claimedFlags.add('clear')
      report = buildV3CampaignReport(state, clear)
    }
  }
  if (chapter === state.campaignProgress.chapter && claimedFlags.size === state.campaignProgress.claimedFlags.length) return state
  return {
    ...state,
    campaignReport: report,
    campaignProgress: {
      ...state.campaignProgress,
      chapter,
      claimedFlags: [...claimedFlags],
      clearedAtTick,
    },
  }
}

export type V3ClearConditions = {
  partners: string[]
  families: V3ProductFamily[]
  advancedClient: boolean
  showcase: boolean
  rollingProfitCents: number
  profitWindowComplete: boolean
  met: boolean
}

const CLIENT_FAMILY: Record<string, V3ProductFamily> = {
  local: 'gasoline', performance: 'gasoline', fleet: 'lubricants', airline: 'jetFuel',
}

export function evaluateV3ClearConditions(state: V3GameState): V3ClearConditions {
  const partnerReceipts = state.jobReceipts.receipts
    .filter((receipt) => receipt.status === 'completed' && receipt.templateId.endsWith(':partner'))
  const partners = [...new Set(partnerReceipts.map((receipt) => receipt.templateId.split(':')[0]))].sort()
  const families = new Set<V3ProductFamily>()
  for (const receipt of partnerReceipts) {
    const client = receipt.templateId.split(':')[0]
    if (CLIENT_FAMILY[client]) families.add(CLIENT_FAMILY[client])
    else for (const id of Object.keys(receipt.deliveredByBlueprint)) {
      const family = state.productBlueprints[id]?.family
      if (family) families.add(family)
    }
  }
  const advancedClient = partners.includes('airline') || partners.includes('materials')
  const showcase = Boolean(state.campaignProgress.showcaseReceiptId)
  const rolling = getV3RollingOperatingProfit(state)
  const met = partners.length >= 3 && families.size >= 2 && advancedClient && showcase && rolling.complete && rolling.cents > 0
  return { partners, families: [...families].sort(), advancedClient, showcase, rollingProfitCents: rolling.cents, profitWindowComplete: rolling.complete, met }
}

function buildV3CampaignReport(state: V3GameState, clear: V3ClearConditions): V3CampaignReport {
  const showcaseReceipt = state.jobReceipts.receipts.find((receipt) => receipt.id === state.campaignProgress.showcaseReceiptId)
  const delivered: Record<string, number> = {}
  for (const receipt of state.jobReceipts.receipts) {
    if (receipt.status !== 'completed') continue
    for (const [id, quantity] of Object.entries(receipt.deliveredByBlueprint)) delivered[id] = (delivered[id] ?? 0) + quantity
  }
  const star = Object.entries(delivered)
    .filter(([id]) => state.productBlueprints[id]?.provenance === 'developed')
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  const buildingCounts: Record<string, number> = {}
  for (const cell of state.world.grid) if (cell) buildingCounts[cell] = (buildingCounts[cell] ?? 0) + 1
  return {
    clearedAtTick: state.world.tickCount,
    partners: clear.partners,
    families: clear.families,
    showcaseTemplateId: showcaseReceipt?.templateId ?? '',
    starProduct: star ? {
      blueprintId: star[0], name: state.productBlueprints[star[0]].name,
      quality: state.productBlueprints[star[0]].quality, delivered: star[1],
    } : null,
    team: state.world.employees.map((employee) => {
      const record = state.employeeRecords[employee.id]
      return {
        employeeId: employee.id, name: employee.name, role: employee.type, level: employee.level,
        recipes: record?.blueprintIds.length ?? 0, milestones: record?.milestoneIds.length ?? 0,
      }
    }).sort((a, b) => b.milestones - a.milestones || b.recipes - a.recipes || a.employeeId.localeCompare(b.employeeId)),
    lotsUsed: state.world.grid.filter((cell) => cell !== null).length,
    buildingCounts,
    rollingProfitCents: clear.rollingProfitCents,
    lifetimeReceiptsCents: state.operatingLedger.lifetimeReceiptsCents,
  }
}

export function getV3GuidanceStep(state: V3GameState): V3GuidanceStep {
  if (state.campaignProgress.chapter >= 4) return 'chapter_four'
  if (state.campaignProgress.chapter === 3) return 'chapter_three'
  if (state.campaignProgress.chapter === 2) return 'chapter_two'
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
