# CURRENT_TASK

## Branch Name

`feature/ui-skeleton-v1`

## Current Task Status

- UI foundation and first visual-grid direction are implemented on the current branch.
- Documentation handoff has been refreshed for branch continuation.
- Typecheck is passing at the time of this update.
- Manual QA has not been fully re-run end-to-end after every recent UI pass, so visual verification is still needed on device/emulator.

## What Has Been Completed

- UI Foundation Phase 1: 5-tab navigation skeleton
  - Factory
  - Production
  - Staff
  - Business
  - HQ
- Stats tab removed from bottom navigation but left in code for internal access.
- UI Foundation Phase 2A: Factory cleanup / grid-first layout
  - compact header
  - primary resources only
  - time moved into header
  - goal card compressed
  - grid made more prominent
- UI Foundation Phase 2B: Production extraction
  - Production Overview moved out of Factory
  - non-gasoline inventory surfaced in Production
  - Automation moved to Production
  - Factory now focuses on grid, goal, and buy/sell core loop
- UI Foundation Phase 2C: Production health and bottlenecks
  - Production Health card
  - Bottlenecks card
  - Production now explains operational problems using derived state only
- Visual Layer Phase 1: Building identity
  - building icons
  - category accents
  - level badges
  - staff/status badge foundations
- Visual Layer Phase 2: Building silhouette system
  - abbreviation-first tiles reduced to tiny secondary labels
  - building-family silhouettes added
  - tile platform/body treatment added
  - badge layout standardized

## What Has Not Been Completed

- HQ is still a placeholder screen, not a real progression hub yet.
- Production is only partially mature; it now explains health and bottlenecks, but deeper production-management UX is still minimal.
- Business and Staff keep their existing functional screens and have not yet received a dedicated visual polish pass in this branch.
- Visual Layer Phase 3 and beyond are not done:
  - road / pipe layer
  - light animation pass
  - worker/truck/environment feedback
  - Kairosoft-style moment-to-moment polish
- No screenshot set or visual QA capture pack exists yet for this branch.

## Files Changed So Far

- [PROJECT_UI_AUDIT.md](/d:/My%20App/Refinery-Story/PROJECT_UI_AUDIT.md)
- [README.md](/d:/My%20App/Refinery-Story/README.md)
- [Doc/UI_BLUEPRINT_V1.md](/d:/My%20App/Refinery-Story/Doc/UI_BLUEPRINT_V1.md)
- [Doc/UI_IMPLEMENTATION_STATUS.md](/d:/My%20App/Refinery-Story/Doc/UI_IMPLEMENTATION_STATUS.md)
- [Doc/UI_ROADMAP.md](/d:/My%20App/Refinery-Story/Doc/UI_ROADMAP.md)
- [Doc/NEXT_TASK.md](/d:/My%20App/Refinery-Story/Doc/NEXT_TASK.md)
- [CURRENT_TASK.md](/d:/My%20App/Refinery-Story/CURRENT_TASK.md)
- [app/game/(tabs)/_layout.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/_layout.tsx)
- [app/game/(tabs)/index.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/index.tsx)
- [app/game/(tabs)/production.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/production.tsx)
- [app/game/(tabs)/hq.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/hq.tsx)
- [src/components/BuildingGrid.tsx](/d:/My%20App/Refinery-Story/src/components/BuildingGrid.tsx)
- [src/components/BuildingTile.tsx](/d:/My%20App/Refinery-Story/src/components/BuildingTile.tsx)
- [src/components/BuildingSilhouette.tsx](/d:/My%20App/Refinery-Story/src/components/BuildingSilhouette.tsx)
- [src/buildingIdentity.ts](/d:/My%20App/Refinery-Story/src/buildingIdentity.ts)
- [src/theme.ts](/d:/My%20App/Refinery-Story/src/theme.ts)
- [app.json](/d:/My%20App/Refinery-Story/app.json)
- [package.json](/d:/My%20App/Refinery-Story/package.json)
- [package-lock.json](/d:/My%20App/Refinery-Story/package-lock.json)
- [.gitignore](/d:/My%20App/Refinery-Story/.gitignore)
- [eas.json](/d:/My%20App/Refinery-Story/eas.json)

## Known Issues

- Require cycle warning still exists:
  - `src/game/utils/gameCalculations.ts -> src/game/data/recruitment.ts -> src/game/utils/gameCalculations.ts`
- Expo warning still exists:
  - Linking requires a build-time `scheme` in Expo config.
- Emulator / Expo connection instability has been observed:
  - Android emulator may show `System UI isn't responding`
  - Expo may show `Cannot connect to Expo CLI`
  - treat this as likely emulator / Expo connection instability unless new evidence points to app code
- No branch-level screenshot baseline exists yet, so visual regressions are harder to compare across sessions.
- `Stats` screen still exists in code and is hidden from tabs, which is intentional for now but not final IA cleanup.
- On this Windows environment, direct `npm run ...` from PowerShell may fail because `npm.ps1` is blocked by execution policy. `cmd /c npm run typecheck` works and is the verified command path used here.

## Manual Test Status

- `npm run typecheck` via PowerShell: failed because local Windows execution policy blocks `npm.ps1`
- `cmd /c npm run typecheck`: passed
- App launch: not re-verified in this documentation pass
- Continue / New Game opening Factory: not re-verified in this documentation pass
- 5 bottom tabs visible: not re-verified in this documentation pass
- Factory gameplay flow: previously preserved by implementation intent, but not re-verified in this documentation pass
- Production Health / Bottlenecks: not re-verified in this documentation pass
- Silhouette tile readability: not re-verified in this documentation pass

## Next Recommended Task

Visual Layer Phase 3: Road / Pipe Layer Foundation

- Add quiet non-interactive connective language between buildings.
- Keep gameplay unchanged.
- Keep save format unchanged.
- Do not add trucks, workers, smoke, or animation yet.
- Build on the current silhouette-based tiles rather than replacing them.
