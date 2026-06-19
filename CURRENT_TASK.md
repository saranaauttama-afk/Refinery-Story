# CURRENT_TASK

## Task Name

`Refine Diamond Ground Prototype - Clean Projection + Fixed World Scale`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Refined `FactoryDiamondGroundView` into a projection-first prototype
- Removed decorative silhouette-based occupied buildings from prototype mode
- Replaced occupied buildings with clean code markers plus level badges
- Simplified empty lots to diamond pads with small plus signs
- Switched the prototype to fixed tile size instead of screen-fit tile sizing
- Updated the hidden prototype route with four variants:
  - empty / 3x3
  - mid / 5x5
  - large / 6x6
  - stress / 10x10
- Kept the live Factory renderer on `grid`

## Why Visual Noise Was Removed

The earlier prototype was evaluating too many things at once:
projection, fake depth, silhouettes, and decorative clutter. This pass
removes that noise so the review is specifically about whether diamond
ground projection improves Factory readability and feel.

## Why Fixed Tile Size Was Chosen

A projected world should grow as the grid expands. If tile size shrinks to
fit the screen, expansion stops feeling like a larger refinery and starts
feeling like a smaller widget. Fixed tile size keeps world scale honest and
makes overflow behavior visible for review.

## Files Changed

- `app/game/(tabs)/index.tsx`
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
- No roads, pipes, workers, smoke, or animation
- No removal of `BuildingGrid`
- No removal of `FactoryMapView`
- No removal of `FactoryIsometricView`

## Manual Test Checklist

- [ ] App launches
- [ ] Live Factory default remains `grid`
- [ ] `/diamond-ground-prototype?variant=empty` works
- [ ] `/diamond-ground-prototype?variant=mid` works
- [ ] `/diamond-ground-prototype?variant=large` works
- [ ] `/diamond-ground-prototype?variant=stress` works
- [ ] Diamond lots are clean and readable
- [ ] Occupied lots are label-based and not decorative
- [ ] Empty lots are diamond pads with plus signs
- [ ] Fixed tile size is used
- [ ] Larger grids create larger worlds
- [ ] Overflow is allowed
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Diamond Ground Direction Review`

Next step should be a design decision, not more polish:

- continue diamond ground as a future 2.5D path, or
- stop and keep the live grid while pursuing scene-first refinery context elsewhere
