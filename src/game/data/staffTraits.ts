import type { BilingualTextValue, StaffTraitKey } from '../types'
import { bilingual } from '../translations'

// Staff personality traits. The mechanical effect is a small additive bonus to
// the worker's contribution (getEmployeeMultiplier), but the real point is
// CHARACTER -- every hire is a little person with a quirk, not "operator Lv5".
// Each new hire rolls one (weighted); star-tier recruits get a top trait.
//
// Weights/bonuses are tuned so the expected bonus across a random hire (~+0.03)
// stays close to the old veteran-only model (~+0.01), so this barely moves
// economy balance (verified via npm run sim:check) while adding flavour.
// StaffTraitKey lives in types.ts (Employee.trait references it).
export type StaffTrait = {
  key: StaffTraitKey
  badge: string
  name: BilingualTextValue
  flavor: BilingualTextValue
  productivityBonus: number // added to getWorkerLevelMultiplier in getEmployeeMultiplier
  weight: number // relative chance on a normal hire
}

export const STAFF_TRAITS: StaffTrait[] = [
  {
    key: 'greenhorn',
    badge: '🌱',
    name: bilingual('Greenhorn', 'มือใหม่'),
    flavor: bilingual('Still learning the ropes — but eager.', 'ยังเรียนรู้งานอยู่ แต่กระตือรือร้น'),
    productivityBonus: -0.05,
    weight: 22,
  },
  {
    key: 'steady',
    badge: '🔧',
    name: bilingual('Steady Hand', 'มือมั่นคง'),
    flavor: bilingual('Shows up, does the job, never complains.', 'มาตรงเวลา ทำงานเรียบร้อย ไม่บ่น'),
    productivityBonus: 0.03,
    weight: 24,
  },
  {
    key: 'easygoing',
    badge: '😎',
    name: bilingual('Easygoing', 'ชิลล์'),
    flavor: bilingual('Keeps the breakroom laughing.', 'ทำให้ห้องพักมีเสียงหัวเราะ'),
    productivityBonus: 0,
    weight: 16,
  },
  {
    key: 'diligent',
    badge: '📋',
    name: bilingual('Diligent', 'ขยัน'),
    flavor: bilingual('First one in, last one out.', 'มาคนแรก กลับคนสุดท้าย'),
    productivityBonus: 0.08,
    weight: 14,
  },
  {
    key: 'bythebook',
    badge: '✅',
    name: bilingual('By-the-book', 'ทำตามคู่มือ'),
    flavor: bilingual('Runs every safety checklist twice.', 'เช็กลิสต์ความปลอดภัยซ้ำสองรอบ'),
    productivityBonus: 0,
    weight: 9,
  },
  {
    key: 'meticulous',
    badge: '🔬',
    name: bilingual('Meticulous', 'ละเอียด'),
    flavor: bilingual('Triple-checks every gauge.', 'ตรวจเกจทุกตัวสามรอบ'),
    productivityBonus: 0.1,
    weight: 7,
  },
  {
    key: 'prodigy',
    badge: '✨',
    name: bilingual('Prodigy', 'หัวกะทิ'),
    flavor: bilingual('A natural — picks it up fast.', 'มีพรสวรรค์ เรียนรู้ไว'),
    productivityBonus: 0.15,
    weight: 5,
  },
  {
    key: 'veteran',
    badge: '⭐',
    name: bilingual('Veteran', 'รุ่นเก๋า'),
    flavor: bilingual('Seen every kind of shift. Unflappable.', 'ผ่านงานมาทุกแบบ นิ่งสุดๆ'),
    productivityBonus: 0.2,
    weight: 3,
  },
]

const TRAIT_BY_KEY: Record<string, StaffTrait> = Object.fromEntries(STAFF_TRAITS.map((t) => [t.key, t]))
const TOTAL_WEIGHT = STAFF_TRAITS.reduce((sum, t) => sum + t.weight, 0)

export function getStaffTrait(key?: string): StaffTrait | undefined {
  return key ? TRAIT_BY_KEY[key] : undefined
}

// Weighted random trait for a normal hire.
export function rollStaffTrait(): StaffTraitKey {
  let r = Math.random() * TOTAL_WEIGHT
  for (const t of STAFF_TRAITS) {
    r -= t.weight
    if (r < 0) return t.key
  }
  return 'steady'
}

// Star-tier recruits earn a standout personality (no duds).
export function rollStarTrait(): StaffTraitKey {
  return Math.random() < 0.5 ? 'veteran' : 'prodigy'
}
