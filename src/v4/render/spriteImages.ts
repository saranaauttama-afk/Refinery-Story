// PixelLab sprites (pilot). Each entry: the PNG for level tiers and the footprint
// centre inside the image (px at 2×). Buildings without an entry use code-drawn sprites.
// Tiers: L1 covers levels 1–2, L3 covers 3–4, L5 covers 5 (falls back to the lower tier).
export type SpriteImage = { src: number; w: number; h: number; ax: number; ay: number }
const at = (src: number, w: number, h: number, footprint: number): SpriteImage => ({
  src,
  w,
  h,
  ax: w / 2,
  // The art's base sits on the footprint diamond's bottom tip.
  ay: h - footprint * 8,
})
export const spriteImages: Record<string, Partial<Record<1 | 3 | 5, SpriteImage>>> = {
  cdu: { 1: at(require('../../../assets/v4/sprites/cdu_L1.png'), 99, 152, 4) },
  crudeTank: { 1: at(require('../../../assets/v4/sprites/crudeTank_L1.png'), 93, 68, 4) },
  blend: { 1: at(require('../../../assets/v4/sprites/blend_L1.png'), 116, 77, 4) },
}
export const tierOf = (level: number): 1 | 3 | 5 => (level >= 5 ? 5 : level >= 3 ? 3 : 1)
/** The tier image a building at this level uses, falling back to a lower tier. */
export function spriteTierFor(id: string, level: number): 1 | 3 | 5 | undefined {
  const set = spriteImages[id]
  if (!set) return undefined
  const t = tierOf(level)
  return ([t, 3, 1] as const).find(x => x <= t && set[x])
}
export function spriteImageFor(id: string, level: number): SpriteImage | undefined {
  const tier = spriteTierFor(id, level)
  return tier ? spriteImages[id][tier] : undefined
}
/** Every image the yard needs loaded, in a fixed order (one hook each). */
export const allSpriteImages = Object.entries(spriteImages).flatMap(([id, set]) =>
  Object.entries(set).map(([tier, img]) => ({ key: `${id}:${tier}`, img: img! })),
)
