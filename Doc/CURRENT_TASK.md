# TECH_DEBT Cleanup — COMPLETE (2026-06-13)

Branch: `feature/tech-debt-cleanup` (off energy-transition-era). Last item
of this session's 4-item priority punch list.

## What shipped
- Removed AWARDS_BALANCE.thresholdGrowthPerYear (dead config, never read by
  getAwardGrade). DECISION: static gradeThresholds are intentional — rivals
  already calibrated against them; ESG + Energy Transition era already add
  late-game pressure, a 3rd rising-bar system would be redundant.
- .resource-grid: repeat(8, minmax(0,1fr)) -> repeat(auto-fit,
  minmax(140px,1fr)). Fixes the 9th-card (ESG Score) layout break, scales to
  any count permanently.
- TECH_DEBT.md: both entries moved to Resolved with rationale.

## Verification
build/lint/tsc + dev server clean. No new assertions needed (config/CSS
only); all 233 prior pass.

## Session status: ALL 4 PRIORITY ITEMS DONE
1. Post-Phase-3 balance pass (no changes needed)
2. ESG/Safety axis
3. Energy Transition era (demand shift)
4. TECH_DEBT cleanup (this branch)

## Recommended next
Merge all outstanding feature branches to main:
post-phase3-balance-pass, esg-safety-axis, energy-transition-era,
tech-debt-cleanup (this session's chain), plus the earlier Individual Staff
branches (individual-employees, staff-training-choice, staff-veteran-trait,
staff-assignments — already merged per prior session). Confirm linear
ancestry and fast-forward.
