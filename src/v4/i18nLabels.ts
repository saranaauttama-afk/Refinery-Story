import { buildings } from './data/buildings'
import { bases } from './data/bases'
import { text, type LocalizedText } from './i18n'
export const marketNames: Record<string, LocalizedText> = {
  normal: { en: 'Normal', th: 'ปกติ' },
  boom: { en: 'Boom', th: 'ขาขึ้น' },
  bust: { en: 'Bust', th: 'ขาลง' },
}
export const awardNames: Record<string, LocalizedText> = {
  product: { en: 'Best Product', th: 'ผลิตภัณฑ์ยอดเยี่ยม' },
  safety: { en: 'Safety', th: 'ความปลอดภัย' },
  eco: { en: 'Eco', th: 'รักษ์โลก' },
  refinery: { en: 'Refinery of the Year', th: 'โรงกลั่นแห่งปี' },
}
const extra: Record<string, LocalizedText> = {
  land2: { en: 'Land parcel', th: 'แปลงที่ดิน' },
  land4: { en: 'More land', th: 'ที่ดินเพิ่มเติม' },
  yard40: { en: 'Full yard', th: 'ลานเต็ม 40×40' },
  'training:lab': { en: 'Lab Study', th: 'ฝึกศึกษาในแล็บ' },
  'hire:university': { en: 'University hiring', th: 'สรรหาจากมหาวิทยาลัย' },
  'hire:fair': { en: 'Job Fair', th: 'มหกรรมงาน' },
  'hire:headhunter': { en: 'Headhunter', th: 'เฮดฮันเตอร์' },
  'investment:highway': { en: 'Highway', th: 'ลงทุนทางหลวง' },
  'investment:airport': { en: 'Airport', th: 'ลงทุนสนามบิน' },
  'investment:port': { en: 'Port', th: 'ลงทุนท่าเรือ' },
  'investment:industrial': { en: 'Industrial Park', th: 'ลงทุนนิคมฯ' },
  director: { en: 'Plant Director', th: 'ผู้อำนวยการโรงงาน' },
  ending: { en: 'Special ending', th: 'ตอนจบพิเศษ' },
  mascot: { en: 'Mascot applicant', th: 'มาสคอตสมัครงาน' },
}
export function unlockName(id: string): LocalizedText {
  return (
    buildings.find(b => b.id === id)?.name ??
    bases.find(b => b.id === id)?.name ??
    extra[id] ?? { en: id, th: id }
  )
}
export const awardList = (wins: string[]) => wins.map(w => text(awardNames[w])).join(' · ')
