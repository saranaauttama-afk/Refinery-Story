# Yard and streets polish — 4.1.11 / Android 53

Branch: `topdown/v5`. Implements the owner's seven phone screenshots and follow-up requests.

## Visible changes

- The beach reaches the quay at exactly the same shoreline height on both sides. Wider cargo piers have stone caps, chain posts, safety paint and a service aisle. Fenders hang at the water edge rather than standing in the middle of the quay.
- The factory's green roadside buffer is replaced with a concrete apron and a low cream wall with dark railings, directly against the road. This permanent outer compound encloses the maximum 32×24 yard. Internal parcel boundaries still follow ownership; actual north/west gates have openings through the roadside wall. The yard origin and buildable coordinates stay fixed.
- Town footpaths have warm block paving, curbs and drains. North intersections are T junctions; south intersections remain crossroads. They have zebra crossings, stop bars, direction arrows and red/amber/green traffic signals.
- Four decorative cars follow continuous loops in the correct lanes, wait at signal approaches and turn through the junctions. They do not respawn at a visible road end. Customer/crude truck lead tiles are also mapped to off-world visual endpoints, with separate incoming/outgoing lanes and a turn at the real gate. Their logical paths, delivery ticks and sale timing are unchanged.
- The two disconnected decorative drainage channels, culverts and footbridges are removed.
- Player-placed road tiles automatically connect to neighbouring roads, gates and loading bays. Straight roads, corners, T junctions and crossroads draw from the same tile occupancy; moving/demolishing a tile updates its neighbours. The road remains the existing one-tile building and uses existing routing rules.
- Twelve new player-placeable decorations: palm, flowering shrub, hedge, bench, fountain, pavilion, flower planter, picnic table, vending machine, fire cabinet, recycling bins and garden fence. Every piece occupies **1×1** at every level and uses the standard purchase/move/remove/save flow. All are available at rank 1, cost $350–$2,800, and support the existing continuous placement option. They add no production bonus or new rule.
- The permanent “Your refinery / placed count / Build” card is removed. The bottom Build tab and first-game tutorial remain.
- The title art is displayed in full with `contain`, exposing its width rather than cropping the sides. The Refinery Story nameplate and menu are smaller, with a revised Thai subtitle. The game's English name and save identity are retained.

## Artwork

Built-in `image_gen` produced a new transparent 3×4 sheet. Exact prompt and tool attribution: `assets/v5/yard/source/generation.json`. Source hash: `SHA256.json`. The checked-in sheet retains its resolution with a 256-colour palette. `npm run art:yard` extracts complete alpha components, removes isolated specks, downsamples with nearest-neighbour and exports 96-colour hard-alpha PNGs at the established **64 art pixels per tile / 0.5 world scale**. The native sprite registry is `src/v4/render/yardDecorSprites.ts`; decoration PNGs and dimensions are in `assets/v5/yard/`.

Street markings, curbs, chain posts and walls are exact native pixel geometry; the existing generated asphalt, paving and factory textures remain in use. No replacement full-map image is introduced.

## Verification

- TypeScript, formatting and the complete `v4:check` suite, including existing production/progression/balance checks.
- New headless checks cover all 12 sprite frames, purchasing/moving/removing and save round-trip; road connectivity and junction masks; continuous car positions on legal road lanes; coast joins, removed waterways and wall gate openings.
- Browser checks cover camera zoom/restore, placement, land purchase, the decoration catalogue and placement, scenery views, ambient/reduced motion, and title/new-game flow at 390×844 and 360×740 pt. Actual screenshots and JSON reports are in `yard-polish/`.
- Fixtures are synthetic; no player save is changed by these checks. Android gesture feel, performance and appearance still need a native playtest.
