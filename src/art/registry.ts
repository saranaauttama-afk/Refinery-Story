import type { ImageSourcePropType } from 'react-native'

// ── Art registry ────────────────────────────────────────────────────────────
// Single source of truth that maps an art slot id → a bundled image.
//
// Every <ArtSlot id="..."> in the app looks up its id here. While an id is
// absent (or commented out) the slot renders a labelled placeholder showing the
// id and the target pixel size; the moment you add the real image it swaps in —
// no screen code changes needed.
//
// To add a generated image:
//   1. Drop the PNG into  assets/art/<id>.png  (exact id, see ASSETS_NEEDED.md)
//   2. Uncomment / add its line below.
//
// Metro requires a *static* require() string, which is why each asset needs its
// own literal line here rather than a path built at runtime.
export const ART: Partial<Record<string, ImageSourcePropType>> = {
  // ── Front menu ──
  // menu_hero: require('../../assets/art/menu_hero.png'),

  // ── Gameplay tab headers ──
  // contracts_header: require('../../assets/art/contracts_header.png'),
  // supply_header: require('../../assets/art/supply_header.png'),
  // recruit_header: require('../../assets/art/recruit_header.png'),
  // research_header: require('../../assets/art/research_header.png'),
  // company_header: require('../../assets/art/company_header.png'),

  // ── Empty-state illustrations ──
  // contracts_empty: require('../../assets/art/contracts_empty.png'),
  // team_empty: require('../../assets/art/team_empty.png'),

  // ── Misc screens ──
  // achievements_hero: require('../../assets/art/achievements_hero.png'),
}
