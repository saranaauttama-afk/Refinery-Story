# Perk Branch Diversity Pass — COMPLETE (2026-06-13)

Branch: `feature/perk-diversity-pass` (off tech-debt-cleanup). BACKLOG
"Strategic Differentiation #3".

## What shipped
- FOUND: Efficiency branch (efficiency1/2/3, all 6 points) was 100% DEAD
  from ~refineryLevel 8 onward -- productionInterval already at the 180ms
  floor before perks apply, so the /perkProductionMultiplier divisor did
  nothing. Verified via simulation.
- FIX: repurposed efficiency's `production` values (unchanged: 0.10/0.15/
  0.25) into a gasoline YIELD multiplier (extra gasoline per batch of crude,
  no floor). New GameState.gasolineYieldCarry accumulates fractional yield
  so small bonuses materialize correctly over time (verified: +10%/+50%
  exactly over 1000 ticks).
- FOUND: capacity2/3's `crudeDiscount` (0.05/0.10) was computed
  (perkCrudeDiscountRate) but never applied anywhere -- dead since added.
- FIX: redistributed into `storage`: capacity1/2/3 now 0.10/0.20/0.35 (total
  0.65, was effectively 0.50). Removed the dead field + DerivedStats export.
- Updated perk descriptions (efficiency: 'gasoline yield per batch';
  capacity2/3: storage % only, no crude-discount mention).
- Save migration: gasolineYieldCarry defaults to 0, clamped [0,1].

## Resulting identities
Efficiency = early-game/snowball (gasoline yield, gasoline ~26% of revenue
and declining). Quality = late-game/universal (+35% all sell prices).
Capacity = bulk-buying/AFK-resistant (+65% storage).

## Verification
build/lint/tsc + dev server clean. 21 new assertions + 233 prior = 254 total
pass.

## Recommended next
Strategic Differentiation #4: Seasonal price/demand volatility within a
business year.
