# Individual Staff, Phase 4 (Veteran Trait) — COMPLETE (2026-06-13)

Branch: `feature/staff-veteran-trait` (off staff-training-choice). Phase 2b
skipped (not a dependency, deferred pending design discussion).

## What shipped
- Employee.trait?: 'veteran' (extensible for future traits).
- STAFF_LEVEL_BALANCE.veteranHireChance (5%) + veteranBonusRate (+20%, flat,
  stacks with level multiplier).
- getEmployeeMultiplier(employee) = getWorkerLevelMultiplier(level) +
  veteran bonus; getEffectiveWorkerSum now uses it (production/sales bonuses
  reflect veterans).
- createNewEmployee(employees, type) helper shared by hire handler + 2
  choice-event free-hire spots — rolls trait, names from pool, level1/xp0.
- StaffPanel: "⭐ Veteran" badge per employee row; bonus % reflects the boost.
- Hire log gets a flavor line when a veteran is hired.
- Save migration: trait round-trips for new-shape saves, sanitized to
  'veteran'|undefined; old-shape migrated employees never get veteran
  (feature predates them).

## Verification
build/lint/tsc + dev server clean. 13 new assertions + 150 prior = 163 total
pass.

## Recommended next (Doc/INDIVIDUAL_STAFF_ROADMAP.md)
- Phase 3: assign employees to specific plants (feedstock-chain payoff) —
  the big remaining piece.
- Phase 2b: retirement/turnover, if/when desired (needs design discussion).
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
