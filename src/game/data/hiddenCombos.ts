import type { BilingualTextValue, BuildingType } from '../types'
import { bilingual } from '../translations'

// Hidden, discoverable "combos" — one-time bonuses for arranging specific
// sets of 3 distinct buildings in any 3 consecutive cells of a row or column
// (order-independent). Deliberately NOT shown anywhere in the UI ahead of
// time; the player has to experiment with layout to find them. Each is
// awarded once per save (tracked in GameState.discoveredCombos).
export type HiddenComboConfig = {
  key: string
  name: BilingualTextValue
  message: BilingualTextValue
  buildings: BuildingType[]
  cashReward: number
  rpReward: number
  reputationReward?: number
}

export const HIDDEN_COMBOS: HiddenComboConfig[] = [
  {
    key: 'fullRefineryLine',
    name: bilingual('Full Refinery Line', 'แนวโรงกลั่นครบสาย'),
    message: bilingual(
      'Crude Tank, Distillation Unit, and Product Tank lined up — a complete mini refinery!',
      'ถังน้ำมันดิบ หน่วยกลั่น และถังสินค้าเรียงกัน — โรงกลั่นจิ๋วครบสาย!',
    ),
    buildings: ['crudeTank', 'distillationUnit', 'productTank'],
    cashReward: 300,
    rpReward: 5,
  },
  {
    key: 'commandCenter',
    name: bilingual('Command Center', 'ศูนย์บัญชาการ'),
    message: bilingual(
      'Laboratory, Maintenance Workshop, and Sales Office side by side — a real command center.',
      'ห้องแล็บ โรงซ่อมบำรุง และสำนักงานขายเรียงติดกัน — ศูนย์บัญชาการตัวจริง',
    ),
    buildings: ['laboratory', 'maintenanceWorkshop', 'salesOffice'],
    cashReward: 500,
    rpReward: 8,
  },
  {
    key: 'jetSetRow',
    name: bilingual('Jet Set Row', 'แถวเชื้อเพลิงอากาศยาน'),
    message: bilingual(
      'Distillation Unit, Jet Fuel Plant, and Sales Office in a row — ready for takeoff.',
      'หน่วยกลั่น โรงผลิตเชื้อเพลิงอากาศยาน และสำนักงานขายเรียงกัน — พร้อมบินขึ้น',
    ),
    buildings: ['distillationUnit', 'jetFuelPlant', 'salesOffice'],
    cashReward: 800,
    rpReward: 12,
  },
  {
    key: 'refiningTriangle',
    name: bilingual('Refining Triangle', 'สามเหลี่ยมการกลั่น'),
    message: bilingual(
      'Distillation Unit, Lubricant Plant, and Petrochemical Plant aligned — the feedstock chain in miniature.',
      'หน่วยกลั่น โรงผลิตสารหล่อลื่น และโรงผลิตปิโตรเคมีเรียงกัน — สายโซ่วัตถุดิบกลั่นฉบับย่อ',
    ),
    buildings: ['distillationUnit', 'lubricantPlant', 'petrochemicalPlant'],
    cashReward: 1200,
    rpReward: 15,
  },
  {
    key: 'petrochemicalComplex',
    name: bilingual('Petrochemical Complex', 'นิคมปิโตรเคมี'),
    message: bilingual(
      'Lubricant Plant, Jet Fuel Plant, and Petrochemical Plant together — a full advanced-products complex.',
      'โรงผลิตสารหล่อลื่น เชื้อเพลิงอากาศยาน และปิโตรเคมีอยู่ด้วยกัน — นิคมผลิตภัณฑ์ขั้นสูงเต็มรูปแบบ',
    ),
    buildings: ['lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant'],
    cashReward: 2000,
    rpReward: 25,
    reputationReward: 10,
  },
  {
    key: 'tankFarm',
    name: bilingual('Tank Farm', 'ลานถังเก็บ'),
    message: bilingual(
      'Crude Tank, Jet Fuel Tank, and Petrochemical Tank side by side — a proper tank farm. Logistics love it.',
      'ถังน้ำมันดิบ ถังเชื้อเพลิงอากาศยาน และถังปิโตรเคมีเรียงกัน — ลานถังเก็บเต็มรูปแบบ ฝ่ายโลจิสติกส์ปลื้ม',
    ),
    buildings: ['crudeTank', 'jetFuelTank', 'petrochemicalTank'],
    cashReward: 700,
    rpReward: 10,
  },
  {
    key: 'poweredLine',
    name: bilingual('Powered Line', 'สายพานติดไฟ'),
    message: bilingual(
      'Power Plant, Distillation Unit, and Maintenance Workshop in a row — the line runs itself.',
      'โรงไฟฟ้า หน่วยกลั่น และโรงซ่อมบำรุงเรียงกัน — สายการผลิตเดินเองได้',
    ),
    buildings: ['powerPlant', 'distillationUnit', 'maintenanceWorkshop'],
    cashReward: 1000,
    rpReward: 12,
  },
  {
    key: 'greenLoop',
    name: bilingual('Green Loop', 'วงจรสีเขียว'),
    message: bilingual(
      'Waste Treatment, Recycling Bunker, and Pellet Silo closing the loop — nothing wasted. Regulators approve.',
      'บำบัดของเสีย บังเกอร์รีไซเคิล และไซโลเม็ดพลาสติกครบวงจร — ไม่มีอะไรสูญเปล่า หน่วยงานกำกับชื่นชม',
    ),
    buildings: ['wasteTreatmentPlant', 'recyclingBunker', 'pelletSilo'],
    cashReward: 1500,
    rpReward: 18,
    reputationReward: 12,
  },
  {
    key: 'polymerLine',
    name: bilingual('Polymer Line', 'สายพอลิเมอร์'),
    message: bilingual(
      'Petrochemical Plant, Polymer Plant, and Pellet Silo aligned — feedstock to finished pellets in one line.',
      'โรงปิโตรเคมี โรงพอลิเมอร์ และไซโลเม็ดพลาสติกเรียงกัน — จากวัตถุดิบสู่เม็ดสำเร็จรูปในสายเดียว',
    ),
    buildings: ['petrochemicalPlant', 'polymerPlant', 'pelletSilo'],
    cashReward: 2500,
    rpReward: 30,
    reputationReward: 8,
  },
]
