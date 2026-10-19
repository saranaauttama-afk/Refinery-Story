# Refinery Story v4 — Art & UI Direction

All in-game graphics are **drawn in code with Skia** (no AI raster sprites).
Reason: placement snaps exactly to the iso grid, levels/colours are cheap to
vary, and the APK stays small. The look target is a **Kairosoft-style chunky
pixel diorama**: small, readable, bright, with black outlines.

## 1. Grid & projection

- 2:1 isometric. One tile = **32 × 16 logical px**; renderer draws at an
  integer pixel scale (×2 default, ×1–×4 zoom) with
  `FilterMode.Nearest` / no anti-aliasing so edges stay crisp.
- Tile (x, y) → screen: `sx = (x − y) × 16`, `sy = (x + y) × 8`.
- Building height unit = 8 logical px. A 2×2 building is ~3–6 units tall.
- Draw order: sort by `x + y + footprintDepth`, then by height; trucks and
  people use the same key from their current tile.
- All draw functions take `(canvas, tileX, tileY, level, accent, t)` and draw
  in logical px; the canvas transform handles zoom/pan.

## 2. Outline & shading rules

- **1 logical-px black outline** (`#14110F`) around every silhouette and along
  roof edges (owner choice: black sharp, not brown).
- 3-tone faces per material: top (light), left (mid), right (dark).
  Light comes from top-left.
- No gradients except sky/water and smoke alpha.
- Small detail budget: 3–6 details per building (pipes, ladder, lamp, vent,
  hazard stripe, number plate). Details are what make levels feel different.

## 3. Palette (tokens in `src/v4/render/palette.ts`)

| Token | Hex | Use |
| --- | --- | --- |
| outline | #14110F | all outlines |
| ground | #8DBF5A / #7AAA4C / #5E8C3A | grass top / left / right |
| concrete | #D8D2C4 / #B9B2A3 / #948C7E | pads, roads |
| asphalt | #4A4E57 / #3B3F47 / #2D3037 | roads, truck bays |
| steel | #C9D3DC / #9EABB8 / #73818F | tanks, columns |
| rust | #B5653A | ladders, pipe flanges |
| hazard | #F2C230 + outline stripes | rails, bollards |
| water | #4FA3D9 → #2F7DB8 | port, ponds |
| smoke | #FFFFFF @ 0.55 → 0 | stacks |

**Accent per product line** (roof bands, pipe colour, tank stripe, UI chips):

| Line | Accent |
| --- | --- |
| Crude / CDU | #3C3C46 (oil black) |
| Gasoline | #E2483D (red) |
| Diesel / Gasoil | #F08A24 (orange) |
| Jet / Kerosene | #3D8FE0 (blue) |
| LPG | #9C5BD6 (purple) |
| Lube / Wax | #2FB38E (teal) |
| Asphalt | #6D5A4A (brown) |
| Pellet / Petrochem | #E36BB0 (pink) |
| Support (Lab, Control, Canteen) | #FFFFFF body + #4FA3D9 trim |

## 4. Building sprites (M2b order)

Each building has **levels 1–5**, drawn by one function with level-driven
changes. Minimum visible differences: L1 base shape; L3 extra column/tank +
walkway; L5 taller, lit beacon, company flag. Footprint never changes with
level (unlike V3).

| Building | Footprint | Silhouette idea |
| --- | --- | --- |
| Truck Gate | 1×2 | booth + striped barrier arm (animates) |
| Loading Bay | 2×2 | canopy on posts, 2 bays, hoses |
| Crude Tank | 2×2 | wide squat cylinder, dark band, ladder |
| Product Tank | 1×1 | small cylinder, accent stripe = product |
| CDU | 2×2 | tall column + furnace box + stack (smoke) |
| Hydrotreater | 2×2 | 2 reactors + heat exchanger |
| Reformer | 2×3 | row of 3 reactors + furnace |
| Cracker | 3×3 | tall riser + regenerator + big stack |
| Blending Station | 2×2 | 3 small vats + mixer arms (spin) |
| Pipe Rack | 1×1 | steel frame with 3 coloured pipes |
| Lab | 1×1 | white box, blue roof, flask sign |
| Control Room | 2×1 | flat box, window strip with blinking screens |
| Canteen | 2×1 | warm roof, chimney, tables outside |
| Flare | 1×1 | thin tall stack + flame (flicker) |
| Deco | 1×1 | tree, lamp, bench, flowerbed, sign, flag, bus stop |

## 5. Life in the yard (priority over menu polish)

- **Trucks:** 2 types (crude tanker black, product tanker in product accent),
  drive tile-to-tile on roads at 1 tile / 0.4 s, 2-frame wheel wobble.
- **Workers:** 6×10 px people with hard hats in job colour, walk between
  Canteen and assigned building; idle bob.
- **Smoke** from stacks (3–5 circles, rise + fade), **flare flame** flicker,
  **mixer arms** rotate while blending, **gate arm** lifts for trucks.
- **Pop-ups:** "+$1,240" (gold), "+5 ★" (fame), "S!!" grade burst on lot
  completion, "New Combo!" ribbon. Float up 24 px over 1 s.
- Performance budget: 40 buildings + 10 trucks + 20 people at 60 fps on a
  mid-range Android. Static layer (ground + buildings) is cached as a Skia
  picture and only re-recorded when the yard changes; animated bits draw on top.

## 6. UI style

- Kairosoft-like **light panels**: cream body `#FFF6E3`, 2 px outline
  `#14110F`, coloured header band per screen (build = orange, staff = blue,
  customers = green, company = purple), 6 px corner radius, 2 px drop shadow.
- Font: **Pixelify Sans** for numbers and headers, Baloo 2 for Thai body text
  (both already in `package.json`).
- HUD: top bar = date · money · fame · RD; speed toggle on the right. Bottom bar
  = 5 big icon buttons: Build, Blend, Staff, Customers, Company. Sheets slide up
  over the yard; the yard keeps running.
- Icons: code-drawn or `lucide-react-native`; no raster icon packs.
- Title screen: painterly refinery-port scene is a **later** task; for now a
  code-drawn sunset sky + skyline of the same building sprites + logo text.
