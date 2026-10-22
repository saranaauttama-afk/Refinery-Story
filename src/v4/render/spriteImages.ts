// Building art registry. Native-resolution V5 art lives in v5Buildings.ts; buildings without an
// entry draw the temporary box from box.ts. Tiers: a level uses its own image, else the
// nearest lower one.
import { v5Buildings } from './v5Buildings'
export type Tier = 1 | 2 | 3 | 4 | 5
export type SpriteImage = {
  src: number
  w: number
  h: number
  ax: number
  ay: number
  scale: number
  /** Legacy flag; V5 always uses nearest-neighbour at native logical resolution. */
  smooth: boolean
}
export const spriteImages: Record<string, Partial<Record<Tier, SpriteImage>>> = v5Buildings
export function spriteTierFor(id: string, level: number): Tier | undefined {
  const set = spriteImages[id]
  if (!set) return undefined
  for (let t = Math.min(5, Math.max(1, level)); t >= 1; t--) if (set[t as Tier]) return t as Tier
  return undefined
}
export function spriteImageFor(id: string, level: number): SpriteImage | undefined {
  const tier = spriteTierFor(id, level)
  return tier ? spriteImages[id][tier] : undefined
}
/** Every image the yard needs loaded, in a fixed order (one hook each). */
export const allSpriteImages = Object.entries(spriteImages).flatMap(([id, set]) =>
  Object.entries(set).map(([tier, im]) => ({ key: `${id}:${tier}`, img: im! })),
)
