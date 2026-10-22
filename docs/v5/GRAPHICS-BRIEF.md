# Refinery Story V5 — Unified Graphics Specification

Design proposal • 22 October 2026 • Target branch: `topdown/v5`

This document answers the fresh graphics brief. It specifies presentation and asset production; it does not change simulation rules. It is not an implementation-completion report.

## 1. Decisions

Use an orthogonal square grid with top-down 3/4 artwork: roofs plus the south-facing wall, no east/west wall, no diamond/isometric tiles. One logical art pixel is one world unit. One tile is exactly **32 × 32 art pixels/world units**. Terrain, buildings, roads, people, ships and props all use this same density.

The normal play camera shows a section of the yard and pans. It does not continually fit all owned land onto a portrait screen. Default play scale is **48 pt per tile**, with 32 and 64 pt alternatives. A separate Overview fits the yard, not the entire scenic map. Overview is for orientation and parcel selection; entering building placement returns to a play scale.

Build scenery from reusable terrain tiles and separately placed props. Cache those layers if useful; do not use a flattened painting as the authoritative map. A cached layer must preserve the original 1 art pixel = 1 world unit mapping.

Render building foundations from the exact footprint in the game. Do not ask image generation to reproduce the same slab 75 times. Every building picture is a transparent sprite aligned to a fixed footprint rectangle and anchor.

## 2. Preserved game rules

- The yard origin is permanently tile `(0,0)`. Expansion adds land in +x/+y; camera movement never changes world coordinates.
- Parcels are 8 × 8 tiles. Start with 2 × 2 parcels / 16 × 16 tiles. Maximum is 4 × 3 parcels / 32 × 24 tiles / 768 tiles.
- Ownership limits remain 5 parcels from rank 2, 9 from rank 4, and all 12 from rank 6. These are limits, not automatic purchases.
- A useful factory uses roughly 80–100 tiles for about 25 buildings; decoration and circulation occupy remaining space.
- Truck gates remain on the north edge `y=0` or west edge `x=0`, approached from an external road.
- Each building retains the user-specified width × depth at every level. The gate remains 1 × 2 even when facing the west approach.
- Existing placement, adjacency, unlocking, production, truck routing and save rules are unchanged by this proposal. Visual fences and verges do not introduce new collision rules.

## 3. Camera and units

| Quantity | Value |
| --- | --- |
| Final terrain tile | 32 × 32 art px |
| World tile | 32 × 32 world units |
| Default play | 48 × 48 screen pt per tile; camera scale 1.5 |
| Wider play | 32 × 32 screen pt per tile; camera scale 1 |
| Detail/building placement | 64 × 64 screen pt per tile; camera scale 2 |
| Play zoom range | 1–2, with buttons settling at 1, 1.5, 2 |
| Overview | Computed fit of yard bounds + one tile of padding per side |
| Art-to-screen conversion | screen pt = art px × camera scale |
| Physical display pixels | screen pt × device pixel ratio; distinct from art pixels |

On a 390 pt-wide phone, default play shows about 8.1 tiles across before insets. A 2 × 2 building occupies 96 × 96 pt of ground. At 32 pt/tile it occupies 64 × 64 pt. A 3 × 3 landmark occupies 144 × 144 pt at default play, plus its visual height.

With 12 pt screen insets on both sides, overview of the full 32-tile yard plus two padding tiles gives `366 / 34 = 10.76 pt/tile` if width is limiting. A 1 × 1 object is inevitably tiny at that scale. No texture resolution can make all 32 columns into comfortable individual touch targets on this screen.

Calculate overview with the actual unobscured canvas rectangle, including the current HUD, dock and sheets. Include tall sprite bounds where needed to avoid clipping, and take the smaller width/height fit. A useful formula is `min(viewWidth / boundsWidth, viewHeight / boundsHeight)` in matching units. Overview can be smooth/downsampled as a whole for legibility; the play renderer retains consistent pixel-art sampling.

Opening a new game centers on the starter operating cluster at default play scale. Continue restores the last play camera. Buying land does not automatically zoom out; an optional brief highlight indicates the new parcel. The Overview button toggles back to the previous play camera. Selecting a building from overview centers it at play scale. Parcel purchase can remain available in overview. A single-tile placement uses at least 48 pt/tile and a clear confirm affordance; selection at wider play can use an enlarged screen-space hit area with nearest-candidate disambiguation.

Use nearest-neighbour image sampling for play sprites and terrain, without a per-object smoothing policy. Pixel art may appear stepped when enlarged; that is expected. Fractional scales can produce uneven pixel widths and movement shimmer, so settle zoom and camera translations consistently on the device-pixel grid where practical. This does not guarantee every scale is a perfect integer enlargement on every display. Keep moving actor coordinates continuous; do not round their simulated paths. Evaluate settled 32/48/64 pt tiles on an actual target device.

## 4. View and visual language

- Orthographic/oblique top-down 3/4 on a square grid; south is screen-down.
- Ground footprints remain axis-aligned 32 px squares. Roofs and walls create depth above the footprint; ground is never sheared or flattened into diamonds.
- South walls use a consistent stylized height, generally 6–12 art px for low buildings. Larger/taller objects may rise farther within their reserved canvas.
- Light comes from the upper-left. Use three-tone shading, crisp dark outlines and broad readable silhouettes.
- Small industrial forms: orange furnaces, cool steel tanks, yellow rails, blue service roofs. Gold appears only as small level-5 accents.
- Background props use comparable detail density but slightly quieter contrast so production buildings remain easy to find.
- No baked text, UI numbers, rank badges or upgrade labels. Draw those in the interface.
- No photographic noise, smooth gradients, JPEG artifacts, baked smoke/flames/clouds, or a second perspective.

Suggested starting palette, expandable only when necessary:

| Role | Colour |
| --- | --- |
| Outline | `#22313D` |
| Deep shade | `#34515D` |
| Concrete | `#C8C8BA` |
| Asphalt | `#51575A` |
| Grass / grass shade | `#8DB957` / `#55844F` |
| Water | `#3D92B2` |
| Sand | `#E7CF91` |
| Steel | `#B4CDD0` |
| Yellow rail | `#D9A541` |
| Furnace orange | `#E88239` |
| Warning red | `#D35348` |
| Service blue | `#478CB8` |
| Glass | `#91D6DA` |
| Cream | `#F3E5BE` |
| Light | `#FFC94A` |

These are art-direction values, not new gameplay categories.

## 5. Fixed surrounding world

Author a **48 × 48 tile scenic area**, or 1536 × 1536 logical art px, spanning `x ∈ [-8,40)` and `y ∈ [-16,32)`. The maximum yard remains `[0,32) × [0,24)`. This gives eight tiles of scenery west/east/south and sixteen north.

| Zone | Tile bounds | Contents |
| --- | --- | --- |
| Sea | `x [-8,40), y [-16,-8)` | Open water, small rocks, ships and glints |
| Port | `x [-8,40), y [-8,-4)` | Modular quay, blue warehouse, containers, crane; pier extends north into sea |
| North access road | `y [-4,-1)` | Sidewalk + two single-tile lanes; shares the same geometry used by traffic |
| North verge | `y [-1,0)` | Connection strips to north-facing gates; no permanent obstruction |
| West access road | `x [-4,-1), y [-4,28)` | Connected to north road; two lanes + sidewalk |
| West verge | `x [-1,0)` | West-facing gate connections; keep gate approach clear |
| West town strip | `x [-8,-4), y [-4,28)` | Small houses, office, trees and a pocket park |
| East service strip | `x [32,40), y [0,24)` | Outside-maximum service road, utilities, planted edge |
| South strip | `x [-8,40), y [24,32)` | Outside-maximum road, greenery, small service props |

East/south roads sit outside the **maximum** yard, for example around `x=34` and `y=26`, and never move on purchase. They are ambient streets; they do not create new valid gate edges. All corner junctions use a single road-layout data source so lanes and turns meet. Ships and cars follow paths measured in the same tile/world coordinate system, not positions reverse-engineered from a background painting.

Terrain can continue procedurally beyond scenic bounds with water/grass if a tall viewport needs it; do not stretch a finite background to hide borders. Camera clamps should otherwise respect scenic bounds and the unobscured canvas. The entire scenic world need not fit the phone at once.

Draw order: base terrain → pavement/roads/foundations → depth-sorted buildings, static props, fence sections and ground actors → building-attached effects → sparse birds/clouds. Fence sections must not all be drawn as an unconditional foreground overlay. Anchor shadows in world space and apply them once.

Cache static ground in 8 × 8 tile chunks: **256 × 256 logical px** per chunk. The proposed scenic area has 6 × 6 such chunks. These are assembled/cached at runtime or build time, not 36 independent AI paintings. Packed sprites may use atlases up to 2048 × 2048 with padding; several atlases are acceptable. Actual memory/performance must be profiled; chunking and packing do not by themselves guarantee a frame rate.

## 6. Unbought land and expansion

Show all future parcels in their permanent positions from the beginning as pale grass/bare soil with sparse removable-looking scrub. Use small survey posts and a subtle parcel outline. Avoid a giant grey rectangle and diagonal hatch overlay during ordinary play.

Only the land-purchase mode shows strong 8 × 8 boundaries, prices, rank locks and eligible-parcel highlights. These are UI overlays. Do not bake them into terrain.

Owned empty ground becomes light concrete. Decorative roads, trees and planted tiles can visually cover it according to existing game content. Do not add new surface-dependent gameplay effects.

Compute the fence from the union of owned cells/parcels: show an edge where owned land touches unowned land or the outside of the yard; remove edges between two owned neighbours. This handles irregular shapes, rather than drawing only the bounding rectangle. Skip the relevant section at a valid truck gate. Buying a parcel removes only the old shared fence and adds the newly exposed boundary; existing buildings, `(0,0)` and surrounding roads do not move.

Fences are visual boundaries unless existing routing already assigns them collision. Their posts and foreground sections use ground-depth sorting. Tall buildings can naturally cover objects behind them; on selection/placement, temporarily fade only occluders so a valid target is reachable.

## 7. Building asset contract

All dimensions below are **final logical art pixels**, not large image-generation draft pixels and not phone display pixels.

For footprint `w × d`, headroom `r`, and a four-pixel transparent margin:

```text
canvasWidth  = 32*w + 8
canvasHeight = 32*d + r + 8
footprintRect = {x:4, y:4+r, width:32*w, height:32*d}
anchor = {x:canvasWidth/2, y:canvasHeight-4}
```

Place the anchor at world `((tileX+w/2)*32, (tileY+d)*32)`. The footprint rectangle then lands exactly at `(tileX*32,tileY*32)` with size `(w*32,d*32)`. Draw the foundation separately at that world rectangle. Do not independently resize each level to its visible alpha bounding box.

The reserved headroom and full canvas remain identical for all five levels of a building. Art may occupy less than the full canvas at low levels. Tanks and pipes may occupy the footprint area; transparent space is not a requirement inside the footprint. The art must not include a slab, ground shadow or background. No permanent opaque pixels outside the footprint's width; keep lateral equipment inside the pad. Vertical headroom is deliberate visual overlap, not extra occupied tiles.

| Building | Existing ID | Footprint | Ground area px | Headroom px | Canvas W×H px | Anchor x,y | Level files |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Product tank | `tank` | 1×1 | 32×32 | 16 | 40×56 | 20,52 | 5 |
| Pipe rack | `pipe` | 1×1 | 32×32 | 8 | 40×48 | 20,44 | 5 |
| Lab | `lab` | 1×1 | 32×32 | 12 | 40×52 | 20,48 | 5 |
| Flare stack | `flare` | 1×1 | 32×32 | 48 | 40×88 | 20,84 | 5 bases |
| Truck gate | `gate` | 1×2 | 32×64 | 8 | 40×80 | 20,76 | 5 north + 5 west variants |
| Control room | `control` | 2×1 | 64×32 | 16 | 72×56 | 36,52 | 5 |
| Canteen | `canteen` | 2×1 | 64×32 | 16 | 72×56 | 36,52 | 5 |
| CDU | `cdu` | 2×2 | 64×64 | 32 | 72×104 | 36,100 | 5 |
| Crude tank | `crudeTank` | 2×2 | 64×64 | 24 | 72×96 | 36,92 | 5 |
| Blending station | `blend` | 2×2 | 64×64 | 16 | 72×88 | 36,84 | 5 |
| Loading bay | `loading` | 2×2 | 64×64 | 16 | 72×88 | 36,84 | 5 |
| Hydrotreater | `hydro` | 2×2 | 64×64 | 24 | 72×96 | 36,92 | 5 |
| Reformer | `reformer` | 2×3 | 64×96 | 40 | 72×144 | 36,140 | 5 |
| Cracker | `cracker` | 3×3 | 96×96 | 40 | 104×144 | 52,140 | 5 |
| Mega refinery tower | `tower` | 3×3 | 96×96 | 64 | 104×168 | 52,164 | 5 |

There are 75 logical building-level pictures; the second gate orientation adds five rendered variants, giving 80 base sprite files if stored separately. Gate art must solve north/south and east/west drive-through appearance **inside the same 1×2 pad**, not rotate the footprint to 2×1. Put the barrier pivot, animation state and drive-through centre in metadata. Use a separate barrier overlay with open/closed states for each orientation; pivot geometry must match all levels.

Flame, smoke, warning-light blinking and level-up effects are separate attachments. Every flare level defines a flame socket. A level-five beacon painted into art must not get another duplicate code-drawn beacon.

Upgrade progression preserves the building's main silhouette and identity: L1 basic machine; L2 access ladder/platform or small utility detail; L3 additional compact process element inside the pad; L4 richer pipework/safety equipment; L5 small gold trim and a beacon. Each type gets its own meaningful variations. Do not grow the slab, scale the whole image or add unrelated refinery buildings at higher levels.

## 8. Complete production batches

Generate **one object or one animation frame at a time**. Assemble sheets/atlases mechanically after approval. Reuse a fixed template and approved reference image for every family. The sequence below avoids making all 75 upgrades before scale is proven.

### Batch 0 — Mechanical templates and scale check

Create in code: a 32×32 tile ruler, the footprint templates from section 7, generated foundations, and a test scene containing product tank L1, CDU L1, control room L1, one tree, one worker and one tanker. No full world painting.

Test at 390×844 pt with the actual HUD. Verify 32/48/64 pt play tiles and max-yard overview before producing the remainder. The 1×1, 2×1 and 2×2 bases must match exactly; the worker and truck must not need independent scale corrections.

### Batch 1 — Terrain and boundary kit

| Asset | Final size per image | Count/variants |
| --- | --- | --- |
| Concrete | 32×32 | 3 seamless variants |
| Grass | 32×32 | 3 seamless variants |
| Bare soil | 32×32 | 2 seamless variants |
| Asphalt | 32×32 | 2 seamless variants |
| Quay paving | 32×32 | 2 seamless variants |
| Sand | 32×32 | 2 seamless variants |
| Water | 32×32 | 4 subtle, mutually seamless animation frames |
| Shore edge masks | 32×32 | 16 cardinal-neighbour masks + 4 concave corner overlays; topology assembled in code |
| Curb overlays | 32×32 | 4 edges + 4 outside corners + 4 inside corners |
| Quay vertical face | 32×48 | 4 edge orientations; extra height below/above the ground edge handled by anchors |
| Boundary fence segments | 40×48 | N/E/S/W segments; explicit segment-end coordinates in metadata |
| Fence junctions/posts | 16×24 | straight, corner, end and T/cross as needed |
| Survey post | 16×24 | 1 neutral version; rank/price stays UI |

Terrain is flat top-down, fills the 32×32 cell and tiles without a visible seam. No object shadows in terrain. Road lines and junction markings can be drawn in code with the shared palette, using the same lane geometry as traffic. Do not paint tiny vehicles into road tiles. Fence/curb variants have shared endpoints and corners; do not rely on visual guesses when assembling them.

### Batch 2 — All 15 level-one buildings

Use the size/anchor table. Approve the silhouette and palette for every type first. Include both gate orientations and the separate barrier overlays. Distinguish CDU, hydrotreater, reformer and cracker by silhouette as well as accent colour.

### Batch 3 — Essential traffic and staff

| Asset | Final frame size | Content dimensions and count |
| --- | --- | --- |
| Crude tanker | 80×80 | About 56×22 ground px, roughly 2 tiles long; 4 directions |
| Product tanker | 80×80 | Same proportions; 4 directions |
| Passenger car | 48×48 | About 28×14 ground px; 3 colour variants × 4 directions |
| Staff | 24×32 | Body about 12–16 px wide and 24 px tall; 6 jobs × 4 directions × 4 walk frames = 96 frames |

Truck/car anchors are ground-centre: `(40,40)` and `(24,24)` respectively. Turn the body within the same canvas without moving its ground anchor; leave room for cabin height. Vehicle sizes refer to the body/ground reference, not the padded canvas. Staff use foot anchor `(12,28)` and shared body proportions. Use a walk frame as idle; do not change frame canvas sizes. Vehicle motion need not have wheel animation at this scale.

Staff jobs: operator (orange coverall/yellow helmet), chemist (white lab coat), engineer (blue shirt/white helmet), safety officer (high-visibility vest/red helmet), manager (shirt/tie), plant director (dark suit). Validate four directions, not mirrored diagonal isometric directions. Do not add carrying animations until the basic walking loop is stable.

### Batch 4 — Twelve one-tile decorations

Every decoration occupies exactly 1×1. Use **40×80 px canvases**, footprint rectangle `(4,44,32,32)` and anchor `(20,76)`, allowing shared packing/preview logic. Short decorations leave unused transparent space above; do not stretch them taller.

Proposed twelve visual slots: broadleaf tree, palm, shrub, flower bed, planter, bench, lamp, small statue, trophy monument, company sign, small fountain, safety/cone arrangement. Map them to existing decoration IDs; the list is art direction, not authority to add new effects or unlock rules. Existing road content remains a flat 32×32 overlay if it is a separate buildable item; it must not consume the tall decoration canvas or be removed to force this list to twelve.

### Batch 5 — Surrounding props

These footprints describe scenic layout occupancy, not new player-buildable buildings.

| Scenic prop | Scenic footprint | Headroom | Final canvas |
| --- | --- | --- | --- |
| Blue port warehouse | 3×2 | 16 | 104×88 |
| Small house | 2×2 | 16 | 72×88 |
| Town office | 2×2 | 32 | 72×104 |
| Port crane | 2×2 | 64 | 72×136 |
| Container stack | 2×1 | 16 | 72×56 |
| Utility/substation | 2×1 | 16 | 72×56 |
| Rock cluster | 1×1 | 16 | 40×56 |
| Bollard / port lamp / bench | 1×1 | up to 40 | 40×80 |

Use the section-7 formula for anchors and footprint rectangles. Produce 2 house palettes and 2 container palettes by controlled recolour, rather than independently redrawing their geometry. Reuse approved trees/lamps/benches where possible. Quay and pier ground is assembled from 32×32 tiles and edge pieces; do not generate a pier with a baked rectangle of sea around it.

### Batch 6 — Remaining building levels

After the mixed scene works, generate L2→L5 for each approved L1, one building family at a time. This is 60 logical level variants plus the four extra west-gate level variants. Always reference that building's L1 and its immediately preceding approved level; keep the same template, silhouette position, pad reference and canvas. Produce the simplest architectural family first to verify the workflow, then tall industrial families.

### Batch 7 — Ships and ambient animation

| Asset | Final canvas per frame | Quantity / anchor |
| --- | --- | --- |
| Large oil tanker | 264×88 | 2 directions E/W; ground/hull 256×64, headroom 16; anchor 132,84 |
| Small oil tanker | 200×80 | 2 directions E/W; ground/hull 192×64, headroom 8; anchor 100,76 |
| Fishing boat | 104×56 | 2 directions E/W; ground/hull 96×32, headroom 16; anchor 52,52 |
| Tug | 72×56 | 2 directions E/W; ground/hull 64×32, headroom 16; anchor 36,52 |
| Bird | 24×24 | 4 wing frames; centre anchor 12,12 |
| Cloud | 128×64 | 3 variants; centre anchor 64,32 |
| Smoke | 48×64 | 6 frames; emitter anchor 24,60 |
| Flare flame | 24×48 | 6 frames; emitter anchor 12,44 |
| Level-up sparkle | 64×64 | 8 frames; centre anchor 32,32 |
| Water glint | 32×32 | 4 frames; centre anchor 16,16 |
| Gate barrier | 40×80 | 2 states × 2 orientations; pivot/socket metadata tied to gate pad |

Ship hull dimensions are authoring reference rectangles, not collision requirements. Centre a ship's motion path from the hull rectangle, then translate to the listed bottom-centre sprite anchor. Do not accidentally use its bottom anchor as the hull centre. Keep waves, wakes and smoke separate so no moving ship carries a rectangular patch of water.

Building level metadata includes smoke, flame and beacon sockets measured in its logical canvas. Attach effects to those coordinates instead of estimating from image height. With reduced motion, use quiet static frames or disable ambient overlays; do not hide essential operation state. Keep clouds sparse and away from the main factory working area, and avoid obscuring placement previews.

## 9. Delivery and generation rules

Final assets are transparent RGBA PNG for sprites and opaque lossless PNG for terrain. Do not use JPEG. Names are descriptive, such as `cdu_L1.png`, `gate_w_L3.png`, `operator_s_walk_02.png`, `terrain_concrete_01.png`. Atlases are a packaging step and must retain the source files and metadata.

Each asset metadata record must include: `id`, `file`, `canvasWidth`, `canvasHeight`, `anchorX`, `anchorY`, `footprintWidth`, `footprintDepth`, `footprintRect`, level/orientation/frame where relevant, and optional named effect sockets. Final assets render at **scale 1 in world space**, followed by the common camera transform. A packing tool may trim transparency only if it adjusts anchors and sockets and preserves the untrimmed template metadata.

An image generator's output resolution is a draft size, not proof of pixel density. Exact pixel dimensions, transparency, repeated geometry and seamless edges must be validated and normalized after generation. If generating at 4× a template for convenience, the draft canvas and every guide are exactly 4×; reduce once, clean the pixel clusters, and export the stated logical canvas. Merely applying nearest sampling to a detailed AI painting does not turn it into consistent pixel art. Do not auto-fit each object's alpha bounds, stretch a misplaced slab, or keep differently sized pixel clusters across assets.

Keep one approved CDU, worker, tree and vehicle reference visible while producing any new family. Use a template showing the exact ground rectangle and reserved headroom; guide layers are never included in final delivery. The foundation is generated by the renderer, so art generation must not invent its own differently sized slab. Use the same palette and reference pixel density for background props.

Reusable prompt core:

> Refinery Story V5 game sprite. Orthogonal square-grid top-down 3/4 view: visible roof and south/front wall only. Cute chunky pixel art, crisp dark outline, broad shapes, simple three-tone shading, approved reference palette, light from upper-left. One logical tile is 32×32 art pixels. Follow the attached footprint template and approved reference sprite. Asset: [name, level]. Final logical canvas [W×H]; ground reference [x,y,w,h]; anchor [x,y]. Keep all equipment within the specified ground width and reserved headroom. Transparent background, no slab, no ground shadow, no text, no UI, no smoke or flame. Preserve the same scale, anchor and principal silhouette as the approved base level; change only [specific level addition].

Prompts support the workflow; exact alignment is enforced by templates, metadata and cleanup. Generate a single object at a time rather than asking an image model to lay out a 5-level sprite sheet precisely.

## 10. Acceptance before full production

1. At 390×844 pt, default play makes a 1×1 object easy to locate and a 2×2 process building identifiable. Placement switches to at least 48 pt/tile.
2. The same car and tree drawn inside and outside the yard retain the same proportions and pixel density. A background building is not an inexplicably larger-scale model.
3. At 64 pt/tile, scenery and buildings enlarge equally with crisp pixel clusters; neither relies on a coarse flattened map.
4. Max-yard overview knowingly simplifies individual objects; returning to play restores the previous camera.
5. Every level of every building has the exact same canvas, footprint rectangle and anchor. Foundations remain mechanically identical.
6. Test initial 2×2 parcels, five owned parcels, nine parcels and all twelve, including permitted irregular ownership shapes. `(0,0)`, pre-existing buildings, sea and roads stay fixed.
7. Both gate-edge cases retain 1×2 occupancy and visibly meet an outside road. Do not introduce a third gate edge or rotate the footprint.
8. Tall towers are not clipped and selected objects behind them remain reachable through occluder fading/selection handling. Shadows, fence sections and people sort from ground coordinates.
9. A 3×3 repetition of each terrain tile shows no seam; test water across both tile and animation-frame boundaries. Atlas boundaries do not leak neighbours when sampled.
10. Test actual target phones for settled zoom sharpness, camera movement, memory and animated-scene performance. A desktop mockup alone does not establish device performance.

## 11. Existing-branch observations and implementation handoff

Read-only inspection of `topdown/v5` at commit `e72b887f6f8a9ade0da2df49babe7b7ed78ad44d` found:

- `src/v4/render/iso.ts` already uses a square top-down grid with `TILE=32`, despite the legacy filename.
- `docs/v4/ART-TOPDOWN.md` describes the matching 3/4 view but still specifies one flattened map. It describes halving the source map and drawing it back at 2×.
- `src/v4/render/tdMap.ts` represents that map with `k=2`. A common final mapping still cannot restore detail discarded by the source/downsample pipeline.
- `src/v4/render/world.ts` already samples the map with nearest mode. Therefore changing just the map's filter is not a sufficient fix. Actor sampling also depends on per-sprite scale.
- `src/v4/render/tdBuildings.ts` includes `smooth:true`; `useSpriteImages.ts` selects linear filtering/mipmaps for those entries and divides scale by two. Building art and terrain do not currently share one uncomplicated final-pixel convention.
- `YardCanvas.tsx` offers zooms 0.35–3 and initially fits owned bounds. Its depth sorting already uses building ground/front depth. Preserve useful existing logic rather than replacing it reflexively.

Implementation sequence: introduce the common art/world-unit contract and camera modes; build the Batch-0 comparison scene; replace map drawing with tiled/layered scenery; replace the unowned veil with parcel terrain/boundaries; import final L1 art; then expand content and animation. Existing game rules remain authoritative. This task supplies the design; it does not claim that code changes or device tests have been performed.
