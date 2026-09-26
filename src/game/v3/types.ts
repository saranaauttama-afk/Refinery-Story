import type {
  BuildingType,
  Employee,
  ProductKey,
  ResearchKey,
  SpecializationPath,
  WorkerType,
} from '../types'

export const V3_RULESET_VERSION = 3 as const
export const V3_PREVIEW_SCHEMA_REVISION = 14 as const

export type V3ProductFamily = Extract<
  ProductKey,
  'gasoline' | 'lubricants' | 'jetFuel' | 'petrochemicals' | 'plasticPellets'
>
export type V3CommodityFamily = Extract<ProductKey, 'asphalt' | 'recycledMaterial'>
export type V3ProcessProfile = 'volume' | 'standard' | 'precision'
export type V3BlueprintProvenance = 'default' | 'developed'
export type V3ModuleKey = 'none' | 'throughput' | 'economy' | 'precision'

export type V3ProductBlueprint = {
  id: string
  signature: string
  revision: number
  family: V3ProductFamily
  name: string
  quality: number
  profile: V3ProcessProfile
  module: V3ModuleKey
  minPlantLevel: 1 | 2 | 3
  provenance: V3BlueprintProvenance
  commissionedAtTick: number | null
  pinned: boolean
  archived: boolean
}

export type V3InventoryEntry = {
  blueprintId: string
  quantity: number
  totalCostBasisCents: number
  estimatedBasis: boolean
}

export type V3MaterialCostBasis = {
  crudeCents: number
  feedstockCents: number
  wasteCents: number
  electricityCents: number
}

export type V3PlantProgram = {
  buildingId: string
  blueprintId: string
  installedModule: V3ModuleKey
  setupRemainingTicks: number
  paused: boolean
}

export type V3DevelopmentProject = {
  id: string
  signature: string
  family: V3ProductFamily
  leadEmployeeId: string
  contributorEmployeeIds: string[]
  labBuildingId: string
  remainingTicks: number
  profile: V3ProcessProfile
  module: V3ModuleKey
  knowledgeRank: 0 | 1 | 2
  leadContribution: 0 | 5
  quality: number
  sampleDebits: Array<{ blueprintId: string; quantity: number }>
  feeDebitedCents: number
}

export type V3DevelopmentHistoryEntry = {
  signature: string
  blueprintId: string
  completedAtTick: number
  creditedEmployeeIds: string[]
}

export type V3EmployeeDuty =
  | { kind: 'line'; buildingId: string }
  | { kind: 'development'; projectId: string; returnBuildingId: string | null; returnSupport?: boolean }
  | { kind: 'support' }
  | { kind: 'reserve' }

/** Minimal accomplishment record (Master §6); derived only from real ledger events. */
export type V3EmployeeRecord = {
  workTicks: number
  blueprintIds: string[]
  milestoneIds: string[]
  /** V3-21e career rank (0 = none, 1 = Senior, 2 = Chief). */
  careerRank?: number
}

export type V3ClientProgress = {
  clientId: string
  lastCompletedMilestoneId: string | null
  repeatAvailableAtTick: number
}

export type V3JobStatus = 'accepted' | 'completed' | 'cancelled' | 'expired'
export type V3AcceptedJob = {
  id: string
  templateId: string
  family: V3ProductFamily
  minimumQuality: number
  quantity: number
  deliveredQuantity: number
  lockedUnitPriceCents: number
  completionBonusCents: number
  paidToDateCents: number
  acceptedAtTick: number
  deadlineTick: number | null
  status: V3JobStatus
  contributorWork: Record<string, number>
  deliveredByBlueprint: Record<string, number>
}

export type V3JobReceipt = {
  id: string
  jobId: string
  templateId: string
  status: Exclude<V3JobStatus, 'accepted'>
  settledAtTick: number
  deliveredQuantity: number
  paidCents: number
  deliveredByBlueprint: Record<string, number>
}

export type V3JobReceipts = {
  receipts: V3JobReceipt[]
  templateRetryAtTick: Record<string, number>
  /** Opt-in repeat re-accepted into the single slot (C3+); null = off. */
  autoRepeatTemplateId: string | null
}

export type V3StockPolicy = {
  keepQuantity: number
  autoSell: boolean
  autoDispatch: boolean
}

export type V3CampaignProgress = {
  chapter: 0 | 1 | 2 | 3 | 4 | 5
  claimedFlags: string[]
  showcaseReceiptId: string | null
  clearedAtTick: number | null
  inheritedCapabilities: string[]
}

export type V3LedgerBucket = {
  second: number
  receiptsCents: number
  cashOutflowsCents: number
  cogsCents: number
  wagesCents: number
  maintenanceCents: number
  unrecognizedCents: number
}

export type V3OperatingLedger = {
  buckets: V3LedgerBucket[]
  capexCents: number
  grantsCents: number
  developmentExpenseCents: number
  lifetimeCashOutflowsCents: number
  lifetimeReceiptsCents: number
  lifetimeCogsCents: number
  lifetimeOperatingExpenseCents: number
  /** Receipts − bonuses/estimated-basis receipts − COGS − wages − maintenance (may be negative). */
  lifetimeRecognizedProfitCents: number
}

export type V3InboxKind = 'customer_thanks' | 'staff_accomplishment' | 'experiment_opportunity'

export type V3InboxItem = {
  /** Unique per source fact (e.g. thanks:local:regular); never re-issued. */
  id: string
  kind: V3InboxKind
  createdAtTick: number
  /** One-time optional RP; never money or stock, never required for the campaign. */
  rewardRp: number
  /** Only experiment opportunities are decisions; others are read/dismiss notes. */
  decision: boolean
  status: 'pending' | 'claimed' | 'dismissed'
  params: Record<string, string | number>
}

export type V3InboxState = {
  items: V3InboxItem[]
  lastIssuedTick: number | null
}

export type V3ExpoEntry = {
  year: number
  blueprintId: string
  family: V3ProductFamily
  quality: number
  score: number
  rank: number
  rivalScores: number[]
  cashCents: number
  reputation: number
}

export type V3AwardGrade = 'S' | 'A' | 'B' | '-'

export type V3AwardPeriod = {
  startTick: number
  familyCount: number
  deliveryTarget: number
  varietyTarget: number
  startRecognizedProfitCents: number
  qualifiedUnits: number
  qualifiedFamilies: V3ProductFamily[]
}

export type V3AwardState = {
  current: V3AwardPeriod
  history: Array<{ startTick: number; score: number; grade: V3AwardGrade; profitCents: number; rpAwarded: number }>
  /** Highest grade RP already paid this run (B5/A10/S15; cumulative cap 15). */
  paidGradeRp: number
}

export type V3CampaignReport = {
  clearedAtTick: number
  partners: string[]
  families: V3ProductFamily[]
  showcaseTemplateId: string
  starProduct: { blueprintId: string; name: string; quality: number; delivered: number } | null
  team: Array<{ employeeId: string; name: string; role: string; level: number; recipes: number; milestones: number }>
  unlockedArea: number
  buildingCounts: Record<string, number>
  rollingProfitCents: number
  lifetimeReceiptsCents: number
}

export type V3RecoveryState = {
  rescueJobId: string
  loanerBuildingIds: string[]
  status: 'running' | 'completed'
  quoteCents: number
  targetCashCents: number
  startedAtTick: number
  remainingTicks: number
  paidCents: number
}

export type V3Building = {
  id: string
  type: BuildingType
  level: 1 | 2 | 3
  /** Top-left anchor in 100×100 world coordinates; footprint comes from data by type × level. */
  x: number
  y: number
}

export type V3WorldState = {
  tickCount: number
  moneyCents: number
  researchPoints: number
  reputation: number
  crudeOil: number
  feedstock: number
  electricity: number
  waste: number
  /** Every placed building; occupancy is derived from these, never stored. */
  buildingsById: Record<string, V3Building>
  unlockedParcelIds: string[]
  employees: Employee[]
  unlockedResearchIds: ResearchKey[]
  specialization: SpecializationPath | null
}

export type V3GameState = {
  rulesetVersion: typeof V3_RULESET_VERSION
  schemaRevision: typeof V3_PREVIEW_SCHEMA_REVISION
  preview: true
  world: V3WorldState
  productBlueprints: Record<string, V3ProductBlueprint>
  variantInventory: Record<string, V3InventoryEntry>
  commodityInventory: Partial<Record<V3CommodityFamily, V3InventoryEntry>>
  materialCostBasis: V3MaterialCostBasis
  plantPrograms: Record<string, V3PlantProgram>
  developmentProject: V3DevelopmentProject | null
  developmentHistory: V3DevelopmentHistoryEntry[]
  employeeDuties: Record<string, V3EmployeeDuty>
  unpaidEmployeeIds: string[]
  employeeRecords: Record<string, V3EmployeeRecord>
  /** Set when maintenance could not be paid; cleared only by player confirmation. */
  maintenanceEmergency: { sinceTick: number; buildingId: string | null } | null
  awards: V3AwardState
  /** One judged entry per in-game year (V3-21d). */
  expoResults: V3ExpoEntry[]
  campaignReport: V3CampaignReport | null
  /** Adjacency kinds formed at least once (history only; never rewarded). */
  discoveredAdjacencies: string[]
  inbox: V3InboxState
  clientProgress: Record<string, V3ClientProgress>
  acceptedJob: V3AcceptedJob | null
  jobReceipts: V3JobReceipts
  stockPolicies: Record<string, V3StockPolicy>
  campaignProgress: V3CampaignProgress
  operatingLedger: V3OperatingLedger
  recoveryState: V3RecoveryState | null
  nextActionSequence: number
}

export type V3ActionMessageId =
  | 'v3.action.ok'
  | 'v3.action.sequence_mismatch'
  | 'v3.build.invalid_cell'
  | 'v3.build.occupied'
  | 'v3.build.locked'
  | 'v3.build.insufficient_cash'
  | 'v3.build.unsupported'
  | 'v3.build.requires_route'
  | 'v3.place.out_of_bounds'
  | 'v3.place.locked_land'
  | 'v3.place.overlap'
  | 'v3.place.no_footprint'
  | 'v3.place.building_limit'
  | 'v3.building.missing'
  | 'v3.inbox.missing'
  | 'v3.inbox.resolved'
  | 'v3.land.unknown'
  | 'v3.land.owned'
  | 'v3.land.locked'
  | 'v3.land.requires_parcel'
  | 'v3.land.insufficient_cash'
  | 'v3.upgrade.invalid_cell'
  | 'v3.upgrade.unsupported'
  | 'v3.upgrade.locked'
  | 'v3.upgrade.max_level'
  | 'v3.upgrade.insufficient_cash'
  | 'v3.trade.invalid_amount'
  | 'v3.trade.insufficient_cash'
  | 'v3.trade.storage_full'
  | 'v3.trade.insufficient_stock'
  | 'v3.trade.inventory_pending'
  | 'v3.program.invalid_cell'
  | 'v3.program.invalid_blueprint'
  | 'v3.program.module_mismatch'
  | 'v3.program.plant_level'
  | 'v3.program.wrong_family'
  | 'v3.program.loaner_default_only'
  | 'v3.duty.employee_missing'
  | 'v3.duty.invalid_target'
  | 'v3.duty.ineligible'
  | 'v3.duty.occupied'
  | 'v3.duty.resume_unaffordable'
  | 'v3.hire.locked'
  | 'v3.hire.unsupported'
  | 'v3.hire.staff_cap'
  | 'v3.hire.insufficient_cash'
  | 'v3.train.employee_missing'
  | 'v3.train.max_level'
  | 'v3.train.insufficient_cash'
  | 'v3.train.insufficient_rp'
  | 'v3.career.employee_missing'
  | 'v3.career.max_rank'
  | 'v3.career.level_required'
  | 'v3.career.insufficient_cash'
  | 'v3.career.insufficient_rp'
  | 'v3.candidate.unavailable'
  | 'v3.expo.not_expo_month'
  | 'v3.expo.fame_locked'
  | 'v3.expo.already_entered'
  | 'v3.expo.invalid_recipe'
  | 'v3.expo.insufficient_samples'
  | 'v3.job.requires_previous'
  | 'v3.job.invalid_branch'
  | 'v3.job.rush_unavailable'
  | 'v3.job.auto_repeat_locked'
  | 'v3.job.auto_repeat_invalid'
  | 'v3.maintenance.not_in_emergency'
  | 'v3.maintenance.unaffordable'
  | 'v3.specialization.locked'
  | 'v3.specialization.chosen'
  | 'v3.development.chapter_locked'
  | 'v3.development.project_active'
  | 'v3.development.invalid_lab'
  | 'v3.development.invalid_config'
  | 'v3.development.knowledge_locked'
  | 'v3.module.invalid_cell'
  | 'v3.module.locked'
  | 'v3.module.plant_level'
  | 'v3.module.no_change'
  | 'v3.module.insufficient_cash'
  | 'v3.research.unsupported'
  | 'v3.research.owned'
  | 'v3.research.locked'
  | 'v3.research.prerequisite'
  | 'v3.research.lab_level'
  | 'v3.research.insufficient_rp'
  | 'v3.development.duplicate_signature'
  | 'v3.development.insufficient_cash'
  | 'v3.development.insufficient_samples'
  | 'v3.development.invalid_lead'
  | 'v3.development.no_project'
  | 'v3.blueprint.missing'
  | 'v3.job.template_missing'
  | 'v3.job.slot_occupied'
  | 'v3.job.locked'
  | 'v3.job.cooldown'
  | 'v3.job.no_active_job'
  | 'v3.job.invalid_quantity'
  | 'v3.job.insufficient_qualified_stock'
  | 'v3.recovery.not_available'
  | 'v3.recovery.already_running'
  | 'v3.recovery.clear_slots'
  | 'v3.recovery.no_missing_route'
  | 'v3.demolish.invalid_cell'
  | 'v3.demolish.stock_overflow'
  | 'v3.demolish.building_changed'
  | 'v3.demolish.active_project'

export type V3ActionEvent = {
  tone: 'success' | 'blocked' | 'info'
  messageId: V3ActionMessageId
  params?: Record<string, string | number>
}

export type V3ActionResult = {
  state: V3GameState
  changed: boolean
  actionId: string
  events: V3ActionEvent[]
}

export type V3BuildAction = {
  type: 'build'
  sequence: number
  /** Top-left anchor in world coordinates. */
  x: number
  y: number
  building: BuildingType
}

export type V3UpgradeAction = {
  type: 'upgrade'
  sequence: number
  buildingId: string
}

export type V3MoveBuildingAction = {
  type: 'move_building'
  sequence: number
  buildingId: string
  x: number
  y: number
}

export type V3UnlockLandParcelAction = {
  type: 'unlock_land_parcel'
  sequence: number
  parcelId: string
}

export type V3TradeDirection = 'buy' | 'sell'
export type V3TradeAction = {
  type: 'trade'
  sequence: number
  direction: V3TradeDirection
  product: ProductKey | 'crude'
  quantity: number
  blueprintId?: string
  source?: 'manual' | 'auto'
  overrideKeep?: boolean
}

export type V3SetProgramAction = {
  type: 'set_program'
  sequence: number
  buildingId: string
  blueprintId: string
}

export type V3SetPauseAction = {
  type: 'set_pause'
  sequence: number
  buildingId: string
  paused: boolean
}

export type V3AssignDutyAction = {
  type: 'assign_duty'
  sequence: number
  employeeId: string
  duty: V3EmployeeDuty
}

export type V3ResumeEmployeeAction = {
  type: 'resume_employee'
  sequence: number
  employeeId: string
}

export type V3StartDevelopmentAction = {
  type: 'start_development'
  sequence: number
  family: V3ProductFamily
  profile: V3ProcessProfile
  module: V3ModuleKey
  knowledgeRank: 0 | 1 | 2
  leadEmployeeId: string | null
  labBuildingId: string
}

export type V3CancelDevelopmentAction = {
  type: 'cancel_development'
  sequence: number
}

export type V3SetBlueprintPresentationAction = {
  type: 'set_blueprint_presentation'
  sequence: number
  blueprintId: string
  name?: string
  pinned?: boolean
  archived?: boolean
}

export type V3AcceptJobAction = {
  type: 'accept_job'
  sequence: number
  templateId: string
  /** Required for Materials: which product this job will use until it ends. */
  branch?: V3ProductFamily
}

export type V3DispatchJobAction = {
  type: 'dispatch_job'
  sequence: number
  quantity: number
  blueprintId?: string
}

export type V3CancelJobAction = {
  type: 'cancel_job'
  sequence: number
}

export type V3SetStockPolicyAction = {
  type: 'set_stock_policy'
  sequence: number
  blueprintId: string
  keepQuantity?: number
  autoSell?: boolean
  autoDispatch?: boolean
}

export type V3StartRecoveryAction = {
  type: 'start_recovery'
  sequence: number
}

export type V3RestoreStarterLoanersAction = {
  type: 'restore_starter_loaners'
  sequence: number
}

export type V3DemolishAction = {
  type: 'demolish'
  sequence: number
  buildingId: string
  expectedBuilding: BuildingType
}

export type V3SetModuleAction = {
  type: 'set_module'
  sequence: number
  buildingId: string
  module: V3ModuleKey
}

export type V3BuyResearchAction = {
  type: 'buy_research'
  sequence: number
  researchId: ResearchKey
}

export type V3HireEmployeeAction = {
  type: 'hire_employee'
  sequence: number
  role: WorkerType
}

export type V3TrainEmployeeAction = {
  type: 'train_employee'
  sequence: number
  employeeId: string
}

export type V3ChooseSpecializationAction = {
  type: 'choose_specialization'
  sequence: number
  path: SpecializationPath
}

export type V3RestoreOperationsAction = {
  type: 'restore_operations'
  sequence: number
}

export type V3ConvertAsphaltAction = {
  type: 'convert_asphalt'
  sequence: number
  quantity: number
}

export type V3ResolveInboxAction = {
  type: 'resolve_inbox'
  sequence: number
  itemId: string
  choice: 'claim' | 'dismiss'
}

export type V3PromoteEmployeeAction = {
  type: 'promote_employee'
  sequence: number
  employeeId: string
}

export type V3HireCandidateAction = {
  type: 'hire_candidate'
  sequence: number
  candidateId: string
}

export type V3EnterExpoAction = {
  type: 'enter_expo'
  sequence: number
  blueprintId: string
}

export type V3SetAutoRepeatAction = {
  type: 'set_auto_repeat'
  sequence: number
  templateId: string | null
}

export type V3Action = V3PromoteEmployeeAction | V3HireCandidateAction | V3EnterExpoAction | V3ResolveInboxAction | V3RestoreOperationsAction | V3ConvertAsphaltAction | V3SetAutoRepeatAction | V3HireEmployeeAction | V3TrainEmployeeAction | V3ChooseSpecializationAction | V3SetModuleAction | V3BuyResearchAction | V3MoveBuildingAction | V3UnlockLandParcelAction | V3BuildAction | V3UpgradeAction | V3TradeAction | V3SetProgramAction | V3SetPauseAction | V3AssignDutyAction | V3ResumeEmployeeAction | V3StartDevelopmentAction | V3CancelDevelopmentAction | V3SetBlueprintPresentationAction | V3AcceptJobAction | V3DispatchJobAction | V3CancelJobAction | V3SetStockPolicyAction | V3StartRecoveryAction | V3RestoreStarterLoanersAction | V3DemolishAction

export type V3StaffRequirement = {
  workerType: WorkerType
  minimumLevel: number
}
