import { BASE_PRICES as PRICE, BASE_RANKS as RANK } from './balance'
export const bases = [
  {
    id: 'lpg',
    name: { en: 'LPG', th: 'แอลพีจี' },
    price: PRICE.lpg,
    cut: 'naphtha',
    rank: RANK.lpg,
    unit: 'cracker',
  },
  {
    id: 'gasoline',
    name: { en: 'Gasoline', th: 'เบนซิน' },
    price: PRICE.gasoline,
    cut: 'naphtha',
    rank: RANK.gasoline,
    unit: 'cdu',
  },
  {
    id: 'jet',
    name: { en: 'Jet', th: 'เชื้อเพลิงอากาศยาน' },
    price: PRICE.jet,
    cut: 'kerosene',
    rank: RANK.jet,
    unit: 'hydro',
  },
  {
    id: 'diesel',
    name: { en: 'Diesel', th: 'ดีเซล' },
    price: PRICE.diesel,
    cut: 'gasoil',
    rank: RANK.diesel,
    unit: 'cdu',
  },
  {
    id: 'lube',
    name: { en: 'Lube', th: 'น้ำมันหล่อลื่น' },
    price: PRICE.lube,
    cut: 'gasoil',
    rank: RANK.lube,
    unit: 'hydro',
  },
  {
    id: 'asphalt',
    name: { en: 'Asphalt', th: 'ยางมะตอย' },
    price: PRICE.asphalt,
    cut: 'residue',
    rank: RANK.asphalt,
    unit: 'cdu',
  },
  {
    id: 'wax',
    name: { en: 'Wax', th: 'แวกซ์' },
    price: PRICE.wax,
    cut: 'residue',
    rank: RANK.wax,
    unit: 'hydro',
  },
  {
    id: 'pellet',
    name: { en: 'Pellet', th: 'เม็ดพลาสติก' },
    price: PRICE.pellet,
    cut: 'naphtha',
    rank: RANK.pellet,
    unit: 'cracker',
  },
] as const
export type BaseId = (typeof bases)[number]['id']
export type CutId = (typeof bases)[number]['cut']
export const baseDef = (id: BaseId) => bases.find(b => b.id === id)!
