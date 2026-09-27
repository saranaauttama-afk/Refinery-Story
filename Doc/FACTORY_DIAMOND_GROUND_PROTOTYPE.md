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

This refinement removes the remaining non-tile construction lines so the
review stays focused on the diamond ground itself.

Current prototype rules:

- Empty lots are diamond pads with a small plus
- Occupied lots are diamond pads with a short building code
- Occupied lots keep level badges
- Decorative silhouettes are removed
- Shadows and fake depth embellishments are removed
- Outer guide lines and projection extensions are removed
- Only the actual playable diamond tile grid remains visible

## Fixed World Scale Strategy

Tile size remains fixed.

- `tileWidth = 84`
- `tileHeight = 42`

The renderer does not shrink the world to fit the current screen width.
Only the visual projection changes. The game still uses the same
row/column data and the same build/inspect interactions.

## Expansion Scale Notes

With fixed tile size, expansion increases world size naturally:

- 3x3 reads like a small starter plot
- 5x5 reads like a larger mid-game site
- 6x6 reads like a larger refinery district
- 10x10 stress intentionally exceeds the comfortable viewport

This is still the correct behavior for evaluation. The world should grow
as the grid grows.

## Overflow / Future Scrolling Notes

Overflow is intentionally allowed.

- The prototype does not force the entire refinery onto the screen
- Larger worlds may extend past the preview width
- Future work can add panning and scrolling around the same fixed-size world
- Future work can also test real isometric assets on top of this projection

This task stops at clean projection and world-scale evaluation only.

## Centering Strategy

The renderer now calculates projected world bounds from the actual tile
positions and centers that world inside the preview viewport.

That means:

- 3x3, 5x5, 6x6, and 10x10 all use the same centering rule
- No per-variant visual nudging is required
- Large worlds can still overflow while remaining centered as much as practical

## Lessons Learned

- Cleaning the renderer made the projection itself easier to judge
- Diamond lots reduce the spreadsheet feel more effectively when stray guide lines are gone
- Fixed tile size makes expansion feel more like world growth
- World-bounds centering makes the prototype read more intentionally composed
- Label-based occupied markers remain better for density review than fake 3D art
- Projection helps readability, but by itself still does not solve full refinery atmosphere

## Advantages

- Clearer evaluation of the projection itself
- Cleaner builder-style ground language
- Honest world growth with expansion
- Better visual centering across different grid sizes
- Reuses the exact same logical grid model

## Disadvantages

- Large layouts still overflow the viewport quickly
- Badge density remains a scaling concern at 6x6 and beyond
- Projection alone still does not create a full refinery scene
- Future panning, scrolling, and real asset work would still be needed

## Recommendation

Diamond ground is worth continuing as a projection study, but not yet as a
live renderer replacement.

Best next step:

- keep the live `grid` renderer for gameplay safety
- continue only if the team wants to explore a fixed-scale 2.5D Factory path
- pair the projection later with panning/scrolling support and real isometric assets
