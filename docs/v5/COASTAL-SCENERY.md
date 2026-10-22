# Coastal world — 4.1.10 / Android 52

An assembled coastal industrial district surrounds the fixed 32×24 maximum yard. It uses the existing orthogonal 3/4 camera and **64 art pixels per tile**. No simulation, building content or parcel rules change.

## The neighbourhoods

- **North:** a curved sandy headland with shallow water, grass, palms, rocks and low cliffs; two working cargo piers, warehouses, loading arms, cargo stacks, mooring hardware, fenders and a short lighthouse. A small entrance monument and food cart sit near the northwest junction.
- **West:** a lunch shop, convenience shop, apartments, workshop and house, with paved aprons, a bus shelter, bike racks, bins, lamps and planting. Every public-road lane and possible north/west truck-gate approach remains clear.
- **East:** irregular rock ledges, a green belt with several tree sizes, shrubs, utilities, drainage and a footbridge.
- **South:** a small arrival plaza, parking, shelter and security hut, followed by a community park with a fountain, picnic area, pavilion and stream crossing.

The ground is cached in the existing 36 native-density chunks. The natural coastline is composed by clipping existing generated sea/sand/grass textures to pixel-stepped curves. The world extent and yard origin are unchanged. Scenery outside the viewport is skipped before sprite drawing.

Overview includes the surrounding district, while land-purchase mode keeps its closer parcel framing. Returning from overview restores the previous play camera; normal play tile sizes remain 32 / 48 / 64 pt. Culling updates during camera moves even when game time is paused.

## Artwork and animation

Built-in **image_gen** created four new transparent sprite sheets: nature, town, port and street. Prompts are in `assets/v5/coast/source/generation.json`; source SHA-256 hashes are in `SHA256.json`. Checked-in source sheets use a 256-colour palette, exported game sprites use 96 colours and hard alpha. Existing factory artwork is retained.

`npm run art:coast` extracts 36 image frames (34 prop designs, including three windsock frames) into `assets/v5/coast/sprites` and generates `environmentSprites.ts`. Extraction groups connected alpha components, preserving full subjects even where the generator used uneven cell gutters. Windsock poles share a fixed frame and ground anchor.

Existing three-frame crane sprites now animate at the port. Windsocks move, the fountain has a small pixel water jet, and shore foam ebbs. Four visual-only residents walk outside the yard, depth-sorted with scenery; they add no staff, production or saved state. Ambient/reduced-motion settings stop these decorative animations.

## Validation

- TypeScript, formatting and simulation checks.
- Generated PNG/frame checks, fixed scenery coordinates, no overlap with any future parcel or public road, aligned windsock frames, and ambient paths outside the yard.
- Browser checks at 390×844 pt: play camera, overview return, placement, land purchase, neighbourhood views, and ambient-off rendering.

Screenshots in `coast/` show the actual game. Native phone frame rate and gesture feel require an on-device playtest; browser checks do not establish those.
