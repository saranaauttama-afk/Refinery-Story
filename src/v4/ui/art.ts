// Portraits and menu art made with ChatGPT, pixelated by scripts/art/portraits.py and bgs.py.
// Chosen from ids, so saves need no new fields.
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
const staffArt: Record<string, number[]> = {
  operator: [
    require('../../../assets/v4/portraits/operator_0.png'),
    require('../../../assets/v4/portraits/operator_1.png'),
    require('../../../assets/v4/portraits/operator_2.png'),
    require('../../../assets/v4/portraits/operator_3.png'),
    require('../../../assets/v4/portraits/operator_4.png'),
    require('../../../assets/v4/portraits/operator_5.png'),
  ],
  chemist: [
    require('../../../assets/v4/portraits/chemist_0.png'),
    require('../../../assets/v4/portraits/chemist_1.png'),
    require('../../../assets/v4/portraits/chemist_2.png'),
    require('../../../assets/v4/portraits/chemist_3.png'),
    require('../../../assets/v4/portraits/chemist_4.png'),
    require('../../../assets/v4/portraits/chemist_5.png'),
  ],
  engineer: [
    require('../../../assets/v4/portraits/engineer_0.png'),
    require('../../../assets/v4/portraits/engineer_1.png'),
    require('../../../assets/v4/portraits/engineer_2.png'),
    require('../../../assets/v4/portraits/engineer_3.png'),
    require('../../../assets/v4/portraits/engineer_4.png'),
    require('../../../assets/v4/portraits/engineer_5.png'),
  ],
  safety: [
    require('../../../assets/v4/portraits/safety_0.png'),
    require('../../../assets/v4/portraits/safety_1.png'),
    require('../../../assets/v4/portraits/safety_2.png'),
    require('../../../assets/v4/portraits/safety_3.png'),
    require('../../../assets/v4/portraits/safety_4.png'),
    require('../../../assets/v4/portraits/safety_5.png'),
  ],
  manager: [
    require('../../../assets/v4/portraits/manager_0.png'),
    require('../../../assets/v4/portraits/manager_1.png'),
    require('../../../assets/v4/portraits/manager_2.png'),
    require('../../../assets/v4/portraits/manager_3.png'),
    require('../../../assets/v4/portraits/manager_4.png'),
    require('../../../assets/v4/portraits/manager_5.png'),
  ],
  director: [
    require('../../../assets/v4/portraits/director_0.png'),
    require('../../../assets/v4/portraits/director_1.png'),
    require('../../../assets/v4/portraits/director_2.png'),
    require('../../../assets/v4/portraits/director_3.png'),
    require('../../../assets/v4/portraits/director_4.png'),
    require('../../../assets/v4/portraits/director_5.png'),
  ],
}
const customerArt: Record<string, number[]> = {
  gas: [
    require('../../../assets/v4/portraits/gas_0.png'),
    require('../../../assets/v4/portraits/gas_1.png'),
    require('../../../assets/v4/portraits/gas_2.png'),
    require('../../../assets/v4/portraits/gas_3.png'),
    require('../../../assets/v4/portraits/gas_4.png'),
    require('../../../assets/v4/portraits/gas_5.png'),
    require('../../../assets/v4/portraits/gas_6.png'),
    require('../../../assets/v4/portraits/gas_7.png'),
  ],
  air: [
    require('../../../assets/v4/portraits/air_0.png'),
    require('../../../assets/v4/portraits/air_1.png'),
    require('../../../assets/v4/portraits/air_2.png'),
    require('../../../assets/v4/portraits/air_3.png'),
    require('../../../assets/v4/portraits/air_4.png'),
    require('../../../assets/v4/portraits/air_5.png'),
    require('../../../assets/v4/portraits/air_6.png'),
    require('../../../assets/v4/portraits/air_7.png'),
  ],
  shipping: [
    require('../../../assets/v4/portraits/shipping_0.png'),
    require('../../../assets/v4/portraits/shipping_1.png'),
    require('../../../assets/v4/portraits/shipping_2.png'),
    require('../../../assets/v4/portraits/shipping_3.png'),
    require('../../../assets/v4/portraits/shipping_4.png'),
    require('../../../assets/v4/portraits/shipping_5.png'),
    require('../../../assets/v4/portraits/shipping_6.png'),
    require('../../../assets/v4/portraits/shipping_7.png'),
  ],
  industrial: [
    require('../../../assets/v4/portraits/industrial_0.png'),
    require('../../../assets/v4/portraits/industrial_1.png'),
    require('../../../assets/v4/portraits/industrial_2.png'),
    require('../../../assets/v4/portraits/industrial_3.png'),
    require('../../../assets/v4/portraits/industrial_4.png'),
    require('../../../assets/v4/portraits/industrial_5.png'),
    require('../../../assets/v4/portraits/industrial_6.png'),
    require('../../../assets/v4/portraits/industrial_7.png'),
  ],
  government: [
    require('../../../assets/v4/portraits/government_0.png'),
    require('../../../assets/v4/portraits/government_1.png'),
    require('../../../assets/v4/portraits/government_2.png'),
    require('../../../assets/v4/portraits/government_3.png'),
    require('../../../assets/v4/portraits/government_4.png'),
    require('../../../assets/v4/portraits/government_5.png'),
    require('../../../assets/v4/portraits/government_6.png'),
    require('../../../assets/v4/portraits/government_7.png'),
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
  Build: require('../../../assets/v4/art/header_build.png'),
  Blend: require('../../../assets/v4/art/header_blend.png'),
  Staff: require('../../../assets/v4/art/header_staff.png'),
  Customers: require('../../../assets/v4/art/header_customers.png'),
  Company: require('../../../assets/v4/art/header_company.png'),
}
export const sceneArt = {
  rank: require('../../../assets/v4/art/scene_rank.png'),
  awards: require('../../../assets/v4/art/scene_award.png'),
  title: require('../../../assets/v4/art/title.png'),
}
