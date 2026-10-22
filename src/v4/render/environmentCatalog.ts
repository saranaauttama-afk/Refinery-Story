// Ambient scenery only. These are never purchasable yard buildings.
const prop = (id: string, w: number, h: number, artWidth = w * 64, level = 1) => ({
  id,
  w,
  h,
  artWidth,
  level,
})
export const environmentSheets = {
  nature: [
    prop('envPalm', 1, 1, 48),
    prop('envCanopy', 2, 1),
    prop('envShrub', 2, 1),
    prop('envCliff', 3, 1),
    prop('envCliffCorner', 2, 2),
    prop('envShoreRocks', 2, 1),
    prop('envHill', 3, 2),
    prop('envBench', 1, 1, 44),
    prop('envPlanter', 2, 1),
  ],
  town: [
    prop('envLunchShop', 2, 2),
    prop('envCornerShop', 2, 2),
    prop('envApartment', 2, 2),
    prop('envWorkshop', 2, 2),
    prop('envPavilion', 2, 2),
    prop('envFoodCart', 1, 1, 48),
    prop('envBusStop', 2, 1),
    prop('envFountain', 2, 2),
    prop('envSecurity', 1, 1),
  ],
  port: [
    prop('envLoadingArm', 2, 2),
    prop('envBollards', 1, 1, 48),
    prop('envFenders', 2, 1),
    prop('envContainerStack', 2, 2),
    prop('envCargo', 1, 1, 56),
    prop('envLighthouse', 2, 2, 100),
    prop('envWindsock', 1, 1, 32, 1),
    prop('envWindsock', 1, 1, 32, 2),
    prop('envWindsock', 1, 1, 32, 3),
  ],
  street: [
    prop('envDistrictSign', 3, 1),
    prop('envParking', 3, 2),
    prop('envMedian', 2, 1),
    prop('envSwitchbox', 1, 1, 40),
    prop('envCulvert', 2, 1),
    prop('envPicnic', 1, 1, 52),
    prop('envBins', 1, 1, 40),
    prop('envBikes', 1, 1, 52),
    prop('envFootbridge', 2, 1),
  ],
}
export const environmentSizes: Record<string, { w: number; h: number }> = Object.fromEntries(
  Object.values(environmentSheets)
    .flat()
    .map(d => [d.id, { w: d.w, h: d.h }]),
)
