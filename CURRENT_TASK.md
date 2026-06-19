# CURRENT_TASK

## Task Name

`Factory Yard Pass 1 - Make the Current Factory Feel Like a Refinery`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Kept the live Factory renderer on `FACTORY_VIEW_MODE = 'grid'`
- Added refinery-yard background context behind the live Factory scene:
  concrete yard zoning, dock edge, service lanes, pipe runs, loading strip,
  and a small tank-cluster decoration
- Added refinery-yard context inside the live `BuildingGrid` wrapper so the
  play area feels like placed slots inside a larger industrial yard
- Retreated the "white card" look on live building cells and turned occupied
  tiles into concrete-pad landmarks with quieter surface treatment
- Kept empty build slots visible, lighter, and easy to understand
- Preserved existing tap behavior, badges, Buy Crude, and Sell Gas

## Why This Task Chose Live Grid Improvement Instead Of Isometric

The recent experiments showed that projection alone did not make the Factory
feel like a refinery. The live grid already has the safest interactions and
the clearest build/inspect flow, so this pass improves world context around
that proven layout instead of investing further in isometric rendering.

## Files Changed

- `app/game/(tabs)/index.tsx`
- `src/components/BuildingGrid.tsx`
- `src/components/BuildingTile.tsx`
- `CURRENT_TASK.md`

## What Was Intentionally Not Changed

- No gameplay logic
- No save format
- No economy or balance
- No tab ownership changes
- No building placement logic rewrite
- No switch to `isometric`
- No live use of `FactoryMapView`
- No new renderer mode
- No changes to Buy Crude / Sell Gas ownership or placement

## Manual Test Checklist

- [ ] App launches
- [ ] Existing save loads
- [ ] Factory uses grid renderer
- [ ] Factory looks more like a refinery yard
- [ ] Empty tile build works
- [ ] Occupied tile inspect works
- [ ] Buy Crude works
- [ ] Sell Gas works
- [ ] Production tab still works
- [ ] HQ expansion access still works
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Factory Yard Pass 2 - Surface utility and operational context`

Suggested next step:
add a light layer of operational context around the live grid, such as
boost visibility, contract visibility, or production-state cues, while
keeping Factory readable and gameplay-first.
