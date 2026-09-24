# CURRENT TASK — Refinery Story 1.0 Release Candidate

## Goal

Finish the approved Modern Pixel UI and the first gameplay fun pass, preserve
existing saves, verify the full progression loop, then publish one final APK.

## Completed Scope

1. Factory: compact HUD, anchored isometric build grid, camera controls, clear
   build mode, live profit/output rail, and bottleneck feedback.
2. Operations: illustrated control room, production flow, process detail,
   staff/efficiency, upgrades, trade, supply orders, and automation.
3. Business: illustrated commercial office, deal summary, Deal Desk, grouped
   contracts, rush orders, and contract completion flow.
4. Team: illustrated crew room, live staffing summary, recruitment, training,
   skills, retirement warnings, and per-plant assignment.
5. HQ screens: Research, Achievements, Company, and Settings use the same dark
   pixel UI; the unfinished Store remains visible as `LATER`.
6. Fun pass: new games start with a working Crude Tank + Distillation Unit,
   onboarding teaches decisions instead of mandatory setup, and Auto Trade is
   earned at Refinery Lv3.
7. Reliability: corrected the save export storage key; existing save sanitation
   and migration remain intact.

## Final Release Gates

- TypeScript clean
- Full progression/balance regression clean
- Camera math regression clean
- Expo bundle export clean
- Git diff whitespace clean
- Android bundled release APK succeeds from the final commit

## Release Policy

No milestone APKs. Build once after every release gate passes.

Build marker: `REFINERY-STORY-1.0-RC`.

Native release event: final Android candidate.
