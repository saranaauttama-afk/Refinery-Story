# Refinery Story V3 — Art Asset List (yard scale 2)

Brief for the artist / art AI. Everything here is drawn on the **isometric
yard** (buildings, decorations, roads, ground) plus the small UI icons for the
decoration palette. Code already draws placeholders, so assets can arrive in
any order; the priority column says what matters first.

Total: **51 building sprites · 15 decoration sprites · 16 road tiles ·
16 fence tiles · 5 ground tiles · 15 palette icons = 118 PNGs.**

---

## 1. Style (applies to every asset)

**Owner decision (2026-09-27): detailed, and a colour per product line.**
Style reference = `assets/plants/starter/distillation_unit_lv3.png` (use it as
the style/reference image in the generator for every building).

- **Isometric pixel art, detailed industrial look** like the reference: brushed
  grey steel vessels and columns, dense pipe runs, ladders, catwalks with
  railings, valves, control boxes, small platforms. Crisp dark outlines.
  Busy but readable — the silhouette must still read at small size.
- Every building stands on a **thin dark-grey concrete pad that exactly fills
  its footprint diamond** (as in the reference). Decorations and roads have no pad.
- **2:1 isometric** (diamond tiles twice as wide as tall). Camera from the
  south; **light from the top-left**, shadows fall to the bottom-right.
- Crisp pixels: strict pixel grid, limited palette, no blur, no painterly
  texture, no soft glow.
- **Transparent background only** (real alpha, no checkerboard, nothing
  outside the pad).
- No text, no logos, no people, no vehicles (unless listed), no smoke / steam /
  fire (the game animates those in code).
- **Colour = product line.** Steel stays grey on every building; pipes, trim,
  stripes and small panels use the line's accent colour (table in §3). Shared
  / support buildings use safety orange like the reference.
- Levels: Lv1 simple (one main vessel), Lv2 adds a second unit and more pipes,
  Lv3 is the densest (multiple towers, pipe bridge, catwalks) like the reference.

Base prompt fragment (prepend to each item's description):

> detailed isometric pixel art industrial building for a Kairosoft-style
> tycoon game, 2:1 isometric, 3/4 view from the south, light from top-left,
> grey steel with {ACCENT} pipes and trim, dense pipes, ladders and catwalks,
> crisp dark outlines, strict pixel grid, standing on a thin dark concrete pad
> that fills the isometric footprint, no text, no people, no smoke,
> transparent background, single object

---

## 2. Size and anchor rules (important — this is what makes art line up)

Master scale: **one tile = 64 × 32 px** (2× the in-game size, so it stays sharp
at max zoom). A footprint of **w × h tiles** (w = tiles along the
down-right edge, h = tiles along the down-left edge) uses:

- **Image width = (w + h) × 32 px** — the footprint diamond touches the left
  and right edges of the image.
- **Bottom edge = bottom corner of the footprint diamond.** The diamond takes
  the bottom `(w + h) × 16` px; everything above is the building rising out of it.
- **Height:** free, but keep it ≤ 1.25 × width for buildings (≤ 2 × width for
  thin 1×1 decorations like lamps, trees and flag poles). Add transparent space
  on top rather than squashing.
- Nothing may stick out past the left, right or bottom edges.

Ready-made guide images (red diamond = base, faint lines = tiles, blue line =
top of the diamond) are in `assets/Docs/templates/footprint_WxH.png`:

| Footprint | Image width | Diamond height | Bottom corner x (from left) | Template |
|---|---|---|---|---|
| 1×1 | 64 | 32 | 32 | `footprint_1x1.png` |
| 2×1 | 96 | 48 | 64 | `footprint_2x1.png` |
| 1×2 | 96 | 48 | 32 | `footprint_1x2.png` |
| 2×2 | 128 | 64 | 64 | `footprint_2x2.png` |
| 3×2 | 160 | 80 | 96 | `footprint_3x2.png` |
| 3×3 | 192 | 96 | 96 | `footprint_3x3.png` |
| 4×3 | 224 | 112 | 128 | `footprint_4x3.png` |
| 4×4 | 256 | 128 | 128 | `footprint_4x4.png` |
| 5×4 | 288 | 144 | 160 | `footprint_5x4.png` |

If the generator only outputs large squares (e.g. 1024 px), draw on the
template's proportions, then **trim and downscale with nearest-neighbour** to
the exact width above. Never stretch non-uniformly.

Non-square footprints (2×1, 3×2, 4×3, 5×4) are lopsided diamonds: the bottom
corner is **not** in the middle. Use the template.

---

## 3. Buildings — 17 types × 3 levels = 51 sprites

**Priority 1.** Each level is the *same building grown bigger*; the footprint
grows too (upgrades extend right/down), so every level needs its own sprite at
its own size. Level 3 should look clearly the most advanced.

File path = existing name, so they replace the old 1-tile art in place.
Starter buildings live in `assets/plants/starter/`, the rest in `assets/plants/`.

| Building | File name (…`_lv1/2/3.png`) | Lv1 | Lv2 | Lv3 | {ACCENT} colour / look |
|---|---|---|---|---|---|
| Distillation Unit | `starter/distillation_unit` | 3×3 | 4×4 | 5×4 | **Orange** (gasoline line); tall columns — the reference |
| Crude Tank | `starter/crude_tank` | 2×2 | 3×2 | 3×3 | **Dark brown/black** band; round tanks |
| Gasoline Tank | `starter/gasoline_tank` | 2×2 | 3×2 | 3×3 | **Orange** band |
| Lubricant Plant | `lubricant_plant` | 3×3 | 4×4 | 5×4 | **Gold/amber**; blending vessels |
| Lubricant Tank | `lubricant_tank` | 2×2 | 3×2 | 3×3 | **Gold/amber** band |
| Jet Fuel Plant | `jet_fuel_plant` | 3×3 | 4×4 | 5×4 | **Sky blue**; clean, high-tech |
| Jet Fuel Tank | `jet_fuel_tank` | 2×2 | 3×2 | 3×3 | **Sky blue** band |
| Petrochemical Plant | `petrochemical_plant` | 3×3 | 4×4 | 5×4 | **Purple**; reactor spheres |
| Petrochemical Tank | `petrochemical_tank` | 2×2 | 3×2 | 3×3 | **Purple** band, pressure spheres |
| Polymer Plant | `polymer_plant` | 3×3 | 4×4 | 5×4 | **Green**; extruders, conveyors |
| Pellet Silo | `pellet_silo` | 2×2 | 3×2 | 3×3 | **Green**; tall silos |
| Power Plant | `power_plant` | 3×3 | 3×3 | 4×3 | **Yellow**; turbines, cooling stack |
| Laboratory | `laboratory` | 2×2 | 3×3 | 3×3 | **Teal**; white lab block, dish/antenna at Lv3 |
| Maintenance Workshop | `maintenance_workshop` | 2×2 | 3×2 | 3×3 | **Safety orange**; garage door, crane |
| Waste Treatment Plant | `waste_treatment_plant` | 2×2 | 3×2 | 3×3 | **Olive**; settling ponds |
| Recycling Bunker | `recycling_bunker` | 2×2 | 3×2 | 3×3 | **Lime green**; concrete bunker, bins |
| Sales Office | `sales_office` | 2×2 | 2×2 | 3×2 | **Safety orange**; friendly office, awning, glass front |

Notes:
- Power Plant Lv1 and Lv2 share 3×3 and Lab Lv2 and Lv3 share 3×3; make the
  higher level visibly busier on the same base.
- Keep a small walkable margin (≈ ¼ tile) inside the footprint edge so
  neighbouring buildings don't visually merge.

---

## 4. Decorations — 13 map items (15 sprites; road and fence are in §5)

**Priority 2.** Folder `assets/decor/`. Small, cheerful, readable at a glance.
The 2×1 pieces need a second, rotated sprite (`_rot`, footprint 1×2).

| Item | File | Footprint | Look |
|---|---|---|---|
| Sidewalk | `sidewalk.png` | 1×1 | Flat light paving slab (flat, diamond only) |
| Tree | `tree.png` | 1×1 | Round leafy tree, tall (up to 64×128) |
| Street lamp | `street_lamp.png` | 1×1 | Thin lamp post with warm lamp head (up to 64×128) |
| Shrub | `shrub.png` | 1×1 | Low round bush |
| Bench | `bench.png` | 1×1 | Wooden park bench facing south-east |
| Trash bin | `trash_bin.png` | 1×1 | Small green bin with lid |
| Flower bed | `flower_bed.png` | 1×1 | Raised bed, pink/yellow flowers |
| Flag pole | `flag_pole.png` | 1×1 | Tall pole, plain company-colour flag (no logo) (up to 64×128) |
| Award statue | `award_statue.png` | 1×1 | Golden trophy/oil-drop statue on a pedestal — the "Expo winner" prize |
| Bus stop | `bus_stop.png` + `bus_stop_rot.png` | 2×1 / 1×2 | Small shelter with bench and sign pole (no text) |
| Company sign | `company_sign.png` + `company_sign_rot.png` | 2×1 / 1×2 | Billboard-style sign on posts; face blank or simple oil-drop emblem, no text |
| Parking lot | `parking_lot.png` | 2×2 | Asphalt pad with white bay lines (flat); optional one tiny parked car |
| Fountain | `fountain.png` | 2×2 | Round stone basin, water jet (static frame) |
| Road | — | 1×1 | See §5 (autotile) |
| Fence | — | 1×1 | See §5 (autotile) |

---

## 5. Autotiles — roads and fences (16 + 16)

**Priority 2.** A road/fence tile changes shape depending on which neighbours
are the same item. Name each tile by a 4-letter mask **N E S W**
(`1` = connected, `0` = not), e.g. `road_1010.png` = straight N–S.

Directions on screen (2:1 iso):
- **N** = up-right edge · **E** = down-right edge · **S** = down-left edge ·
  **W** = up-left edge.

All 16 masks: `0000` (single) · `1000` `0100` `0010` `0001` (dead ends) ·
`1010` `0101` (straights) · `1100` `0110` `0011` `1001` (corners) ·
`1110` `0111` `1011` `1101` (T-junctions) · `1111` (cross).

| Set | Folder / name | Size | Look |
|---|---|---|---|
| Road | `assets/decor/road/road_NESW.png` | 64×32, flat | Dark asphalt, dashed centre line on straights, kerb edge where not connected |
| Fence | `assets/decor/fence/fence_NESW.png` | 64×64 | Low chain-link or white picket fence running along connected sides; post in the middle |

---

## 6. Ground — 5 tiles

**Priority 3.** Folder `assets/ground/`, each 64×32, flat diamond, must tile
seamlessly with itself.

| File | Look |
|---|---|
| `grass_1.png`, `grass_2.png`, `grass_3.png` | Owned land; same green with small variations (tufts, tiny flowers) |
| `concrete_pad.png` | Light concrete under buildings (optional base) |
| `locked_land.png` | Unowned land: duller, desaturated grass/dirt with a subtle fence-post hint |

---

## 7. Decoration palette icons — 15

**Priority 3.** Folder `assets/icons/decor/`, **96×96 px**, transparent, the
item centred and slightly larger than on the map (a close-up), same pixel
style. One per item: `road`, `sidewalk`, `tree`, `street_lamp`, `fence`,
`shrub`, `bench`, `trash_bin`, `flower_bed`, `bus_stop`, `parking_lot`,
`company_sign`, `fountain`, `flag_pole`, `award_statue`.

---

## 8. Delivery checklist

1. PNG, RGBA, transparent, exact pixel width from §2 (height per rules).
2. Base diamond matches the template for its footprint; nothing past left,
   right or bottom edges.
3. Same light direction and palette as the rest of the set.
4. File name and folder exactly as listed (lowercase, underscores).
5. Send a batch at a time (e.g. all 3 levels of one building). The developer
   wires it into `src/components/v3/v3Art.ts` and the decoration/road renderer.
