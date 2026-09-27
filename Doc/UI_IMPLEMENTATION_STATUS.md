# UI Implementation Status

## Project Context

Refinery Story is an Expo / React Native mobile game. This repository is the app root. The current UI effort is focused on turning the game from a utilitarian prototype layout into a clearer mobile-first management game with stronger screen separation and better grid readability.

This branch does not introduce new gameplay systems. The work so far is UI architecture, layout cleanup, derived-state presentation, and early visual language for the Factory map.

## Branch Context

- Branch: `feature/ui-skeleton-v1`
- Intent: establish the new mobile navigation structure and begin the long-term visual direction for the Factory grid
- Scope so far:
  - new top-level tab architecture
  - Factory information hierarchy cleanup
  - Production screen extraction and operational summaries
  - first-pass building identity and silhouette presentation

## Current UI Architecture

The app currently follows a 5-tab bottom navigation structure:

- Factory
  - main refinery gameplay screen
  - grid, build flow, inspect flow, goal card, core buy/sell actions
- Production
  - production overview
  - production health
  - bottlenecks
  - inventory
  - automation
- Staff
  - existing staff screen remains active
- Business
  - existing business screen remains active
- HQ
  - placeholder progression shell for future research/awards/settings consolidation

`Stats` still exists in code but is hidden from the bottom tab bar.

## Current Screen Map

- [app/game/(tabs)/index.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/index.tsx)
  - Factory gameplay
- [app/game/(tabs)/production.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/production.tsx)
  - Production management
- [app/game/(tabs)/staff.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/staff.tsx)
  - Staff management
- [app/game/(tabs)/business.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/business.tsx)
  - Business/contracts/shipments
- [app/game/(tabs)/hq.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/hq.tsx)
  - HQ placeholder
- [app/game/(tabs)/stats.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/stats.tsx)
  - hidden from tabs, still present
- [app/game/(tabs)/_layout.tsx](/d:/My%20App/Refinery-Story/app/game/(tabs)/_layout.tsx)
  - bottom tab shell

## What Changed In This Branch

### Navigation Foundation

- Replaced the older tab structure with:
  - Factory
  - Production
  - Staff
  - Business
  - HQ
- Hid the old Stats tab from the visible bottom nav without deleting the file.
- Adopted a compact floating tab bar style.

### Factory Cleanup

- Reduced top-of-screen density.
- Prioritized only core always-visible resources:
  - Money
  - Crude
  - Gasoline
- Moved time into the header.
- Compressed the goal card.
- Added a secondary expandable info area for lower-priority stats.
- Increased visible emphasis on the building grid.

### Production Extraction

- Removed Production Overview from Factory.
- Moved inventory and automation surfaces into Production.
- Preserved Factory’s short-loop focus:
  - grid
  - build
  - inspect
  - goal
  - buy crude
  - sell gas

### Production Health Layer

- Added `Production Health` at the top of Production.
- Added `Bottlenecks` below it.
- Derived-state messaging now helps answer:
  - what is helping output
  - what is blocking output

### Factory Visual Layer

- Added building identity foundations:
  - building icons
  - category accents
  - level badges
  - staff badges
  - warning badges
- Added building silhouette presentation:
  - tank-like storage shapes
  - distillation tower silhouette
  - compact production-plant silhouettes
  - lab/support/power/waste family silhouettes
- Building abbreviations are now tiny secondary labels, not the main identity.

## Design Principles Being Followed

- Gameplay first: Factory should stay focused on the core loop and the grid.
- Information hierarchy before polish: move systems to the correct screen before adding visual complexity.
- Mobile readability: fewer large dashboard blocks, tighter scanning, short labels, no horizontal overflow.
- Derived display only: operational summaries should explain state without introducing new saved data.
- Visual clarity over art fidelity: use icons, silhouettes, tint, and shape language before pixel art or isometric rendering.
- Preserve existing game logic: UI changes should not change balance, formulas, or save format.

## Current Screenshots Status

No curated screenshot pack exists for this branch yet.

Textual state of the UI right now:

- Factory
  - floating 5-tab shell
  - compact top header with refinery name/level and time
  - primary resource row
  - compact goal card
  - expandable secondary info
  - larger central grid
  - building tiles now read as soft, colored refinery objects with badges
- Production
  - operational health cards at the top
  - real overview/inventory/automation content below
- HQ
  - still placeholder cards only

## Known UX Concerns

- Factory has a better hierarchy now, but the build/inspect experience is still mostly utilitarian and modal-driven.
- Production is clearer than before, but still reads more like a structured management panel than a playful simulation screen.
- HQ is only a placeholder and does not yet support the intended progression fantasy.
- Staff and Business screens are functionally preserved but have not been visually brought up to the same standard as the Factory tile work.
- No screenshot baseline means future sessions may unintentionally drift the visual direction.

## Known Technical Warnings

- Require cycle warning:
  - `src/game/utils/gameCalculations.ts -> src/game/data/recruitment.ts -> src/game/utils/gameCalculations.ts`
- Expo warning:
  - Linking requires a build-time setting `scheme` in the project's Expo config
- Local shell note:
  - direct `npm run ...` in PowerShell may fail on this machine because `npm.ps1` is blocked by execution policy
  - `cmd /c npm run typecheck` was used successfully for verification
- Expo / emulator issue observed:
  - Android emulator sometimes shows `System UI isn't responding`
  - Android emulator sometimes shows `Cannot connect to Expo CLI`
  - currently treated as likely emulator / Expo connection instability unless new evidence appears

## Next Implementation Plan

Recommended next sequence after this handoff:

1. Visual Layer Phase 3: Road / Pipe Layer Foundation
2. Visual Layer Phase 4: Light animation pass
3. Staff / Business / HQ visual consistency pass
4. Kairosoft-feel pass:
   - moving workers
   - truck / shipment motion
   - smoke / spark / production feedback
   - sound / haptic polish

Historical note:

- The originally queued `Visual Layer Phase 2 - Building Silhouette System` task has already been implemented on this branch’s working tree and should be treated as complete unless reverted.
