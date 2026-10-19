export const B = {
  startingMoney: 50_000, tickMs: 250, ticksPerWeek: 60, weeksPerMonth: 4, monthsPerYear: 12,
  upkeepRate: .03, logLimit: 50, saveKey: 'refinery-v4-save', defaultSeed: 42,
  speeds: [0, 1, 2, 4] as const,
}
export const MONTH = B.ticksPerWeek * B.weeksPerMonth
export const YEAR = MONTH * B.monthsPerYear
export const YARD = { startSize:16, parcel:8, maxSize:40, landCost:20000, moveCost:2000, refund:.5, maxLevel:5, upgradeBase:.6, upgradeGrowth:1.5, outputPerLevel:.25, tileW:32, tileH:16, defaultZoom:2, minZoom:1, maxZoom:4 }
export const PRODUCTION = { cycle:60, crudeInterval:60, crudeDelivery:1200, crudeCapacity:2400, crudeUnitPrice:1, creditLimit:5000, cutCapacity:6000, tankCapacity:1200, lotUnits:300, baseStat:30, familiarityLots:5, familiarityMax:10, familiarityBonus:.03, firstTryFame:10, popupTicks:4, crudeQuality:{light:1,heavy:.9,shale:.95} }
export const PAIR = { S:1.5,A:1.25,B:1.1,C:1,D:.85,F:.6 }
export const GRADES = [ {id:'SS',min:400,price:2.5,fame:10}, {id:'S',min:300,price:1.8,fame:5}, {id:'A',min:200,price:1.3,fame:2}, {id:'B',min:120,price:1,fame:1}, {id:'C',min:0,price:.8,fame:0} ] as const
export const SALES = { arrivalTicks:60, roadTicks:2, dwellTicks:4, units:300, giftHearts:10, rdUnits:10, offers:2, maxContracts:3, deadlineWeeks:6, reward:1.5, contractFame:15, failedFame:10, maxTrucks:10 }
export const COMBO = { distance:2, fame:20, hintCost:500, auraPower:10, aura:[[.1,.125,.25,.125,.1],[.125,.5,1,.5,.125],[.25,1,0,1,.25],[.125,.5,1,.5,.125],[.1,.125,.25,.125,.1]] }
export const STAFF = { capStart:3,capMax:12,levelMax:5,levelRD:20,salaryGrowth:1.2,superChance:.05,superGain:3,diminish:12,manualCost:200000,workDrain:1,restGain:4,restWithoutCanteen:1,powerMin:8,powerMax:30,candidates:3,statMin:6,statSpread:20,salaryMin:1000,salaryRange:7000 }
