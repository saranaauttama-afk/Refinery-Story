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
