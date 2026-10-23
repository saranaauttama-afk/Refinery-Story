import type { LocalizedText } from '../i18n'
// Rules text shown behind each sheet's "?" button instead of on screen all the time.
export const help: Record<string, LocalizedText> = {
  blend: {
    en: "Each Production Line makes one product into 300-unit lots. Pick a line at the top, then tap a card to see it and make it there. Plain products are grade C. Product cards come from the Lab menu. Every 6 lots use one unit of each of a card's catalysts; when one runs out the line makes plain lots until you research more. From rank 3 the market % falls when you sell one product a lot and recovers weekly.",
    th: 'สายการผลิตแต่ละสายผลิตสินค้า 1 อย่าง เป็นล็อตละ 300 หน่วย เลือกสายด้านบน แล้วแตะการ์ดเพื่อดูรายละเอียดและสั่งผลิต สินค้าธรรมดาได้เกรด C การ์ดสินค้าได้จากเมนูแล็บ ทุก 6 ล็อตใช้สารเร่งของการ์ดอย่างละ 1 หน่วย ถ้าสารหมดจะผลิตเกรดธรรมดาจนกว่าจะวิจัยเพิ่ม ตั้งแต่แรงก์ 3 ขายชนิดเดียวซ้ำ ๆ ตลาด % จะลด แล้วฟื้นทุกสัปดาห์',
  },
  lab: {
    en: '1) Formula Labs research catalysts: one random catalyst with a grade each time. 2) Product Labs turn a base plus catalysts into a product card, or upgrade a card. The best catalyst you use caps the grade; good pairs add, clashing pairs take away. 3) Production Lines make the card; 4) trucks buy it.',
    th: '1) แล็บสร้างสูตรวิจัยสารเร่ง ได้สารสุ่ม 1 ชนิดพร้อมเกรดทุกครั้ง 2) แล็บสร้างสินค้าเอาน้ำมันฐาน + สารเร่งมาทำเป็นการ์ดสินค้า หรืออัปเกรดการ์ด เกรดสูงสุดไม่เกินสารเร่งที่ดีที่สุดที่ใส่ คู่ที่เข้ากันช่วยเพิ่ม คู่ที่ไม่เข้ากันทำให้ลด 3) สายการผลิตผลิตตามการ์ด 4) รถลูกค้ามารับไปขาย',
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
