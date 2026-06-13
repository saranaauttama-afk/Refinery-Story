# Individual Staff, Phase 2a — COMPLETE (2026-06-13)

Branch: `feature/staff-training-choice` (off individual-employees).

## What shipped
- StaffPanel: per-employee roster rows (name, level badge, bonus %, XP bar,
  Train button or MAX badge) replace the single auto-pick "currently
  training" block.
- handleTrainEmployee(employeeId) replaces handleTrainWorker(worker) — player
  picks WHO to train; cost based on that employee's own level.
- Removed dead trainingLabel/roster translations and .staff-roster /
  .staff-level-block CSS (replaced by .staff-roster-list / .staff-employee-row).
- Passive XP (concentrated training) unchanged.

## Verification
build/lint/tsc + dev server clean. 6 new assertions + 144 prior = 150 total
pass.

## Recommended next (Doc/INDIVIDUAL_STAFF_ROADMAP.md)
- Phase 2b: retirement/turnover — needs design discussion before implementing.
- Phase 3: assign employees to specific plants (feedstock-chain payoff).
- Phase 4: traits/veteran/legendary hires.
- TECH_DEBT: thresholdGrowthPerYear decision (open since rival-refineries).
- Watch: per-type roster list could get long with no hiring cap — revisit if
  it becomes a real UX problem.
