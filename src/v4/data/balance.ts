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
