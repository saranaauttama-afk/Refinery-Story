import type { AdditiveId } from './additives'
import type { BaseId } from './bases'

// Catalyst × catalyst pairs. Good pairs add a step when mixed together, bad ones take one away.
// Players learn them by trying pairs or from lab hints; the book shows ??? until then.
export interface Synergy {
  a: AdditiveId
  b: AdditiveId
  kind: 'good' | 'bad'
}
const s = (a: AdditiveId, b: AdditiveId, kind: Synergy['kind']): Synergy => ({ a, b, kind })
export const synergies: Synergy[] = [
  s('octane', 'detergent', 'good'),
  s('octane', 'cleanburn', 'good'),
  s('antifreeze', 'coldflow', 'good'),
  s('cetane', 'lubricity', 'good'),
  s('antioxidant', 'stabilizer', 'good'),
  s('polymer', 'adhesive', 'good'),
  s('bio', 'recycled', 'good'),
  s('dye', 'fragrance', 'good'),
  s('corrosion', 'lubricity', 'good'),
  s('antifoam', 'detergent', 'good'),
  s('catalyst', 'nano', 'good'),
  s('premium', 'cleanburn', 'good'),
  s('octane', 'cetane', 'bad'),
  s('dye', 'cleanburn', 'bad'),
  s('fragrance', 'cetane', 'bad'),
  s('polymer', 'antifoam', 'bad'),
  s('nano', 'recycled', 'bad'),
  s('bio', 'stabilizer', 'bad'),
  s('adhesive', 'lubricity', 'bad'),
  s('premium', 'recycled', 'bad'),
]
export const synergyKey = (a: string, b: string) => [a, b].sort().join('+')
const synergyMap = new Map(synergies.map(x => [synergyKey(x.a, x.b), x.kind]))
export const synergyOf = (a: AdditiveId, b: AdditiveId) => synergyMap.get(synergyKey(a, b)) ?? null

// Secret formulas: an exact base + catalyst set. Making one names the product, sells for more
// and raises the grade cap by FORMULA_LAB.mix.secretBonus.
export interface SecretFormula {
  id: string
  name: { en: string; th: string }
  base: BaseId
  catalysts: AdditiveId[]
  hint: { en: string; th: string }
}
const f = (
  id: string,
  en: string,
  th: string,
  base: BaseId,
  catalysts: AdditiveId[],
  hintEn: string,
  hintTh: string,
): SecretFormula => ({ id, name: { en, th }, base, catalysts, hint: { en: hintEn, th: hintTh } })
export const secretFormulas: SecretFormula[] = [
  f(
    'premiumGas',
    'Premium Gasoline',
    'เบนซินพรีเมียม',
    'gasoline',
    ['octane', 'cleanburn'],
    'Gasoline that burns hot and clean…',
    'เบนซินที่แรงและเผาไหม้สะอาด…',
  ),
  f(
    'euroDiesel',
    'Euro Diesel',
    'ดีเซลยูโร',
    'diesel',
    ['cetane', 'coldflow'],
    'Diesel that starts on a frozen morning…',
    'ดีเซลที่สตาร์ทติดแม้เช้าหนาวจัด…',
  ),
  f(
    'jetA1',
    'Jet A-1',
    'เจ็ท เอ-วัน',
    'jet',
    ['antifreeze', 'stabilizer'],
    'Jet fuel that stays calm at 10,000 m…',
    'เชื้อเพลิงเครื่องบินที่นิ่งแม้ที่ความสูงหมื่นเมตร…',
  ),
  f(
    'cleanLpg',
    'Clean LPG',
    'แอลพีจีสะอาด',
    'lpg',
    ['cleanburn', 'catalyst'],
    'Gas with a flame that leaves nothing behind…',
    'แก๊สที่เปลวไฟไม่ทิ้งคราบ…',
  ),
  f(
    'syntheticLube',
    'Synthetic Lube',
    'น้ำมันเครื่องสังเคราะห์',
    'lube',
    ['antioxidant', 'polymer', 'stabilizer'],
    'Oil that never ages, never thins…',
    'น้ำมันที่ไม่เสื่อม ไม่ใส…',
  ),
  f(
    'ecoAsphalt',
    'Eco Asphalt',
    'ยางมะตอยรักษ์โลก',
    'asphalt',
    ['recycled', 'adhesive'],
    'Roads paved with yesterday’s waste…',
    'ถนนที่ปูจากขยะเมื่อวาน…',
  ),
  f(
    'candleWax',
    'Scented Candle Wax',
    'แวกซ์เทียนหอม',
    'wax',
    ['fragrance', 'dye'],
    'Wax that looks and smells like a gift…',
    'แวกซ์ที่ทั้งสวยและหอมเหมือนของขวัญ…',
  ),
  f(
    'bioPellet',
    'Bio Pellet',
    'เม็ดพลาสติกชีวภาพ',
    'pellet',
    ['bio', 'recycled', 'polymer'],
    'Plastic that came from plants and goes back…',
    'พลาสติกที่มาจากพืชและกลับคืนสู่ธรรมชาติ…',
  ),
]
export const formulaKey = (base: string, catalysts: readonly string[]) =>
  `${base}:${[...catalysts].sort().join('+') || 'none'}`
export const secretFor = (base: BaseId, catalysts: readonly AdditiveId[]) =>
  secretFormulas.find(x => formulaKey(x.base, x.catalysts) === formulaKey(base, catalysts)) ?? null
