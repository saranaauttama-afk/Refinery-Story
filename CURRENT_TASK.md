# CURRENT_TASK

## Task Name

`Apply Diamond Ground Renderer To Live Factory For Review`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Switched the live Factory review renderer from `grid` to `diamond_ground`
- Reused the existing cleaned `FactoryDiamondGroundView` instead of creating another renderer
- Kept the live Factory wired to real game data:
  - real grid
  - real buildings
  - real grid levels
  - real build tap handler
  - real inspect tap handler
- Kept the rest of the Factory UI in place:
  - HUD
  - resource strip
  - goal chip
  - trade pill
  - bottom navigation
- Kept fixed tile size and allowed overflow for larger factory layouts

## Live Review Status

`diamond_ground` is now the live review renderer for Factory on this
branch.

The old `grid` renderer still remains available in code as a fallback and
comparison path. This is a review pass only, not final art direction.

## Why This Was Safe To Switch

Only the buildable ground view changed. Gameplay logic, save format,
balance, and tap handling stay on the same live Factory data flow that was
already connected during the prototype pass.

## Files Changed

- `app/game/(tabs)/index.tsx`
- `CURRENT_TASK.md`

## What Was Intentionally Not Changed

- No gameplay logic
- No save format
- No balance
- No build/inspect behavior rewrite
- No removal of the old grid renderer
- No new renderer implementation
- No panning, scrolling, or zoom
- No final art pass

## Manual Test Checklist

- [ ] New game 3x3 shows diamond ground on live Factory
- [ ] Existing save loads
- [ ] Occupied tiles can inspect
- [ ] Empty tiles can build
- [ ] Expansion still works
- [ ] Buy/sell still works
- [ ] Production tab still works
- [ ] HQ tab still works
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Live Factory Diamond Ground Navigation Review`

Most likely next step:

- add panning/scrolling support for larger live layouts, or
- begin mapping real isometric assets onto the same diamond ground positions
