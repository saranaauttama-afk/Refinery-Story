import type { LocalizedText } from '../i18n'

// What each building is for, shown in the Build sheet and the building info sheet.
export const buildingInfo: Record<string, LocalizedText> = {
  gate: {
    en: 'Trucks enter here. Must sit on the yard edge.',
    th: 'ทางเข้ารถบรรทุก ต้องวางที่ขอบลาน',
  },
  loading: {
    en: 'Customer trucks load products here. Link it to the gate with road.',
    th: 'รถลูกค้ามารับสินค้าที่นี่ ต้องมีถนนเชื่อมกับประตู',
  },
  road: {
    en: 'Links the gate to loading bays. Joins straight roads, corners and junctions automatically.',
    th: 'เชื่อมประตูกับลานจ่ายสินค้า วางต่อกันเป็นทางตรง ทางโค้ง สามแยก และสี่แยกอัตโนมัติ',
  },
  crudeTank: {
    en: 'Stores crude oil from tanker trucks. More tanks, bigger deliveries.',
    th: 'เก็บน้ำมันดิบจากรถ ยิ่งมีมาก รับน้ำมันดิบได้ทีละมาก',
  },
  tank: {
    en: 'Stores finished lots until a customer collects them.',
    th: 'เก็บล็อตที่ผสมเสร็จ รอรถลูกค้ามารับ',
  },
  cdu: {
    en: 'Splits crude into cuts. Makes Gasoline, Diesel and Asphalt bases.',
    th: 'แยกน้ำมันดิบ ทำฐานเบนซิน ดีเซล และยางมะตอย',
  },
  blend: {
    en: 'Makes one product card into graded lots ready to sell.',
    th: 'ผลิตสินค้าตามการ์ดที่เลือก เป็นล็อตที่มีเกรดพร้อมขาย',
  },
  pipe: { en: 'Pipe rack. Part of the Tank Farm set.', th: 'แนวท่อ ใช้เข้าชุดฟาร์มถัง' },
  hydro: {
    en: 'Cleans cuts. Makes Jet, Lube and Wax bases.',
    th: 'ทำความสะอาดน้ำมัน ทำฐานเจ็ท น้ำมันหล่อลื่น และแว็กซ์',
  },
  lab: {
    en: 'Researches catalysts with RD: one random catalyst with a grade each time. A higher level and a chemist on duty give better grades. Also raises Purity nearby.',
    th: 'วิจัยสารเร่งด้วย RD ได้สารเร่งสุ่ม 1 ชนิดพร้อมเกรด เลเวลสูงและมีนักเคมีประจำได้เกรดดีขึ้น และเพิ่ม Purity ให้ตึกใกล้ ๆ',
  },
  productLab: {
    en: 'Develops products: a base plus catalysts becomes a product card that blend stations can make. Upgrade a card with better catalysts.',
    th: 'พัฒนาสินค้า: น้ำมันฐาน + สารเร่ง กลายเป็นการ์ดสินค้าให้สถานีผสมผลิต ใส่สารเร่งที่ดีกว่าเพื่ออัปเกรดการ์ด',
  },
  reformer: {
    en: 'Upgrades naphtha for better Gasoline.',
    th: 'ปรับแนฟทาให้ได้เบนซินคุณภาพดีขึ้น',
  },
  cracker: {
    en: 'Cracks heavy oil. Makes LPG and Pellet bases.',
    th: 'แตกโมเลกุลน้ำมันหนัก ทำฐาน LPG และเม็ดพลาสติก',
  },
  control: {
    en: 'Raises Stability nearby and cuts incidents.',
    th: 'เพิ่ม Stability ให้หน่วยใกล้ ๆ และลดอุบัติเหตุ',
  },
  canteen: {
    en: 'Staff rest faster. Raises Yield of nearby units.',
    th: 'พนักงานฟื้นพลังเร็วขึ้น และเพิ่ม Yield ให้หน่วยใกล้ ๆ',
  },
  flare: {
    en: 'Safety flare. Keep it away from the canteen.',
    th: 'หอเผาเพื่อความปลอดภัย อย่าวางใกล้โรงอาหาร',
  },
  tree: { en: 'Raises Eco of nearby units.', th: 'เพิ่ม Eco ให้หน่วยใกล้ ๆ' },
  lamp: { en: 'Raises Stability nearby. Brightens the gate.', th: 'เพิ่ม Stability ใกล้ ๆ' },
  sign: { en: 'Company sign. Part of some sets.', th: 'ป้ายบริษัท ใช้เข้าชุดคอมโบบางชุด' },
  flag: { en: 'Company flag.', th: 'ธงบริษัท' },
  tower: {
    en: 'The ultimate refinery tower.',
    th: 'หอกลั่นยักษ์ ตึกสุดท้ายของเกม',
  },
}

export const infoFor = (id: string): LocalizedText =>
  buildingInfo[id] ?? { en: 'Decoration.', th: 'ของตกแต่ง' }
