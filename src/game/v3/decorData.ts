import type { BilingualTextValue } from '../types'

/**
 * Player decorations (decoration track, step 2). Pure data: no imports from
 * yard/rules so the yard occupancy can read footprints without a cycle.
 * Prices are cheap on purpose; appeal is a small, capped fame-gain bonus.
 */
export type V3DecorKind =
  | 'road' | 'sidewalk' | 'tree' | 'streetLamp' | 'fence'
  | 'shrub' | 'bench' | 'trashBin' | 'flowerBed'
  | 'busStop' | 'parkingLot' | 'companySign'
  | 'fountain' | 'flagPole'
  | 'awardStatue'

export type V3DecorSpec = {
  label: BilingualTextValue
  w: number
  h: number
  costDollars: number
  /** Appeal of the first item of this kind; repeats give less (see decor.ts). */
  appeal: number
  chapter: 0 | 1 | 2 | 3 | 4
  /** Extra unlock beyond the chapter. */
  requires: 'expoWin' | null
}

export const V3_DECOR: Record<V3DecorKind, V3DecorSpec> = {
  road: { label: { en: 'Road', th: 'ถนน' }, w: 1, h: 1, costDollars: 10, appeal: 0.2, chapter: 0, requires: null },
  sidewalk: { label: { en: 'Sidewalk', th: 'ทางเท้า' }, w: 1, h: 1, costDollars: 10, appeal: 0.5, chapter: 0, requires: null },
  tree: { label: { en: 'Tree', th: 'ต้นไม้' }, w: 1, h: 1, costDollars: 30, appeal: 2, chapter: 0, requires: null },
  streetLamp: { label: { en: 'Street lamp', th: 'เสาไฟ' }, w: 1, h: 1, costDollars: 25, appeal: 1, chapter: 0, requires: null },
  fence: { label: { en: 'Fence', th: 'รั้ว' }, w: 1, h: 1, costDollars: 10, appeal: 0.5, chapter: 0, requires: null },
  shrub: { label: { en: 'Shrub', th: 'พุ่มไม้' }, w: 1, h: 1, costDollars: 20, appeal: 1.5, chapter: 1, requires: null },
  bench: { label: { en: 'Bench', th: 'ม้านั่ง' }, w: 1, h: 1, costDollars: 40, appeal: 2, chapter: 1, requires: null },
  trashBin: { label: { en: 'Trash bin', th: 'ถังขยะ' }, w: 1, h: 1, costDollars: 15, appeal: 1, chapter: 1, requires: null },
  flowerBed: { label: { en: 'Flower bed', th: 'แปลงดอกไม้' }, w: 1, h: 1, costDollars: 50, appeal: 3, chapter: 1, requires: null },
  busStop: { label: { en: 'Bus stop', th: 'ป้ายรถเมล์' }, w: 2, h: 1, costDollars: 150, appeal: 5, chapter: 2, requires: null },
  parkingLot: { label: { en: 'Parking lot', th: 'ลานจอดรถ' }, w: 2, h: 2, costDollars: 200, appeal: 4, chapter: 2, requires: null },
  companySign: { label: { en: 'Company sign', th: 'ป้ายชื่อบริษัท' }, w: 2, h: 1, costDollars: 250, appeal: 6, chapter: 2, requires: null },
  fountain: { label: { en: 'Fountain', th: 'น้ำพุ' }, w: 2, h: 2, costDollars: 600, appeal: 8, chapter: 3, requires: null },
  flagPole: { label: { en: 'Flag pole', th: 'เสาธง' }, w: 1, h: 1, costDollars: 120, appeal: 4, chapter: 3, requires: null },
  awardStatue: { label: { en: 'Award statue', th: 'รูปปั้นรางวัล' }, w: 1, h: 1, costDollars: 800, appeal: 10, chapter: 4, requires: 'expoWin' },
}

export const V3_DECOR_KINDS = Object.keys(V3_DECOR) as V3DecorKind[]

/** Hard cap on placed decorations (performance on phones). */
export const V3_DECOR_CAP = 150
/** Each extra item of the same kind is worth this fraction of the previous one. */
export const V3_DECOR_REPEAT_FACTOR = 0.85
/** Fame-gain bonus ceiling and the appeal scale that approaches it. */
export const V3_APPEAL_MAX_BONUS = 0.1
export const V3_APPEAL_SCALE = 60

export type V3Decoration = { id: string; kind: V3DecorKind; x: number; y: number; rotated: boolean }

/** Footprint in tiles; 2×1 pieces can be rotated to 1×2. */
export function getV3DecorFootprint(kind: V3DecorKind, rotated: boolean): { w: number; h: number } {
  const spec = V3_DECOR[kind]
  return rotated ? { w: spec.h, h: spec.w } : { w: spec.w, h: spec.h }
}

export function getV3DecorCells(kind: V3DecorKind, rotated: boolean, x: number, y: number): Array<{ x: number; y: number }> {
  const { w, h } = getV3DecorFootprint(kind, rotated)
  const cells: Array<{ x: number; y: number }> = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push({ x: x + dx, y: y + dy })
  return cells
}

/** Placeholder map colours until real art lands (flat diamonds on the ground). */
export const V3_DECOR_PLACEHOLDER_COLOR: Record<V3DecorKind, string> = {
  road: '#8E877B', sidewalk: '#C9C1B1', tree: '#2F6B3A', streetLamp: '#E8D36A', fence: '#8A6A48',
  shrub: '#4E8B45', bench: '#9C6B3E', trashBin: '#5B6770', flowerBed: '#D66A8A',
  busStop: '#3F7FB5', parkingLot: '#6E6E6E', companySign: '#E0A83B',
  fountain: '#5BB6D9', flagPole: '#D9534F', awardStatue: '#E6C229',
}
