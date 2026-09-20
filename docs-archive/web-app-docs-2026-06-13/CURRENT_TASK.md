# Seasonal Demand Volatility — COMPLETE (2026-06-13)

> ⚠️ **This file describes the `src/` web app only, last updated
> 2026-06-13. If you're looking for the CURRENT current task, the active
> codebase as of 2026-06-15 is `mobile/` (Expo app, `devMobile` branch) --
> go read `mobile/README.md`'s "START HERE" section at the top instead.
> This file is kept for `src/` historical reference but is not the
> up-to-date entry point for the project as a whole.**

Branch: `feature/seasonal-volatility` (off perk-diversity-pass). BACKLOG
"Strategic Differentiation #4" -- last item of this session.

## What shipped
- getSeasonalGasolineMultiplier(tickCount, yearStartTick): sine wave over
  one business year (3600 ticks), range [0.85, 1.15]
  (SEASONAL_BALANCE.amplitude=0.15). Purely derived, no new state/migration.
- Multiplies into gasoline's sellPrice formula (composes with the Energy
  Transition gasolineDemandMultiplier -- short-term swing on long-term
  trend).
- getSeasonLabel(tickCount, yearStartTick): 4 flavor labels by sine quadrant
  (Demand Rising / Peak Season / Demand Cooling / Off-Season).
- StatsPanel: new 'Gasoline Season' row (label + % of base price).
- DerivedStats.seasonalGasolineMultiplier exported.

## Verification
build/lint/tsc + dev server clean. 17 new assertions + 254 prior = 271 total
pass.

## Session status: BACKLOG Strategic Differentiation 4/4 DONE
ESG axis, Energy Transition era, Perk diversity, Seasonal volatility -- all
shipped this session (on top of the full Individual Staff roadmap from the
prior session).

## Recommended next
Merge feature/perk-diversity-pass and feature/seasonal-volatility to main
(linear chain off the already-merged tech-debt-cleanup). Then: discuss
further direction with user (Phase 2b retirement/turnover, extending
specialist assignment to other worker types, or mobile UI pass -- all
previously deferred).
