# Generated pixel artwork — 4.1.9

The active game art is image-generated raster pixel art. The geometric prototype from 4.1.8 is archived; it is no longer the active building registry.

## Scale and placement

- One game tile = 32 world units = **64 native art pixels**. Building, ground and moving-sprite atlases all use this density. Play camera scales remain 32 / 48 / 64 pt per tile.
- Orthogonal 3/4 view: roof and south wall. Square grid, fixed origin, existing parcel rules and footprints unchanged.
- A building's five levels have one shared frame and bottom-centre anchor. Foundation width is measured separately from pipe overhang when extracting the sheet. Transparent padding retains all overhang; it does not increase the buildable footprint.
- Artwork is nearest-sampled to its native sprite size, with a 96-colour palette and hard alpha. Ground tiles are 64×64 with 48 colours. No runtime linear blur.
- Ground is assembled into native-density chunks. No full-world painting is enlarged behind the yard.

## Sources and generation

Built-in **image_gen** generated 19 source sheets. Every complete prompt is recorded in `assets/v5/pixel/source/generation.json`; `SHA256.json` identifies the checked-in source images. Sources have a 256-colour storage palette; original generated images are preserved separately by image generation.

The terrain's quieter final revision uses the additional prompt in `source/terrain-refinement.txt`; the first terrain prompt is marked superseded. Cuts follow detected transparent gutters, so small generated spacing differences cannot clip the building edges.

The first CDU sheet is the style reference for every subsequent call. Prompts specify a constant base, top-left light, silver metal, orange pipework, yellow railings, orthogonal view, transparent surroundings and cumulative upgrades. Process colours distinguish red blending/product tanks, yellow hydrotreater, purple cracker and pink mega refinery.

1. Fifteen building sheets, five levels each: gate, loading bay, crude tank, product tank, CDU, blending, pipe rack, hydrotreater, lab, reformer, cracker, control room, canteen, flare, mega refinery.
2. One west gate sheet, five levels, retaining its 1×2 footprint.
3. One scenery sheet: warehouse, house, office, crane, containers, utility, rocks, flowers.
4. One decoration sheet: eleven existing decorations. These use one static design each across levels; their gameplay upgrades remain unchanged.
5. One terrain sheet: concrete, asphalt, quay, grass, soil, sea.

`npm run art:v5` extracts these sheets into **180 sprite files plus six terrain tiles**, writes `manifest.json`, and generates `src/v4/render/pixelBuildings.ts`. Repeated scenery/decoration level entries intentionally share artwork. Extraction removes detached alpha specks, aligns slab centres, preserves full sprite bounds, and pads all levels to a common frame. It does not paint replacement geometry.

Existing pixel-art staff, trucks, cars, ships and ambient animations are reused at the same native density; they were not regenerated. HUD assets and game rules are unchanged. Fences, parcel outlines and the animated flare remain small pixel-drawn overlays.

## Verification

TypeScript, simulation checks, generated asset/frame checks, formatting and a web export are required before commit. Browser checks cover zoom, pan, save restore, overview return, placement and buying land at 390×844 pt. Screenshots in this directory show the actual game, not an image-generated mockup. Native phone frame rate and gesture feel still require an on-device playtest.
