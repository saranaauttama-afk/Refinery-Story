import { SALES, PRODUCTION as P } from '../../data/balance'
import { blendStations, recipeOf, tankCapacity, tankUnits } from './blending'
import { bases } from '../../data/bases'
import type { GameState } from '../types'

/** Optional nudges shown on the yard. They only point at a sheet; nothing is forced. */
export interface Alert {
  id: string
  tab: 'blend' | 'customers' | 'staff'
  en: string
  th: string
}

export function yardAlerts(s: GameState): Alert[] {
  if (!s.opened) return []
  const out: Alert[] = []
  const cap = tankCapacity(s)
  if (cap > 0 && tankUnits(s) >= cap * SALES.clearanceFill)
    out.push({
      id: 'tanks',
      tab: 'blend',
      en: 'Product tanks nearly full: build a tank',
      th: 'ถังผลิตภัณฑ์ใกล้เต็ม สร้างถังเพิ่มได้',
    })
  blendStations(s).forEach((b, i) => {
    const r = recipeOf(s, b),
      base = bases.find(x => x.id === r.base)!
    // Only when nothing in the yard can refine this base, so the station will never run.
    const noUnit = !s.yard.buildings.some(x => x.defId === base.unit)
    if (s.baseStock[r.base] < P.lotUnits && noUnit)
      out.push({
        id: `idle:${b.uid}:${r.base}`,
        tab: 'blend',
        en: `Station ${i + 1}: nothing refines this base, try another recipe`,
        th: `สถานี ${i + 1} ไม่มีหน่วยผลิตน้ำมันฐานนี้ ลองเปลี่ยนสูตร`,
      })
  })
  const offers = s.contracts.offers
  if (offers.length && s.contracts.active.length < SALES.maxContracts)
    out.push({
      id: `offers:${offers.map(o => o.uid).join(',')}`,
      tab: 'customers',
      en: `${offers.length} contract offer${offers.length > 1 ? 's' : ''} this month`,
      th: `มีข้อเสนอสัญญา ${offers.length} รายการ`,
    })
  const idle = s.staff.filter(p => !p.assignedTo).length
  if (idle)
    out.push({
      id: `idle-staff:${idle}`,
      tab: 'staff',
      en: `${idle} staff without a post`,
      th: `พนักงานยังไม่มีตำแหน่ง ${idle} คน`,
    })
  return out
}
