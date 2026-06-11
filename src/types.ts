export type BilingualTextValue = {
  en: string
  th: string
}

// Product types — gasoline is primary. asphalt, jetFuel, lubricants, petrochemicals are secondary products.
export type ProductKey = 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals'

export type ProductInventory = Record<ProductKey, number>

export type BuildingType =
  | 'crudeTank'
  | 'distillationUnit'
  | 'productTank'
  | 'laboratory'
  | 'maintenanceWorkshop'
  | 'salesOffice'
  | 'lubricantPlant'
  | 'jetFuelPlant'
  | 'petrochemicalPlant'

export type GridCell = BuildingType | null

export type GameState = {
  money: number
  researchPoints: number
  reputation: number
  crudeOil: number
  gasoline: number
  // Phase A foundation: future product inventory.
  // Only gasoline is active. Others are unused placeholders.
  // game.gasoline remains the source of truth for all current gameplay.
  productInventory: ProductInventory
  refineryLevel: number
  productionProgress: number
  tickCount: number
  lastEventMessage: string
  totalGasolineProduced: number
  completedContractCount: number
  totalWorkersHired: number
  unlockedResearchCount: number
  activityLog: string[]
  completedContractIds: number[]
  completedMilestoneKeys: MilestoneKey[]
  unlockedResearchIds: ResearchKey[]
  workerCounts: WorkerCounts
  grid: GridCell[]
  gridLevels: number[]
  gridExpansionLevel: number
  prototypeCompleted: boolean
  everBoughtCrude: boolean
  starterGuideDismissed: boolean
  pendingShipments: PendingShipment[]
  // Maps standing order key → tick at which the order becomes available again.
  // Absent key means the order is currently available (never fulfilled or cooldown expired).
  standingOrderCooldowns: Partial<Record<StandingOrderKey, number>>
}

export type BuildingConfig = {
  name: BilingualTextValue
  shortName: string
  cost: number
  description: BilingualTextValue
  unlockLevel?: number
}

export type ComboStats = {
  crudeToDistillation: number
  distillationToProduct: number
  crudeToProduct: number
}

export type Contract = {
  id: number
  name: BilingualTextValue
  tier: 1 | 2 | 3
  unlockLevel: number
  gasolineRequired: number
  // Phase B: asphalt contracts use this field instead of gasolineRequired
  asphaltRequired?: number
  // Phase C: jet fuel contracts
  jetFuelRequired?: number
  // Phase D: lubricant contracts
  lubricantsRequired?: number
  // Phase E: petrochemical contracts
  petrochemicalsRequired?: number
  reward: number
  rpReward: number
  reputationReward: number
}

export type ActiveContract = Contract & {
  isCompleted: boolean
  isUnlocked: boolean
  currentReward: number
  currentRpReward: number
  currentReputationReward: number
  unlockRequirement?: BilingualTextValue
}

export type ReputationTier = {
  name: BilingualTextValue
  minimumReputation: number
  contractRewardBonusRate: number
}

export type ResearchKey =
  | 'betterPumps'
  | 'biggerTanks'
  | 'premiumFuel'
  | 'advancedDistillation'
  | 'industrialStorage'
  | 'premiumContracts'
  | 'advancedProcessing'
  | 'storageOptimization'
  | 'contractAnalytics'
  | 'saferOperations'

export type ResearchItem = {
  key: ResearchKey
  name: BilingualTextValue
  cost: number
  description: BilingualTextValue
  prerequisite?: ResearchKey
}

export type ActiveResearchItem = ResearchItem & {
  isUnlocked: boolean
  isVisible: boolean
  prerequisiteName?: BilingualTextValue
}

export type BuildingCounts = Record<BuildingType, number>

export type WorkerType =
  | 'operator'
  | 'mechanic'
  | 'salesAgent'
  | 'chemist'
  | 'logisticsCoordinator'
  | 'safetyOfficer'
  | 'fuelSpecialist'
  | 'aviationSpecialist'
  | 'chemicalEngineer'

export type WorkerCounts = Record<WorkerType, number>

export type WorkerConfig = {
  key: WorkerType
  name: BilingualTextValue
  cost: number
  description: BilingualTextValue
  unlockLevel?: number
  tier?: 1 | 2 | 3
}

export type ActiveWorkerItem = WorkerConfig & {
  count: number
}

export type RandomEventKey =
  | 'crudeDiscount'
  | 'machineTuneUp'
  | 'minorLeak'
  | 'qualityBonus'
  | 'marketDemandSpike'
  | 'safetyInspection'
  | 'equipmentWear'
  | 'efficientBatch'
  | 'localNewsCoverage'
  | 'supplierDiscount'
  | 'equipmentInspection'
  | 'workerSuggestion'
  | 'storageContamination'
  | 'communityVisit'

export type RandomEvent = {
  key: RandomEventKey
  name: BilingualTextValue
  message: string
}

export type ChoiceEventKey =
  | 'supplierNegotiation'
  | 'researchGrant'
  | 'workerRecruitment'
  | 'equipmentEmergency'
  | 'governmentIncentive'
  | 'qualityAlert'
  | 'supplyChainDelay'
  | 'investorVisit'
  | 'oldEquipmentSale'
  | 'trainingRequest'
  | 'communityComplaint'
  | 'rushOrder'

export type ChoiceEvent = {
  key: ChoiceEventKey
  title: BilingualTextValue
  description: BilingualTextValue
  optionA: BilingualTextValue
  optionB: BilingualTextValue
}

export type ShipmentKey =
  | 'miniDelivery'
  | 'localTruck'
  | 'coastalTanker'
  | 'importedShip'
  | 'tankerConvoy'

export type PendingShipment = {
  id: number
  amount: number
  arrivesAt: number
}

export type StandingOrderKey = 'asphaltMaintenance' | 'jetFuelCharter'

export type MilestoneKey =
  | 'firstFuel'
  | 'smallSupplier'
  | 'growingRefinery'
  | 'researchBeginner'
  | 'upgradeBuilder'
  | 'reputedSupplier'
  | 'industrialProducer'
  | 'refineryLevel5'
  | 'researchAdvanced'
  | 'contractVeteran'
  | 'tierThreeContractor'
  | 'fullWorkforce'

export type Milestone = {
  key: MilestoneKey
  name: BilingualTextValue
  requirement: BilingualTextValue
  reward: string
}

export type ActiveMilestone = Milestone & {
  isCompleted: boolean
}

export type DerivedStats = {
  activeContracts: ActiveContract[]
  activeMilestones: ActiveMilestone[]
  activeResearchItems: ActiveResearchItem[]
  activeWorkers: ActiveWorkerItem[]
  availableSpace: number
  baseCrudeStorage: number
  baseGasolineStorage: number
  baseProductionInterval: number
  buildingCounts: BuildingCounts
  canProcessCrude: boolean
  comboStats: ComboStats
  maxCrudeStorage: number
  maxGasolineStorage: number
  productionInterval: number
  contractRewardMultiplier: number
  contractRpRewardMultiplier: number
  reputationContractRewardMultiplier: number
  eventPenaltyMultiplier: number
  reputationTier: ReputationTier
  nextReputationTier?: ReputationTier
  researchProductionMultiplier: number
  researchContractRewardMultiplier: number
  researchSellPriceBonus: number
  researchStorageBonus: number
  specialBuildingContractRewardMultiplier: number
  specialBuildingRpRewardMultiplier: number
  workerProductionMultiplier: number
  workerSellPriceBonus: number
  workerStorageBonus: number
  productionMultiplier: number
  productionRate: number
  progressPercent: number
  sellPrice: number
  sellPriceMultiplier: number
  statusLabel: BilingualTextValue
  storageMultiplier: number
  upgradeCost: number
}
