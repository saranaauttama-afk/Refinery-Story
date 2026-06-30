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

// ── Isometric grid placement ──
// GRID_DROP   : how many px the grid is pushed DOWN from the HUD. Increase to
//               move the plants further down onto the dirt/land (away from the
//               trees up top); decrease to raise them.
// GRID_SPREAD : spacing between cell centres. 1.0 = diamonds touch edge-to-edge
//               (cramped); >1 opens a walkway/road gap between cells. Tiles and
//               plant sprites keep their size — only the spacing grows.
export const GRID_DROP = 262
export const GRID_SPREAD = 1.22

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
