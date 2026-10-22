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

## 3. Map layout (48 × 64 tiles = 1536 × 2048 px)

The world is two pictures stacked: **top panel** and **bottom panel**, each
1536 × 1024 px landscape. Both keep the 32 px tile scale.

```
x:  0        192                               1344      1536
y 0 ┌──────────────────── TOP PANEL ─────────────────────────┐
    │ sea, cliffs, islands, lighthouse                         │
    │ port quay with piers, ships, cranes, containers          │
576 │ side strip │   YARD BLOCK (empty)                │ side  │
    │ (town /    │   36 × 14 tiles, plain grey          │ strip │
1024└────────────┴──────────────────────────────────────┴───────┘  ← seam (code road)
    ┌──────────── BOTTOM PANEL (y 0 here = 1024 on the map) ────┐
    │ side strip │   YARD BLOCK continues (empty)       │ side  │
448 │            │   36 × 14 tiles                       │ strip │
    │ river, bridges, warehouses, forest, farmland           │
1024└──────────────────────────────────────────────────────────┘
```

- **Yard block** = the playable yard 32 × 24 tiles + a 2-tile ring road around it =
  36 × 28 tiles (1152 × 896 px), from x 192 to 1344. The game draws the yard, the ring
  road and the grid itself, so the panels leave that area as plain flat grey.
- **Seam** = the line where the panels meet. The game draws a road across the side
  strips exactly there, so nothing important may cross a panel edge.
- Side strips are 6 tiles (192 px) wide: houses, trees, a railway, a canal.

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

Yard concrete and grid, the ring road and seam road, placement highlights, shadows
under placed buildings, smoke, sparkles, moving cars, boats, fish, birds and clouds.
