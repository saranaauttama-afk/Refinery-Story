# Gameplay Systems Expansion — Staff Levels, Perk Tree, Tech Eras, Annual Awards

## Goal

Add four Kairosoft-style systems to deepen progression and fun beyond the product
economy. All save-compatible, all reusing existing patterns.

See GAMEPLAY_SYSTEMS_EXPANSION.md for full design rationale.

## Systems

1. **Staff Training & Levels** — per-type crew Level 1–5 + XP bar; level scales
   bonus effectiveness (×1.0 → ×1.6); pay money + RP to train instantly.
2. **Refinery Upgrade Perk Tree** — 1 upgrade point per refinery level-up;
   spend on Efficiency / Capacity / Quality branches (3 tiers each, directional).
3. **Tech Eras** — Foundation → Expansion → Modern; advance on research + level
   thresholds; cumulative sell-price and RP bonuses; one-time banner.
4. **Annual Awards** — 12-minute business year, weighted S/A/B/C grade, cash +
   reputation reward, ceremony modal, rolling history.

## Files

New: data/perks.ts, data/eras.ts, components/RefineryUpgradesPanel.tsx,
components/EraPanel.tsx, components/AwardsPanel.tsx, components/AwardCeremonyModal.tsx

Changed: types.ts, data/balance.ts, data/milestones.ts (n/a), utils/gameCalculations.ts,
utils/gameStorage.ts, components/StaffPanel.tsx, App.tsx, App.css, translations.ts

## Status — COMPLETE (2026-06-12)

Build ✓, eslint ✓, tsc ✓. 48 unit assertions pass (systems + save migration).
Dev server serves without errors.

## Manual Testing

1. `npm run dev`
2. Hire 2–3 operators → watch the XP bar fill in StaffPanel; crew levels up and
   production speeds up. Try the Train button (needs money + RP).
3. Upgrade refinery (DevTools or contracts) → spend the upgrade point in
   Refinery Upgrades; confirm production/storage/sell-price changes.
4. DevTools: set level 10 + unlock research → Era panel shows Expansion/Modern
   progress; a banner logs on entering a new era.
5. Wait ~12 min (or lower AWARDS_BALANCE.yearLengthTicks for testing) → awards
   ceremony modal fires with a grade and prize; history fills.
6. Reload mid-game → all state (levels, XP, perks, year progress) persists; old
   saves load with defaults.
