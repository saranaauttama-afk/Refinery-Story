import { yardDecor } from './yardDecor'
export const B = {
  startingMoney: 55_000,
  tickMs: 250,
  ticksPerWeek: 60,
  weeksPerMonth: 4,
  monthsPerYear: 12,
  upkeepRate: 0.03,
  // Upkeep grows with level: × (1 + upkeepPerLevel × (level − 1)).
  upkeepPerLevel: 0.5,
  logLimit: 50,
  saveKey: 'refinery-v4-save',
  defaultSeed: 42,
  speeds: [0, 1, 2, 4] as const,
}
export const MONTH = B.ticksPerWeek * B.weeksPerMonth
export const YEAR = MONTH * B.monthsPerYear
export const YARD = {
  startSize: 16,
  parcel: 8,
  // The yard block on the world map: 4 × 3 parcels.
  maxW: 32,
  maxH: 24,
  landCost: 20000,
  // Each parcel past the first four costs ×landGrowth more.
  landGrowth: 1.6,
  startParcels: 4,
  moveCost: 2000,
  refund: 0.5,
  maxLevel: 5,
  upgradeBase: 0.6,
  upgradeGrowth: 1.5,
  outputPerLevel: 0.25,
  tileW: 32,
  tileH: 16,
  defaultZoom: 2,
  minZoom: 1,
  maxZoom: 4,
}
export const PRODUCTION = {
  cycle: 48,
  crudeInterval: 48,
  crudeDelivery: 1200,
  crudeCapacity: 2400,
  crudeUnitPrice: 1,
  creditLimit: 5000,
  cutCapacity: 6000,
  tankCapacity: 1200,
  lotUnits: 300,
  baseStat: 30,
  familiarityLots: 5,
  familiarityMax: 10,
  familiarityBonus: 0.03,
  firstTryFame: 10,
  popupTicks: 4,
  crudeQuality: { light: 1, heavy: 0.9, shale: 0.95 },
}
// Sale price multiplier and fame per lot grade, best first. Grades come from formulas
// (FORMULA_LAB below), not from a score.
export const GRADES = [
  { id: 'SS', price: 2.7, fame: 10 },
  { id: 'S', price: 2, fame: 7 },
  { id: 'A', price: 1.5, fame: 4 },
  { id: 'B', price: 1.2, fame: 3 },
  { id: 'C', price: 1, fame: 1 },
  { id: 'D', price: 0.8, fame: 0 },
] as const
// Demand per product: selling the same thing cools it down; a monthly trend heats one up.
export const DEMAND = {
  perSale: 0.025,
  recoverPerWeek: 0.05,
  max: 1,
  min: 0.5,
  trendBoost: 1.5,
}
// Phase B: plants wear out and need engineers or an overhaul.
export const WEAR = {
  perMonth: 4,
  // Condition below these lines cuts output.
  worn: 60,
  wornOutput: 0.8,
  broken: 30,
  brokenOutput: 0.6,
  // Each engineer on the building restores Mech ÷ this per month.
  mechDivisor: 25,
  overhaulShare: 0.15,
  overhaulWeeks: 1,
  // Incident odds rise by this much for each plant below the broken line.
  incidentPerBroken: 0.5,
}
// Phase C: from Lv3 a plant can specialise once.
export const SPEC = {
  minLevel: 3,
  volumeOutput: 0.15,
  qualityPurity: 6,
  qualityStability: 6,
  ecoEco: 8,
  ecoWearLess: 1,
}
// Phase C: an ad campaign resets one product's demand and lifts it for a month.
export const ADS = {
  minCost: 20000,
  profitShare: 0.5,
  boost: 1.25,
}
// Phase B: big repeatable projects soak up late-game money.
export const PROJECTS = {
  export: { rank: 5, cost: 5_000_000, growth: 1.8, pricePerLevel: 0.05, max: 10 },
  researchCenter: { rank: 6, cost: 8_000_000, growth: 1, labLevels: 1, max: 1 },
}
// Rivals grow like a typical player (fitted to the bot), so awards stay contested.
export const RIVALS = {
  scoreBase: 240,
  scoreGrowth: 1.45,
  profitBase: 420000,
  profitGrowth: 1.53,
  spread: 0.15,
}
// Start-up help: a bank loan when the first layout runs out of cash.
export const LOAN = {
  amount: 10000,
  repay: 12000,
  repayShare: 0.25,
}
export const SALES = {
  arrivalTicks: 60,
  highwayBays: 1.3,
  // Each extra product in the tanks draws its own buyers (up to lineCap products).
  lineBuyers: 0.8,
  lineCap: 3,
  roadTicks: 2,
  dwellTicks: 4,
  units: 300,
  giftHearts: 10,
  rdUnits: 10,
  offers: 2,
  maxContracts: 3,
  deadlineWeeks: 6,
  reward: 1.5,
  contractFame: 15,
  failedFame: 10,
  maxTrucks: 24,
  approachTiles: 6,
  // Off-map approach: ticks per tile of the visible approach road (render/truckApproach.ts), so
  // trucks drive in at about 3 tiles a second at 1× instead of jumping 10+ tiles per step.
  approachTicksPerTile: 1.3,
  // When tanks are this full, buyers take a below-standard lot at a discount.
  clearanceFill: 0.8,
  clearancePrice: 0.5,
}
export const COMBO = {
  distance: 2,
  fame: 20,
  // Secret combos are worth this many times the Fame.
  hiddenFameMultiplier: 3,
  hintCost: 500,
  auraPower: 10,
  aura: [
    [0.1, 0.125, 0.25, 0.125, 0.1],
    [0.125, 0.5, 1, 0.5, 0.125],
    [0.25, 1, 0, 1, 0.25],
    [0.125, 0.5, 1, 0.5, 0.125],
    [0.1, 0.125, 0.25, 0.125, 0.1],
  ],
}
export const STAFF = {
  capStart: 3,
  capMax: 12,
  levelMax: 5,
  levelRD: 20,
  // RD to reach job level 1…5.
  levelRDCost: [20, 60, 150, 300, 500],
  salaryGrowth: 1.2,
  superChance: 0.05,
  superGain: 3,
  diminish: 12,
  manualCost: 200000,
  workDrain: 1,
  restGain: 4,
  restWithoutCanteen: 1,
  powerMin: 8,
  powerMax: 30,
  candidates: 3,
  statMin: 6,
  statSpread: 20,
  salaryMin: 1000,
  salaryRange: 7000,
}
export const PROGRESSION = {
  rankFame: [0, 150, 1000, 1800, 2900, 6000, 11000, 20000, 30000, 40000],
  finalYear: 15,
  marketBonus: 0.3,
  marketMinYears: 2,
  marketExtraYears: 1,
  warningMonths: 1,
  eventsPerMonth: 2,
  stormWeeks: 1,
  spillMoney: 2000,
  // Spill fine = max(spillMoney, building value × spillShare).
  spillShare: 0.02,
  spillFame: 10,
  safeThreshold: 60,
  inspectorMoney: 3000,
  inspectorFame: 5,
  celebrityFame: 10,
  incidentChance: 0.15,
  awardMin: 150,
  awardMax: 600,
  awardYearStep: 60,
  rivalScoreBase: 280,
  rivalScoreYear: 12,
  rivalScoreGap: 8,
  rivalEcoGap: 2,
  rivalProfitGap: 50000,
  rivalEcoBase: 60,
  rivalEcoYear: 4,
  rivalProfitBase: 1000000,
  rivalProfitYear: 200000,
  stimulus: 0.5,
  shelter: 0.5,
  exportBonus: 1.3,
  airportBonus: 2,
}

export const BASE_PRICES = {
  lpg: 63,
  gasoline: 26,
  jet: 66,
  diesel: 30,
  lube: 110,
  asphalt: 80,
  wax: 80,
  pellet: 90,
}

// "Is it too easy?" gates for the bot (AUDIT.md).
export const FUN = {
  // Median year (0-based, as tick / YEAR) a lot of each grade first appears.
  firstGrade: { A: [1.5, 4], S: [4.5, 8], SS: [7, 11] } as Record<'A' | 'S' | 'SS', number[]>,
  awardsFromYear: 3,
  awardsMean: [1, 2.5],
  // Formulas found by year 15: the lab stays worth using all game.
  formulasY15: [8, 40],
  // Phase B sinks: cash on hand stays within this many months of profit (Y5, Y10),
  // and RD does not pile up.
  cashMonthsMax: 24,
  rdY10Max: 3000,
}
export const POLISH = {
  hintLimit: 6,
  confettiPieces: 28,
  confettiMs: 1000,
  rdScoreDivisor: 1000,
  reportSeeds: 20,
  // Lowered in Phase A (lab research, demand, rivals): money still piles up, so this is not a squeeze.
  incomeTargets: { 1: 45000, 5: 300000, 10: 2500000 },
  incomeMeanBounds: { 1: [30000, 60000], 5: [180000, 500000], 10: [1500000, 3600000] } as Record<
    number,
    number[]
  >,
}

export const BUILDING_BALANCE: Record<
  string,
  { w: number; h: number; height: number; cost: number; rank: number }
> = {
  ...Object.fromEntries(
    yardDecor.map((d, i) => [
      d.id,
      {
        w: 1,
        h: 1,
        height: 24,
        cost: [900, 450, 400, 600, 2200, 2800, 500, 800, 1200, 650, 450, 350][i],
        rank: 1,
      },
    ]),
  ),
  gate: {
    w: 1,
    h: 2,
    height: 16,
    cost: 5000,
    rank: 1,
  },
  loading: {
    w: 2,
    h: 2,
    height: 24,
    cost: 4900,
    rank: 1,
  },
  crudeTank: {
    w: 2,
    h: 2,
    height: 24,
    cost: 5000,
    rank: 1,
  },
  tank: {
    w: 1,
    h: 1,
    height: 24,
    cost: 5000,
    rank: 1,
  },
  cdu: {
    w: 2,
    h: 2,
    height: 48,
    cost: 20000,
    rank: 1,
  },
  blend: {
    w: 2,
    h: 2,
    height: 24,
    cost: 10000,
    rank: 1,
  },
  pipe: {
    w: 1,
    h: 1,
    height: 16,
    cost: 1000,
    rank: 1,
  },
  road: {
    w: 1,
    h: 1,
    height: 0,
    cost: 100,
    rank: 1,
  },
  hydro: {
    w: 2,
    h: 2,
    height: 40,
    cost: 25000,
    rank: 2,
  },
  lab: {
    w: 1,
    h: 1,
    height: 24,
    cost: 15000,
    rank: 2,
  },
  productLab: {
    w: 1,
    h: 1,
    height: 24,
    cost: 15000,
    rank: 2,
  },
  reformer: {
    w: 2,
    h: 3,
    height: 40,
    cost: 120000,
    rank: 3,
  },
  cracker: {
    w: 3,
    h: 3,
    height: 64,
    cost: 300000,
    rank: 4,
  },
  control: {
    w: 2,
    h: 1,
    height: 24,
    cost: 80000,
    rank: 5,
  },
  canteen: {
    w: 2,
    h: 1,
    height: 24,
    cost: 8000,
    rank: 1,
  },
  flare: {
    w: 1,
    h: 1,
    height: 56,
    cost: 6000,
    rank: 2,
  },
  tree: {
    w: 1,
    h: 1,
    height: 24,
    cost: 500,
    rank: 1,
  },
  lamp: {
    w: 1,
    h: 1,
    height: 24,
    cost: 500,
    rank: 1,
  },
  sign: {
    w: 1,
    h: 1,
    height: 24,
    cost: 1000,
    rank: 1,
  },
  flag: {
    w: 1,
    h: 1,
    height: 24,
    cost: 2000,
    rank: 8,
  },
  goldTree: {
    w: 1,
    h: 1,
    height: 24,
    cost: 5000,
    rank: 9,
  },
  goldSign: {
    w: 1,
    h: 1,
    height: 24,
    cost: 5000,
    rank: 9,
  },
  legend: {
    w: 1,
    h: 1,
    height: 32,
    cost: 10000,
    rank: 10,
  },
  tower: {
    w: 3,
    h: 3,
    height: 80,
    cost: 3000000,
    rank: 9,
  },
  award: {
    w: 1,
    h: 1,
    height: 24,
    cost: 0,
    rank: 99,
  },
}

// The foreman the player starts with, so people walk the yard from minute one.
export const STARTING_STAFF = {
  name: 'สมชาย',
  stat: 2,
  salary: 1000,
  power: 12,
}
export const STAFF_HIRING = {
  word: {
    cost: 5000,
    rank: 1,
    quality: 1,
  },
  board: {
    cost: 20000,
    rank: 1,
    quality: 1.2,
  },
  university: {
    cost: 80000,
    rank: 3,
    quality: 1.6,
  },
  fair: {
    cost: 250000,
    rank: 5,
    quality: 2,
  },
  headhunter: {
    cost: 600000,
    rank: 7,
    quality: 3,
  },
}

export const TRAINING_BALANCE = {
  manual: {
    cost: 3000,
    power: 2,
    rank: 1,
    op: 2,
    chem: 3,
    mech: 0,
    safe: 0,
  },
  walk: {
    cost: 3000,
    power: 2,
    rank: 1,
    op: 3,
    chem: 0,
    mech: 0,
    safe: 3,
  },
  repair: {
    cost: 6000,
    power: 3,
    rank: 1,
    op: 0,
    chem: 0,
    mech: 5,
    safe: 1,
  },
  lab: {
    cost: 12000,
    power: 4,
    rank: 2,
    op: 0,
    chem: 6,
    mech: 0,
    safe: -2,
  },
  drill: {
    cost: 15000,
    power: 4,
    rank: 3,
    op: 1,
    chem: 0,
    mech: 0,
    safe: 6,
  },
  tour: {
    cost: 60000,
    power: 6,
    rank: 5,
    op: 5,
    chem: 4,
    mech: 4,
    safe: 3,
  },
  overseas: {
    cost: 200000,
    power: 9,
    rank: 7,
    op: 7,
    chem: 7,
    mech: 5,
    safe: 5,
  },
}

export const COMBO_EFFECTS: Record<string, Partial<import('./combos').Modifiers>> = {
  tankFarm: {
    capacity: 0.25,
  },
  freshCut: {
    purity: 10,
  },
  octaneLine: {
    gasolineScore: 15,
  },
  quickLoad: {
    dwell: -0.3,
  },
  watchful: {
    incident: -0.5,
  },
  greenBelt: {
    eco: 10,
    monthlyFame: 10,
  },
  lunch: {
    regen: 0.2,
  },
  smoke: {
    regen: -0.3,
  },
  heavy: {
    yieldPct: 0.2,
  },
  showcase: {
    yearlyFame: 40,
  },
  research: {
    purity: 5,
  },
  cleanLab: {
    eco: 5,
  },
  brightGate: {
    price: 0.1,
  },
  pipeFlow: {
    production: 0.1,
  },
  safeLoad: {
    stability: 5,
  },
  tankCare: {
    stability: 10,
  },
  blendStudy: {
    quality: 0.1,
  },
  octaneCare: {
    purity: 5,
  },
  welcome: {
    price: 0.1,
  },
  restGarden: {
    regen: 0.2,
  },
  flowLine: {
    production: 0.2,
  },
  quietLab: {
    stability: -5,
  },
  nightShift: {
    production: 0.1,
  },
  greenBlend: {
    eco: 10,
  },
  towerLight: {
    price: 0.2,
  },
  greatView: {
    yearlyFame: 40,
  },
  hotScience: {
    yield: 15,
  },
  oilGarden: {
    eco: 15,
  },
  teamSpirit: {
    regen: 0.3,
  },
  perfectMix: {
    quality: 0.25,
  },
}
export const INVESTMENT_BALANCE = {
  highway: { rank: 3, costs: [20000, 100000, 500000, 3000000] },
  port: { rank: 5, costs: [80000, 300000, 1000000, 5000000] },
  industrial: { rank: 7, costs: [50000, 250000, 1000000, 4000000] },
  airport: { rank: 4, costs: [150000, 400000, 1200000, 4500000] },
}
export const CUSTOMER_BALANCE = {
  perGroup: 8,
  starterBuyers: 2,
  lowerGradeBuyers: 4,
  governmentRank: 6,
}
export const ADDITIVE_LEVELS: Record<string, number> = {
  octane: 2,
  antifreeze: 2,
  detergent: 2,
  bio: 2,
  dye: 1,
  fragrance: 3,
  cetane: 3,
  antioxidant: 3,
  lubricity: 2,
  stabilizer: 3,
  corrosion: 2,
  antifoam: 2,
  coldflow: 4,
  cleanburn: 3,
  polymer: 4,
  adhesive: 4,
  recycled: 4,
  premium: 4,
  catalyst: 5,
  nano: 2,
}

export const BASE_RANKS = {
  lpg: 4,
  gasoline: 1,
  jet: 4,
  diesel: 1,
  lube: 6,
  asphalt: 6,
  wax: 7,
  pellet: 7,
}

// Formula Lab (v5 design, docs/v4/FORMULA-LAB.md): two labs replace the blend-time score.
// Catalyst Lab researches graded catalyst stock; Formula Lab mixes a base or a known formula
// with catalysts into a permanent formula; blend stations then produce at that formula's grade.
export const FORMULA_GRADES = ['D', 'C', 'B', 'A', 'S', 'SS'] as const
export const FORMULA_LAB = {
  // Each lab level shortens a job by this share (min half).
  fasterPerLevel: 0.1,
  catalyst: {
    weeks: 2,
    // RD per job: rd + rdPerYear × (year − 1), so RD keeps a use all game.
    rd: 60,
    rdPerYear: 20,
    money: 3000,
    // Units of one catalyst per finished research: unitsBase + unitsPerLevel × (level − 1).
    unitsBase: 4,
    unitsPerLevel: 1,
    // Odds [D, C, B, A, S, SS] by Catalyst Lab level 1–5 (Research Center adds levels).
    weights: [
      [55, 35, 10, 0, 0, 0],
      [30, 40, 25, 5, 0, 0],
      [12, 30, 35, 20, 3, 0],
      [4, 16, 32, 32, 13, 3],
      [0, 8, 24, 36, 23, 9],
    ],
    // Every `chemPerLevel` Chem on the assigned chemists counts as one more lab level (fraction),
    // and each year of experience past the first adds `levelPerYear`.
    chemPerLevel: 200,
    levelPerYear: 0.2,
    // Highest catalyst grade research can return, by game year (index = year − 1, last repeats).
    maxGradeByYear: ['B', 'B', 'A', 'A', 'A', 'S', 'S', 'S', 'SS'] as const,
    // Chance per finished research to reveal one synergy or secret-formula hint.
    hintChance: 0.04,
    // Fame for each finished research, by the catalyst's grade.
    fame: { D: 1, C: 2, B: 4, A: 5, S: 6, SS: 8 },
  },
  mix: {
    weeks: 1,
    money: 2000,
    // Catalyst units used per slot when mixing.
    unitsPerSlot: 2,
    // Catalyst slots per mix, by game year (index = year − 1, last repeats).
    slotsByYear: [1, 1, 2, 2, 2, 3],
    // Most catalysts one formula can hold.
    maxCatalysts: 3,
    // Grade steps added per base × catalyst compatibility (data/compatibility.ts).
    compat: { S: 0.75, A: 0.4, B: 0.15, C: 0, D: -0.4, F: -0.9 },
    synergy: { good: 0.6, bad: -0.8 },
    // Secret formulas: extra grade steps, and how far they lift the cap (0 = SS still needs SS catalysts).
    secretBonus: 1,
    secretCap: 0,
    // Luck: uniform ±spread, shifted up by shiftPerLevel × (Formula Lab level − 1).
    spread: 0.6,
    shiftPerLevel: 0.08,
    // A result may be at most this many steps above the best catalyst used.
    capAboveBest: 0,
    // After this many mixes in a row that do not beat the best input, the next one gets +1.
    pityAfter: 4,
  },
  production: {
    // One catalyst unit of each kind in the formula per this many lots. Lowest grade is used first.
    lotsPerUnit: 6,
    // When a catalyst runs out, lots fall back to plain grade (plainGrade) until restocked.
  },
  // A blend station with no formula makes plain lots of this grade.
  plainGrade: 'C' as const,
  // Award "product" score: lot stats × this factor per grade (mirrors the old pair multipliers).
  gradeScore: { D: 0.85, C: 1, B: 1.1, A: 1.25, S: 1.5, SS: 1.8 },
  // Fame when a mix finds a new formula or improves one, by its grade.
  formulaFame: { D: 0, C: 3, B: 10, A: 20, S: 20, SS: 30 },
  secretPrice: 1.3,
  secretFame: 50,
  // Lowest grade a contract asks for, by game year (index = year − 1, last repeats).
  contractGradeByYear: ['C', 'C', 'B', 'B', 'B', 'A'] as const,
}
