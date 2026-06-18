# CURRENT_TASK

## Branch Name

`feature/ui-skeleton-v1`

## Current Task

**Visual Direction Reset — Factory Scene Layout**

## Why the Previous Grid-Card Direction Was Rejected

The previous Factory tab was built as a vertical dashboard stack:

```
Header
StatBoxRow (resources)
NextGoalCard
"More Info" toggle button
ResourceBar (secondary stats)
BuildingGrid in a padded card
Buy/Sell action buttons
```

This reads as a productivity UI, not a management game. The grid felt like one item in a long list, not the heart of the experience. Resources and goal notifications had the same visual weight as action controls. The first impression was "resource dashboard", not "small refinery scene."

## What Changed

- **Factory tab rebuilt as a two-zone scene:**
  - Top 1/3 = sky / atmosphere / industrial horizon
  - Bottom 2/3 = factory yard with grid embedded in ground

- **Sky zone elements (absolute-positioned HUD):**
  - Sky background with atmospheric depth layers (highlight wash, horizon haze, treeline silhouette)
  - Night mode: sky transitions to deep navy `#0D1B2E`
  - Refinery name + level pill — top-left HUD floating over sky
  - Upgrade indicator: level pill turns gold and shows "↑" when upgrade is ready
  - Time chip + events button — top-right HUD
  - Goal panel — compact floating panel at the bottom edge of sky, above yard boundary

- **Factory yard elements:**
  - Ground color `#B8A882` (dusty concrete) fills yard area
  - Decorative road/path strips (two horizontal bands, low-opacity)
  - Resource HUD strip — dark semi-transparent pill floating at top of yard, showing Money / Crude / Gas + "···" chip
  - Building grid sits directly on the yard (embedded, not in a white card)
  - Grid scroll area with bottom padding to clear the floating action buttons and tab bar

- **Floating action buttons:**
  - Buy Crude and Sell Gas float above the bottom tab bar (`position: absolute, bottom: FLOATING_TAB_BAR_CLEARANCE`)
  - Not a dashboard section — they're tool buttons that live in the scene

- **More Info → bottom sheet:**
  - Secondary stats (Feedstock, ESG, Reputation, Season, Era) moved to a `Sheet`
  - Triggered by the "···" chip in the resource HUD strip
  - No longer pushes the grid down

- **Removed from main flow:**
  - `StatBoxRow` component (replaced by resource HUD strip)
  - `ResourceBar` component (replaced by More Info sheet)
  - `ChevronDown` / `ChevronUp` icons (no longer needed)
  - Vertical `ScrollView` wrapping the whole screen (replaced by scene layout)

- **BuildingGrid visual tweak:**
  - `borderRadius` reduced from `radii.lg` to `radii.sm` for a less card-like look
  - Added `width: '100%'` to fill yard consistently

## What Was Intentionally Not Changed

- All gameplay logic (buyCrude, sellGasoline, placeBuilding, etc.)
- Save format — untouched
- Balance — untouched
- Tile build/inspect interaction — fully preserved
- All Sheet content (Build picker, Building Info, Events, Automation)
- Grid edit mode (Move / Swap)
- Bottom tab navigation
- Night overlay (now inside scene container, same opacity)
- All false-gated code blocks kept in place

## Files Changed

- [app/game/(tabs)/index.tsx](app/game/(tabs)/index.tsx) — full scene layout rebuild
- [src/components/BuildingGrid.tsx](src/components/BuildingGrid.tsx) — reduced border radius, added width: 100%
- [CURRENT_TASK.md](CURRENT_TASK.md) — this documentation update

## Manual Test Checklist

- [ ] App launches without error
- [ ] Factory tab opens and shows a scene (not a dashboard stack)
- [ ] Upper portion shows sky with atmospheric layers
- [ ] Factory yard occupies lower 2/3 with ground color visible
- [ ] Refinery name + level pill visible in sky — top left
- [ ] Time chip + ⚙️ button visible in sky — top right
- [ ] Goal panel visible near sky/yard boundary (if a goal exists)
- [ ] Resource HUD strip visible at top of yard (Money / Crude / Gas)
- [ ] "···" chip in resource HUD opens More Info sheet
- [ ] More Info sheet shows Feedstock, ESG, Reputation, Season, Era
- [ ] Building grid is visible on the yard
- [ ] Tap empty tile → Build sheet opens → building can be placed
- [ ] Tap occupied tile → Building Info sheet opens → upgrade/move/demolish work
- [ ] Buy Crude button floats above tab bar, works correctly
- [ ] Sell Gas button floats above tab bar, works correctly
- [ ] Grid edit mode (Move/Swap) still works from Building Info sheet
- [ ] ⚙️ button opens Events sheet
- [ ] Night mode: sky turns dark, night veil applies
- [ ] Bottom tab navigation works — all 5 tabs accessible
- [ ] `npx tsc --noEmit` passes with no errors

## Typecheck Status

- `npx tsc --noEmit`: ✅ passed (no output = no errors)

## Known Issues (carried forward)

- Require cycle warning still exists:
  - `src/game/utils/gameCalculations.ts -> src/game/data/recruitment.ts -> src/game/utils/gameCalculations.ts`
- Expo warning still exists:
  - Linking requires a build-time `scheme` in Expo config.
- Emulator / Expo connection instability has been observed:
  - Android emulator may show `System UI isn't responding`
  - Expo may show `Cannot connect to Expo CLI`
- `Stats` screen still exists in code and is hidden from tabs (intentional)
- On this Windows environment, `npm run typecheck` from PowerShell may fail due to execution policy. Use `cmd /c npm run typecheck` or `npx tsc --noEmit` directly.
- `marginLeft: 'auto'` cast as `any` in resource HUD — this is a React Native limitation; the layout still works via flex row with the chip pushed right.

## Next Recommended Task

Visual Layer Phase 3: Road / Pipe / Ground Layer Foundation

Now that the scene layout is established, add quiet connective language to the yard:

- Pipe segments between compatible buildings (crude → distillation → product tank chain)
- Road markings below the grid for vehicle/movement suggestion
- Subtle concrete pad differentiation around different building categories
- Keep gameplay and save format unchanged
- Do not add animation, trucks, or workers yet
- Build on top of the scene layout — do not revert to dashboard structure
