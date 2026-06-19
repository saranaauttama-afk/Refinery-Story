# Factory Diamond Ground Prototype

## Goal

Evaluate whether diamond ground projection is the right future direction
for Factory without changing gameplay, save data, or the row/column grid
model.

This remains a prototype only.

- Live default renderer stays `grid`
- Game logic stays row/column based
- Save format stays unchanged
- Build/inspect behavior stays unchanged

## Clean Projection Review

This refinement removes most of the earlier visual noise so the review is
about projection instead of art style.

Current prototype rules:

- Empty lots are diamond pads with a small plus
- Occupied lots are diamond pads with a short building code
- Occupied lots keep level badges
- Decorative 3D silhouettes are removed
- Strong shadows and depth embellishments are removed
- Background clutter is greatly reduced

## Fixed World Scale Strategy

Tile size is now fixed.

- `tileWidth = 84`
- `tileHeight = 42`

The renderer no longer shrinks the world to fit the current screen width.
Only the visual projection changes. The game still uses the same
row/column data and the same build/inspect interactions.

## Expansion Scale Notes

With fixed tile size, expansion increases world size naturally:

- 3x3 reads like a small starter plot
- 5x5 reads like a larger mid-game site
- 6x6 reads like a larger refinery district
- 10x10 stress intentionally exceeds the comfortable viewport

This is the correct behavior for evaluation. The world should grow as the
grid grows.

## Overflow / Future Scrolling Notes

Overflow is intentionally allowed.

- The prototype does not force the entire refinery onto the screen
- The prototype does not implement pan, scroll, or zoom yet
- Future work can add scrolling/panning around the same fixed-size world

This task stops at world-scale evaluation only.

## Lessons Learned

- Cleaning the renderer made the projection itself easier to judge
- Diamond lots immediately reduce the “spreadsheet” feel of the Factory
- Fixed tile size makes expansion feel more like world growth
- Label-based occupied markers are better for density review than fake 3D art
- The projection helps ground readability, but by itself still does not
  solve the full refinery-atmosphere problem

## Advantages

- Clearer evaluation of the projection itself
- Stronger builder-style ground language
- Honest world growth with expansion
- Reuses the exact same logical grid model

## Disadvantages

- Large layouts overflow the viewport quickly
- Badge density becomes a scaling concern at 6x6 and beyond
- Projection alone still does not create a full refinery scene
- Future scrolling/panning will be needed if this path continues

## Recommendation

Diamond ground is worth continuing as a projection study, but not yet as a
live renderer replacement.

Best next step:

- keep the live `grid` renderer for gameplay safety
- continue only if the team wants to explore a fixed-scale 2.5D Factory path
- pair the projection later with better world-context composition, not
  decorative building art first
