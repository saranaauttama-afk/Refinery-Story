import type { LocalizedText } from '../i18n'
// Rules text shown behind each sheet's "?" button instead of on screen all the time.
export const help: Record<string, LocalizedText> = {
  blend: {
    en: 'Each blend station turns one base into 300-unit lots. Plain lots are grade C. Pick a formula from the Formula Lab to make its grade instead; every 6 lots use one unit of each of its catalysts, and when one runs out the station makes plain lots until you research more. Grade sets the price. From rank 3 the market % falls when you sell one product a lot and recovers weekly.',
    th: 'แต่ละสถานีเปลี่ยนน้ำมันฐานเป็นล็อตละ 300 หน่วย ถ้าไม่ใส่สูตรจะได้เกรด C เลือกสูตรจากแล็บผสมสูตรเพื่อผลิตตามเกรดของสูตร ทุก 6 ล็อตจะใช้สารเร่งในสูตรอย่างละ 1 หน่วย ถ้าสารหมดจะกลับไปผลิตเกรดธรรมดาจนกว่าจะวิจัยเพิ่ม เกรดกำหนดราคา ตั้งแต่แรงก์ 3 ขายชนิดเดียวซ้ำ ๆ ตลาด % จะลด แล้วฟื้นทุกสัปดาห์',
  },
  customers: {
    en: 'Trucks come and buy on their own. Contracts deliver automatically every week until done; finishing pays extra and gives Fame. Regulars give a gift at 10 hearts.',
    th: 'รถลูกค้ามาซื้อเอง สัญญาส่งของให้อัตโนมัติทุกสัปดาห์จนครบ ส่งครบได้เงินเพิ่มและชื่อเสียง ลูกค้าประจำครบ 10 หัวใจให้ของขวัญ',
  },
  staff: {
    en: 'Assign people to buildings. Operators raise yield, chemists purity and research, engineers stability and repairs, safety staff Eco and inspections. Training costs power, which recovers while resting.',
    th: 'ส่งคนไปประจำตึก ปฏิบัติการเพิ่ม Yield นักเคมีเพิ่ม Purity และช่วยวิจัย วิศวกรเพิ่ม Stability และซ่อมเครื่อง ความปลอดภัยเพิ่ม Eco และผ่านผู้ตรวจ การฝึกใช้พลัง พักแล้วพลังฟื้น',
  },
  combos: {
    en: 'Place the right buildings within 2 tiles of each other to get a combo. Tapping a building in Build shows what to place it near.',
    th: 'วางตึกที่เข้ากันห่างไม่เกิน 2 ช่องเพื่อเกิดคอมโบ ในหน้าสร้าง แตะค้างที่ตึกจะบอกว่าควรวางใกล้อะไร',
  },
}
