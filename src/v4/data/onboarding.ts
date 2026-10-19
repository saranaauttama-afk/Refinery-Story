// First-session guide. Each step lists buildings to place in order, with a suggested tile.
// A step completes on its own when the player has done it (see ui/Onboarding.tsx).
export interface HintStep {
  id: 'gate' | 'road' | 'crude' | 'blend' | 'sale' | 'recipe'
  en: string
  th: string
  place: { id: string; x: number; y: number }[]
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
    en: 'Place a Blending Station and a Product Tank to make your first lot.',
    th: 'วางสถานีผสมกับถังผลิตภัณฑ์ เพื่อผลิตล็อตแรก',
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
    id: 'recipe',
    en: 'Open Blend and try a new recipe. First tries earn Fame.',
    th: 'เปิดหน้าผสมแล้วลองสูตรใหม่ ลองครั้งแรกได้ชื่อเสียง',
    place: [],
  },
]
