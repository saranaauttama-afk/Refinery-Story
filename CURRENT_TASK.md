# CURRENT_TASK

## Task Name

`Flat-Top 11x11 Diamond Shell Pass`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Kept the live Factory renderer on `diamond_ground`
- Kept the live visual ground on an `11x11` shell
- Cut the top of the visible shell so it reads with a flatter top edge instead of a full diamond point
- Shifted the active gameplay block upward from the exact center
- Reduced tile scale from the previous `2x` pass to a more moderate enlarged size
- Kept disabled shell cells lighter than active cells
- Kept the real gameplay grid and interactions unchanged underneath

## Why This Pass Was Needed

The fully pointed shell and extra-large `2x` tiles left too much dead
space above the active factory area. This pass is a composition fix:

- less wasted space at the top
- active cells sit higher in the frame
- the grid stays large, but not so large that it pushes everything downward

## Files Changed

- `src/components/FactoryDiamondGroundView.tsx`
- `CURRENT_TASK.md`

## What Was Intentionally Not Changed

- No save format
- No balance
- No expansion pricing
- No real gameplay grid size change
- No new renderer
- No panning or zoom

## Manual Test Checklist

- [ ] Live Factory still shows an `11x11` shell
- [ ] Top of the shell reads flatter than before
- [ ] Active cells sit higher than the previous centered version
- [ ] Tile size is still enlarged, but less oversized than the `2x` pass
- [ ] Empty active cells can still build
- [ ] Occupied active cells can still inspect
- [ ] Disabled shell cells remain lighter
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Diamond Shell Camera Review`

Most likely next step:

- add panning/scrolling for the larger shell, or
- lock the final shell silhouette before mapping any richer art onto it
