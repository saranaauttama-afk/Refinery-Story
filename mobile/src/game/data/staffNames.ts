// Curated, original first-name pool used to give hired staff a little
// identity in the StaffPanel roster. Cycled per worker type by hire order
// (pool[index % length]), so the same name can recur across types — that's
// fine, it's flavor text, not unique-identity tracking.
export const STAFF_NAME_POOL: string[] = [
  'Mara', 'Theo', 'Priya', 'Diego', 'Naomi', 'Felix', 'Aiko', 'Marcus',
  'Lena', 'Samir', 'Greta', 'Kofi', 'Yuki', 'Hassan', 'Ines', 'Tomas',
  'Zara', 'Owen', 'Noor', 'Pavel', 'Bea', 'Ravi', 'Sina', 'Eli',
  'Tess', 'Amir', 'Lucia', 'Niko', 'Wren', 'Dara',
]

export function getStaffName(index: number): string {
  return STAFF_NAME_POOL[index % STAFF_NAME_POOL.length]
}
