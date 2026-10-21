import type { LocalizedText } from '../i18n'
// Rules text shown behind each sheet's "?" button instead of on screen all the time.
export const help: Record<string, LocalizedText> = {
  blend: {
    en: 'Each blend station mixes one base + one additive into 300-unit lots. The letter on an additive is how well it suits the base; NEW pairs give Fame the first time. Grade sets the price. From rank 3 the market % falls when you sell one product a lot and recovers weekly. Find new pairs at a Lab.',
    th: 'แต่ละสถานีผสมฐาน 1 อย่างกับสารเติมแต่ง 1 อย่าง เป็นล็อตละ 300 หน่วย ตัวอักษรบนสารคือความเข้ากับฐาน คู่ที่ "ใหม่" ได้ชื่อเสียงครั้งแรก เกรดกำหนดราคา ตั้งแต่แรงก์ 3 ขายชนิดเดียวซ้ำ ๆ ตลาด % จะลด แล้วฟื้นทุกสัปดาห์ หาสูตรใหม่ได้ที่ห้องทดลอง',
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
