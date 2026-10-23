import { yardDecor } from './yardDecor'
import { BUILDING_BALANCE } from './balance'
import type { LocalizedText } from '../i18n'
export interface BuildingDef {
  id: string
  name: LocalizedText
  category: 'process' | 'storage' | 'logistics' | 'blend' | 'support' | 'deco'
  w: number
  h: number
  height: number
  cost: number
  rank: number
  accent: string
}
const def = (
  id: string,
  en: string,
  th: string,
  category: BuildingDef['category'],
  accent: string,
): BuildingDef => ({
  id,
  name: { en, th },
  category,
  ...(BUILDING_BALANCE[id] ?? BUILDING_BALANCE.award),
  accent,
})
export const buildings: BuildingDef[] = [
  def('gate', 'Truck Gate', 'ประตูรถบรรทุก', 'logistics', '#F2C230'),
  def('loading', 'Loading Bay', 'ลานจ่ายสินค้า', 'logistics', '#F08A24'),
  def('crudeTank', 'Crude Tank', 'ถังน้ำมันดิบ', 'storage', '#3C3C46'),
  def('tank', 'Product Tank', 'ถังผลิตภัณฑ์', 'storage', '#E2483D'),
  def('cdu', 'CDU', 'หอกลั่น', 'process', '#3C3C46'),
  def('blend', 'Blending Station', 'สถานีผสม', 'blend', '#E2483D'),
  def('pipe', 'Pipe Rack', 'แนวท่อ', 'logistics', '#9EABB8'),
  def('road', 'Road', 'ถนน', 'logistics', '#4A4E57'),
  def('hydro', 'Hydrotreater', 'หน่วยไฮโดรทรีต', 'process', '#F08A24'),
  def('lab', 'Lab', 'ห้องทดลอง', 'support', '#4FA3D9'),
  def('reformer', 'Reformer', 'หน่วยรีฟอร์มเมอร์', 'process', '#E2483D'),
  def('cracker', 'Cracker', 'หน่วยแครกเกอร์', 'process', '#9C5BD6'),
  def('control', 'Control Room', 'ห้องควบคุม', 'support', '#4FA3D9'),
  def('canteen', 'Canteen', 'โรงอาหาร', 'support', '#B5653A'),
  def('flare', 'Flare', 'หอเผา', 'support', '#F08A24'),
  ...yardDecor.map(d => def(d.id, d.en, d.th, 'deco', '#5E8C3A')),
  def('tree', 'Tree', 'ต้นไม้', 'deco', '#5E8C3A'),
  def('lamp', 'Lamp', 'โคมไฟ', 'deco', '#F2C230'),
  def('sign', 'Company Sign', 'ป้ายบริษัท', 'deco', '#4FA3D9'),
  ...['product', 'safety', 'eco', 'refinery'].map(id =>
    def(`award${id}`, `Award ${id}`, `ถ้วยรางวัล ${id}`, 'deco', '#F2C230'),
  ),
  def('flag', 'Company Flag', 'ธงบริษัท', 'deco', '#E2483D'),
  def('goldTree', 'Golden Tree', 'ต้นไม้ทอง', 'deco', '#F2C230'),
  def('goldSign', 'Golden Sign', 'ป้ายทอง', 'deco', '#F2C230'),
  def('legend', 'Legend Statue', 'รูปปั้นตำนาน', 'deco', '#9C5BD6'),
  def('tower', 'Mega Refinery Tower', 'เมกะรีไฟเนอรี', 'process', '#E36BB0'),
]
export const buildingDef = (id: string): BuildingDef => {
  const d = buildings.find(b => b.id === id)
  if (!d) throw new Error(`Unknown building ${id}`)
  return d
}
