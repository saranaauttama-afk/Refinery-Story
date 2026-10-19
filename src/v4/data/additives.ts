import { ADDITIVE_LEVELS } from './balance'
// Content defaults beyond the examples in GDD §3; rules are exercised by staff checks.
const rows = [
  ['octane', 'Octane Booster', 'เพิ่มออกเทน', 'chemist', 'lab'],
  ['antifreeze', 'Anti-freeze', 'สารกันเยือกแข็ง', 'chemist', 'manual'],
  ['detergent', 'Detergent', 'สารชะล้าง', 'operator', 'manual'],
  ['bio', 'Bio-blend', 'ไบโอเบลนด์', 'safety', 'walk'],
  ['dye', 'Dye', 'สีย้อม', 'chemist', 'manual'],
  ['fragrance', 'Fragrance', 'สารแต่งกลิ่น', 'chemist', 'lab'],
  ['cetane', 'Cetane', 'เพิ่มซีเทน', 'operator', 'walk'],
  ['antioxidant', 'Antioxidant', 'สารต้านออกซิเดชัน', 'chemist', 'manual'],
  ['lubricity', 'Lubricity', 'สารหล่อลื่น', 'engineer', 'repair'],
  ['stabilizer', 'Stabilizer', 'สารคงสภาพ', 'engineer', 'repair'],
  ['corrosion', 'Corrosion Guard', 'สารกันสนิม', 'engineer', 'manual'],
  ['antifoam', 'Anti-foam', 'สารลดฟอง', 'operator', 'repair'],
  ['coldflow', 'Cold Flow', 'สารช่วยไหล', 'engineer', 'tour'],
  ['cleanburn', 'Clean Burn', 'สารเผาไหม้สะอาด', 'safety', 'drill'],
  ['polymer', 'Polymer', 'พอลิเมอร์', 'chemist', 'tour'],
  ['adhesive', 'Adhesive', 'สารยึดเกาะ', 'operator', 'tour'],
  ['recycled', 'Recycled Blend', 'ส่วนผสมรีไซเคิล', 'safety', 'tour'],
  ['premium', 'Premium Package', 'แพ็กเกจพรีเมียม', 'manager', 'overseas'],
  ['catalyst', 'Catalyst', 'ตัวเร่ง', 'chemist', 'overseas'],
  ['nano', 'Nano Blend', 'นาโนเบลนด์', 'director', 'overseas'],
] as const
export const additives = rows.map(([id, en, th, job, training]) => ({
  id,
  name: { en, th },
  job,
  level: ADDITIVE_LEVELS[id],
  training,
}))
export type AdditiveId = (typeof rows)[number][0]
