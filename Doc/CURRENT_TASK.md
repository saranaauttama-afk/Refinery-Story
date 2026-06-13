# Hidden/Discoverable Combos — COMPLETE (2026-06-13)

Branch: `feature/hidden-combos` (off rival-refineries). Background task, all
6 work-plan tasks done.

## What shipped
- `data/hiddenCombos.ts`: 5 one-time combos (3 distinct building types in any
  3-consecutive-cell row/column run, order-independent), cash/RP/reputation
  rewards, not documented in-game.
- `getNewlyDiscoveredCombos(grid, discovered)` in gameCalculations.ts — scans
  all horizontal/vertical 3-runs each tick.
- GameState.discoveredCombos: string[] — one-time per save. Save migration
  defaults [] and filters to known keys.
- ComboDiscoveryToast component (reuses era-banner-toast pattern, teal,
  stacks below era banner if both fire). Queue supports multiple at once.
- text.logs.comboDiscovered/comboToastTitle/comboToastReward translations.

## Verification
build/lint/tsc clean, dev server clean. 15 new assertions + 101 prior = 116
total pass.

## Recommended next (from BACKLOG "Next Session")
- #2: Scoped-down star employees (~5% chance on hire, permanent small perk +
  star marker in roster).
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
