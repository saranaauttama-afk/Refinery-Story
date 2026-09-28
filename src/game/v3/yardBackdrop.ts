/**
 * World-space backdrop slot for the yard (sea, coast, harbour, hills…).
 * The image is drawn inside the same pan/zoom transform as the buildings, so
 * it moves with them. `assets/bg/yard_backdrop_pixel_v2.png` uses 768:424 (any
 * multiple of it works; it is scaled to this world rectangle, nearest-neighbour).
 *
 * World rectangle (1× game px, same units as V3_ISO): the fully expanded
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
  // Pixel art source size (4 world px per source pixel).
  artWidth: 768,
  artHeight: 424,
  seaColor: '#0879BE',
} as const
