export const B = {
  startingMoney: 50_000, tickMs: 250, ticksPerWeek: 60, weeksPerMonth: 4, monthsPerYear: 12,
  upkeepRate: .03, logLimit: 50, saveKey: 'refinery-v4-save', defaultSeed: 42,
  speeds: [0, 1, 2, 4] as const,
}
export const MONTH = B.ticksPerWeek * B.weeksPerMonth
export const YEAR = MONTH * B.monthsPerYear
export const YARD = { startSize:16, parcel:8, maxSize:40, landCost:20000, moveCost:2000, refund:.5, maxLevel:5, upgradeBase:.6, upgradeGrowth:1.5, outputPerLevel:.25, tileW:32, tileH:16, defaultZoom:2, minZoom:1, maxZoom:4 }
