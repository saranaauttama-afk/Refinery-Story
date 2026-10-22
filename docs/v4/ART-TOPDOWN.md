# Top-down art rules (branch topdown/v5)

Every picture for the yard follows these rules so pieces made at different times fit
together. ChatGPT draws; Claude cuts, scales and places. Mockups live in
`art-src/gpt/topdown/`.

## 1. View and style (paste into every prompt)

> Top-down 3/4 (oblique) view on a square grid, like Kairosoft games and Stardew
> Valley. NOT isometric. We see the tops of everything and only the FRONT (south) side
> of buildings. Light from the top-left, soft shadows to the lower right. Cute chunky
> pixel art, clean dark outlines, bright cheerful colours, simple 3-tone shading, the
> same pixel size everywhere. No text, letters, numbers or logos.

## 2. Scale contract — 1 tile = 32 px

| thing                  | size                             |
| ---------------------- | -------------------------------- |
| one grid square (tile) | 32 × 32 px                       |
| car                    | about 1 tile long                |
| tanker truck           | about 2 tiles long               |
| tree, lamp, person     | 1 tile wide (person ½ tile)      |
| small house            | 1.5–2 tiles wide                 |
| warehouse              | 3–4 tiles wide                   |
| oil tanker ship        | about 8 tiles long               |
| buildings in the game  | their footprint in tiles (below) |

Game footprints (w × h tiles): gate 1×2, loading 2×2, crudeTank 2×2, tank 1×1, cdu 2×2,
blend 2×2, pipe 1×1, hydro 2×2, lab 1×1, reformer 2×3, cracker 3×3, control 2×1,
canteen 2×1, flare 1×1, tower 3×3, every decoration 1×1.

## 3. World map — one picture

The whole world is **one image** (`art-src/gpt/topdown/map_v1.png`, 2560 × 2816, drawn
at 2 image px per art pixel). `scripts/art/td_map.py` finds the flat grey yard block,
writes `assets/v4/td/map.png` (half size, drawn back at 2×) and `src/v4/render/tdMap.ts`
(where the yard's tile 0,0 sits, plus open-water tiles for sea glints).

- **Yard block** = flat grey `#CECFCF`, exactly **32 × 24 tiles = 1024 × 768 px**, no
  marks inside it. That is the buildable yard: 4 × 3 parcels of 8 × 8 tiles.
- Around it: a ~2-tile ring road with a fence; the entrance gap faces the port at the top.
- A replacement map must keep the yard block the same size; roads and lanes in
  `world.ts` (TOP / LEFT / RIGHT / BOTTOM, BERTH) are measured from the current picture
  and need re-measuring if the layout changes.

## 4. Sprite sheets (buildings, decorations, vehicles)

- Flat solid **#FF00FF** background, a regular grid, one object per cell with space
  around it; objects never touch each other or the cell edge.
- Buildings stand on their **own square light-grey concrete slab** sized by their
  footprint (a 2×2 slab is exactly twice as wide as a 1×1 slab).
- Decorations stand on the background with no slab.
- Vehicles: same vehicle in 4 directions in one row: facing right, left, down, up.
- Levels: one building per sheet, a single row of 5 versions (level 1 → 5), the same
  slab in all five; each level adds one visible thing; gold only as small accents at 5.
- File names: `td_<what>.png` (e.g. `td_buildings_A.png`, `td_map_top.png`).

## 5. What the game draws in code (do not paint these)

Yard grid, the veil over land not bought yet, placement highlights, shadows
under placed buildings, smoke, sparkles, moving cars, boats, fish, birds and clouds.
