// Fixed ambient world layout. Coordinates never depend on bought land or rank.
export type ScenicProp = { id: string; x: number; y: number; level: number }
const p = (id: string, x: number, y: number, level = 1): ScenicProp => ({
  id,
  x: Math.round(x * 64) / 64,
  y: Math.round(y * 64) / 64,
  level,
})
export const coastalShoreY = (x: number) => {
  // Beach and quay meet at exactly y=-8 with a level tangent at both joins.
  const smooth = (k: number) => {
    const t = Math.max(0, Math.min(1, k))
    return t * t * (3 - 2 * t)
  }
  if (x < 5) {
    const raw = -9.8 + 1.35 * Math.sin((x + 8) * 0.44) + (x + 8) * 0.06
    return raw + (-8 - raw) * smooth((x - 2) / 3)
  }
  const raw = -9.2 + 0.8 * Math.sin((x - 35) * 0.7)
  return -8 + (raw + 8) * smooth((x - 35) / 3)
}
export const naturalCoast = (x: number, y: number) => (x < 5 || x >= 35) && y < -4
export const onPier = (x: number, y: number) =>
  (((x >= 8 && x < 11) || (x >= 23 && x < 26)) && y >= -11 && y < -4) ||
  (x >= 30 && x < 34 && y >= -10 && y < -8)

export const environmentProps: ScenicProp[] = [
  // Natural headland, beach and a working port along the north edge.
  p('envHill', -8, -7),
  p('envCliff', -4.8, -7.2),
  p('envCliffCorner', 0, -6.7),
  p('envShoreRocks', -7, -9.3),
  p('envShoreRocks', -2.7, -8.4),
  p('envPalm', -6, -7.8),
  p('envPalm', 2.5, -6),
  p('envCanopy', 1, -8.2),
  p('envPalm', 3.6, -7.8),
  p('envShrub', -2.5, -6.1),
  p('envBench', 1.3, -5.1),
  p('envShrub', 0.2, -5),
  p('envDistrictSign', -7.5, -5),
  p('envFoodCart', -4.3, -6),
  p('warehouse', 5, -6),
  p('crane', 8.5, -9),
  p('envBollards', 8.5, -10.8),
  p('envFenders', 13, -8.5),
  p('envLoadingArm', 23.5, -10),
  p('warehouse', 13, -6),
  p('envContainerStack', 17, -7),
  p('envCargo', 19.3, -6),
  p('envContainerStack', 26, -7),
  p('envCargo', 28.3, -6),
  p('envLighthouse', 31, -10),
  p('envBollards', 30.2, -9),
  p('envWindsock', 20, -5),
  p('envWindsock', 29.5, -5),
  p('envPalm', 35.4, -6.2),
  p('envShoreRocks', 37, -8.7),
  p('envHill', 36.5, -6.1),
  ...[10.6, 21, 33].map(x => p('lamp', x, -5)),
  // West-side community; the public road and every possible gate approach stay clear.
  p('envLunchShop', -7.5, 0),
  p('envPlanter', -7.5, 2.3),
  p('envBikes', -5.3, 1.3),
  p('envParking', -7.8, 4),
  p('envBusStop', -5.2, 6.5),
  p('envBins', -7.5, 6.5),
  p('envCornerShop', -7.5, 9),
  p('envFoodCart', -5.2, 10.6),
  p('envPalm', -7.6, 11.4),
  p('envApartment', -7.5, 13),
  p('envPlanter', -7.6, 15.3),
  p('envBench', -5, 15),
  p('envWorkshop', -7.5, 17.2),
  p('envSwitchbox', -5.2, 18.5),
  p('house', -7.5, 22),
  p('envCanopy', -7.7, 24),
  ...[3, 8, 12, 16, 21].map(y => p('lamp', -4.7, y)),
  // East-side green belt: low rock shelves, varied foliage and a drainage channel.
  p('envCliff', 37, 1.5),
  p('envHill', 36.8, 5),
  p('envCliffCorner', 38, 10),
  p('envCliff', 37, 14),
  p('envCliffCorner', 38, 20),
  p('utility', 37, 23),
  ...[0, 4, 8, 12, 17, 22, 27.5].map((y, i) => p(i % 2 ? 'envCanopy' : 'envPalm', 36, y)),
  ...[3, 7, 11, 16, 21, 27.5, 29].map(y => p('envShrub', 37.7, y)),
  ...[2, 9, 16, 23].map(y => p('lamp', 35.6, y)),
  // Southern arrival plaza and a small community park below the ring road.
  p('envParking', 0.5, 28),
  p('envSecurity', 4, 28),
  p('envDistrictSign', 20.5, 28),
  p('envMedian', 24.3, 28),
  p('envBusStop', 30, 28),
  p('envBins', 32, 29.2),
  p('envFountain', 6, 29),
  p('envBench', 8.3, 30),
  p('envPavilion', 14, 29),
  p('envPicnic', 16.3, 30),
  p('envFoodCart', 18, 29.2),
  p('envBikes', 28.5, 29.4),
  ...[0, 4, 9, 12, 19, 25, 28, 35.5, 37].map((x, i) => p(i % 2 ? 'envPalm' : 'envCanopy', x, 31)),
  ...[3.5, 12.5, 19, 26.5, 35.1].map(x => p('envPlanter', x, 28)),
]

type Patch = { x: number; y: number; w: number; h: number; color: string }
export const sceneryPatches: Patch[] = [
  { x: -8, y: -5, w: 4, h: 1, color: '#D8C7A1' },
  { x: -5, y: -4, w: 1, h: 1, color: '#D8C7A1' },
  { x: -5, y: -1, w: 1, h: 26, color: '#D8C7A1' },
  ...[0, 4, 9, 13, 17, 22].map(y => ({ x: -8, y, w: 3, h: 2, color: '#D8C7A1' })),
  { x: 0, y: 28, w: 33, h: 1, color: '#D8C7A1' },
  { x: 35, y: 28, w: 5, h: 1, color: '#D8C7A1' },
  { x: 5, y: 29, w: 5, h: 3, color: '#D8C7A1' },
  { x: 13, y: 29, w: 7, h: 2, color: '#D8C7A1' },
]
export const crossingTiles = [
  { x: -3, y: 7 },
  { x: 28, y: -3 },
  { x: 5, y: 25 },
]
export const neighbourhoodWalks = [
  { job: 'operator', x: 11, y: -4.25, dx: 9, dy: 0, period: 25 },
  { job: 'manager', x: -4.5, y: 1, dx: 0, dy: 9, period: 38 },
  { job: 'engineer', x: 5.4, y: 31.6, dx: 3.2, dy: 0, period: 20 },
  { job: 'operator', x: 25.5, y: -4.3, dx: 3.2, dy: 0, period: 17 },
]
export function neighbourhoodPeople(t: number) {
  return neighbourhoodWalks.map((route, i) => {
    const f = ((t + i * 7) % route.period) / route.period,
      k = f < 0.5 ? f * 2 : 2 - f * 2
    const dir = route.dx ? (f < 0.5 ? 'e' : 'w') : f < 0.5 ? 's' : 'n'
    return {
      x: route.x + route.dx * k,
      y: route.y + route.dy * k,
      sprite: `${route.job}_${dir}${Math.floor(t * 4) % 2}`,
    }
  })
}
