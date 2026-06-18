# CURRENT_TASK

## Branch Name

`feature/ui-skeleton-v1`

## Current Task

**Factory Scene Layout v1 — Layered Composition**

## Why the Previous Stacked Scene Was Rejected

The first "scene" attempt (commit b592018) was structurally wrong.
It used two sibling flex Views stacked vertically inside the tab:

```
skyArea   (flex: 1)   ← sky section takes its own block of height
yardArea  (flex: 2)   ← yard section takes the next block of height
```

This is still a vertical dashboard stack — sky just replaced "Header + StatBoxRow".
The background was a **participant in document flow** instead of a backdrop.
The first impression was still "two zones stacked on top of each other", not a
single game scene with floating UI.

## What Layered Composition Means

In a layered composition, there is **one scene container** (`flex: 1`).
All elements are positioned within that single container using absolute positioning
and zIndex. Nothing pushes anything else down.

```
Layer 0  (zIndex  0)  Background — absoluteFill behind everything.
                      Contains sky + horizon + yard drawn as visual shapes.
                      pointerEvents="none" — never intercepts touches.

Layer 1  (zIndex 10)  Grid / Building Yard — absolute, top = yardTop, fills to bottom.
                      ScrollView lives inside; only the grid scrolls.

Layer 2  (zIndex 20)  HUD — name/level top-left, time/events top-right.
                      Floats over the sky portion of the background.

Layer 3  (zIndex 20)  Resource strip + Goal panel.
                      Resource strip straddles the sky/yard boundary line.
                      Goal panel sits just below the resource strip.
                      Neither pushes the grid down.

Layer 4  (zIndex 20)  Buy / Sell buttons — absolute, bottom = FLOATING_TAB_BAR_CLEARANCE.
                      Float above the bottom nav in thumb reach.
```

The background paints the world.  
The grid lives in the world.  
The HUD floats over the world.  
Nothing is stacked in vertical document flow.

## Scene Geometry

Positions are computed once per render from screen dimensions + safe area insets:

```
sceneHeight = screenHeight - insets.top      (scene fills below status bar)
skyH        = sceneHeight × 0.33            (sky is top 33 %)
HORIZON_H   = 28 px                         (treeline strip)
yardTop     = skyH + HORIZON_H              (where yard layer starts)
resourceTop = yardTop − (RESOURCE_H / 2)    (resource strip straddles boundary)
goalTop     = resourceTop + RESOURCE_H + 8  (goal just below resource strip)
gridPaddingTop = goalTop − yardTop + GOAL_H + 12  (grid starts below both overlays)
```

## What Changed

- **`app/game/(tabs)/index.tsx`** — complete scene composition rebuild:
  - Added `useSafeAreaInsets` hook for precise position math
  - Background: `StyleSheet.absoluteFillObject` with `pointerEvents="none"`,
    flex-column children (sky / horizon / yard) paint the world behind everything
  - Grid layer: `position: 'absolute', top: yardTop, left: 0, right: 0, bottom: 0`,
    ScrollView fills this layer, content starts below the resource/goal overlays
  - HUD: name+level and time+events are individually `position: 'absolute'` with
    `top: spacing.sm`, `zIndex: 20`
  - Resource strip: `position: 'absolute'` at `top: resourceTop`, straddles
    sky/yard boundary, uses `flexDirection: 'row', justifyContent: 'space-between'`
    (no `marginLeft: 'auto'` hack)
  - Goal panel: `position: 'absolute'` at `top: goalTop`, semi-transparent white
  - Buy/Sell: `position: 'absolute'` at `bottom: FLOATING_TAB_BAR_CLEARANCE`
  - More Info: `···` chip in resource strip opens a Sheet (secondary stats)

## What Was Intentionally Not Changed

- All gameplay logic (buyCrude, sellGasoline, placeBuilding, etc.)
- Save format — untouched
- Balance — untouched
- Tile build / inspect interaction — fully preserved
- All Sheet content (Build picker, Building Info, Events, Automation)
- Grid edit mode (Move / Swap)
- Bottom tab navigation
- `BuildingGrid` component (except the `borderRadius` / `width` tweak from v1)

## Files Changed

- [app/game/(tabs)/index.tsx](app/game/(tabs)/index.tsx) — layered composition rebuild
- [CURRENT_TASK.md](CURRENT_TASK.md) — this documentation update

## Manual Test Checklist

- [ ] App launches without error
- [ ] Factory tab opens — scene uses layered composition
- [ ] Sky/background fills the scene behind all UI — not a separate stacked section
- [ ] HUD (name, level, time, ⚙️) floats over the sky portion
- [ ] Resource strip visually straddles the sky/yard boundary
- [ ] Goal panel appears just below the resource strip (floating, not part of scroll)
- [ ] Building grid sits below the goal panel in the yard area
- [ ] Grid is scrollable when content exceeds the yard height
- [ ] Tap empty tile → Build sheet opens → building can be placed
- [ ] Tap occupied tile → Building Info sheet opens → upgrade/move/demolish work
- [ ] Grid edit mode (Move / Swap) works from Building Info sheet
- [ ] ⚙️ button opens Events sheet
- [ ] `···` chip opens More Info sheet (Feedstock, ESG, Reputation, Season, Era)
- [ ] Buy Crude button works; floating above tab bar
- [ ] Sell Gas button works; floating above tab bar
- [ ] Night mode: sky transitions to dark; night veil applies
- [ ] Bottom tab navigation — all 5 tabs accessible
- [ ] `npx tsc --noEmit` passes with no errors

## Typecheck Status

- `npx tsc --noEmit`: ✅ passed (no output = no errors)

## Known Issues (carried forward)

- Require cycle warning:
  `src/game/utils/gameCalculations.ts → src/game/data/recruitment.ts → src/game/utils/gameCalculations.ts`
- Expo Linking scheme warning (build-time config, not app code)
- Android emulator instability (`System UI isn't responding`) is emulator-level, not app
- `Stats` screen hidden from tabs intentionally (not final IA cleanup)
- On Windows, use `cmd /c npm run typecheck` or `npx tsc --noEmit` — `npm.ps1` blocked by execution policy

## Next Recommended Task

Visual Layer Phase 3 — Road / Pipe / Ground Detail

Now that the scene has proper layered composition:

- Add a thin pipe / road layer between building tiles in the yard
- Use simple colored line segments or View strips — no assets
- Indicate crude-in / product-out flow direction visually
- Keep interactions and gameplay logic unchanged
- Build on top of current layered composition — do not revert to stacked layout
