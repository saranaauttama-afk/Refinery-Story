import type { Employee } from '../types'
import {
  V3_PREVIEW_SCHEMA_REVISION,
  V3_RULESET_VERSION,
  type V3Building,
  type V3GameState,
  type V3ProductBlueprint,
  type V3ProductFamily,
} from './types'

/**
 * Starter layout inside the 10×10 core parcel (x/y 45..54), spaced 3 apart so
 * each can grow to its Lv3 footprint without moving.
 */
export const V3_STARTER_BUILDINGS = {
  crudeTank: { id: 'building:starter:crude', type: 'crudeTank', level: 1, x: 45, y: 48 },
  distillationUnit: { id: 'building:starter:distillation', type: 'distillationUnit', level: 1, x: 48, y: 48 },
  gasolineTank: { id: 'building:starter:gasoline', type: 'gasolineTank', level: 1, x: 51, y: 48 },
} as const satisfies Record<string, V3Building>

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
  const buildingsById: V3GameState['world']['buildingsById'] = Object.fromEntries(
    Object.values(V3_STARTER_BUILDINGS).map((building) => [building.id, { ...building }]),
  )

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
      buildingsById,
      unlockedParcelIds: ['core'],
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
      [V3_STARTER_BUILDINGS.distillationUnit.id]: {
        buildingId: V3_STARTER_BUILDINGS.distillationUnit.id,
        blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline,
        installedModule: 'none',
        setupRemainingTicks: 0,
        paused: false,
      },
    },
    developmentProject: null,
    developmentHistory: [],
    employeeDuties: {
      [operator.id]: { kind: 'line', buildingId: V3_STARTER_BUILDINGS.distillationUnit.id },
    },
    unpaidEmployeeIds: [],
    maintenanceEmergency: null,
    awards: {
      current: {
        startTick: 0, familyCount: 1, deliveryTarget: 60, varietyTarget: 1,
        startRecognizedProfitCents: 0, qualifiedUnits: 0, qualifiedFamilies: [],
      },
      history: [],
      paidGradeRp: 0,
    },
    campaignReport: null,
    discoveredAdjacencies: [],
    inbox: { items: [], lastIssuedTick: null },
    employeeRecords: { [operator.id]: { workTicks: 0, blueprintIds: [], milestoneIds: [] } },
    clientProgress: {},
    acceptedJob: null,
    jobReceipts: { receipts: [], templateRetryAtTick: {}, autoRepeatTemplateId: null },
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
      lifetimeRecognizedProfitCents: 0,
    },
    recoveryState: null,
    nextActionSequence: 1,
  }
}
