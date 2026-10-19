export const B = {
  startingMoney: 50_000, tickMs: 250, ticksPerWeek: 60, weeksPerMonth: 4, monthsPerYear: 12,
  upkeepRate: .03, logLimit: 50, saveKey: 'refinery-v4-save', defaultSeed: 42,
  speeds: [0, 1, 2, 4] as const,
}
export const MONTH = B.ticksPerWeek * B.weeksPerMonth
export const YEAR = MONTH * B.monthsPerYear
