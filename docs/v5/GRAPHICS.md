# V5 graphics — generated pixel artwork

Branch: `topdown/v5`. App **4.1.9 / versionCode 51**.

The active art specification, complete source list and generation/extraction workflow are in [pixel/README.md](pixel/README.md).

This release replaces the geometric artwork introduced in 4.1.8 with image-generated pixel sprites for all fifteen buildings and their five levels, west-facing gates, scenery and decorations. Six generated ground textures share a **64 art pixels per tile** density with the buildings and moving actors. All art is rendered with nearest-neighbour sampling.

The 4.1.8 camera and placement improvements remain: 32 / 48 / 64 pt play tiles, a separate overview mode, persisted play camera, sheet-aware framing, fixed parcel origin, and fences around the union of owned parcels. Yard rules, save data, building footprints and upgrade gameplay are unchanged.

The world remains a 48×48-tile assembled coastal scene, with sea/port north and access roads north/west. Ground chunks are cached at the new native density. The source art is not a full-world painting.

Existing pixel staff, vehicles, ships and ambient animations are reused. Decoration/scenery levels share their static design; the fifteen production/support/logistics buildings and both gate orientations have individual L1–L5 pictures. On-device performance and gestures still need a phone playtest.

The original fresh design brief is preserved in [GRAPHICS-BRIEF.md](GRAPHICS-BRIEF.md). The old code-painted PNGs remain as archived prototypes; `pixelBuildings.ts` is the active sprite registry.
