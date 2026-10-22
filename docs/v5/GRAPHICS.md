# V5 graphics — native pixels and two camera modes

Branch: `topdown/v5`. App 4.1.8 / Android versionCode 50. Gameplay rules and save data are unchanged.

## What ships

- Orthogonal 3/4 view: a square 32×32 world/art-pixel tile; roof + south wall.
- Play zooms: 32, **48 (default)** and 64 pt/tile. Pan to see more of the refinery. Overview fits owned land; its button returns to the previous play camera. Tapping overview returns to play at the chosen location. Placement uses at least 48 pt/tile.
- The play camera waits for the game save, centres on the operating cluster and persists separately from game state. It accounts for sheets and the bottom guide. Buying land does not zoom out the play camera. Land mode shows all twelve fixed parcel positions.
- A 48×48-tile coastal scene spans x=-8…40, y=-16…32; sea/port north, town west, fixed access roads north/west and fixed service roads east/south. The yard remains x=0…32, y=0…24 and grows only right/down.
- Ground is composed from deterministic 32 px terrain tiles, cached in 36 native-resolution 256×256 chunks. No full-map painting is loaded by the yard. The old map and image sources remain in the repository as references.
- Future land is pale grass/soil with survey posts. Purchased parcels are concrete. Fences follow the union of owned land, including notches, and open at north/west truck gates. Parcel borders become prominent in land mode.
- Production buildings have distinct native pixel silhouettes and cumulative upgrades. Tall occluders fade during selection/placement; fences and ground actors share depth sorting. Smoke and flame attach to explicit emitter offsets.

## Art sources and exports

`src/v4/render/topdownArt.ts` is the editable code-native art source. It extends the project's command-based art workflow, using a shared palette and exact integer pixel geometry. It is deliberately simpler and chunkier than the archived detailed AI paintings. No paid/image-generation API is needed to rebuild it.

`npm run art:v5` exports lossless transparent PNGs into `assets/v5/buildings`, the JSON manifest and `src/v4/render/v5Buildings.ts`:

- 75 process/support/logistics building-level pictures (15 types × five levels).
- Five additional west-facing gate pictures; the footprint stays 1×2.
- Five road pictures and 55 pictures for the eleven existing decoration types.
- Eight scenery props: warehouse, house, office, crane, containers, utility, rocks, flower bed.
- **148 PNGs total**. Flower bed is a scenic prop, not a new purchasable item or unlock rule.

Foundations and ground shadows are drawn by the yard, not included in sprites. The frame formula is `W=32*w+8`, `H=32*d+headroom+8`, anchor `(W/2,H-4)`, footprint rectangle `(4,headroom+4,32*w,32*d)`. Every L1–L5 frame of a type uses exactly the same dimensions and anchor. The manifest preserves the footprint, orientation and effect sockets. Gates have a separate code-drawn open/closed barrier; flame and smoke are not baked into their PNGs.

Existing directional trucks/cars, six jobs with two-frame walks in all four directions, ships, birds, clouds, smoke and sparkles are reused. `logicalAtlas.ts` normalizes their legacy pixel densities once to integer world-pixel images before rendering. Both actors and new scenery then use nearest-neighbour sampling under the same camera transform. Original image files are preserved.

## Validation

- `npx tsc --noEmit`
- `npm run v4:check` (includes `check-v5-graphics.ts`): dimensions/anchors for every building level, unique upgrades, integer art geometry, clipping checks, PNG headers, gate variants, camera focal-point invariance, irregular parcel fence topology, and static world coordinates through land growth.
- `npm run format:check`
- `npm run export:web`
- Browser checks at 390×844 pt: populated yard, 32/48/64 pt scales, overview return, pan, camera restore after reload, placement and land mode. Evidence is in `previews/`.

Android APK validation is recorded by the linked GitHub Actions run after push. Browser validation does not establish native phone frame rate or replace an on-device playtest.

The original fresh brief and full production template table are preserved in `GRAPHICS-BRIEF.md`. Its four-frame staff walks and richer standalone scenery asset set describe a possible further art pass; this release reuses the existing two-frame actor animation, and uses editable native artwork for buildings and static scenery. No gameplay content was added to force the proposed decoration list into the existing catalogue.
