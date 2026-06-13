# Energy Transition Era: Demand Shift — COMPLETE (2026-06-13)

Branch: `feature/energy-transition-era` (off esg-safety-axis). BACKLOG
"Strategic Differentiation #2".

## What shipped
- 4th era `energyTransition` (ERAS[3], index 3): requires 10 research + level
  18. +30% sell price / +40% RP (largest flat bonus yet) AND
  `demandShift: true`.
- GameState.gasolineDemandMultiplier / petrochemicalsDemandMultiplier (both
  start 1.0). getDemandShiftDelta(currentEra): zero unless demandShift, then
  gasoline -shiftPerTick (0.0001), petrochemicals +shiftPerTick. Applied +
  clamped each tick in App.tsx: gasoline -> floor 0.7 (only falls),
  petrochemicals -> ceiling 1.3 (only rises). Monotonic.
- getProductSellPrice gained an optional demandMultiplier param (default 1,
  no behavior change for jetFuel/lubricants). Gasoline's sellPrice formula
  and petrochemicals' price (App.tsx + handleSellPetrochemicals) now use
  these.
- EraPanel: dynamic '/4' badge (ERAS.length), energyTransition badge color,
  new 'Market Shift' section showing live demand % when in this era.
- Save migration: default 1.0, clamp gasoline to [0.7,1], petrochemicals to
  [1,1.3].

## Verification
build/lint/tsc + dev server clean. 31 new assertions + 202 prior = 233 total
pass.

## Recommended next
TECH_DEBT cleanup: thresholdGrowthPerYear decision (open since
rival-refineries) -- last item in this session's priority list, then merge
everything to main.
