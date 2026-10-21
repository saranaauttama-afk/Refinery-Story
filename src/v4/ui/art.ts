// Portraits and menu art made with ChatGPT, pixelated by scripts/art/portraits.py and bgs.py.
// Chosen from ids, so saves need no new fields.
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
const staffArt: Record<string, number[]> = {
  operator: [
    require('../../../assets/v4/portraits/operator_0.jpg'),
    require('../../../assets/v4/portraits/operator_1.jpg'),
    require('../../../assets/v4/portraits/operator_2.jpg'),
    require('../../../assets/v4/portraits/operator_3.jpg'),
    require('../../../assets/v4/portraits/operator_4.jpg'),
    require('../../../assets/v4/portraits/operator_5.jpg'),
  ],
  chemist: [
    require('../../../assets/v4/portraits/chemist_0.jpg'),
    require('../../../assets/v4/portraits/chemist_1.jpg'),
    require('../../../assets/v4/portraits/chemist_2.jpg'),
    require('../../../assets/v4/portraits/chemist_3.jpg'),
    require('../../../assets/v4/portraits/chemist_4.jpg'),
    require('../../../assets/v4/portraits/chemist_5.jpg'),
  ],
  engineer: [
    require('../../../assets/v4/portraits/engineer_0.jpg'),
    require('../../../assets/v4/portraits/engineer_1.jpg'),
    require('../../../assets/v4/portraits/engineer_2.jpg'),
    require('../../../assets/v4/portraits/engineer_3.jpg'),
    require('../../../assets/v4/portraits/engineer_4.jpg'),
    require('../../../assets/v4/portraits/engineer_5.jpg'),
  ],
  safety: [
    require('../../../assets/v4/portraits/safety_0.jpg'),
    require('../../../assets/v4/portraits/safety_1.jpg'),
    require('../../../assets/v4/portraits/safety_2.jpg'),
    require('../../../assets/v4/portraits/safety_3.jpg'),
    require('../../../assets/v4/portraits/safety_4.jpg'),
    require('../../../assets/v4/portraits/safety_5.jpg'),
  ],
  manager: [
    require('../../../assets/v4/portraits/manager_0.jpg'),
    require('../../../assets/v4/portraits/manager_1.jpg'),
    require('../../../assets/v4/portraits/manager_2.jpg'),
    require('../../../assets/v4/portraits/manager_3.jpg'),
    require('../../../assets/v4/portraits/manager_4.jpg'),
    require('../../../assets/v4/portraits/manager_5.jpg'),
  ],
  director: [
    require('../../../assets/v4/portraits/director_0.jpg'),
    require('../../../assets/v4/portraits/director_1.jpg'),
    require('../../../assets/v4/portraits/director_2.jpg'),
    require('../../../assets/v4/portraits/director_3.jpg'),
    require('../../../assets/v4/portraits/director_4.jpg'),
    require('../../../assets/v4/portraits/director_5.jpg'),
  ],
}
const customerArt: Record<string, number[]> = {
  gas: [
    require('../../../assets/v4/portraits/gas_0.jpg'),
    require('../../../assets/v4/portraits/gas_1.jpg'),
    require('../../../assets/v4/portraits/gas_2.jpg'),
    require('../../../assets/v4/portraits/gas_3.jpg'),
    require('../../../assets/v4/portraits/gas_4.jpg'),
    require('../../../assets/v4/portraits/gas_5.jpg'),
    require('../../../assets/v4/portraits/gas_6.jpg'),
    require('../../../assets/v4/portraits/gas_7.jpg'),
  ],
  air: [
    require('../../../assets/v4/portraits/air_0.jpg'),
    require('../../../assets/v4/portraits/air_1.jpg'),
    require('../../../assets/v4/portraits/air_2.jpg'),
    require('../../../assets/v4/portraits/air_3.jpg'),
    require('../../../assets/v4/portraits/air_4.jpg'),
    require('../../../assets/v4/portraits/air_5.jpg'),
    require('../../../assets/v4/portraits/air_6.jpg'),
    require('../../../assets/v4/portraits/air_7.jpg'),
  ],
  shipping: [
    require('../../../assets/v4/portraits/shipping_0.jpg'),
    require('../../../assets/v4/portraits/shipping_1.jpg'),
    require('../../../assets/v4/portraits/shipping_2.jpg'),
    require('../../../assets/v4/portraits/shipping_3.jpg'),
    require('../../../assets/v4/portraits/shipping_4.jpg'),
    require('../../../assets/v4/portraits/shipping_5.jpg'),
    require('../../../assets/v4/portraits/shipping_6.jpg'),
    require('../../../assets/v4/portraits/shipping_7.jpg'),
  ],
  industrial: [
    require('../../../assets/v4/portraits/industrial_0.jpg'),
    require('../../../assets/v4/portraits/industrial_1.jpg'),
    require('../../../assets/v4/portraits/industrial_2.jpg'),
    require('../../../assets/v4/portraits/industrial_3.jpg'),
    require('../../../assets/v4/portraits/industrial_4.jpg'),
    require('../../../assets/v4/portraits/industrial_5.jpg'),
    require('../../../assets/v4/portraits/industrial_6.jpg'),
    require('../../../assets/v4/portraits/industrial_7.jpg'),
  ],
  government: [
    require('../../../assets/v4/portraits/government_0.jpg'),
    require('../../../assets/v4/portraits/government_1.jpg'),
    require('../../../assets/v4/portraits/government_2.jpg'),
    require('../../../assets/v4/portraits/government_3.jpg'),
    require('../../../assets/v4/portraits/government_4.jpg'),
    require('../../../assets/v4/portraits/government_5.jpg'),
    require('../../../assets/v4/portraits/government_6.jpg'),
    require('../../../assets/v4/portraits/government_7.jpg'),
  ],
}
// Which cells of each job's set are women (from the generated grids).
const women: Record<string, number[]> = {
  operator: [1, 4],
  chemist: [0, 3, 5],
  engineer: [1, 4],
  safety: [1, 3, 5],
  manager: [1, 4],
  director: [1, 3, 5],
}
const womenNames = new Set(['มาลี', 'พิมพ์', 'ปรียา', 'น้ำฝน', 'สุรีย์'])
/** Same person, same face: picked from the uid among faces that fit the name. */
export const staffPortrait = (uid: string, job: string, name = ''): number | undefined => {
  const set = staffArt[job]
  if (!set) return undefined
  const w = women[job] ?? []
  const pool = set
    .map((_, i) => i)
    .filter(i => (womenNames.has(name) ? w.includes(i) : !w.includes(i)))
  return set[pool[hash(uid) % pool.length]]
}
/** Customer ids are `<group><index>` (gas0…gas7). */
export const customerPortrait = (id: string): number | undefined => {
  const m = /^([a-z]+)(\d+)$/.exec(id)
  const set = m ? customerArt[m[1]] : undefined
  return set ? set[Number(m![2]) % set.length] : undefined
}
export const headerArt: Record<string, number> = {
  Build: require('../../../art-src/gpt/bg_build.png'),
  Blend: require('../../../art-src/gpt/bg_blend.png'),
  Staff: require('../../../art-src/gpt/bg_staff.png'),
  Customers: require('../../../art-src/gpt/bg_customers.png'),
  Company: require('../../../art-src/gpt/bg_company.png'),
}
export const sceneArt = {
  rank: require('../../../assets/v4/art/scene_rank.jpg'),
  awards: require('../../../assets/v4/art/scene_award.jpg'),
  title: require('../../../assets/v4/art/title_coastal_v2.png'),
}
