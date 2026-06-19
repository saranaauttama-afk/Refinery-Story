# CURRENT_TASK

## Task Name

`Live Factory 11x11 Diamond Shell Review`

## Branch

`feature/ui-skeleton-v1`

## What Changed

- Kept the live Factory renderer on `diamond_ground`
- Expanded the live visual ground to a `11x11` diamond shell
- Kept only the real gameplay grid cells active
- Mapped the active gameplay area into the center of the `11x11` shell
- Rendered the remaining shell cells as disabled lots with a much lighter treatment
- Cleaned leftover background linework from the old yard scene when diamond ground is active

## Why This Approach Was Chosen

The request has big gameplay implications if the real save data is changed
to `11x11` immediately. This pass keeps gameplay and save shape stable by
changing the live presentation only:

- the real game still uses its real active grid
- expansion still unlocks more real cells
- the player now sees the larger planned footprint from the start

That gives us the review value of a larger refinery shell without breaking
progression or old saves.

## Files Changed

- `app/game/(tabs)/index.tsx`
- `src/components/FactoryDiamondGroundView.tsx`
- `CURRENT_TASK.md`

## What Was Intentionally Not Changed

- No save format
- No balance
- No expansion pricing
- No new renderer
- No panning or zoom
- No forced gameplay conversion to a real `11x11` starting grid

## Manual Test Checklist

- [ ] Live Factory shows a `11x11` diamond shell
- [ ] Only the current real gameplay cells are active
- [ ] Remaining shell cells look disabled and lighter
- [ ] Empty active cells can still build
- [ ] Occupied active cells can still inspect
- [ ] Existing saves still load
- [ ] Expansion still unlocks additional real cells
- [ ] Old background linework no longer clashes with the diamond shell
- [ ] `npm run typecheck` passes

## Next Recommended Task

`Diamond Shell Navigation Review`

Most likely next step:

- add panning/scrolling so the larger shell can be explored comfortably, or
- decide on the final rule for how future unlocked cells spread across the `11x11` shell
