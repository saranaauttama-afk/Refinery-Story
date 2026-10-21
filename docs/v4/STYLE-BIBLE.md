# Refinery Story V4 — Style Bible (Chunky Pixel Industrial)

Status: UI/art direction for branch `rewrite/v4`. This document supplements `docs/v4/ART.md`; where instructions conflict, `docs/v4/UI-HANDOFF.md` governs UI constraints and `docs/v4/GDD.md` governs game rules.

## North star

A **playable toy refinery**, not a realistic industrial painting. Players must identify a building at a glance, read its occupied tiles, and enjoy rearranging a living miniature yard. The refinery, not the landscape, is the hero.

## Hard visual rules

- Isometric 2:1; logical tile **32×16 px**; reuse `src/v4/render/iso.ts`. Never alter building footprints to suit art.
- Large, readable clusters of pixels; crisp edges, no smooth gradients or painterly micro-detail on buildings.
- One strong silhouette per building. Keep **3–6 decorative details** per structure. Do not fill empty ground with props.
- Top-left lighting; black ink `#14110F`; light/mid/dark faces, minimal highlights.
- Industrial materials: cream concrete, blue-grey steel, safety orange, hazard yellow. Product accents must match `src/v4/render/palette.ts`.
- Ground is a quiet grid. Roads and pipe racks are placeable game buildings, not automatic simulated networks.
- Buildings must remain recognizable at minimum camera zoom and with neighboring buildings tightly packed.
- Thai body text: Kanit; numbers: Pixelify Sans. All user-visible strings use `text({en,th})`. No emoji.
- Preserve five existing tab colors and touch targets >= 40px.

## Six reference silhouettes

| Building         | Readable shape                     | Visual signature                    |
| ---------------- | ---------------------------------- | ----------------------------------- |
| CDU              | Tall single column + squat furnace | Orange safety rings, dark furnace   |
| Crude Tank       | Wide low cylinder                  | Black band, ladder, yellow rim      |
| Hydrotreater     | Twin vertical reactors             | Two matched towers + crosspipe      |
| Blending Station | Three short vats                   | Red/blue vats and a central mixer   |
| Pipe Rack        | Open bridge frame                  | Three simple colored parallel pipes |
| Truck Gate       | Booth and long barrier             | Yellow boom, black supports         |

For every sprite: stay within the existing logical footprint, keep its anchor stable, avoid permanent pipes protruding into adjacent lots. At levels 3 and 5 add a _small_ readable upgrade detail without expanding the footprint.

## Placement experience

1. Show the true sprite thumbnail, name, footprint, price and lock state from current building data.
2. On choosing a building, show its ghost anchored to the current grid and color the **whole footprint** green/red based on existing `canPlace`.
3. Let the player tap to move the preview, then explicitly confirm/cancel.
4. Existing combo preview may show discovered effects; do not reveal hidden combo rules.
5. Preserve `place`, `move`, `buyLand`, `canPlace`, rank, costs, and all sim logic unchanged.

## UI composition

- Yard gets the majority of a 390×844 portrait screen; panels are temporary sheets, not permanent sidebars.
- Dark navy/steel headers and simple cream surfaces are acceptable, but keep the existing handoff colors and text constraints.
- Information hierarchy: building sprite → name → size/cost → effect/combos → action.
- Avoid floating labels on every building and excessive environmental art.

## Asset pipeline

**Phase 1:** code-drawn Skia sprites under `src/v4/render/buildings/` for fast iterations and exact grid alignment.
**Optional Phase 2:** PixelLab sprites only if visual reviews justify it. Keep the same 2:1 view, footprint, anchor, silhouette, limited palette, transparency, and nearest-neighbor scaling. Replace rendering assets, not gameplay rules.

## Acceptance checklist

- [x] Each of the six buildings is distinct when shown without labels.
- [x] Buildings fit their actual footprints and do not obscure placement decisions.
- [x] 16×16 starter yard stays readable with several buildings packed together.
- [x] Ghost preview aligns with the building anchor.
- [x] Pan/zoom, workers and trucks still layer correctly.
- [x] No changes to `src/v4/sim/**`, `src/v4/data/**`, or `scripts/v4/**`.
- [x] Before release: `npm run format`, `npx tsc --noEmit`, `npm run v4:check`, plus 390×844 visual inspection.

## 4.0.13 implementation

- All 27 content definitions now have dedicated silhouettes, including flags, golden decor and the four award statues. Levels 2/4 add small marks; levels 3/5 add stronger upgrade details. Roads remain flat.
- Catalogue, info and placement thumbnails use the same Skia command list as the yard. CPU snapshots are cached rather than creating one GPU context per card.
- Yard camera framing uses projected sprite bounds; moving workers and trucks sort by their interpolated position. Placement ghosts use the real sprite, level and anchor.
- Shared navy headers, cream inset cards, tab accents and 40px minimum action targets apply throughout the game.
- Acceptance evidence and native-device limitations: [UI-PLAYTEST-4.0.13.md](UI-PLAYTEST-4.0.13.md).

## 4.0.24 shared surfaces

- Owned land uses one quiet light-grey concrete floor, independent of plant artwork. Expansion joints are subtle in normal play; exact one-tile lines appear in placement mode.
- Perimeter thickness and flush edging follow owned parcel boundaries only. Never draw a curb between adjacent purchased parcels or change their buildable area for visual reasons.
- Outside grass is visually subordinate. The actual gate approach road keeps its existing alignment; decorative ground never creates roads or pathfinding.
- Panels share an illustrated navy header, a colored category badge and cream surfaces. Active tabs have a category-colored marker. Thai values always use Kanit, including the market state.
- Preserve the current plant sprites for the later dedicated plant-art pass.
- Evidence: [UI-SURFACES-4.0.24.md](UI-SURFACES-4.0.24.md).

## Approved 4.0.25 Coastal Pixel Industrial direction

The owner approved a fresh full-screen concept with a matching title screen. Use generous, readable cream enamel controls on navy frames, orange primary actions, original chunky pixel icons and high-resolution coastal art. Earlier small HUD/button size constraints are superseded for this visual pass.

- UI text and controls are live native elements, never baked into a screenshot or background.
- Keep title art at its native PNG resolution. Yard art contains empty terrain only; the concrete footprint and all gameplay objects remain rendered separately.
- Logical placement remains 32×16 and all footprints stay unchanged. UI size, camera presentation zoom and icon resolution are independent of that logical grid.
- Present actual screenshots individually at 2x device scale instead of shrinking multiple screens into a tiny montage.
- Use the approved cream/navy/orange instruments and 88px navigation dock consistently.
- Provenance, exact prompts and validation: [COASTAL-REDESIGN-4.0.25.md](COASTAL-REDESIGN-4.0.25.md).
