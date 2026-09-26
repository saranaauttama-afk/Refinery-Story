import type { BilingualTextValue } from '../../game/types'
import type { V3InboxItem } from '../../game/v3/types'

/** Player-facing names; internal template/parcel IDs are never shown (Master UX rule). */
const CLIENT: Record<string, BilingualTextValue> = {
  tutorial: { en: 'First customer', th: 'ลูกค้ารายแรก' },
  local: { en: 'Local Fuel', th: 'ปั๊มท้องถิ่น' },
  performance: { en: 'Performance Garage', th: 'อู่รถแต่ง' },
  fleet: { en: 'Fleet Services', th: 'บริษัทรถขนส่ง' },
  airline: { en: 'Airline', th: 'สายการบิน' },
  materials: { en: 'Materials Co.', th: 'บริษัทวัสดุ' },
  showcase: { en: 'Showcase', th: 'งานโชว์เคส' },
}
const STAGE: Record<string, BilingualTextValue> = {
  gasoline: { en: 'first order', th: 'ออเดอร์แรก' },
  trial: { en: 'Trial', th: 'ทดลอง' },
  regular: { en: 'Regular', th: 'ประจำ' },
  partner: { en: 'Partner', th: 'พาร์ทเนอร์' },
  repeat: { en: 'Repeat order', th: 'สั่งซ้ำ' },
  'partner-repeat': { en: 'Partner repeat', th: 'พาร์ทเนอร์สั่งซ้ำ' },
  'starter-repeat': { en: 'Starter repeat (C1)', th: 'สั่งซ้ำเริ่มต้น (C1)' },
  rush: { en: 'Rush order', th: 'งานด่วน' },
  lubricants: { en: 'Lubricants', th: 'น้ำมันหล่อลื่น' },
  jetFuel: { en: 'Jet Fuel', th: 'น้ำมันเครื่องบิน' },
  petrochemicals: { en: 'Petrochemicals', th: 'ปิโตรเคมี' },
  plasticPellets: { en: 'Plastic Pellets', th: 'เม็ดพลาสติก' },
}

export function v3JobLabel(templateId: string): BilingualTextValue {
  const [client, stage] = templateId.split(':')
  const c = CLIENT[client] ?? { en: client, th: client }
  const s = STAGE[stage] ?? { en: stage ?? '', th: stage ?? '' }
  return { en: `${c.en} · ${s.en}`, th: `${c.th} · ${s.th}` }
}

const SIDE: Record<string, BilingualTextValue> = {
  north: { en: 'north', th: 'ทิศเหนือ' }, south: { en: 'south', th: 'ทิศใต้' },
  east: { en: 'east', th: 'ทิศตะวันออก' }, west: { en: 'west', th: 'ทิศตะวันตก' },
}

export function v3ParcelLabel(parcelId: string): BilingualTextValue {
  if (parcelId === 'core') return { en: 'Starting yard', th: 'ลานเริ่มต้น' }
  const [ring, side] = parcelId.split(':')
  const n = ring.replace('ring', '')
  return { en: `Expansion ${n} · ${SIDE[side]?.en ?? side}`, th: `ขยายวงที่ ${n} · ${SIDE[side]?.th ?? side}` }
}

export function v3InboxText(item: V3InboxItem): BilingualTextValue {
  const p = item.params
  if (item.kind === 'customer_thanks') {
    const label = v3JobLabel(`${p.client}:${p.stage}`)
    return { en: `${label.en}: the customer thanks your team for the delivery.`, th: `${label.th}: ลูกค้าขอบคุณทีมสำหรับการส่งมอบ` }
  }
  if (item.kind === 'staff_accomplishment') {
    return p.recipes
      ? { en: `${p.name} has certified ${p.recipes} recipe(s). The team is proud!`, th: `${p.name} รับรองสูตรได้ ${p.recipes} สูตรแล้ว ทีมภูมิใจมาก!` }
      : { en: `${p.name} reached level ${p.level}.`, th: `${p.name} ขึ้นเลเวล ${p.level} แล้ว` }
  }
  return {
    en: 'The lab has an idea for a small experiment using what you learned. Accept for research points (no cost).',
    th: 'ห้องแล็บมีไอเดียทดลองเล็ก ๆ จากความรู้ที่มี รับเพื่อรับแต้มวิจัย (ไม่มีค่าใช้จ่าย)',
  }
}
