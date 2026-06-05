export type BilingualTextValue = {
  en: string
  th: string
}

export type BuildingType =
  | 'crudeTank'
  | 'distillationUnit'
  | 'productTank'
  | 'laboratory'
  | 'maintenanceWorkshop'
  | 'salesOffice'

export type GridCell = BuildingType | null

export type GameState = {
  money: number
  researchPoints: number
  reputation: number
  crudeOil: number
  gasoline: number
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
  gridExpansionLevel: number
  prototypeCompleted: boolean
  everBoughtCrude: boolean
  starterGuideDismissed: boolean
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

export type WorkerType = 'operator' | 'mechanic' | 'salesAgent'

export type WorkerCounts = Record<WorkerType, number>

export type WorkerConfig = {
  key: WorkerType
  name: BilingualTextValue
  cost: number
  description: BilingualTextValue
}

export type ActiveWorkerItem = WorkerConfig & {
  count: number
}

export type RandomEventKey =
  | 'crudeDiscount'
  | 'machineTuneUp'
  | 'minorLeak'
  | 'qualityBonus'

export type RandomEvent = {
  key: RandomEventKey
  name: BilingualTextValue
  message: string
}

export type ChoiceEventKey =
  | 'supplierNegotiation'
  | 'researchGrant'
  | 'workerRecruitment'

export type ChoiceEvent = {
  key: ChoiceEventKey
  title: BilingualTextValue
  description: BilingualTextValue
  optionA: BilingualTextValue
  optionB: BilingualTextValue
}

export type MilestoneKey =
  | 'firstFuel'
  | 'smallSupplier'
  | 'growingRefinery'
  | 'researchBeginner'

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
