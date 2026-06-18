# CURRENT_TASK

## Branch Name

`feature/ui-skeleton-v1`

## Current Task

**Factory Layout Final Pass — Refinery Dominance**

## Why This Pass Was Needed

After the layered composition commit (6ffa3a6), the scene structure was
architecturally correct but the proportions were wrong:

- `SKY_RATIO = 0.33` gave the sky 33 % of scene height — atmosphere was eating
  one third of the screen where gameplay should live.
- `HORIZON_H = 28` — the treeline separator strip was unnecessarily thick.
- The goal panel was ~64 px tall (name + ProgressBar + progress text) — a full
  card-height element floating in the game area that scrolled the grid down.
- Action buttons had generous padding, adding more dead height.

Result: on a 800 px scene, the grid didn't start until ~415 px from the top.
Only ~285 px remained for grid tiles before the action buttons. That is not
"refinery as focus" — that is "UI as focus".

## Layout Before vs After

### Before (6ffa3a6)
```
0 px         ─ top safe area
0–264 px     sky (33 % of 800 px)
264–292 px   horizon strip (28 px)
292–330 px   resource strip straddles boundary
338–402 px   goal panel (64 px tall)
402 px        first grid tile
402–574 px   grid (4×4 ≈ 320 px + hint)
674–734 px   floating action buttons
734–800 px   tab bar clearance
```
Grid visible area ≈ 172 px before needing to scroll.

### After (this commit)
```
0 px         ─ top safe area
0–96 px      sky (12 % of 800 px)
96–110 px    horizon strip (14 px)
110–129 px   resource strip straddles boundary  (resourceTop = 110 - 19 = 91)
137–165 px   goal chip (28 px tall)             (goalTop = 129 + 8 = 137)
165–228 px   grid padding clears overlays        (gridPaddingTop ≈ 63 px from yardTop 110)
228 px        first grid tile                    (yardTop 110 + 63 + grid margin)
228–548 px   grid (4×4 ≈ 320 px)
548–556 px   hint text
556–100 px   FLOATING_TAB_BAR_CLEARANCE bottom padding
```
Grid visible area ≈ 328 px before needing to scroll — ~1.9× more visible yard.
Refinery occupies roughly 70 % of the Factory scene above the tab bar.

## What Changed

### `app/game/(tabs)/index.tsx`

1. **`SKY_RATIO` reduced** `0.33 → 0.12`
   Sky is now atmosphere only (~12 % of scene). Provides color and day/night
   mood without consuming playable space.

2. **`HORIZON_H` reduced** `28 → 14 px`
   Thinner treeline separator. Still visible as a color break.

3. **`GOAL_H` reduced** `64 → 28 px`
   Goal UI redesigned as a compact single-line chip pill instead of a card.

4. **Goal JSX replaced** — tall `goalPanel` (name + ProgressBar + num) →
   compact `goalChip` (icon + name + 56 px inline track + n/total text).
   All on one row, 28 px tall. Progress still visible; functionality preserved.

5. **`bgSkyHaze` height reduced** `22 → 10 px` to remain proportional to the
   shorter sky.

6. **Action button `paddingVertical` reduced** `spacing.sm (8) → 6 px`.
   Slightly less visual weight; still clearly tappable.

## What Was Intentionally Not Changed

- All gameplay logic, save format, balance
- Grid interactions (build, inspect, move, swap, demolish)
- Resource strip (Money / Crude / Gas + ··· chip)
- Buy Crude / Sell Gas functionality
- More Info sheet, Events sheet, Build picker, Building Info sheet
- Bottom tab navigation
- Production, Staff, Business, HQ screens
- Layered composition architecture (absoluteFill background, zIndex layers)

## Files Changed

- [app/game/(tabs)/index.tsx](app/game/(tabs)/index.tsx)
- [CURRENT_TASK.md](CURRENT_TASK.md)

## Manual Test Checklist

- [ ] App launches without error
- [ ] Existing saves load correctly
- [ ] Factory opens — sky area is narrow (atmosphere only, ~10–15 % of screen)
- [ ] Refinery yard visually dominates the lower ~70 % of the screen
- [ ] Goal chip is compact one-line pill with inline progress bar
- [ ] Goal chip is tappable and navigates to achievements
- [ ] Resource strip ($ / Crude / Gas) visible and correct
- [ ] `···` chip opens More Info sheet with secondary stats
- [ ] Buy Crude button works; floating above tab bar
- [ ] Sell Gas button works; floating above tab bar
- [ ] Tap empty tile → Build sheet opens → building can be placed
- [ ] Tap occupied tile → Building Info sheet opens → upgrade/move/demolish work
- [ ] Grid edit mode (Move / Swap) works from Building Info sheet
- [ ] ⚙️ button opens Events sheet
- [ ] Night mode: sky turns dark, night veil applies
- [ ] Bottom tab navigation works — all 5 tabs accessible
- [ ] `npx tsc --noEmit` passes with no errors

## Typecheck Status

- `npx tsc --noEmit`: ✅ passed (no output = no errors)

## Known Issues (carried forward)

- Require cycle: `gameCalculations.ts → recruitment.ts → gameCalculations.ts`
- Expo Linking scheme warning (build-time config)
- Android emulator instability is emulator-level, not app code
- `Stats` screen hidden from tabs intentionally
- Windows: use `cmd /c npm run typecheck` or `npx tsc --noEmit` directly

## Next Recommended Task

Visual Layer Phase 3 — Road / Pipe / Ground Detail

The refinery yard now has space and visual dominance. Next:

- Add pipe/road segments between building tiles as decorative connectors
- Use simple View strips or dotted lines — no image assets
- Suggest crude-in / product-out flow between building categories
- Keep all gameplay and save format unchanged
- Do not add trucks, workers, smoke, or animation yet
