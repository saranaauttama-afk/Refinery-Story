import AsyncStorage from '@react-native-async-storage/async-storage'
import { BUILDINGS } from '../data/buildings'
import { V3_COMMODITY_ID, V3_DEVELOPMENT_BY_FAMILY, V3_ROLES, isV3ProcessBuilding, type V3ProcessBuilding } from './data'
import { createInitialV3GameState } from './state'
import { getV3Parcel, validateV3Placement } from './yard'
import {
  V3_PREVIEW_SCHEMA_REVISION,
  V3_RULESET_VERSION,
  type V3Building,
  type V3GameState,
} from './types'

export const V3_STORAGE_KEY = 'refinery-story-v3-save'

export type V3StorageAdapter = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export type V3LoadResult =
  | { status: 'new'; state: V3GameState; reason: null }
  | { status: 'loaded'; state: V3GameState; reason: null }
  | { status: 'invalid'; state: null; reason: string }
  | { status: 'unsupported'; state: null; reason: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

const BUILDING_KEYS = new Set(Object.keys(BUILDINGS))
const PRODUCT_FAMILIES = new Set(['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets'])

/** Yard validation: known types, levels 1–3, integer anchors, unlocked land, no overlap. */
function validYard(world: Record<string, unknown>): boolean {
  if (!isRecord(world.buildingsById) || !Array.isArray(world.unlockedParcelIds)) return false
  const parcels = world.unlockedParcelIds as unknown[]
  if (!parcels.every((id) => typeof id === 'string' && getV3Parcel(id)) || new Set(parcels).size !== parcels.length || !parcels.includes('core')) return false
  for (const id of parcels as string[]) {
    const requires = getV3Parcel(id)!.requires
    if (requires && !parcels.includes(requires)) return false
  }
  const buildings = Object.entries(world.buildingsById)
  if (!buildings.every(([key, building]) =>
    isRecord(building) && building.id === key && typeof building.type === 'string' && BUILDING_KEYS.has(building.type) &&
    [1, 2, 3].includes(building.level as number) && Number.isInteger(building.x) && Number.isInteger(building.y))) return false
  // Re-place every building through the shared validator against the rest.
  const probe = { world: { buildingsById: world.buildingsById, unlockedParcelIds: parcels } } as unknown as V3GameState
  return buildings.every(([id, building]) => {
    const entry = building as V3Building
    return validateV3Placement(probe, entry.type, entry.level, entry.x, entry.y, id) === null
  })
}

export function parseV3GameState(input: unknown): V3LoadResult {
  const value = input
  if (!isRecord(value)) {
    return { status: 'invalid', state: null, reason: 'Save root is not an object.' }
  }
  if (value.rulesetVersion !== V3_RULESET_VERSION) {
    return {
      status: 'unsupported',
      state: null,
      reason: `Unsupported ruleset version: ${String(value.rulesetVersion)}`,
    }
  }
  // V3-15.5 is fresh-save only: earlier preview revisions (fixed grid) are not migrated.
  if (!isRecord(value)) return { status: 'invalid', state: null, reason: 'Save root is not an object.' }
  if (value.schemaRevision !== V3_PREVIEW_SCHEMA_REVISION) {
    return {
      status: 'unsupported',
      state: null,
      reason: `Unsupported schema revision: ${String(value.schemaRevision)}`,
    }
  }
  if (value.preview !== true || !isRecord(value.world)) {
    return { status: 'invalid', state: null, reason: 'Missing V3 world state.' }
  }
  const world = value.world
  if (
    !Number.isInteger(world.tickCount) || (world.tickCount as number) < 0 ||
    !isFiniteNonnegative(world.moneyCents) ||
    !isFiniteNonnegative(world.crudeOil) ||
    !isFiniteNonnegative(world.feedstock) ||
    !isFiniteNonnegative(world.electricity) ||
    !isFiniteNonnegative(world.waste) ||
    !validYard(world) ||
    !Array.isArray(world.employees) ||
    !world.employees.every((employee) => isRecord(employee) && typeof employee.id === 'string')
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 world values.' }
  }
  const requiredRecords = [
    value.productBlueprints,
    value.variantInventory,
    value.commodityInventory,
    value.materialCostBasis,
    value.plantPrograms,
    value.employeeDuties,
    value.clientProgress,
    value.jobReceipts,
    value.stockPolicies,
    value.campaignProgress,
    value.operatingLedger,
  ]
  if (requiredRecords.some((entry) => !isRecord(entry))) {
    return { status: 'invalid', state: null, reason: 'Missing V3 system collection.' }
  }
  if (!Object.entries(value.commodityInventory as Record<string, unknown>).every(([commodity, entry]) =>
    (commodity === 'asphalt' || commodity === 'recycledMaterial') && isRecord(entry) &&
    entry.blueprintId === V3_COMMODITY_ID[commodity] && isFiniteNonnegative(entry.quantity) &&
    isFiniteNonnegative(entry.totalCostBasisCents) && typeof entry.estimatedBasis === 'boolean')) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 commodity inventory.' }
  }
  const emergency = value.maintenanceEmergency
  if (emergency !== null && !(isRecord(emergency) && Number.isInteger(emergency.sinceTick) && (emergency.buildingId === null || typeof emergency.buildingId === 'string'))) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 maintenance emergency.' }
  }
  const awards = value.awards
  const period = isRecord(awards) ? awards.current : null
  if (
    !isRecord(awards) || !isRecord(period) ||
    !Number.isInteger(period.startTick) || !isFiniteNonnegative(period.familyCount) ||
    !isFiniteNonnegative(period.deliveryTarget) || (period.deliveryTarget as number) <= 0 ||
    !isFiniteNonnegative(period.varietyTarget) || (period.varietyTarget as number) <= 0 ||
    typeof period.startRecognizedProfitCents !== 'number' || !Number.isFinite(period.startRecognizedProfitCents) ||
    !isFiniteNonnegative(period.qualifiedUnits) ||
    !Array.isArray(period.qualifiedFamilies) || !period.qualifiedFamilies.every((family) => PRODUCT_FAMILIES.has(family as string)) ||
    !Array.isArray(awards.history) || !isFiniteNonnegative(awards.paidGradeRp) || (awards.paidGradeRp as number) > 15 ||
    (value.campaignReport !== null && !isRecord(value.campaignReport)) ||
    (value.campaignReport !== null && (value.campaignProgress as Record<string, unknown>).chapter !== 5)
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 awards or campaign report.' }
  }
  const inbox = value.inbox
  if (
    !Array.isArray(value.discoveredAdjacencies) || !value.discoveredAdjacencies.every((entry) => typeof entry === 'string') ||
    !isRecord(inbox) || !(inbox.lastIssuedTick === null || Number.isInteger(inbox.lastIssuedTick)) ||
    !Array.isArray(inbox.items) ||
    new Set((inbox.items as Array<Record<string, unknown>>).map((item) => item?.id)).size !== inbox.items.length ||
    !inbox.items.every((item) => isRecord(item) && typeof item.id === 'string' &&
      ['customer_thanks', 'staff_accomplishment', 'experiment_opportunity'].includes(item.kind as string) &&
      Number.isInteger(item.createdAtTick) && isFiniteNonnegative(item.rewardRp) && (item.rewardRp as number) <= 5 &&
      typeof item.decision === 'boolean' && ['pending', 'claimed', 'dismissed'].includes(item.status as string) && isRecord(item.params)) ||
    (inbox.items as Array<Record<string, unknown>>).filter((item) => item.decision && item.status === 'pending').length > 1
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 inbox or adjacency history.' }
  }
  const employees = world.employees as Array<Record<string, unknown>>
  const employeeIds = new Set(employees.map((employee) => employee.id as string))
  const employeeTypes = new Map(employees.map((employee) => [employee.id as string, employee.type]))
  if (
    employeeIds.size !== employees.length ||
    !Array.isArray(value.unpaidEmployeeIds) ||
    !value.unpaidEmployeeIds.every((id) => typeof id === 'string' && employeeIds.has(id)) ||
    new Set(value.unpaidEmployeeIds).size !== value.unpaidEmployeeIds.length
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 employee standby state.' }
  }
  if (
    !Object.entries(value.productBlueprints as Record<string, unknown>).every(([key, blueprint]) =>
      isRecord(blueprint) &&
      blueprint.id === key &&
      typeof blueprint.id === 'string' &&
      typeof blueprint.signature === 'string' &&
      PRODUCT_FAMILIES.has(blueprint.family as string) &&
      isFiniteNonnegative(blueprint.quality) &&
      Number.isInteger(blueprint.revision) && (blueprint.revision as number) >= 1 &&
      typeof blueprint.pinned === 'boolean' &&
      typeof blueprint.archived === 'boolean',
    ) ||
    !Object.entries(value.variantInventory as Record<string, unknown>).every(([key, entry]) =>
      isRecord(entry) &&
      entry.blueprintId === key &&
      Object.hasOwn(value.productBlueprints as Record<string, unknown>, key) &&
      isFiniteNonnegative(entry.quantity) &&
      isFiniteNonnegative(entry.totalCostBasisCents) &&
      typeof entry.estimatedBasis === 'boolean',
    ) ||
    ![0, 1, 2, 3, 4, 5].includes((value.campaignProgress as Record<string, unknown>).chapter as number)
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 blueprint, inventory, or campaign data.' }
  }
  const campaignProgress = value.campaignProgress as Record<string, unknown>
  if (
    !Array.isArray(campaignProgress.claimedFlags) ||
    !campaignProgress.claimedFlags.every((flag) => typeof flag === 'string') ||
    new Set(campaignProgress.claimedFlags).size !== campaignProgress.claimedFlags.length ||
    (campaignProgress.showcaseReceiptId !== null && typeof campaignProgress.showcaseReceiptId !== 'string') ||
    (campaignProgress.clearedAtTick !== null && (!Number.isInteger(campaignProgress.clearedAtTick) || (campaignProgress.clearedAtTick as number) < 0)) ||
    !Array.isArray(campaignProgress.inheritedCapabilities) ||
    !campaignProgress.inheritedCapabilities.every((capability) => typeof capability === 'string')
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 campaign progress.' }
  }
  const materialCostBasis = value.materialCostBasis as Record<string, unknown>
  if (!['crudeCents', 'feedstockCents', 'wasteCents', 'electricityCents'].every((key) =>
    isFiniteNonnegative(materialCostBasis[key]),
  )) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 material cost basis.' }
  }
  const operatingLedger = value.operatingLedger as Record<string, unknown>
  const ledgerTotals = [
    'capexCents',
    'grantsCents',
    'developmentExpenseCents',
    'lifetimeCashOutflowsCents',
    'lifetimeReceiptsCents',
    'lifetimeCogsCents',
    'lifetimeOperatingExpenseCents',
  ]
  if (
    !ledgerTotals.every((key) => isFiniteNonnegative(operatingLedger[key])) ||
    !Array.isArray(operatingLedger.buckets) ||
    !operatingLedger.buckets.every((bucket) =>
      isRecord(bucket) &&
      Number.isInteger(bucket.second) && (bucket.second as number) >= 0 &&
      ['receiptsCents', 'cashOutflowsCents', 'cogsCents', 'wagesCents', 'maintenanceCents', 'unrecognizedCents']
        .every((key) => isFiniteNonnegative(bucket[key])),
    ) ||
    typeof operatingLedger.lifetimeRecognizedProfitCents !== 'number' || !Number.isFinite(operatingLedger.lifetimeRecognizedProfitCents)
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 operating ledger.' }
  }
  const plantPrograms = value.plantPrograms as Record<string, unknown>
  const typeOf = (id: unknown): string | null => (typeof id === 'string' ? ((world.buildingsById as Record<string, V3Building>)[id]?.type ?? null) : null)
  if (!Object.entries(plantPrograms).every(([key, program]) =>
    isRecord(program) &&
    typeof program.buildingId === 'string' && program.buildingId === key &&
    isV3ProcessBuilding(typeOf(program.buildingId) as never) &&
    typeof program.blueprintId === 'string' &&
    (Object.hasOwn(value.productBlueprints as Record<string, unknown>, program.blueprintId) ||
      (typeOf(program.buildingId) === 'wasteTreatmentPlant' && program.blueprintId === V3_COMMODITY_ID.recycledMaterial)) &&
    ['none', 'throughput', 'economy', 'precision'].includes(program.installedModule as string) &&
    isFiniteNonnegative(program.setupRemainingTicks) &&
    typeof program.paused === 'boolean',
  )) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 plant program.' }
  }
  const employeeDuties = value.employeeDuties as Record<string, unknown>
  const occupiedLineCells = new Set<string>()
  if (Object.keys(employeeDuties).length !== employeeIds.size || !Object.entries(employeeDuties).every(([employeeId, duty]) => {
    if (!employeeIds.has(employeeId) || !isRecord(duty) || typeof duty.kind !== 'string') return false
    const role = V3_ROLES[employeeTypes.get(employeeId) as keyof typeof V3_ROLES]
    if (!role) return false
    if (duty.kind === 'reserve') return true
    if (duty.kind === 'support') return role.support !== null
    if (duty.kind === 'development') {
      return typeof duty.projectId === 'string' &&
        (duty.returnBuildingId === null || typeof duty.returnBuildingId === 'string') &&
        (duty.returnSupport === undefined || typeof duty.returnSupport === 'boolean')
    }
    if (duty.kind !== 'line' || typeof duty.buildingId !== 'string') return false
    const buildingId = duty.buildingId
    if (!isV3ProcessBuilding(typeOf(buildingId) as never) || !role.lineBuildings.includes(typeOf(buildingId) as V3ProcessBuilding) || occupiedLineCells.has(buildingId)) return false
    occupiedLineCells.add(buildingId)
    return true
  })) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 employee duties.' }
  }
  if (value.developmentProject !== null) {
    const project = value.developmentProject
    if (
      !isRecord(project) || typeof project.id !== 'string' || typeof project.signature !== 'string' ||
      !PRODUCT_FAMILIES.has(project.family as string) || !['volume', 'standard', 'precision'].includes(project.profile as string) ||
      !['none', 'throughput', 'economy', 'precision'].includes(project.module as string) ||
      ![0, 1, 2].includes(project.knowledgeRank as number) || ![0, 5].includes(project.leadContribution as number) ||
      !isFiniteNonnegative(project.quality) || !isFiniteNonnegative(project.remainingTicks) ||
      typeOf(project.labBuildingId) !== 'laboratory' ||
      typeof project.leadEmployeeId !== 'string' ||
      (project.leadEmployeeId !== '' && !employeeIds.has(project.leadEmployeeId)) ||
      !Array.isArray(project.contributorEmployeeIds) ||
      !project.contributorEmployeeIds.every((id) => typeof id === 'string' && employeeIds.has(id)) ||
      !Array.isArray(project.sampleDebits) ||
      !project.sampleDebits.every((debit) => isRecord(debit) && typeof debit.blueprintId === 'string' && isFiniteNonnegative(debit.quantity)) ||
      project.feeDebitedCents !== V3_DEVELOPMENT_BY_FAMILY[project.family as keyof typeof V3_DEVELOPMENT_BY_FAMILY].feeCents
    ) {
      return { status: 'invalid', state: null, reason: 'Invalid V3 development project.' }
    }
  }
  if (value.acceptedJob !== null) {
    const job = value.acceptedJob
    if (
      !isRecord(job) || typeof job.id !== 'string' || typeof job.templateId !== 'string' ||
      !PRODUCT_FAMILIES.has(job.family as string) || job.status !== 'accepted' ||
      !isFiniteNonnegative(job.minimumQuality) || !isFiniteNonnegative(job.quantity) ||
      !isFiniteNonnegative(job.deliveredQuantity) || (job.deliveredQuantity as number) > (job.quantity as number) ||
      !isFiniteNonnegative(job.lockedUnitPriceCents) || !isFiniteNonnegative(job.completionBonusCents) ||
      !isFiniteNonnegative(job.paidToDateCents) || !Number.isInteger(job.acceptedAtTick) ||
      (job.deadlineTick !== null && !Number.isInteger(job.deadlineTick)) ||
      !isRecord(job.contributorWork) ||
      !Object.entries(job.contributorWork).every(([id, work]) => employeeIds.has(id) && isFiniteNonnegative(work)) ||
      !isRecord(job.deliveredByBlueprint) ||
      !Object.entries(job.deliveredByBlueprint).every(([id, quantity]) =>
        Object.hasOwn(value.productBlueprints as Record<string, unknown>, id) && isFiniteNonnegative(quantity)) ||
      Object.values(job.deliveredByBlueprint).reduce<number>((sum, quantity) => sum + (quantity as number), 0) > (job.deliveredQuantity as number) + 1e-8
    ) {
      return { status: 'invalid', state: null, reason: 'Invalid V3 accepted job.' }
    }
  }
  const jobReceipts = value.jobReceipts as Record<string, unknown>
  if (
    !Array.isArray(jobReceipts.receipts) ||
    !jobReceipts.receipts.every((receipt) =>
      isRecord(receipt) && typeof receipt.id === 'string' && typeof receipt.jobId === 'string' &&
      typeof receipt.templateId === 'string' && ['completed', 'cancelled', 'expired'].includes(receipt.status as string) &&
      Number.isInteger(receipt.settledAtTick) && (receipt.settledAtTick as number) >= 0 &&
      isFiniteNonnegative(receipt.deliveredQuantity) && isFiniteNonnegative(receipt.paidCents) &&
      isRecord(receipt.deliveredByBlueprint) &&
      Object.entries(receipt.deliveredByBlueprint).every(([id, quantity]) =>
        Object.hasOwn(value.productBlueprints as Record<string, unknown>, id) && isFiniteNonnegative(quantity)),
    ) ||
    !isRecord(jobReceipts.templateRetryAtTick) ||
    !Object.values(jobReceipts.templateRetryAtTick).every((tick) => Number.isInteger(tick) && (tick as number) >= 0) ||
    (jobReceipts.autoRepeatTemplateId !== null && typeof jobReceipts.autoRepeatTemplateId !== 'string')
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 job receipts.' }
  }
  if (!Object.entries(value.stockPolicies as Record<string, unknown>).every(([blueprintId, policy]) =>
    Object.hasOwn(value.productBlueprints as Record<string, unknown>, blueprintId) &&
    isRecord(policy) && isFiniteNonnegative(policy.keepQuantity) &&
    typeof policy.autoSell === 'boolean' && typeof policy.autoDispatch === 'boolean',
  )) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 stock policy.' }
  }
  if (value.recoveryState !== null) {
    const recovery = value.recoveryState
    if (
      !isRecord(recovery) || typeof recovery.rescueJobId !== 'string' ||
      !['running', 'completed'].includes(recovery.status as string) ||
      !isFiniteNonnegative(recovery.quoteCents) || !isFiniteNonnegative(recovery.targetCashCents) ||
      !Number.isInteger(recovery.startedAtTick) || (recovery.startedAtTick as number) < 0 ||
      !isFiniteNonnegative(recovery.remainingTicks) || !isFiniteNonnegative(recovery.paidCents) ||
      !Array.isArray(recovery.loanerBuildingIds) ||
      !recovery.loanerBuildingIds.every((id) =>
        ['crudeTank', 'distillationUnit', 'gasolineTank'].includes(typeOf(id) as string)) ||
      new Set(recovery.loanerBuildingIds).size !== recovery.loanerBuildingIds.length
    ) {
      return { status: 'invalid', state: null, reason: 'Invalid V3 recovery state.' }
    }
  }
  if (
    !isRecord(value.employeeRecords) ||
    Object.keys(value.employeeRecords).some((id) => !employeeIds.has(id)) ||
    !Object.values(value.employeeRecords).every((record) =>
      isRecord(record) && isFiniteNonnegative(record.workTicks) &&
      Array.isArray(record.blueprintIds) && record.blueprintIds.every((id) => typeof id === 'string') &&
      Array.isArray(record.milestoneIds) && record.milestoneIds.every((id) => typeof id === 'string'))
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 employee records.' }
  }
  if (
    !Array.isArray(value.developmentHistory) ||
    !value.developmentHistory.every((entry) =>
      isRecord(entry) && typeof entry.signature === 'string' && typeof entry.blueprintId === 'string' &&
      Object.hasOwn(value.productBlueprints as Record<string, unknown>, entry.blueprintId) &&
      Number.isInteger(entry.completedAtTick) && (entry.completedAtTick as number) >= 0 &&
      Array.isArray(entry.creditedEmployeeIds),
    ) ||
    !Number.isInteger(value.nextActionSequence) || (value.nextActionSequence as number) < 1
  ) {
    return { status: 'invalid', state: null, reason: 'Invalid V3 sequence/history.' }
  }
  return { status: 'loaded', state: value as V3GameState, reason: null }
}

export async function loadV3GameState(storage: V3StorageAdapter = AsyncStorage): Promise<V3LoadResult> {
  let raw: string | null
  try {
    raw = await storage.getItem(V3_STORAGE_KEY)
  } catch {
    return { status: 'invalid', state: null, reason: 'Unable to read V3 save.' }
  }
  if (raw === null) {
    return { status: 'new', state: createInitialV3GameState(), reason: null }
  }
  try {
    return parseV3GameState(JSON.parse(raw))
  } catch {
    return { status: 'invalid', state: null, reason: 'V3 save is not valid JSON.' }
  }
}

export async function saveV3GameState(
  state: V3GameState,
  storage: V3StorageAdapter = AsyncStorage,
): Promise<boolean> {
  const parsed = parseV3GameState(state)
  if (parsed.status !== 'loaded') return false
  try {
    await storage.setItem(V3_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export async function clearV3GameState(storage: V3StorageAdapter = AsyncStorage): Promise<boolean> {
  try {
    await storage.removeItem(V3_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
