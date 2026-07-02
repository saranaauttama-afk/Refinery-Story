import type { ImageSourcePropType } from 'react-native'

// ── Factory home scene — visual layout config ───────────────────────────────
// Everything about HOW the factory home scene LOOKS/SITS lives here, so you can
// tune the composition (background framing + grid position) without digging
// through component code. These are PURELY VISUAL — gameplay/economy is
// unaffected. Change a number, reload the app (or re-export web) to see it.

// The full-bleed background painting (sky / sea / land). Swap this file to
// reskin the whole scene. Keep it large enough that the crop + overscan below
// still cover the screen.
export const FACTORY_BG: ImageSourcePropType = require('../../assets/bg/ground_day_1.png')

// ── Background framing ──
// The image is drawn with resizeMode:'cover' inside an over-sized box so it can
// be nudged around without ever showing a blank edge.
//
// BG_CROP_PCT      : trims the top & bottom by this % (shows the middle band).
//                    Higher = more zoomed-in vertically.
// BG_OVERSCAN_PCT  : extends the image past the LEFT & RIGHT screen edges by
//                    this %, giving room to pan horizontally (see BG_OFFSET_X)
//                    without exposing an empty edge. Raise it if a big
//                    BG_OFFSET_X reveals a gap.
// BG_OFFSET_X      : horizontal pan, in px. NEGATIVE moves the scene LEFT,
//                    positive moves it RIGHT.
export const BG_CROP_PCT = 12
export const BG_OVERSCAN_PCT = 18
export const BG_OFFSET_X = -92

// BG_SCALE : zoom of the whole background. 1.0 = fills the screen exactly (the
//            old behaviour). LESS than 1 zooms OUT (the painting looks smaller /
//            more of it fits); e.g. 0.7 = 30% smaller. The scene auto-expands
//            its draw box to match, so zooming out never exposes a blank edge.
//            (Values >1 zoom in.)
export const BG_SCALE = 0.7

// BG_PARALLAX : how much the background follows the grid when you pan. 0 = the
//   bg is fixed (old behaviour); 1 = it moves 1:1 with the plants (locked
//   together like one camera); values in between give a depth/parallax feel.
//   Keep it modest so panning never drags the painting off its overscan and
//   exposes a blank edge.
export const BG_PARALLAX = 0.5

// ── Isometric grid placement ──
// GRID_DROP   : how many px the grid is pushed DOWN from the HUD. Increase to
//               move the plants further down onto the dirt/land (away from the
//               trees up top); decrease to raise them.
// GRID_SPREAD : spacing between cell centres. 1.0 = diamonds touch edge-to-edge
//               (cramped); >1 opens a walkway/road gap between cells. Tiles and
//               plant sprites keep their size — only the spacing grows.
export const GRID_DROP = 262
export const GRID_SPREAD = 1.22

// PLANT_IMAGE_SCALE : size of the plant sprites relative to their tile. 1.0 =
//   sprite spans the tile width (the old look). LESS than 1 shrinks the plant
//   art — handy to match a zoomed-out BG_SCALE so the plants don't look
//   oversized on the smaller ground. Only the drawn sprite (and its smoke)
//   shrinks; the tile, grid spacing, and tap targets are untouched. The sprite
//   stays bottom-centred on its tile.
export const PLANT_IMAGE_SCALE = 0.75

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
