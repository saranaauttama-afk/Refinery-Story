# PixelLab sprite list and spec

Status: pilot in game (v4.0.18): cdu, crudeTank, blend at L1. PixelLab pixflux, init image = code sprite at 2×, init_image_strength 50.
Look and palette: `ART.md` and `STYLE-BIBLE.md`.

## Rules every sprite follows

- **View:** 2:1 isometric, the same as the yard. One tile = 32 × 16 px at 1×.
- **Size:** draw at **2×** (one tile = 64 × 32 px), transparent PNG, no
  anti-aliasing at the edges. The game scales with nearest-neighbour filtering.
- **Footprint:** the base of the building fills its footprint diamond exactly
  (w × h tiles). Nothing sticks out sideways into the next lot. Height can grow
  upwards.
- **Anchor:** the bottom tip of the footprint diamond is the bottom-centre of
  the image. Leave no empty rows below it.
- **Light:** from the top-left. Black 1 px outline (`#14110F`), 3 tones per
  material, no gradients.
- **Colours:** steel `#C9D3DC/#9EABB8/#73818F`, concrete
  `#D8D2C4/#B9B2A3/#948C7E`, hazard `#F2C230`, rust `#B5653A`, plus the
  building's product accent from `ART.md`.
- **Detail budget:** one strong silhouette, 3–6 details. It must still read at
  1× with neighbours packed tightly.
- **Levels:** three images per building: L1, L3, L5. L2 uses L1, L4 uses L3.
  Same footprint and silhouette; each tier adds a small, readable upgrade
  (extra ring, second stack, lights).

## Canvas size per building (2×)

Width = (w + h) × 32. Height = (w + h) × 16 + height × 2 + 16 headroom.

| id                                    | footprint | canvas (px) | silhouette (STYLE-BIBLE)                                   | accent  |
| ------------------------------------- | --------- | ----------- | ---------------------------------------------------------- | ------- |
| cdu                                   | 2×2       | 128 × 176   | tall column + squat furnace                                | #3C3C46 |
| crudeTank                             | 2×2       | 128 × 128   | wide low cylinder, black band, ladder                      | #3C3C46 |
| tank                                  | 1×1       | 64 × 96     | small cylinder, product stripe                             | product |
| blend                                 | 2×2       | 128 × 128   | three short vats + central mixer                           | #E2483D |
| hydro                                 | 2×2       | 128 × 160   | twin reactors + crosspipe                                  | #3D8FE0 |
| reformer                              | 2×3       | 160 × 176   | furnace box + three reactors                               | #E2483D |
| cracker                               | 3×3       | 192 × 240   | big riser column + regenerator                             | #9C5BD6 |
| tower                                 | 3×3       | 192 × 272   | mega column cluster (rank 9)                               | #E36BB0 |
| gate                                  | 1×2       | 96 × 96     | booth + yellow boom barrier                                | #F2C230 |
| loading                               | 2×2       | 128 × 128   | open canopy over a truck bay                               | #F08A24 |
| pipe                                  | 1×1       | 64 × 80     | open rack, three coloured pipes                            | —       |
| road                                  | 1×1       | 64 × 32     | flat asphalt tile (4 variants: straight ×2, corner, cross) | —       |
| lab                                   | 1×1       | 64 × 96     | small white lab, blue trim, roof vent                      | #4FA3D9 |
| control                               | 2×1       | 96 × 96     | low control room, window band                              | #4FA3D9 |
| canteen                               | 2×1       | 96 × 96     | small canteen, awning                                      | #B5653A |
| flare                                 | 1×1       | 64 × 160    | thin stack with flame tip                                  | #F08A24 |
| tree, lamp, sign, flag                | 1×1       | 64 × 96     | decor                                                      | —       |
| goldTree, goldSign, legend, award × 4 | 1×1       | 64 × 96–112 | gold decor / trophies                                      | #F2C230 |

## Not buildings

| asset               | size (2×)          | notes                                    |
| ------------------- | ------------------ | ---------------------------------------- |
| truck, crude tanker | 64 × 48 × 2 dirs   | facing down-right and down-left          |
| truck, product      | 64 × 48 × 2 dirs   | body tinted at runtime by product colour |
| worker              | 16 × 24 × 2 frames | one sheet; job colour tinted at runtime  |
| grass tile          | 64 × 32 × 2 tones  | quiet, almost flat                       |

## Prompt template (PixelLab, isometric building)

> isometric pixel art, 2:1 isometric view, [SILHOUETTE] oil refinery building,
> chunky readable shapes, black 1px outline, light from top-left, flat 3-tone
> shading, limited palette steel grey, cream concrete, safety yellow, [ACCENT
> colour] accent, transparent background, no ground, no shadow outside the
> footprint, game sprite, Kairosoft style

Use the same seed/style reference for the whole set so the buildings match.

## Pilot (do this first)

1. `cdu`, `crudeTank`, `blend` at L1 only.
2. Load them in the game in place of the code-drawn sprites (other buildings
   stay code-drawn) and check on a phone: readable at 1× and 2×, fits the
   footprint, matches the UI.
3. If it works, make L3/L5 for those three, then the rest of the table.

## Engineering (when the pilot images arrive)

- Sprites go in `assets/v4/sprites/<id>_L<tier>.png` and are listed in `src/v4/render/spriteImages.ts` (size + footprint; anchor = bottom tip of the diamond).
- `src/v4/render/buildings/` gains an image path: when a PNG exists for an id
  and tier, the yard, build cards and placement ghost draw it; otherwise they
  fall back to today's code-drawn sprite. Footprints, anchors and the sim do
  not change.
