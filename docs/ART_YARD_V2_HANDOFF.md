# Harbor yard art delivery — 2026-10-03

Branch: `art/yard-v2`; base: `f18de378f376be71a8d46a0540c2b166437e6a03`.

## Delivered

- 51 generated building PNGs, 17 types × Lv1–3, bundled from
  `assets/plants/yard-v2/` through `src/components/v3/v3Art.ts`.
- Generated harbor background at `assets/bg/yard_backdrop.png`. Its actual
  empty-yard corners are registered to world `(26,26)` through `(74,74)`.
- Actual alpha bottom tips in `anchors.json` prevent asymmetric bases from
  floating or shifting when an upgrade changes the footprint.
- All 15 decorations have native SVG graphics in `src/art/decorArt.ts` and
  thumbnails in the build palette. Roads/fences connect to same-kind neighbours;
  props and buildings draw in shared back-to-front order. This replaces flat
  placeholder diamonds; decorations are code-native art, not generated PNGs.
- Three generated 96×96 customer contacts in `assets/clients/`, selected by
  customer route and used consistently in offers and accepted jobs.
- Camera minimum zoom/pan bounds cover tall phone viewports with painted
  backdrop rather than exposing a sea-coloured strip below the map.
- Corrupt uncommitted old `jet_fuel_tank_lv2.png` restored from HEAD; the new
  independent set supplies the live V3 art.
- Android version 1.0.1 / code 8 / `YARD-V2-20261003`.

## Generation recipe

Built-in imagegen generated transparent three-level family atlases, a harbor
backdrop edit, and a customer portrait atlas. Prompt contract: detailed crisp
pixel-art industrial tycoon; 2:1 isometric, top-left light, dark outlines, grey
steel, product-colour trim; thin concrete pads; no labels, people, smoke or
scenery in building atlases; separated sprites with real alpha. Level 1 simple,
Level 2 developed, Level 3 advanced with the same design identity.

| Family | Subject and accent | Lv1 / Lv2 / Lv3 footprint |
|---|---|---|
| Distillation | Tall columns, orange pipes | 3×3 / 4×4 / 5×4 |
| Lubricant plant | Blending vessels, amber pipes | 3×3 / 4×4 / 5×4 |
| Jet plant | Clean fractionation equipment, sky blue | 3×3 / 4×4 / 5×4 |
| Petro plant | Pressure reactors and spheres, purple | 3×3 / 4×4 / 5×4 |
| Polymer plant | Extruders and conveyors, green | 3×3 / 4×4 / 5×4 |
| Crude tank | Round storage tanks, brown | 2×2 / 3×2 / 3×3 |
| Gasoline tank | Round storage tanks, orange | 2×2 / 3×2 / 3×3 |
| Lubricant tank | Round storage tanks, amber | 2×2 / 3×2 / 3×3 |
| Jet tank | Round storage tanks, sky blue | 2×2 / 3×2 / 3×3 |
| Petro tank | Pressure spheres, purple | 2×2 / 3×2 / 3×3 |
| Pellet silo | Tall silos and chutes, green | 2×2 / 3×2 / 3×3 |
| Power | Turbine hall and cooling stack, yellow | 3×3 / 3×3 / 4×3 |
| Lab | Actual white lab, teal, rooftop dish | 2×2 / 3×3 / 3×3 |
| Workshop | Garage bays and crane, orange | 2×2 / 3×2 / 3×3 |
| Waste treatment | Settling basins and pump house, olive | 2×2 / 3×2 / 3×3 |
| Recycling | Concrete sorting bays/conveyor, lime | 2×2 / 3×2 / 3×3 |
| Sales | Actual glass-front office and awning, orange | 2×2 / 2×2 / 3×2 |

`scripts/import-yard-art.cjs` crops isolated atlas subjects, preserves alpha,
resizes by nearest neighbour to `(w+h)*32` pixels, and measures bottom anchors.
Polymer used reviewed cut columns 486/1049; waste atlas was regenerated with
wider gutters. Source atlases remain in the generating session; shipped PNGs
and the import recipe are in git.

Backdrop edit prompt: preserve the harbor theme, make props small, keep an
empty 2:1 central concrete diamond, no painted tile grid, detailed edge-to-edge
sea/docks/roads/verges. The generated proportions were measured and registered
in code rather than trusting the requested percentages.

Customer atlas: friendly Thai local buyer in blue polo, purchasing engineer
in white hard hat/teal uniform, senior corporate contact in navy suit/orange
tie; head-and-shoulders pixel portraits, no text, real transparency.

## Validation

- `npm run typecheck`: pass.
- All `npm run check:v3-*` scripts: pass, including legal full-run campaign.
- `node --import tsx scripts/factory-map-check.ts`: pass.
- `node --import tsx scripts/render-yard-art-check.cjs`: pass; 51 transparent
  sprites fully decode, starter projection and all 15 SVGs render.
- `npx expo export --platform android`: pass.
- `gameplay-integrity-check.ts` is an old pre-V3 diagnostic, not a V3 release
  gate; its own output labels its known failures as a diagnostic baseline.

Static QA files are reproducible in `.build/yard-v2-qa/`. Native interaction,
decoration-cap performance and actual APK installation require owner device
validation. No device playtest is claimed. Economy and save schema were not
changed by this art delivery.
