# Individual Staff, Phase 1 — COMPLETE (2026-06-13)

Branch: `feature/individual-employees` (off hidden-combos). All 6 work-plan
tasks done. See Doc/INDIVIDUAL_STAFF_ROADMAP.md for the full design + Phases
2-4 (per-employee training choice, retirement, assigning employees to plants,
traits/legendary hires).

## What shipped
- `Employee {id, type, name, level, xp}`, `GameState.employees: Employee[]`
  replaces workerLevels/workerXp/workerNames. workerCounts kept (invariant
  maintained at every mutation site: hire + 2 choice-event free-hire spots).
- `getEffectiveWorkerSum`, `getTrainingTarget`, `getEmployeesByType` helpers.
- "Concentrated training": applyStaffXp gives a type's full per-tick XP
  budget to its lowest-level employee — aggregate rate unchanged, individuals
  level up in sequence.
- New hires start at level 1 (intentional balance shift toward "build your
  team early").
- getYearlyPayroll + getTrainingCost/handleTrainWorker operate per-employee.
- Save migration: old shared-level saves -> employees, effectiveWorkers
  numerically identical immediately post-migration. New-shape round-trips.
- StaffPanel + WorkerPresenceBar show individual names/levels;
  staffLevelUp/staffTrained logs name the employee.

## Verification
build/lint/tsc + dev server clean. 24 new assertions + 120 prior = 144 total
pass (staffnames.test.ts rewritten for the new model, +2 net vs before).

## Recommended next
- Phase 2/3/4 per roadmap — Phase 3 (assign employees to plants) is the real
  payoff and ties into the feedstock process chain.
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
