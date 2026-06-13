# Individual Staff, Phase 3 (Assign Specialists to Plants) — COMPLETE (2026-06-13)

Branch: `feature/staff-assignments` (off staff-veteran-trait). Scoped to the
2 existing specialist mechanics (aviationSpecialist/jetFuelPlant,
chemicalEngineer/petrochemicalPlant) per Doc/INDIVIDUAL_STAFF_ROADMAP.md.

## What shipped
- GameState.assignments: Partial<Record<WorkerType, string[]>> — employee IDs
  assigned per specialist type, capacity = plant building count.
- getAssignmentCapacity(buildingCounts, type), getSpecialistMultiplier(game,
  plant, plantCount) — new formula: 1 + sum(getEmployeeMultiplier(assigned) *
  specialistBonusRate), capped at plant count. Unassigned = 0 contribution.
- App.tsx tick loop uses getSpecialistMultiplier; new handleToggleAssignment.
- StaffPanel: 'Assigned to plants: X/Y' header + per-employee Assign/Unassign
  button + '📌 Assigned' badge.
- countBuildings exported; getSafeAssignments in gameStorage auto-assigns in
  hire order up to capacity when missing/empty (no sudden cliff for old
  saves), sanitizes to valid employee IDs of the correct type.

## Verification
build/lint/tsc + dev server clean. 14 new assertions + 163 prior = 177 total
pass.

## Recommended next (Doc/INDIVIDUAL_STAFF_ROADMAP.md)
- Phase 2b (retirement/turnover) if/when desired.
- Extend assignment to other worker types (needs defining per-plant meaning
  for each type first).
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
