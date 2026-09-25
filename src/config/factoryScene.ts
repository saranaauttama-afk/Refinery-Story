import type { ImageSourcePropType } from 'react-native'
import { DEFAULT_PLANT_IMAGE_SCALE } from '../factoryPlantLayout'

// ── Factory home scene — visual layout config ───────────────────────────────
// Everything about HOW the factory home scene LOOKS/SITS lives here, so you can
// tune the composition (background framing + grid position) without digging
// through component code. These are PURELY VISUAL — gameplay/economy is
// unaffected. Change a number, reload the app (or re-export web) to see it.

// The full-bleed background painting (sky / sea / land). Swap this file to
// reskin the whole scene. Keep it large enough that the crop + overscan below
// still cover the screen.
export const FACTORY_BG: ImageSourcePropType = require('../../assets/bg/factory_harbor_world_v3.png')

// ── Background framing ──
// The image is drawn at an EXPLICIT pixel size computed to always cover the
// screen (using the painting's real aspect ratio), then centred and nudged.
// This is deterministic on both native and web — no %-inset + transform tricks
// that used to leave a black edge on device.
//
// BG_OFFSET_X : horizontal nudge, in px. NEGATIVE moves the scene LEFT, positive
//               RIGHT. The draw box auto-widens by this much so the far edge is
//               never uncovered.
// BG_OFFSET_Y : vertical nudge, in px. NEGATIVE moves the scene UP (shows more
//               of the lower land), positive DOWN.
export const BG_OFFSET_X = 0
export const BG_OFFSET_Y = 0

// BG_PARALLAX : how much the background follows the grid when you pan. 0 = the
//   bg is fixed; 1 = it moves 1:1 with the plants (one camera); in between gives
//   a depth feel. Kept modest so panning stays within the offset slack.
export const BG_PARALLAX = 1

// BG_ZOOM_PARALLAX : how much of the world-camera zoom the painted background
// follows. Keeping this below 1 preserves depth, while still preventing the
// background from feeling completely detached from the grid during a pinch.
// Keep the full-bleed painted backdrop at cover size. Scaling this layer down
// exposed the edge of the image on tall phones; the interactive yard still
// zooms fully while both layers pan together 1:1.
export const BG_ZOOM_PARALLAX = 0

// ── Isometric grid placement ──
// GRID_DROP   : how many px the grid is pushed DOWN from the HUD. Increase to
//               move the plants further down onto the dirt/land (away from the
//               trees up top); decrease to raise them.
// GRID_SPREAD : spacing between cell centres. 1.0 = diamonds touch edge-to-edge
//               (cramped); >1 opens a walkway/road gap between cells. Tiles and
//               plant sprites keep their size — only the spacing grows.
export const GRID_DROP = 278
// Service roads are rendered inside each world tile, so neighbouring road
// diamonds must meet exactly. The concrete build lot is inset from that road.
export const GRID_SPREAD = 1

// U2.3 large-world camera. The painted world is intentionally much larger
// than one phone screen so the harbor can be explored in all four directions.
export const FACTORY_WORLD_VIEWPORT_SCALE = 2.3
export const BUILD_ZONE_CENTER_X = 0.5
export const BUILD_ZONE_TOP_Y = 0.57
export const BUILD_ZONE_FOCUS_Y = 0.62

// PLANT_IMAGE_SCALE : size of the plant sprites relative to their tile. 1.0 =
//   sprite spans the tile width (the old look). LESS than 1 shrinks the plant
//   art — handy to match a zoomed-out BG_SCALE so the plants don't look
//   oversized on the smaller ground. Only the drawn sprite (and its smoke)
//   shrinks; the tile, grid spacing, and tap targets are untouched. The sprite
//   stays bottom-centred on its tile.
// U2.4: plants are intentionally a little larger than one tile. Their gameplay
// footprint and tap target stay one cell; only the sprite may overlap the cells
// behind it, which is normal for a 3/4 isometric scene.
export const PLANT_IMAGE_SCALE = DEFAULT_PLANT_IMAGE_SCALE

// SHOW_GRID : draw the diamond tile art for the ACTIVE (playable) cells — the
//             cream tiles, outlines, "+" markers on empty cells, and the tile
//             under each plant. false = clean "plants sit straight on the yard"
//             look (cells stay tappable; plants/auras/smoke/combo-hints still
//             render). true = the classic visible isometric grid.
export const SHOW_GRID = true

// SHOW_SHELL : draw the faint decorative diamonds OUTSIDE the active grid (the
//              future-expansion preview shell). false shows ONLY the cells you
//              can actually use right now. Independent of SHOW_GRID.
export const SHOW_SHELL = false
