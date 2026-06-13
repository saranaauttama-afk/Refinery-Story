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
  // Intermediate refined feedstock: Distillation Units make it from crude;
  // downstream plants (jet fuel / lubricants / petrochemicals) consume it.
  feedstock: number
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
  // System 1: Staff Training & Levels
  workerLevels: WorkerLevels
  workerXp: WorkerXp
  // Flavor roster: names assigned to hired staff in hire order, per type.
  // Cycles through STAFF_NAME_POOL — see getStaffName.
  workerNames: Record<WorkerType, string[]>
  // System 2: Refinery Upgrade Perk Tree
  upgradePoints: number
  unlockedPerks: PerkKey[]
  // System 3: Tech Eras (highestEraIndex drives the "new era" banner)
  highestEraIndex: number
  // System 4: Annual Awards
  businessYear: number
  yearStartTick: number
  yearStats: YearStats
  awardHistory: AwardRecord[]
  grid: GridCell[]
  gridLevels: number[]
  gridExpansionLevel: number
  prototypeCompleted: boolean
  everBoughtCrude: boolean
  starterGuideDismissed: boolean
  // Player-chosen name for their refinery, shown in the hero panel alongside
  // a level-based title (see getRefineryTitle).
  refineryName: string
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

// --- System 1: Staff Training & Levels ---
// Each worker TYPE has a shared crew level (1–5) and accumulated XP.
// Level multiplies that type's bonus effectiveness. XP accrues passively
// per tick (scaled by headcount) and can be bought instantly via training.
export type WorkerLevels = Record<WorkerType, number>
export type WorkerXp = Record<WorkerType, number>

// --- System 2: Refinery Upgrade Perk Tree ---
// Spend upgradePoints (earned on refinery level-up) on perks across 3 branches.
export type PerkBranch = 'efficiency' | 'capacity' | 'quality'

export type PerkKey =
  | 'efficiency1'
  | 'efficiency2'
  | 'efficiency3'
  | 'capacity1'
  | 'capacity2'
  | 'capacity3'
  | 'quality1'
  | 'quality2'
  | 'quality3'

export type PerkConfig = {
  key: PerkKey
  branch: PerkBranch
  tier: 1 | 2 | 3
  cost: number
  name: BilingualTextValue
  description: BilingualTextValue
  prerequisite?: PerkKey
}

// --- System 3: Tech Eras ---
export type EraKey = 'foundation' | 'expansion' | 'modern'

export type EraConfig = {
  key: EraKey
  index: number
  name: BilingualTextValue
  tagline: BilingualTextValue
  // Unlock requirements (both must be met to advance into this era)
  requiredResearch: number
  requiredLevel: number
  // Global bonuses granted while in this era
  sellPriceBonusRate: number
  researchRateBonusRate: number
}

// --- System 4: Annual Awards ---
export type AwardGrade = 'S' | 'A' | 'B' | 'C'

// One rival refinery's result for a business year (Annual Ranking).
export type RivalResult = {
  key: string
  name: BilingualTextValue
  score: number
  grade: AwardGrade
}

export type YearStats = {
  gasolineProduced: number
  moneyEarned: number
  contractsCompleted: number
}

export type AwardRecord = {
  year: number
  grade: AwardGrade
  score: number
  cashReward: number
  payroll: number
  netProfit: number
  // True if cash on hand couldn't fully cover payroll this year (a small
  // reputation penalty was applied). Surfaced in the ceremony so the player
  // understands why reputation dropped — previously computed but discarded.
  couldNotAfford: boolean
  // Annual Ranking (Charm Pass follow-up): 3 fictional rivals + the player's
  // rank among all 4. Empty array for records saved before this feature —
  // the ceremony hides the ranking section in that case.
  rivals: RivalResult[]
  playerRank: number
  gasolineProduced: number
  moneyEarned: number
  contractsCompleted: number
}

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
  | 'distillationHiccup'
  | 'feedstockSurplus'

export type RandomEvent = {
  key: RandomEventKey
  name: BilingualTextValue
  message: string
  // If true, this event only fires once the player has built distillation
  // (maxFeedstockStorage > FEEDSTOCK_BALANCE.baseFeedstockStorage) — keeps
  // feedstock-chain flavor events from showing up for Tier-1-only players.
  requiresFeedstockChain?: boolean
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

export type StandingOrderKey =
  | 'asphaltMaintenance'
  | 'jetFuelCharter'
  | 'lubricantSupply'
  | 'petrochemExport'

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
  | 'jetFuelPioneer'
  | 'aviationPartner'
  | 'petrochemicalPioneer'
  | 'productMogul'

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
  // Global product sell multiplier (Sales Agents % + quality perks + era).
  // Applies to every product's sell price.
  productSellMultiplier: number
  workerStorageBonus: number
  // System 2 + 3 derived contributions (already folded into the multipliers
  // above, exposed here for UI display)
  perkProductionBonusRate: number
  perkStorageBonusRate: number
  perkSellPriceBonusRate: number
  perkCrudeDiscountRate: number
  currentEra: EraConfig
  nextEra?: EraConfig
  eraSellPriceBonusRate: number
  eraResearchRateBonusRate: number
  // Refinery process chain (feedstock layer)
  maxFeedstockStorage: number
  feedstockPerDistillationCycle: number
  productionMultiplier: number
  productionRate: number
  progressPercent: number
  sellPrice: number
  sellPriceMultiplier: number
  statusLabel: BilingualTextValue
  storageMultiplier: number
  upgradeCost: number
}
