/**
 * World-space backdrop slot for the yard (sea, coast, harbour, hills…).
 * The image is drawn inside the same pan/zoom transform as the buildings, so
 * it moves with them. Replace `assets/bg/yard_backdrop.png` with final art —
 * no code change needed as long as the pixel aspect stays 1536:848 (any
 * multiple of it works; it is scaled to this world rectangle, nearest-neighbour).
 *
 * World rectangle (1× game px, same units as V3_ISO): the whole 100×100-tile
 * land diamond is x −768…768, y 416…1184 (top corner at (0,416), left/right
 * corners at (∓768,800), bottom corner at (0,1184)). The backdrop extends past
 * it on every side. Draw the art on the 2:1 iso axes so shorelines and piers
 * run parallel to the land edges.
 */
export const V3_YARD_BACKDROP = {
  x: -1536,
  y: -256,
  width: 3072,
  height: 1696,
  // Art master size (2 world px per art px).
  artWidth: 1536,
  artHeight: 848,
  seaColor: '#2A6FB8',
} as const
