# Top-down art rules — topdown/v5

The active implementation and rebuild instructions are now in [`../v5/GRAPHICS.md`](../v5/GRAPHICS.md). The fresh design brief and exact template table are in [`../v5/GRAPHICS-BRIEF.md`](../v5/GRAPHICS-BRIEF.md).

- Square orthogonal 3/4 view, roofs plus south wall, light from upper-left.
- One tile = 32×32 **logical art pixels and world units** everywhere.
- Buildings use fixed transparent canvases and bottom-centre anchors for all five levels. The renderer supplies the exact footprint foundation. Final sprites use nearest sampling.
- Terrain and scenery are tiled/layered at that density; the archived single world painting is no longer rendered by the yard.
- `npm run art:v5` regenerates current building and scenery PNGs from the editable command-based pixel art.
- Previous AI sources, map images and conversion scripts remain as historical references. Their 2× density and independently fitted slabs are not the active asset contract.

Game footprints remain unchanged: gate 1×2; loading, crudeTank, cdu, blend, hydro 2×2; tank, pipe, lab, flare and decorations 1×1; reformer 2×3; cracker and tower 3×3; control and canteen 2×1.
