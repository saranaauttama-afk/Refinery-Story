import { CUSTOMER_BALANCE as C } from './balance'
import type { BaseId } from './bases'
import type { Grade } from '../sim/types'
import type { AdditiveId } from './additives'
export type CustomerGroup = 'gas' | 'air' | 'shipping' | 'industrial' | 'government'
export interface CustomerDef {
  id: string
  name: { en: string; th: string }
  group: CustomerGroup
  base: BaseId
  minGrade: Grade
  gift: { kind: 'additive' | 'blueprint' | 'deco'; id: string }
}
const groups: { id: CustomerGroup; en: string; th: string; bases: BaseId[] }[] = [
  { id: 'gas', en: 'Gas Station', th: 'ปั๊มน้ำมัน', bases: ['gasoline', 'diesel', 'lpg'] },
  { id: 'air', en: 'Airline', th: 'สายการบิน', bases: ['jet'] },
  { id: 'shipping', en: 'Shipping', th: 'บริษัทเดินเรือ', bases: ['diesel', 'lube'] },
  { id: 'industrial', en: 'Industrial Buyer', th: 'โรงงานอุตสาหกรรม', bases: ['pellet', 'wax'] },
  { id: 'government', en: 'Public Works', th: 'หน่วยงานโยธา', bases: ['asphalt'] },
]
export const customers: CustomerDef[] = groups.flatMap(g =>
  Array.from(
    { length: C.perGroup },
    (_, i) =>
      ({
        id: `${g.id}${i}`,
        name: { en: `${g.en} ${i + 1}`, th: `${g.th} ${i + 1}` },
        group: g.id,
        base: g.bases[i % g.bases.length],
        minGrade: i < C.lowerGradeBuyers ? 'C' : 'B',
        gift:
          i % 3 === 0
            ? { kind: 'additive', id: 'dye' as AdditiveId }
            : i % 3 === 1
              ? { kind: 'blueprint', id: 'lab' }
              : { kind: 'deco', id: 'lamp' },
      }) as CustomerDef,
  ),
)
