/**
 * World-space backdrop slot for the yard (sea, coast, harbour, hills…).
 * The image is drawn inside the same pan/zoom transform as the buildings, so
 * it moves with them. The art at `assets/bg/yard_backdrop.png` is scaled to
 * the world rectangle below with nearest-neighbour sampling.
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
  // Current preview source size; the world rectangle remains unchanged.
  artWidth: 1688,
  artHeight: 932,
  seaColor: '#2A6FB8',
} as const
