import type { BilingualTextValue, PrestigePerkKey } from '../types'
import { bilingual } from '../translations'
import { PRESTIGE_PERK_BALANCE } from './balance'

export type { PrestigePerkKey }

// Prestige Perks — a permanent, one-per-prestige choice. Each perk is picked at
// most once (owned perks are removed from the offered pool), so the decision
// gets more pointed the more times you prestige. Effects stack with the flat
// per-level prestige bonus and persist across every future New Game+.
//
// Adding a perk is: add a key to PrestigePerkKey (types.ts) + its magnitude in
// PRESTIGE_PERK_BALANCE, an entry here, then wire its effect into
// getPrestigePerkEffects() below (the single place the rest of the code reads
// perk power from).
export type PrestigePerkConfig = {
  key: PrestigePerkKey
  icon: string
  name: BilingualTextValue
  flavor: BilingualTextValue
}

export const PRESTIGE_PERKS: PrestigePerkConfig[] = [
  {
    key: 'refinedProcess',
    icon: '⚙️',
    name: bilingual('Refined Process', 'กระบวนการขั้นสูง'),
    flavor: bilingual(
      `+${Math.round(PRESTIGE_PERK_BALANCE.refinedProcessOutputBonus * 100)}% output on everything, forever.`,
      `เพิ่มผลผลิตทุกอย่าง +${Math.round(PRESTIGE_PERK_BALANCE.refinedProcessOutputBonus * 100)}% ตลอดไป`,
    ),
  },
  {
    key: 'marketMaven',
    icon: '📈',
    name: bilingual('Market Maven', 'เซียนตลาด'),
    flavor: bilingual(
      `+${Math.round(PRESTIGE_PERK_BALANCE.marketMavenSellBonus * 100)}% on every product sale price.`,
      `ราคาขายสินค้าทุกชนิด +${Math.round(PRESTIGE_PERK_BALANCE.marketMavenSellBonus * 100)}%`,
    ),
  },
  {
    key: 'leanCrew',
    icon: '👷',
    name: bilingual('Lean Crew', 'ทีมงานคุ้มค่า'),
    flavor: bilingual(
      `-${Math.round(PRESTIGE_PERK_BALANCE.leanCrewWageReduction * 100)}% payroll every year.`,
      `ค่าจ้างพนักงานต่อปี -${Math.round(PRESTIGE_PERK_BALANCE.leanCrewWageReduction * 100)}%`,
    ),
  },
  {
    key: 'greenLegacy',
    icon: '🌱',
    name: bilingual('Green Legacy', 'มรดกสีเขียว'),
    flavor: bilingual(
      `+${Math.round(PRESTIGE_PERK_BALANCE.greenLegacyRegenBonus * 100)}% ESG recovery from safety officers.`,
      `การฟื้นค่า ESG จากเจ้าหน้าที่ความปลอดภัย +${Math.round(PRESTIGE_PERK_BALANCE.greenLegacyRegenBonus * 100)}%`,
    ),
  },
  {
    key: 'frugalUpkeep',
    icon: '🔧',
    name: bilingual('Frugal Upkeep', 'ประหยัดค่าบำรุง'),
    flavor: bilingual(
      `-${Math.round(PRESTIGE_PERK_BALANCE.frugalUpkeepReduction * 100)}% annual maintenance cost.`,
      `ค่าบำรุงรักษาต่อปี -${Math.round(PRESTIGE_PERK_BALANCE.frugalUpkeepReduction * 100)}%`,
    ),
  },
  {
    key: 'warChest',
    icon: '💰',
    name: bilingual('War Chest', 'กองทุนตั้งต้น'),
    flavor: bilingual(
      `Start every future run with $${PRESTIGE_PERK_BALANCE.warChestStartingCash.toLocaleString()} extra.`,
      `เริ่มเกมใหม่ทุกครั้งด้วยเงินเพิ่ม $${PRESTIGE_PERK_BALANCE.warChestStartingCash.toLocaleString()}`,
    ),
  },
]

const PERK_BY_KEY: Record<string, PrestigePerkConfig> = Object.fromEntries(
  PRESTIGE_PERKS.map((p) => [p.key, p]),
)

export function getPrestigePerkConfig(key: PrestigePerkKey): PrestigePerkConfig | undefined {
  return PERK_BY_KEY[key]
}

// The perks NOT yet owned — the pool offered at the next prestige. Once every
// perk is owned this is empty and prestige just bumps the level (no choice).
export function getAvailablePrestigePerks(owned: PrestigePerkKey[]): PrestigePerkConfig[] {
  const ownedSet = new Set(owned)
  return PRESTIGE_PERKS.filter((p) => !ownedSet.has(p.key))
}

export type PrestigePerkEffects = {
  outputBonus: number         // added to the prestige output multiplier
  sellPriceBonus: number      // added to the product sell-price multiplier
  wageReduction: number       // fraction cut from annual payroll
  esgRegenBonus: number       // fraction added to safety-officer ESG regen
  maintenanceReduction: number // fraction cut from annual maintenance
  startingCash: number        // extra cash on a fresh prestige run
}

// Single source of truth for what the owned perks are worth. Every consumer
// (derived stats, payroll, ESG drift, maintenance, prestigeGame) reads from
// here so a new perk only needs wiring in one place.
export function getPrestigePerkEffects(owned: PrestigePerkKey[] | undefined): PrestigePerkEffects {
  const set = new Set(owned ?? [])
  return {
    outputBonus: set.has('refinedProcess') ? PRESTIGE_PERK_BALANCE.refinedProcessOutputBonus : 0,
    sellPriceBonus: set.has('marketMaven') ? PRESTIGE_PERK_BALANCE.marketMavenSellBonus : 0,
    wageReduction: set.has('leanCrew') ? PRESTIGE_PERK_BALANCE.leanCrewWageReduction : 0,
    esgRegenBonus: set.has('greenLegacy') ? PRESTIGE_PERK_BALANCE.greenLegacyRegenBonus : 0,
    maintenanceReduction: set.has('frugalUpkeep') ? PRESTIGE_PERK_BALANCE.frugalUpkeepReduction : 0,
    startingCash: set.has('warChest') ? PRESTIGE_PERK_BALANCE.warChestStartingCash : 0,
  }
}
