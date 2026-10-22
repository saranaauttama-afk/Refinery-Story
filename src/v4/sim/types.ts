export type Speed = 0 | 1 | 2 | 4
export interface Building {
  uid: string
  defId: string
  x: number
  y: number
  level: number
  staff: string[]
  cost: number
  /** Plants only: 0–100, wears down monthly. Missing = 100 (older saves). */
  condition?: number
  /** Plants from Lv3: one chosen specialisation. */
  spec?: 'volume' | 'quality' | 'eco'
  /** Overhaul in progress until this tick: the plant is stopped. */
  repairUntil?: number
  /** Blend stations only: what this station mixes. Falls back to GameState.blend. */
  recipe?: Recipe
  /** Labs only: what this lab does. Missing = 'catalyst'. */
  labRole?: LabRole
}
export type LabRole = 'catalyst' | 'formula'
export interface Recipe {
  base: import('../data/bases').BaseId
  /** Formula key from the Formula Lab; null = plain base. */
  formula: string | null
}
export interface Staff {
  uid: string
  name: string
  job: import('../data/staff').JobId
  jobLevels: Record<import('../data/staff').JobId, number>
  stats: { op: number; chem: number; mech: number; safe: number }
  power: number
  maxPower: number
  salary: number
  trainingCounts: Partial<Record<import('../data/staff').TrainingId, number>>
  assignedTo: string | null
  resting: boolean
}
export interface GameState {
  version: 4
  seed: number
  rng: number
  tick: number
  speed: Speed
  nextId: number
  money: number
  fame: number
  rd: number
  rank: number
  yard: { size: number; ownedParcels: string[]; buildings: Building[] }
  crude: number
  crudeType: 'light' | 'heavy' | 'shale'
  cuts: Record<import('../data/bases').CutId, number>
  baseStock: Record<import('../data/bases').BaseId, number>
  tanks: Lot[]
  /** Default recipe for new blend stations (and the last one picked). */
  blend: Recipe
  familiarity: Record<string, number>
  useCounts: Record<string, number>
  triedPairs: string[]
  unlockedAdditives: import('../data/additives').AdditiveId[]
  popups: Popup[]
  customers: Record<string, { hearts: number; giftGiven: boolean }>
  trucks: Truck[]
  contracts: { offers: Contract[]; active: Contract[] }
  blueprints: string[]
  decos: string[]
  investments: Record<string, number>
  market: { phase: 'normal' | 'boom' | 'bust'; nextChangeTick: number }
  activeCombos: ActiveCombo[]
  discoveredCombos: string[]
  comboHints: string[]
  firedStaff: Staff[]
  candidates: Staff[]
  careerManuals: number
  merchantUntil: number
  year: YearStats
  history: { awards: AwardResult[]; profits: { tick: number; profit: number }[] }
  monthProfit: number
  unlockHistory: { tick: number; key: string }[]
  notices: Notice[]
  stormUntil: number
  evaluation: number | null
  carriedBuildings: Record<string, number>
  // Upkeep and salaries start only after the first sale.
  opened: boolean
  // Amount still owed to the bank; a share of each sale pays it back.
  loan: number
  hintIndex: number
  settings: { sound: boolean; haptics: boolean; ambient?: boolean }
  staff: Staff[]
  ledger: { tick: number; amount: number; reason: string }[]
  log: { tick: number; en: string; th: string }[]
  /** Catalyst stock, formulas, synergy book (docs/v4/FORMULA-LAB.md). */
  formulaLab: FormulaLabState
  research: ResearchJob[]
  /** Per-base demand multiplier: falls with each sale, recovers weekly. */
  demand: Record<string, number>
  trend: { base: import('../data/bases').BaseId | null; until: number }
  /** Big repeatable projects (Phase B), by id → level. */
  projects: Record<string, number>
  /** Ad campaigns: base → tick the campaign ends. */
  ads: Record<string, number>
}
export type Action = (state: GameState) => GameState
export type Grade = 'SS' | 'S' | 'A' | 'B' | 'C' | 'D'
export interface Stats {
  purity: number
  yield: number
  stability: number
  eco: number
}
export interface Lot {
  uid: string
  base: import('../data/bases').BaseId
  /** Formula key, or null for a plain-base lot. */
  formula: string | null
  /** Secret formula id, if the formula is one. */
  secret: string | null
  stats: Stats
  score: number
  grade: Grade
  units: number
}
export interface Popup {
  uid: string
  tick: number
  x: number
  y: number
  en: string
  th: string
}
export interface Truck {
  uid: string
  customer: string | null
  kind: 'crude' | 'product'
  path: { x: number; y: number }[]
  step: number
  phase: 'in' | 'dwell' | 'out'
  nextTick: number
}
export interface Contract {
  uid: string
  base: import('../data/bases').BaseId
  minGrade: Grade
  units: number
  delivered: number
  deadline: number
}
export interface ActiveCombo {
  id: string
  members: string[]
}
export interface YearStats {
  income: number
  expenses: number
  sold: number
  bestScore: number
  ecoTotal: number
  lots: number
  incidents: number
  contracts: number
}
export interface AwardResult {
  year: number
  wins: string[]
  fame: number
  rivals: { name: string; product: number; eco: number; profit: number; safety: number }[]
  // The player's own figures for the same categories (added after the first builds).
  you?: { product: number; eco: number; profit: number }
}
export interface Notice {
  uid: string
  kind: 'rank' | 'awards' | 'ending' | 'market'
  /** Rank-up: what unlocked (chips) and one line per newly active system. */
  chips?: { en: string; th: string }[]
  lines?: { en: string; th: string }[]
  en: string
  th: string
}
export interface CatalystLot {
  additive: import('../data/additives').AdditiveId
  grade: Grade
  units: number
}
export interface Formula {
  key: string
  base: import('../data/bases').BaseId
  catalysts: import('../data/additives').AdditiveId[]
  grade: Grade
  /** Secret formula id when this set matches one. */
  secret: string | null
}
export interface FormulaLabState {
  stock: CatalystLot[]
  formulas: Formula[]
  /** Mixes in a row that did not beat their best input. */
  pity: number
  knownSynergies: string[]
  /** Revealed hints: `syn:<a+b>` or `secret:<id>`. */
  hints: string[]
  /** Lots produced per formula since the last catalyst unit was used. */
  lotCounter: Record<string, number>
}
export type ResearchJob =
  | { lab: string; kind: 'catalyst'; endTick: number }
  | {
      lab: string
      kind: 'mix'
      endTick: number
      /** Rolled when the mix starts (catalysts are spent then); revealed when it ends. */
      formula: Formula
      rolled: Grade
    }
