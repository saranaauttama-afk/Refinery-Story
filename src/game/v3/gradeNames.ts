import type { V3GameState, V3ProductFamily } from './types'

/**
 * Real-world-style grade names by product and quality, so players read
 * "Premium 95" or "Synthetic 5W-30" instead of "Q55". Quality still decides
 * everything; the name is presentation only (players may rename recipes).
 */
const GRADES: Record<V3ProductFamily, Array<[number, string]>> = {
  gasoline: [
    [35, 'Gasohol 91 Eco'], [40, 'Gasohol 91'], [45, 'Gasohol 95 Eco'], [50, 'Gasohol 95'],
    [55, 'Premium 95'], [60, 'Premium 97'], [65, 'Super 97'], [70, 'Super 98'], [75, 'Racing 100'], [80, 'Racing 102'],
  ],
  lubricants: [
    [35, 'Mineral 20W-50'], [40, 'Mineral 15W-40'], [45, 'Semi-Synthetic 15W-40'], [50, 'Semi-Synthetic 10W-40'],
    [55, 'Synthetic 10W-30'], [60, 'Synthetic 5W-40'], [65, 'Full Synthetic 5W-30'], [70, 'Full Synthetic 5W-20'],
    [75, 'Full Synthetic 0W-20'], [80, 'Racing 0W-16'],
  ],
  jetFuel: [
    [35, 'Jet B'], [40, 'Jet B+'], [45, 'Jet A'], [50, 'Jet A'], [55, 'Jet A-1'], [60, 'Jet A-1'],
    [65, 'Jet A-1 Plus'], [70, 'JP-8'], [75, 'JP-8+100'], [80, 'JP-5 Naval'],
  ],
  petrochemicals: [
    [35, 'Mixed Aromatics'], [40, 'Crude Benzene'], [45, 'Benzene'], [50, 'Toluene'], [55, 'Mixed Xylenes'],
    [60, 'Ortho-Xylene'], [65, 'Para-Xylene'], [70, 'Para-Xylene 99.5%'], [75, 'Para-Xylene 99.8%'], [80, 'Ultra-Pure Aromatics'],
  ],
  plasticPellets: [
    [35, 'Recycled-grade PE'], [40, 'Commodity PE'], [45, 'LDPE Film'], [50, 'HDPE General'], [55, 'HDPE Pipe'],
    [60, 'LLDPE Stretch'], [65, 'PP Injection'], [70, 'PP Automotive'], [75, 'Medical PP'], [80, 'Optical PC'],
  ],
}

export function getV3GradeName(family: V3ProductFamily, quality: number): string {
  const table = GRADES[family]
  let name = table[0][1]
  for (const [threshold, label] of table) if (quality >= threshold) name = label
  return name
}

const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X']

/** Grade name made unique within the family by a Roman numeral ("Premium 95 II"). */
export function getV3UniqueGradeName(state: V3GameState, family: V3ProductFamily, quality: number): string {
  const base = getV3GradeName(family, quality)
  const taken = new Set(Object.values(state.productBlueprints).filter((blueprint) => blueprint.family === family).map((blueprint) => blueprint.name))
  for (const suffix of ROMAN) if (!taken.has(`${base}${suffix}`)) return `${base}${suffix}`
  return `${base} ${taken.size + 1}`
}
