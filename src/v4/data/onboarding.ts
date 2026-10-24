// First-session guide. Each step lists buildings to place in order, with a suggested tile.
// A step completes on its own when the player has done it (see ui/Onboarding.tsx).
export interface HintStep {
  id: 'gate' | 'road' | 'crude' | 'blend' | 'sale' | 'product' | 'catalyst' | 'card' | 'make'
  en: string
  th: string
  place: { id: string; x: number; y: number }[]
  /** The guide pauses (hides) until the player reaches this rank. */
  rank?: number
}

export const hints: HintStep[] = [
  {
    id: 'gate',
    en: 'Place a Truck Gate on the yard edge. Trucks drive in from the road outside.',
    th: 'วางประตูรถบรรทุกที่ขอบลาน รถจะวิ่งเข้ามาจากถนนด้านนอก',
    place: [{ id: 'gate', x: 0, y: 0 }],
  },
  {
    id: 'road',
    en: 'Place a Loading Bay and link it to the gate with road.',
    th: 'วางลานจ่ายสินค้า แล้ววางถนนเชื่อมกับประตู',
    place: [
      { id: 'loading', x: 2, y: 0 },
      { id: 'road', x: 1, y: 0 },
    ],
  },
  {
    id: 'crude',
    en: 'Place a Crude Tank and a CDU to turn crude into fuel.',
    th: 'วางถังน้ำมันดิบกับหอกลั่น เพื่อกลั่นน้ำมันดิบเป็นเชื้อเพลิง',
    place: [
      { id: 'crudeTank', x: 0, y: 3 },
      { id: 'cdu', x: 3, y: 3 },
    ],
  },
  {
    id: 'blend',
    en: 'Place a Production Line and a Product Tank to make your first lot.',
    th: 'วางสายการผลิตกับถังผลิตภัณฑ์ เพื่อผลิตล็อตแรก',
    place: [
      { id: 'blend', x: 6, y: 3 },
      { id: 'tank', x: 9, y: 3 },
    ],
  },
  {
    id: 'sale',
    en: 'Wait for a customer truck to collect your first lot.',
    th: 'รอรถลูกค้ามารับล็อตแรก',
    place: [],
  },
  {
    id: 'product',
    en: 'Open Products, tap another oil card and make it on your line. A first try earns Fame.',
    th: 'เปิดเมนูสินค้า แตะการ์ดน้ำมันอีกชนิด แล้วกดผลิต ผลิตครั้งแรกได้ชื่อเสียง',
    place: [],
  },
  {
    id: 'catalyst',
    en: 'Labs are open! Build a Formula Lab (Build › Support), then research a catalyst in the Lab menu.',
    th: 'ปลดล็อกแล็บแล้ว! สร้างแล็บสร้างสูตร (สร้าง › สนับสนุน) แล้ววิจัยสารเร่งในเมนูแล็บ',
    place: [],
    rank: 2,
  },
  {
    id: 'card',
    en: 'Build a Product Lab, then in Lab › Develop put a catalyst in a slot to make your first product card.',
    th: 'สร้างแล็บสร้างสินค้า แล้วไปที่ แล็บ › พัฒนาสินค้า ใส่สารเร่งลงช่องเพื่อสร้างการ์ดสินค้าใบแรก',
    place: [],
    rank: 2,
  },
  {
    id: 'make',
    en: 'Open Products, tap your new card and press "Make on line 1". Better cards sell for more.',
    th: 'เปิดเมนูสินค้า แตะการ์ดใหม่ แล้วกด "ผลิตที่สาย 1" การ์ดเกรดดีขายได้แพงกว่า',
    place: [],
    rank: 2,
  },
]
