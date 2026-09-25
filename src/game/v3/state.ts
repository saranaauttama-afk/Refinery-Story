import type { Employee } from '../types'
import {
  V3_PREVIEW_SCHEMA_REVISION,
  V3_RULESET_VERSION,
  type V3GameState,
  type V3ProductBlueprint,
  type V3ProductFamily,
} from './types'

export const V3_DEFAULT_BLUEPRINT_ID: Record<V3ProductFamily, string> = {
  gasoline: 'blueprint:gasoline:standard:1',
  lubricants: 'blueprint:lubricants:standard:1',
  jetFuel: 'blueprint:jetFuel:standard:1',
  petrochemicals: 'blueprint:petrochemicals:standard:1',
  plasticPellets: 'blueprint:plasticPellets:standard:1',
}

const FAMILY_LABEL: Record<V3ProductFamily, string> = {
  gasoline: 'Standard Gasoline',
  lubricants: 'Standard Lubricants',
  jetFuel: 'Standard Jet Fuel',
  petrochemicals: 'Standard Petrochemicals',
  plasticPellets: 'Standard Plastic Pellets',
}

function createDefaultBlueprint(family: V3ProductFamily): V3ProductBlueprint {
  const id = V3_DEFAULT_BLUEPRINT_ID[family]
  return {
    id,
    signature: `${family}|standard|none|0|0`,
    revision: 1,
    family,
    name: FAMILY_LABEL[family],
    quality: 40,
    profile: 'standard',
    module: 'none',
    minPlantLevel: 1,
    provenance: 'default',
    commissionedAtTick: null,
    pinned: true,
    archived: false,
  }
}

export function createInitialV3GameState(): V3GameState {
  const operator: Employee = {
    id: 'employee:operator:000001',
    type: 'operator',
    name: 'Niran',
    level: 1,
    xp: 0,
    skills: [{ channel: 'output', value: 0.1 }],
  }
  const families: V3ProductFamily[] = [
    'gasoline',
    'lubricants',
    'jetFuel',
    'petrochemicals',
    'plasticPellets',
  ]
  const productBlueprints = Object.fromEntries(
    families.map((family) => {
      const blueprint = createDefaultBlueprint(family)
      return [blueprint.id, blueprint]
    }),
  )
  const grid: V3GameState['world']['grid'] = Array(9).fill(null)
  grid[3] = 'crudeTank'
  grid[4] = 'distillationUnit'
  grid[5] = 'gasolineTank'

  return {
    rulesetVersion: V3_RULESET_VERSION,
    schemaRevision: V3_PREVIEW_SCHEMA_REVISION,
    preview: true,
    world: {
      tickCount: 0,
      moneyCents: 60_000,
      researchPoints: 0,
      reputation: 0,
      crudeOil: 18,
      feedstock: 0,
      electricity: 0,
      waste: 0,
      grid,
      gridLevels: Array(9).fill(1),
      gridExpansionLevel: 0,
      employees: [operator],
      unlockedResearchIds: [],
      specialization: null,
    },
    productBlueprints,
    variantInventory: {},
    commodityInventory: {},
    materialCostBasis: {
      crudeCents: 18_000,
      feedstockCents: 0,
      wasteCents: 0,
      electricityCents: 0,
    },
    plantPrograms: {
      4: {
        cellIndex: 4,
        blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline,
        installedModule: 'none',
        setupRemainingTicks: 0,
        paused: false,
      },
    },
    developmentProject: null,
    developmentHistory: [],
    employeeDuties: {
      [operator.id]: { kind: 'line', cellIndex: 4 },
    },
    unpaidEmployeeIds: [],
    employeeRecords: { [operator.id]: { workTicks: 0, blueprintIds: [], milestoneIds: [] } },
    clientProgress: {},
    acceptedJob: null,
    jobReceipts: { receipts: [], templateRetryAtTick: {} },
    stockPolicies: {},
    campaignProgress: {
      chapter: 0,
      claimedFlags: [],
      showcaseReceiptId: null,
      clearedAtTick: null,
      inheritedCapabilities: [],
    },
    operatingLedger: {
      buckets: [],
      capexCents: 0,
      grantsCents: 0,
      developmentExpenseCents: 0,
      lifetimeCashOutflowsCents: 0,
      lifetimeReceiptsCents: 0,
      lifetimeCogsCents: 0,
      lifetimeOperatingExpenseCents: 0,
    },
    recoveryState: null,
    nextActionSequence: 1,
  }
}
