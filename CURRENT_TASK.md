# CURRENT_TASK

## Task Name

`Refine Diamond Ground Prototype - Centering and Clean Lines`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Refined `FactoryDiamondGroundView` into a cleaner projection-first prototype
- Kept occupied lots as simple code markers with level badges
- Kept empty lots as diamond pads with small plus signs
- Removed faint outer guide lines and non-tile projection lines
- Centered each prototype world from calculated projected world bounds
- Kept fixed tile size instead of shrinking the world to fit the screen
- Kept the hidden prototype route variants:
  - `empty` / `3x3`
  - `mid` / `5x5`
  - `large` / `6x6`
  - `stress` / `10x10`
- Kept the live Factory renderer on `grid`

## Why Visual Noise Was Removed

The prototype should now be judged on projection and layout only.
Removing the leftover outer construction lines prevents the eye from
reading the scene as a diagram instead of a playable ground plane.

## Why Fixed Tile Size Was Chosen

A projected world should grow as the grid expands. If tile size shrinks to
fit the screen, expansion stops feeling like a larger refinery and starts
feeling like a smaller widget. Fixed tile size keeps world scale honest and
makes overflow behavior visible for review.

## Why World Bounds Are Used For Centering

Centering is now driven by the real projected bounds of the placed tiles,
not by per-variant offsets. That gives all four variants the same centering
rule while preserving fixed tile size and allowing larger worlds to
overflow naturally.

## Files Changed

- `app/diamond-ground-prototype.tsx`
- `src/components/FactoryDiamondGroundView.tsx`
- `Doc/FACTORY_DIAMOND_GROUND_PROTOTYPE.md`
- `CURRENT_TASK.md`

## What Was Intentionally Not Changed

- No gameplay logic
- No save format
- No build/inspect logic
- No balance
- No live default renderer switch
- No scrolling, panning, or zoom
- No building art
- No shadows or decorative silhouettes
- No roads, pipes, workers, smoke, or animation
- No removal of `BuildingGrid`
- No removal of `FactoryMapView`
- No removal of `FactoryIsometricView`

## Manual Test Checklist

- [ ] App launches
- [ ] Live Factory default remains `grid`
- [ ] `/diamond-ground-prototype?variant=empty` is centered
- [ ] `/diamond-ground-prototype?variant=mid` is centered
- [ ] `/diamond-ground-prototype?variant=large` is centered
- [ ] `/diamond-ground-prototype?variant=stress` still uses fixed tile size
- [ ] No outer guide lines remain
- [ ] Occupied markers are still readable
- [ ] Empty markers are still readable
- [ ] Tile size remains fixed
- [ ] Overflow is still allowed
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Diamond Ground Direction Review`

Next step should be a design decision, not more polish:

- continue diamond ground as a future 2.5D path, or
- stop and keep the live grid while pursuing scene-first refinery context elsewhere
