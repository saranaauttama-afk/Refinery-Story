import { STAFF_HIRING, TRAINING_BALANCE } from './balance'
export const jobs = [
  { id: 'operator', name: { en: 'Operator', th: 'พนักงานปฏิบัติการ' } },
  { id: 'chemist', name: { en: 'Chemist', th: 'นักเคมี' } },
  { id: 'engineer', name: { en: 'Engineer', th: 'วิศวกร' } },
  { id: 'safety', name: { en: 'Safety Officer', th: 'เจ้าหน้าที่ความปลอดภัย' } },
  { id: 'manager', name: { en: 'Manager', th: 'ผู้จัดการ' } },
  { id: 'director', name: { en: 'Plant Director', th: 'ผู้อำนวยการโรงงาน' } },
] as const
export type JobId = (typeof jobs)[number]['id']
export const hiring = [
  { id: 'word', name: { en: 'Word of mouth', th: 'บอกต่อ' }, ...STAFF_HIRING.word },
  { id: 'board', name: { en: 'Job board', th: 'ประกาศงาน' }, ...STAFF_HIRING.board },
  { id: 'university', name: { en: 'University', th: 'มหาวิทยาลัย' }, ...STAFF_HIRING.university },
  { id: 'fair', name: { en: 'Job Fair', th: 'มหกรรมงาน' }, ...STAFF_HIRING.fair },
  { id: 'headhunter', name: { en: 'Headhunter', th: 'เฮดฮันเตอร์' }, ...STAFF_HIRING.headhunter },
] as const
export const trainings = [
  { id: 'manual', name: { en: 'Read manual', th: 'อ่านคู่มือ' }, ...TRAINING_BALANCE.manual },
  { id: 'walk', name: { en: 'Yard walk', th: 'เดินสำรวจลาน' }, ...TRAINING_BALANCE.walk },
  { id: 'repair', name: { en: 'Hands-on repair', th: 'ฝึกซ่อม' }, ...TRAINING_BALANCE.repair },
  { id: 'lab', name: { en: 'Lab Study', th: 'ศึกษาในแล็บ' }, ...TRAINING_BALANCE.lab },
  { id: 'drill', name: { en: 'Fire drill', th: 'ซ้อมดับเพลิง' }, ...TRAINING_BALANCE.drill },
  { id: 'tour', name: { en: 'Plant tour', th: 'ดูงานโรงงาน' }, ...TRAINING_BALANCE.tour },
  {
    id: 'overseas',
    name: { en: 'Overseas course', th: 'อบรมต่างประเทศ' },
    ...TRAINING_BALANCE.overseas,
  },
] as const
export type TrainingId = (typeof trainings)[number]['id']
export const names = [
  'สมชาย',
  'มาลี',
  'กิตติ',
  'อรุณ',
  'พิมพ์',
  'วิชัย',
  'ปรียา',
  'ธนา',
  'เมธา',
  'น้ำฝน',
  'สุรีย์',
  'นที',
]
