// When each system switches on, and the one-line intro shown in the rank-up notice.
// Early ranks stay simple: build → blend → sell; pressure systems arrive later.
export const FEATURE_RANK = {
  research: 2,
  land: 2,
  market: 3,
  ads: 3,
  wear: 3,
  spec: 4,
  projects: 5,
} as const
export type FeatureId = keyof typeof FEATURE_RANK
export const featureIntro: Record<FeatureId, { en: string; th: string }> = {
  research: {
    en: 'Lab: research new blend recipes with RD.',
    th: 'ห้องทดลอง: ใช้ RD วิจัยสูตรผสมใหม่',
  },
  land: {
    en: 'Land: buy parcels next to your yard (Company → Buy land).',
    th: 'ที่ดิน: ซื้อแปลงติดลานได้ (บริษัท → ซื้อที่ดิน)',
  },
  market: {
    en: 'Market: selling one product a lot now cools its demand; it recovers weekly.',
    th: 'ตลาด: จากนี้ขายชนิดเดียวซ้ำ ๆ ราคาจะลด แล้วฟื้นทุกสัปดาห์',
  },
  ads: {
    en: 'Ads: reset a product’s demand and lift it for a month (Customers).',
    th: 'โฆษณา: ดึงตลาดของสินค้ากลับมาเต็ม และขายดีขึ้น 1 เดือน (หน้าลูกค้า)',
  },
  wear: {
    en: 'Wear: plants wear down. Overhaul them or assign engineers.',
    th: 'สภาพเครื่อง: เครื่องจะเสื่อม ซ่อมใหญ่หรือส่งวิศวกรไปประจำ',
  },
  spec: {
    en: 'Specialisation: Lv3+ plants can pick Volume, Quality or Eco.',
    th: 'สายพัฒนา: เครื่อง Lv3 ขึ้นไปเลือกเน้นปริมาณ คุณภาพ หรือสิ่งแวดล้อม',
  },
  projects: {
    en: 'Big projects: Overseas Export and more (Company).',
    th: 'โปรเจกต์ใหญ่: ส่งออกต่างประเทศ และอื่น ๆ (หน้าบริษัท)',
  },
}
export const featureOn = (s: { rank: number }, id: FeatureId) => s.rank >= FEATURE_RANK[id]
