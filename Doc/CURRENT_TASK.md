# ESG / Safety Axis — COMPLETE (2026-06-13)

Branch: `feature/esg-safety-axis` (off post-phase3-balance-pass). BACKLOG
"Strategic Differentiation #1".

## What shipped
- GameState.esgScore: number (0-100, starts 50). Per-tick drift via
  getEsgDrift(game, buildingCounts): -decayPerDirtyBuildingPerTick (0.003)
  per ESG_DIRTY_BUILDINGS (crudeTank, distillationUnit, lubricantPlant,
  jetFuelPlant, petrochemicalPlant), +regenPerSafetyOfficerPerTick (0.007)
  per effective safetyOfficer (getEffectiveWorkerSum).
- 4 events (minorLeak, equipmentWear, storageContamination,
  distillationHiccup) flagged RandomEvent.isIncident: true.
- getIncidentChance(esgScore): ~25% @ 50, floor 5% @ 100, ceiling 45% @ 0.
  getRandomEvent now does an incident-vs-other weighted split.
- contractRewardMultiplier gets +10% (esgContractRewardMultiplier) when
  esgScore >= premiumThreshold (70).
- getEsgTier(esgScore) -> Poor/Fair/Good/Excellent for UI.
- ResourcePanel: new ESG Score card (XX/100 · Tier + description).
- DevTools: 'Toggle ESG (0/100)' button.
- Save migration: missing -> 50, clamp to [0,100].

## Verification
build/lint/tsc + dev server clean. 25 new assertions + 177 prior = 202 total
pass.

## Recommended next (BACKLOG strategic differentiation)
- Eras that shift the meta (demand restructuring, not just bonuses).
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
