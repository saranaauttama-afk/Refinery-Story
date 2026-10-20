import { SALES, PRODUCTION as P } from '../../data/balance'
import { blendStations, recipeOf, tankCapacity, tankUnits } from './blending'
import { bases } from '../../data/bases'
import { labs, labJob } from './research'
import { trending } from './market'
import { wears, repairing, conditionOf } from './plant'
import { WEAR } from '../../data/balance'
import type { GameState } from '../types'

/** Optional nudges shown on the yard. They only point at a sheet; nothing is forced. */
export interface Alert {
  id: string
  tab: 'blend' | 'customers' | 'staff' | 'lab' | 'building'
  /** Building to open for tab 'lab' (or a blend station for tab 'blend'). */
  target?: string
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
        target: b.uid,
        en: `Station ${i + 1}: nothing refines this base, try another recipe`,
        th: `สถานี ${i + 1} ไม่มีหน่วยผลิตน้ำมันฐานนี้ ลองเปลี่ยนสูตร`,
      })
  })
  const worn = s.yard.buildings.filter(
    b => wears(b) && !repairing(s, b) && conditionOf(b) < WEAR.worn,
  )
  if (worn.length)
    out.push({
      id: `worn:${worn.map(b => b.uid).join(',')}`,
      tab: 'building',
      target: [...worn].sort((a, b) => conditionOf(a) - conditionOf(b))[0].uid,
      en: `${worn.length} plant${worn.length > 1 ? 's' : ''} worn down: overhaul to restore output`,
      th: `เครื่องเสื่อม ${worn.length} ตัว ซ่อมใหญ่เพื่อให้ผลิตเต็มที่`,
    })
  const idleLabs = labs(s).filter(l => !labJob(s, l.uid))
  if (idleLabs.length && s.unlockedAdditives.length)
    out.push({
      id: `lab:${idleLabs.map(l => l.uid).join(',')}:${s.knownRecipes.length}`,
      tab: 'lab',
      target: idleLabs[0].uid,
      en:
        idleLabs.length > 1
          ? `${idleLabs.length} labs idle: start researching recipes`
          : 'Lab is idle: start researching a recipe',
      th:
        idleLabs.length > 1
          ? `ห้องทดลองว่าง ${idleLabs.length} ห้อง เริ่มวิจัยสูตรใหม่ได้`
          : 'ห้องทดลองว่าง เริ่มวิจัยสูตรใหม่ได้',
    })
  if (s.trend.base && trending(s, s.trend.base)) {
    const name = bases.find(b => b.id === s.trend.base)!.name
    out.push({
      id: `trend:${s.trend.until}`,
      tab: 'blend',
      en: `Trend: ${name.en} sells ×1.5 this month`,
      th: `กระแส: ${name.th} ราคา ×1.5 เดือนนี้`,
    })
  }
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
